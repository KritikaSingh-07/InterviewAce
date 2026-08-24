import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['mock_interview', 'roadmap_task', 'roadmap_question', 'daily_challenge', 'streak', 'bonus', 'coding_tutor'],
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  description: String,
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
  },
  referenceModel: {
    type: String,
    enum: ['MockInterview', 'Roadmap'],
  },
  awardedAt: {
    type: Date,
    default: Date.now,
  },
});

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: String,
  description: String,
  awardedAt: {
    type: Date,
    default: Date.now,
  },
  criteria: String,
});

const leaderboardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    weeklyPoints: {
      type: Number,
      default: 0,
    },
    monthlyPoints: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    weeklyRank: {
      type: Number,
      default: 0,
    },
    pointsHistory: [pointSchema],
    badges: [badgeSchema],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActive: Date,
    },
    stats: {
      interviewsCompleted: { type: Number, default: 0 },
      roadmapsCompleted: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

leaderboardSchema.index({ totalPoints: -1 });
leaderboardSchema.index({ weeklyPoints: -1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;

