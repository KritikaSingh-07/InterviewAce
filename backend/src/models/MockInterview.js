import mongoose from 'mongoose';

const questionResponseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'coding'],
    default: 'technical',
  },
  userAnswer: {
    type: String,
    default: '',
  },
  aiFeedback: {
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    suggestedAnswer: String,
    improvementTips: [String],
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
});

const feedbackReportSchema = new mongoose.Schema({
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  strengths: [String],
  weaknesses: [String],
  communicationScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  technicalAccuracy: {
    type: Number,
    min: 0,
    max: 100,
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  missingKeywords: [String],
  improvementTips: [String],
  detailedAnalysis: String,
  recommendedResources: [
    {
      title: String,
      url: String,
      reason: String,
    },
  ],
});

const mockInterviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Mentor who conducted/scheduled this interview (optional - AI interviews have no mentor)
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      required: [true, 'Interview role is required'],
    },
    experience: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'mixed', 'system-design'],
      default: 'mixed',
    },
    duration: {
      type: Number, // total duration in minutes
      default: 30,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    questions: [questionResponseSchema],
    overallFeedback: feedbackReportSchema,
    totalScore: {
      type: Number,
      default: 0,
    },
    aiAnalysisComplete: {
      type: Boolean,
      default: false,
    },
    isVoiceEnabled: {
      type: Boolean,
      default: false,
    },
    // Mentor-led interview scheduling & feedback fields
    scheduledAt: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    suggestions: {
      type: String,
      default: '',
    },
    mentorFeedback: {
      strengths: [String],
      areasToImprove: [String],
      detailedNotes: String,
      communicationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      technicalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
export default MockInterview;