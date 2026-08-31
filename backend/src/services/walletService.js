import MentorWallet from '../models/MentorWallet.js';
import MentorLedger from '../models/MentorLedger.js';
import MentorBankAccount from '../models/MentorBankAccount.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import SessionPayment from '../models/SessionPayment.js';
import {
  MIN_WITHDRAWAL_AMOUNT,
  MAX_WITHDRAWALS_PER_DAY,
  HIGH_VALUE_THRESHOLD,
  getSettlementDate,
} from '../config/earningsConfig.js';
import { initiatePayout } from './payoutService.js';
import { decrypt } from './encryptionService.js';

/**
 * Get or create a mentor's wallet.
 * @param {string} mentorId
 * @returns {Promise<MentorWallet>}
 */
export const getOrCreateWallet = async (mentorId) => {
  let wallet = await MentorWallet.findOne({ mentor: mentorId });
  if (!wallet) {
    wallet = await MentorWallet.create({ mentor: mentorId });
  }
  return wallet;
};

/**
 * Credit an earning to the mentor's wallet after a session payment.
 * Creates a pending ledger entry and increments pendingBalance.
 * @param {{ mentorId: string, sessionPayment: object, interviewId: string, studentId: string }} params
 */
export const creditEarning = async ({ mentorId, sessionPayment, interviewId, studentId }) => {
  const settlesAt = getSettlementDate();

  // Create ledger entry
  const ledgerEntry = await MentorLedger.create({
    mentor: mentorId,
    type: 'session_earning',
    amount: sessionPayment.mentorAmount,
    mentorShare: sessionPayment.mentorAmount,
    platformShare: sessionPayment.platformAmount,
    grossAmount: sessionPayment.amount,
    status: 'pending',
    sessionPayment: sessionPayment._id,
    interview: interviewId || null,
    student: studentId,
    description: `Earning from session payment ${sessionPayment.invoiceId || sessionPayment.orderId}`,
    settlesAt,
  });

  // Atomically update wallet
  await MentorWallet.findOneAndUpdate(
    { mentor: mentorId },
    {
      $inc: {
        totalEarned: sessionPayment.mentorAmount,
        pendingBalance: sessionPayment.mentorAmount,
      },
    },
    { upsert: true, new: true }
  );

  return ledgerEntry;
};

/**
 * Settle pending earnings that have passed the hold period.
 * Called by the settlement cron job.
 * @returns {Promise<number>} Number of entries settled
 */
export const settleEarnings = async () => {
  const now = new Date();

  // Find all pending ledger entries past their settlement date
  const pendingEntries = await MentorLedger.find({
    status: 'pending',
    type: 'session_earning',
    settlesAt: { $lte: now },
  });

  let settledCount = 0;

  for (const entry of pendingEntries) {
    try {
      // Update ledger entry status
      entry.status = 'settled';
      entry.settledAt = now;
      await entry.save();

      // Move funds from pending to available
      await MentorWallet.findOneAndUpdate(
        { mentor: entry.mentor },
        {
          $inc: {
            pendingBalance: -entry.amount,
            availableBalance: entry.amount,
          },
          $set: { lastSettledAt: now },
        }
      );

      settledCount++;
    } catch (err) {
      console.error(`[WalletService] Failed to settle ledger entry ${entry._id}:`, err);
    }
  }

  return settledCount;
};

/**
 * Request a withdrawal from the mentor's available balance.
 * Validates balance, minimum amount, daily limits, and verified bank account.
 * @param {string} mentorId
 * @param {number} amount - Amount in paise
 * @returns {Promise<WithdrawalRequest>}
 */
export const requestWithdrawal = async (mentorId, amount) => {
  // Validate minimum
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    const minInRupees = MIN_WITHDRAWAL_AMOUNT / 100;
    throw Object.assign(new Error(`Minimum withdrawal amount is ₹${minInRupees}`), { statusCode: 400 });
  }

  // Check verified bank account
  const bankAccount = await MentorBankAccount.findOne({ mentor: mentorId });
  if (!bankAccount || !bankAccount.isVerified) {
    throw Object.assign(
      new Error('Please add and verify your bank account before requesting a withdrawal'),
      { statusCode: 400 }
    );
  }

  // Check daily withdrawal limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyCount = await WithdrawalRequest.countDocuments({
    mentor: mentorId,
    createdAt: { $gte: today },
    status: { $nin: ['cancelled'] },
  });

  if (dailyCount >= MAX_WITHDRAWALS_PER_DAY) {
    throw Object.assign(
      new Error(`Maximum ${MAX_WITHDRAWALS_PER_DAY} withdrawal requests per day`),
      { statusCode: 429 }
    );
  }

  // Atomically decrement available balance (prevents race conditions)
  const wallet = await MentorWallet.findOneAndUpdate(
    {
      mentor: mentorId,
      availableBalance: { $gte: amount },
    },
    {
      $inc: { availableBalance: -amount },
    },
    { new: true }
  );

  if (!wallet) {
    throw Object.assign(new Error('Insufficient available balance'), { statusCode: 400 });
  }

  // Create withdrawal request with bank snapshot
  const withdrawal = await WithdrawalRequest.create({
    mentor: mentorId,
    amount,
    status: 'requested',
    bankSnapshot: {
      accountNumberMasked: bankAccount.accountNumberMasked,
      ifsc: bankAccount.ifscDisplay,
      accountHolderName: decrypt(bankAccount.accountHolderName_enc) || 'N/A',
      bankName: bankAccount.bankName || '',
    },
    razorpayFundAccountId: bankAccount.razorpayFundAccountId,
    razorpayContactId: bankAccount.razorpayContactId,
  });

  // Create withdrawal ledger entry
  await MentorLedger.create({
    mentor: mentorId,
    type: 'withdrawal',
    amount: -amount,
    status: 'pending',
    withdrawal: withdrawal._id,
    description: `Withdrawal request #${withdrawal._id.toString().slice(-6).toUpperCase()}`,
  });

  return withdrawal;
};

