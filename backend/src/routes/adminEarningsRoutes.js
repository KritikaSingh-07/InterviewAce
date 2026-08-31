import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getAllMentorWallets, getAllWithdrawals, approveWithdrawal, rejectWithdrawal, getPlatformStats } from '../controllers/adminEarningsController.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/mentors', getAllMentorWallets);
router.get('/withdrawals', getAllWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);
router.get('/stats', getPlatformStats);

export default router;
