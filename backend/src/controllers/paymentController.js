import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Profile from '../models/Profile.js';
import {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayKeyId,
} from '../services/razorpayService.js';
import { getPlanConfig, PAID_PLANS, isUpgrade } from '../config/plans.js';
import { getPlanUsageSummary } from '../services/planLimitService.js';

const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const formatUserResponse = (user, profile = null) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  plan: user.plan,
  planStartedAt: user.planStartedAt,
  planExpiresAt: user.planExpiresAt,
  isProfileComplete: user.isProfileComplete,
  onboardingCompleted: user.onboardingCompleted,
  profileImage: user.profileImage,
  profileImagePublicId: user.profileImagePublicId,
  ...(profile ? { profile } : {}),
});

const generateInvoiceId = () =>
  `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const upgradeUserPlan = async ({ userId, planId, orderId, paymentId, verifiedVia }) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new Error('Payment record not found');
  }

  if (payment.status === 'paid') {
    const user = await User.findById(userId);
    return { user, payment, alreadyProcessed: true };
  }

  const now = new Date();
  const planExpiresAt = new Date(now.getTime() + SUBSCRIPTION_PERIOD_MS);

  payment.paymentId = paymentId;
  payment.status = 'paid';
  payment.verifiedVia = verifiedVia;
  payment.invoiceId = payment.invoiceId || generateInvoiceId();
  await payment.save();

  const user = await User.findByIdAndUpdate(
    userId,
    {
      plan: planId,
      planStartedAt: now,
      planExpiresAt,
    },
    { new: true }
  );

  return { user, payment, alreadyProcessed: false };
};

// @desc    Create Razorpay order for a paid plan
// @route   POST /api/payments/create-order
// @access  Private
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !PAID_PLANS.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const currentPlan = req.user.plan || 'free';
    if (!isUpgrade(currentPlan, plan)) {
      return res.status(400).json({
        error: 'Select a higher tier plan to upgrade. Downgrades are not supported.',
        code: 'INVALID_UPGRADE',
      });
    }

    const planConfig = getPlanConfig(plan);
    const receipt = `plan_${plan}_${req.user._id}_${Date.now()}`.slice(0, 40);

    let order;
    try {
      ({ order } = await createOrder({
        planId: plan,
        userId: req.user._id,
        receipt,
      }));
    } catch (err) {
      const razorpayMessage =
        err?.error?.description || err?.description || err?.message;
      return res.status(502).json({
        error: razorpayMessage || 'Failed to create Razorpay order. Check your API keys.',
      });
    }

    await Payment.create({
      user: req.user._id,
      plan,
      orderId: order.id,
      amount: planConfig.amount,
      currency: planConfig.currency,
      status: 'created',
      invoiceId: generateInvoiceId(),
    });

    const profile = await Profile.findOne({ user: req.user._id });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      plan: planConfig.id,
      planName: planConfig.name,
      user: {
        email: req.user.email,
        name: profile?.fullName || req.user.email.split('@')[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature and upgrade user plan
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const payment = await Payment.findOne({ orderId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ error: 'Order not found for this user' });
    }

    const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const { user, alreadyProcessed } = await upgradeUserPlan({
      userId: req.user._id,
      planId: payment.plan,
      orderId,
      paymentId,
      verifiedVia: 'client',
    });

    res.json({
      success: true,
      message: alreadyProcessed
        ? 'Payment already verified'
        : `Upgraded to ${payment.plan} plan successfully`,
      plan: user.plan,
      user: formatUserResponse(user),
      payment: {
        _id: payment._id,
        plan: payment.plan,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay webhook fallback for payment.captured / order.paid
// @route   POST /api/payments/webhook
// @access  Public (signature verified)
export const handleWebhook = async (req, res, next) => {
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
      const paymentId = paymentEntity?.id;
      const planId = paymentEntity?.notes?.planId || orderEntity?.notes?.planId;
      const userId = paymentEntity?.notes?.userId || orderEntity?.notes?.userId;

      if (orderId && paymentId && planId && userId) {
        const payment = await Payment.findOne({ orderId });
        if (payment && payment.status !== 'paid') {
          await upgradeUserPlan({
            userId,
            planId,
            orderId,
            paymentId,
            verifiedVia: 'webhook',
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's plan usage for the billing period
// @route   GET /api/payments/usage
// @access  Private
export const getPlanUsage = async (req, res, next) => {
  try {
    const summary = await getPlanUsageSummary(req.user);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('plan orderId paymentId invoiceId amount currency status createdAt');

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

export { formatUserResponse };
