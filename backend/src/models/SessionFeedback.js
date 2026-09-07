import mongoose from 'mongoose';

const sessionFeedbackSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorSession',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'mentor'], // role of the reviewer
      required: true,
    },
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Student reviewing mentor specific categories
    knowledge: {
      type: Number,
      min: 1,
      max: 5,
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5,
    },
    explanation: {
      type: Number,
      min: 1,
      max: 5,
    },
    technicalKnowledge: {
      type: Number,
      min: 1,
      max: 5,
    },
    patience: {
      type: Number,
      min: 1,
      max: 5,
    },
    guidance: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Mentor reviewing student specific categories
    preparation: {
      type: Number,
      min: 1,
      max: 5,
    },
    problemSolving: {
      type: Number,
      min: 1,
      max: 5,
    },
    technicalSkills: {
      type: Number,
      min: 1,
      max: 5,
    },
    engagement: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate feedback submissions from the same reviewer for the same session
sessionFeedbackSchema.index({ session: 1, reviewer: 1 }, { unique: true });

const SessionFeedback = mongoose.model('SessionFeedback', sessionFeedbackSchema);
export default SessionFeedback;
