import express from 'express';
import { protect } from '../middleware/auth.js';
import { createSessionOrder, verifySessionPayment, handleSessionWebhook } from '../controllers/sessionPaymentController.js';

const router = express.Router();

// Webhook (public, signature verified) — MUST use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleSessionWebhook);

// Protected routes
router.post('/create-order', protect, createSessionOrder);
router.post('/verify', protect, verifySessionPayment);

export default router;
