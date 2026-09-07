import Razorpay from 'razorpay';
import MentorProfile from '../models/MentorProfile.js';
import SessionPayment from '../models/SessionPayment.js';
import { calculateSplit } from '../config/earningsConfig.js';
import { verifyPaymentSignature, verifyWebhookSignature, getRazorpayKeyId } from '../services/razorpayService.js';
import { creditEarning, handlePayoutSuccess, handlePayoutFailure, handleRefund } from '../services/walletService.js';

export const createSessionOrder = async (req, res, next) => {
  try {
    const { mentorId } = req.body;

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile || !mentorProfile.sessionRate) {
      return res.status(400).json({ error: 'Mentor not found or no session rate set' });
    }

    const sessionRate = mentorProfile.sessionRate;
    const split = calculateSplit(sessionRate);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_API_KEY,
      key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET
    });

    const receipt = `sess_${mentorId}_${req.user._id}_${Date.now()}`.slice(0, 40);
    const order = await razorpay.orders.create({
      amount: sessionRate,
      currency: 'INR',
      receipt,
      notes: {
        type: 'session_payment',
        mentorId: String(mentorId),
        studentId: String(req.user._id)
      }
    });

    await SessionPayment.create({
      student: req.user._id,
      mentor: mentorId,
      orderId: order.id,
      amount: sessionRate,
      currency: 'INR',
      mentorAmount: split.mentorAmount,
      platformAmount: split.platformAmount,
      status: 'created',
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      mentor: {
        name: mentorProfile.fullName,
        sessionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifySessionPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const payment = await SessionPayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (isValid) {
      if (payment.status !== 'paid') {
        payment.status = 'paid';
        payment.paymentId = razorpay_payment_id;
        payment.verifiedVia = 'client';
        await payment.save();
        await creditEarning({
          mentorId: payment.mentor,
          sessionPayment: payment,
          interviewId: payment.interview || null,
          studentId: payment.student,
        });
      }
      return res.json({ success: true });
    } else {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    next(error);
  }
};

export const handleSessionWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    if (!signature || !Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const isValid = verifyWebhookSignature(rawBody.toString(), signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id;

      if (orderId) {
        const payment = await SessionPayment.findOne({ orderId });
        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.paymentId = paymentEntity?.id;
          payment.verifiedVia = 'webhook';
          await payment.save();
          await creditEarning({
            mentorId: payment.mentor,
            sessionPayment: payment,
            interviewId: payment.interview || null,
            studentId: payment.student,
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await SessionPayment.updateOne({ orderId }, { status: 'failed' });
      }
    } else if (eventType === 'refund.created') {
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const payment = await SessionPayment.findOne({ paymentId });
        if (payment) {
          await handleRefund(payment._id);
          payment.status = 'refunded';
          await payment.save();
        }
      }
    } else if (eventType === 'payout.processed') {
      const payoutEntity = event.payload?.payout?.entity;
      const payoutId = payoutEntity?.id;
      if (payoutId) {
        const withdrawal = await (await import('../models/WithdrawalRequest.js')).default.findOne({ payoutId });
        if (withdrawal) {
          await handlePayoutSuccess(withdrawal._id, {
            payoutId,
            utr: payoutEntity?.utr || null,
          });
        }
      }
    } else if (eventType === 'payout.failed' || eventType === 'payout.reversed') {
      const payoutEntity = event.payload?.payout?.entity;
      const payoutId = payoutEntity?.id;
      if (payoutId) {
        const withdrawal = await (await import('../models/WithdrawalRequest.js')).default.findOne({ payoutId });
        if (withdrawal) {
          await handlePayoutFailure(withdrawal._id, payoutEntity?.failure_reason || 'Payout failed');
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
