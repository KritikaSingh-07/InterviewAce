import mongoose from 'mongoose';

const sessionPaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockInterview',
      default: null,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      // Total amount paid by student in paise
    },
    currency: {
      type: String,
      default: 'INR',
    },
    mentorAmount: {
      type: Number,
      required: true,
      // 70% of amount in paise
    },
    platformAmount: {
      type: Number,
      required: true,
      // 30% of amount in paise
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    verifiedVia: {
      type: String,
      enum: ['client', 'webhook'],
      default: null,
    },
    invoiceId: {
      type: String,
      default: null,
    },
    refundId: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

sessionPaymentSchema.index({ mentor: 1, createdAt: -1 });
sessionPaymentSchema.index({ student: 1, createdAt: -1 });

const SessionPayment = mongoose.model('SessionPayment', sessionPaymentSchema);
export default SessionPayment;
