import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPlanUsage,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/usage', protect, getPlanUsage);
router.get('/history', protect, getPaymentHistory);

export default router;
