import MentorLedger from '../models/MentorLedger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import StudentProfile from '../models/StudentProfile.js';
import { getOrCreateWallet, requestWithdrawal } from '../services/walletService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({
      wallet: {
        totalEarned: wallet.totalEarned,
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        withdrawnAmount: wallet.withdrawnAmount,
        formatted: {
          totalEarned: (wallet.totalEarned / 100).toFixed(2),
          availableBalance: (wallet.availableBalance / 100).toFixed(2),
          pendingBalance: (wallet.pendingBalance / 100).toFixed(2),
          withdrawnAmount: (wallet.withdrawnAmount / 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { mentor: req.user._id };
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const total = await MentorLedger.countDocuments(query);
    const ledgers = await MentorLedger.find(query)
      .populate('student', 'email')
      .populate('sessionPayment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch student profiles for names
    const studentIds = ledgers.map(l => l.student?._id).filter(Boolean);
    const studentProfiles = await StudentProfile.find({ userId: { $in: studentIds } });

    const transactions = ledgers.map(ledger => {
      const sp = studentProfiles.find(p => p.userId.toString() === ledger.student?._id?.toString());
      return {
        ...ledger.toObject(),
        studentName: sp?.fullName || ledger.student?.email?.split('@')[0] || 'Unknown'
      };
    });

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getChart = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const aggregation = await MentorLedger.aggregate([
      {
        $match: {
          mentor: req.user._id,
          type: 'session_earning',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const chartData = aggregation.map(item => {
      const [year, month] = item._id.split('-');
      const date = new Date(year, month - 1);
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { month: item._id, label, amount: item.amount };
    });

    res.json({ chartData });
  } catch (error) {
    next(error);
  }
};

export const requestWithdrawalHandler = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    const withdrawal = await requestWithdrawal(req.user._id, amount);
    res.status(201).json({ withdrawal });
  } catch (error) {
    next(error);
  }
};

export const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ mentor: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (error) {
    next(error);
  }
};
