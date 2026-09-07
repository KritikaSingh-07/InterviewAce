import mongoose from 'mongoose';

const mentorLedgerSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['session_earning', 'refund_debit', 'withdrawal', 'adjustment'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      // Positive for credits, negative for debits
    },
    mentorShare: {
      type: Number,
      default: 0,
    },
    platformShare: {
      type: Number,
      default: 0,
    },
    grossAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'settled', 'withdrawn', 'reversed'],
      default: 'pending',
    },
    // Traceability references
    sessionPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionPayment',
      default: null,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockInterview',
      default: null,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    withdrawal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WithdrawalRequest',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    settlesAt: {
      type: Date,
      default: null,
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
mentorLedgerSchema.index({ mentor: 1, createdAt: -1 });
mentorLedgerSchema.index({ mentor: 1, status: 1 });
mentorLedgerSchema.index({ status: 1, settlesAt: 1 }); // For settlement cron

const MentorLedger = mongoose.model('MentorLedger', mentorLedgerSchema);
export default MentorLedger;
