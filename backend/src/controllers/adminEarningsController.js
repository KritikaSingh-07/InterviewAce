import MentorWallet from '../models/MentorWallet.js';
import MentorProfile from '../models/MentorProfile.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { processWithdrawal } from '../services/walletService.js';
import MentorLedger from '../models/MentorLedger.js';

export const getAllMentorWallets = async (req, res, next) => {
  try {
    const wallets = await MentorWallet.find().populate('mentor', 'email');

    const mentorIds = wallets.map(w => w.mentor?._id).filter(Boolean);
    const profiles = await MentorProfile.find({ userId: { $in: mentorIds } });

    const mentors = wallets.map(wallet => {
      const profile = profiles.find(p => p.userId.toString() === wallet.mentor?._id?.toString());
      return {
        wallet,
        mentorName: profile?.fullName || wallet.mentor?.email?.split('@')[0] || 'Unknown',
        email: wallet.mentor?.email
      };
    });

    res.json({ mentors });
  } catch (error) {
    next(error);
  }
};

export const getAllWithdrawals = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const withdrawals = await WithdrawalRequest.find(query)
      .populate('mentor', 'email')
      .sort({ createdAt: -1 });

    const mentorIds = withdrawals.map(w => w.mentor?._id).filter(Boolean);
    const profiles = await MentorProfile.find({ userId: { $in: mentorIds } });

    const populatedWithdrawals = withdrawals.map(w => {
      const profile = profiles.find(p => p.userId.toString() === w.mentor?._id?.toString());
      return {
        ...w.toObject(),
        mentorName: profile?.fullName || w.mentor?.email?.split('@')[0] || 'Unknown'
      };
    });

    res.json({ withdrawals: populatedWithdrawals });
  } catch (error) {
    next(error);
  }
};

export const approveWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const withdrawal = await WithdrawalRequest.findById(id);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'requested') {
      return res.status(400).json({ error: 'Withdrawal is not in requested state' });
    }

    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user._id;
    withdrawal.approvedAt = new Date();
    await withdrawal.save();

    await processWithdrawal(id);

    res.json(withdrawal);
  } catch (error) {
    next(error);
  }
};

export const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'requested') {
      return res.status(400).json({ error: 'Withdrawal is not in requested state' });
    }

    withdrawal.status = 'cancelled';
    withdrawal.rejectedBy = req.user._id;
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = reason;
    await withdrawal.save();

    // Revert balance
    const wallet = await MentorWallet.findOne({ mentor: withdrawal.mentor });
    if (wallet) {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.availableBalance += withdrawal.amount;
      await wallet.save();
    }

    // Mark ledger as failed or cancel it
    await MentorLedger.updateOne(
      { referenceId: id, type: 'withdrawal' },
      { status: 'failed' }
    );

    res.json(withdrawal);
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    // Basic implementation for stats
    res.json({
      stats: {
        totalCommission: 0,
        totalPayouts: 0,
        totalPendingBalance: 0,
        pendingWithdrawals: 0
      }
    });
  } catch (error) {
    next(error);
  }
};