/**
 * Process an approved withdrawal by initiating the Razorpay payout.
 * @param {string} withdrawalId
 * @returns {Promise<WithdrawalRequest>}
 */
export const processWithdrawal = async (withdrawalId) => {
  const withdrawal = await WithdrawalRequest.findById(withdrawalId);
  if (!withdrawal) {
    throw new Error('Withdrawal request not found');
  }

  if (withdrawal.status !== 'approved') {
    throw new Error('Withdrawal must be approved before processing');
  }

  withdrawal.status = 'processing';
  await withdrawal.save();

  try {
    const payoutResult = await initiatePayout({
      fundAccountId: withdrawal.razorpayFundAccountId,
      amount: withdrawal.amount,
      currency: 'INR',
      referenceId: `WD_${withdrawal._id}`,
      narration: `InterviewAce Payout #${withdrawal._id.toString().slice(-6).toUpperCase()}`,
    });

    withdrawal.payoutId = payoutResult.id;

    if (payoutResult.simulated || payoutResult.status === 'processed') {
      // Immediate success (simulated mode or instant processing)
      return await handlePayoutSuccess(withdrawal._id, {
        payoutId: payoutResult.id,
        utr: payoutResult.utr,
      });
    }

    // In real mode, payout status will be updated via webhook
    await withdrawal.save();
    return withdrawal;
  } catch (err) {
    console.error(`[WalletService] Payout failed for withdrawal ${withdrawalId}:`, err);
    return await handlePayoutFailure(withdrawal._id, err.message || 'Payout initiation failed');
  }
};

/**
 * Handle a successful payout.
 * @param {string} withdrawalId
 * @param {{ payoutId: string, utr: string }} payoutDetails
 * @returns {Promise<WithdrawalRequest>}
 */
export const handlePayoutSuccess = async (withdrawalId, payoutDetails) => {
  const withdrawal = await WithdrawalRequest.findById(withdrawalId);
  if (!withdrawal) throw new Error('Withdrawal not found');

  withdrawal.status = 'success';
  withdrawal.payoutId = payoutDetails.payoutId || withdrawal.payoutId;
  withdrawal.utr = payoutDetails.utr || null;
  withdrawal.completedAt = new Date();
  await withdrawal.save();

  // Update wallet withdrawn amount
  await MentorWallet.findOneAndUpdate(
    { mentor: withdrawal.mentor },
    {
      $inc: { withdrawnAmount: withdrawal.amount },
    }
  );

  // Update ledger entry
  await MentorLedger.findOneAndUpdate(
    { withdrawal: withdrawal._id, type: 'withdrawal' },
    { status: 'withdrawn' }
  );

  return withdrawal;
};

/**
 * Handle a failed payout — revert balance and optionally retry.
 * @param {string} withdrawalId
 * @param {string} reason
 * @returns {Promise<WithdrawalRequest>}
 */
export const handlePayoutFailure = async (withdrawalId, reason) => {
  const withdrawal = await WithdrawalRequest.findById(withdrawalId);
  if (!withdrawal) throw new Error('Withdrawal not found');

  withdrawal.status = 'failed';
  withdrawal.failureReason = reason;
  withdrawal.retryCount = (withdrawal.retryCount || 0) + 1;
  await withdrawal.save();

  // Revert balance
  await MentorWallet.findOneAndUpdate(
    { mentor: withdrawal.mentor },
    {
      $inc: { availableBalance: withdrawal.amount },
    }
  );

  // Revert ledger entry
  await MentorLedger.findOneAndUpdate(
    { withdrawal: withdrawal._id, type: 'withdrawal' },
    { status: 'reversed' }
  );

  return withdrawal;
};

/**
 * Handle a refund on a session payment — deduct from mentor's wallet.
 * @param {string} sessionPaymentId
 * @returns {Promise<MentorLedger>}
 */
export const handleRefund = async (sessionPaymentId) => {
  const payment = await SessionPayment.findById(sessionPaymentId);
  if (!payment) throw new Error('Session payment not found');

  const wallet = await MentorWallet.findOne({ mentor: payment.mentor });
  if (!wallet) throw new Error('Mentor wallet not found');

  // Determine which balance to deduct from
  const originalLedger = await MentorLedger.findOne({
    sessionPayment: sessionPaymentId,
    type: 'session_earning',
  });

  const refundAmount = payment.mentorAmount;
  let deductFrom = 'availableBalance';

  if (originalLedger && originalLedger.status === 'pending') {
    deductFrom = 'pendingBalance';
  }

  // Create debit ledger entry
  const ledgerEntry = await MentorLedger.create({
    mentor: payment.mentor,
    type: 'refund_debit',
    amount: -refundAmount,
    mentorShare: -refundAmount,
    grossAmount: -payment.amount,
    status: 'settled',
    sessionPayment: payment._id,
    student: payment.student,
    description: `Refund for session payment ${payment.invoiceId || payment.orderId}`,
    settledAt: new Date(),
  });

  // Deduct from wallet
  await MentorWallet.findOneAndUpdate(
    { mentor: payment.mentor },
    {
      $inc: {
        totalEarned: -refundAmount,
        [deductFrom]: -refundAmount,
      },
    }
  );

  // Mark original ledger entry as reversed
  if (originalLedger) {
    originalLedger.status = 'reversed';
    await originalLedger.save();
  }

  return ledgerEntry;
};
