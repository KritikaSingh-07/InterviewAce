import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getPlanConfig } from '../config/plans.js';

let razorpayInstance = null;

/** Supports RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET or RAZORPAY_TEST_API_KEY / RAZORPAY_TEST_KEY_SECRET */
const getRazorpayKeyId = () =>
  process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_API_KEY;

const getRazorpayKeySecret = () =>
  process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET;

const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = getRazorpayKeyId();
    const keySecret = getRazorpayKeySecret();

    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (or RAZORPAY_TEST_API_KEY and RAZORPAY_TEST_KEY_SECRET) in .env'
      );
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return razorpayInstance;
};

export const createOrder = async ({ planId, userId, receipt }) => {
  const plan = getPlanConfig(planId);
  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt,
    notes: {
      planId: plan.id,
      userId: String(userId),
    },
  });

  return { order, plan };
};

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const secret = getRazorpayKeySecret();
  if (!secret) {
    throw new Error('Razorpay credentials are not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

export const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Razorpay webhook secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

export { getRazorpayKeyId };
