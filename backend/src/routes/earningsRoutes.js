import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboard, getTransactions, getChart, requestWithdrawalHandler, getWithdrawals } from '../controllers/earningsController.js';
import { getBankAccount, saveBankAccount, verifyBankAccount, deleteBankAccount } from '../controllers/bankAccountController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Earnings dashboard
router.get('/dashboard', getDashboard);
router.get('/transactions', getTransactions);
router.get('/chart', getChart);
router.post('/withdraw', requestWithdrawalHandler);
router.get('/withdrawals', getWithdrawals);

// Bank account management
router.get('/bank', getBankAccount);
router.post('/bank', saveBankAccount);
router.post('/bank/verify', verifyBankAccount);
router.delete('/bank', deleteBankAccount);

export default router;
