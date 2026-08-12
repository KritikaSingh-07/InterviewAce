import mongoose from 'mongoose';

const interviewRequestSchema = new mongoose.Schema(
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
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Short bio is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const InterviewRequest = mongoose.model('InterviewRequest', interviewRequestSchema);
export default InterviewRequest;
