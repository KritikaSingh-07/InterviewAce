import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Withdrawal amount must be positive'],
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'processing', 'success', 'failed', 'cancelled'],
      default: 'requested',
    },
    // Snapshot of bank details at time of request
    bankSnapshot: {
      accountNumberMasked: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    // Razorpay Payout details
    payoutId: {
      type: String,
      default: null,
    },
    razorpayFundAccountId: {
      type: String,
      default: null,
    },
    razorpayContactId: {
      type: String,
      default: null,
    },
    utr: {
      type: String,
      default: null,
    },
    // Admin actions
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Retry tracking
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ mentor: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;
