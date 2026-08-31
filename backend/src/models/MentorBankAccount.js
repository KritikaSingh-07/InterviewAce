import mongoose from 'mongoose';

// Encrypted field sub-schema
const encryptedFieldSchema = new mongoose.Schema(
  {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false }
);

const mentorBankAccountSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Encrypted fields
    accountNumber_enc: {
      type: encryptedFieldSchema,
      default: null,
    },
    ifsc_enc: {
      type: encryptedFieldSchema,
      default: null,
    },
    accountHolderName_enc: {
      type: encryptedFieldSchema,
      default: null,
    },
    upiId_enc: {
      type: encryptedFieldSchema,
      default: null,
    },
    // Display fields (unencrypted)
    accountNumberMasked: {
      type: String,
      default: '',
    },
    ifscDisplay: {
      type: String,
      default: '',
    },
    bankName: {
      type: String,
      default: '',
    },
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'upi'],
      default: 'bank_transfer',
    },
    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'failed'],
      default: 'unverified',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationTransactionId: {
      type: String,
      default: null,
    },
    // Razorpay references
    razorpayContactId: {
      type: String,
      default: null,
    },
    razorpayFundAccountId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const MentorBankAccount = mongoose.model('MentorBankAccount', mentorBankAccountSchema);
export default MentorBankAccount;
