import Leaderboard from '../models/Leaderboard.js';

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Public
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const leaders = await Leaderboard.find()
      .populate('user', 'email')
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          select: 'fullName avatar',
        },
      })
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Assign ranks
    const rankedLeaders = leaders.map((entry, index) => ({
      ...entry,
      rank: skip + index + 1,
    }));

    const total = await Leaderboard.countDocuments();

    res.json({
      leaders: rankedLeaders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly leaderboard
// @route   GET /api/leaderboard/weekly
// @access  Public
const getWeeklyLeaderboard = async (req, res, next) => {
  try {
    const leaders = await Leaderboard.find({ weeklyPoints: { $gt: 0 } })
      .populate('user', 'email')
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          select: 'fullName avatar',
        },
      })
      .sort({ weeklyPoints: -1 })
      .limit(100)
      .lean();

    const rankedLeaders = leaders.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      weeklyRank: index + 1,
    }));

    res.json({ leaders: rankedLeaders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's leaderboard stats
// @route   GET /api/leaderboard/me
// @access  Private
const getMyStats = async (req, res, next) => {
  try {
    let leaderboard = await Leaderboard.findOne({ user: req.user._id }).populate({
      path: 'user',
      populate: {
        path: 'profile',
        select: 'fullName avatar',
      },
    });

    if (!leaderboard) {
      leaderboard = await Leaderboard.create({ user: req.user._id });
      leaderboard = await Leaderboard.findById(leaderboard._id).populate({
        path: 'user',
        populate: { path: 'profile', select: 'fullName avatar' },
      });
    }

    // Calculate global rank
    const globalRank = await Leaderboard.countDocuments({
      totalPoints: { $gt: leaderboard.totalPoints },
    });
    leaderboard.rank = globalRank + 1;

    // Calculate weekly rank
    const weeklyRank = await Leaderboard.countDocuments({
      weeklyPoints: { $gt: leaderboard.weeklyPoints },
    });
    leaderboard.weeklyRank = weeklyRank + 1;

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

export { getGlobalLeaderboard, getWeeklyLeaderboard, getMyStats };

