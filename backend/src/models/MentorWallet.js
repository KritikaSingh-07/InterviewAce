import mongoose from 'mongoose';

const mentorWalletSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSettledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual check: totalEarned should equal availableBalance + pendingBalance + withdrawnAmount
mentorWalletSchema.methods.isBalanceConsistent = function () {
  const sum = this.availableBalance + this.pendingBalance + this.withdrawnAmount;
  return Math.abs(this.totalEarned - sum) < 1; // tolerance for floating point (amounts in paise)
};

const MentorWallet = mongoose.model('MentorWallet', mentorWalletSchema);
export default MentorWallet;
