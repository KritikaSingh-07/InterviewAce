import mongoose from "mongoose";

const questionResponseSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    questionNumber: {
      type: Number,
      required: true,
    },

    questionType: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "system-design",
        "coding",
        "mixed",
      ],
      default: "technical",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    status: {
      type: String,
      enum: ["pending", "answered", "skipped"],
      default: "pending",
    },

    userAnswer: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    answeredAt: {
      type: Date,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    aiFeedback: {
      strengths: {
        type: [String],
        default: [],
      },

      weaknesses: {
        type: [String],
        default: [],
      },

      missingKeywords: {
        type: [String],
        default: [],
      },

      suggestedAnswer: {
        type: String,
        default: "",
      },

      improvementTips: {
        type: [String],
        default: [],
      },

      communicationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      technicalAccuracy: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },
  {
    _id: true,
  }
);

const feedbackReportSchema = new mongoose.Schema(
  {
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    technicalAccuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    answeredQuestions: {
      type: Number,
      default: 0,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    missingKeywords: {
      type: [String],
      default: [],
    },

    improvementTips: {
      type: [String],
      default: [],
    },

    detailedAnalysis: {
      type: String,
      default: "",
    },

    recommendedResources: [
      {
        title: String,
        url: String,
        reason: String,
      },
    ],
  },
  {
    _id: false,
  }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      required: [true, "Interview role is required"],
      trim: true,
    },

    experience: {
      type: String,
      enum: ["entry", "mid", "senior", "lead"],
      default: "mid",
    },

    type: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "mixed",
        "system-design",
      ],
      default: "mixed",
    },

    // Selected interview duration (minutes)
    duration: {
      type: Number,
      enum: [1, 5, 10, 15, 20, 30],
      default: 1,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },

    startedAt: Date,

    completedAt: Date,

    expiresAt: Date,

    currentDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    totalQuestionsAsked: {
      type: Number,
      default: 1,
    },

    questions: {
      type: [questionResponseSchema],
      default: [],
    },

    targetScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    overallFeedback: {
      type: feedbackReportSchema,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    aiAnalysisComplete: {
      type: Boolean,
      default: false,
    },

    // Future Voice Interview
    isVoiceEnabled: {
      type: Boolean,
      default: false,
    },

    voiceLanguage: {
      type: String,
      default: "en-US",
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// Indexes
// =========================

mockInterviewSchema.index({
  user: 1,
  createdAt: -1,
});

mockInterviewSchema.index({
  status: 1,
});

mockInterviewSchema.index({
  expiresAt: 1,
});

// =========================
// Virtuals
// =========================

mockInterviewSchema.virtual("answeredQuestions").get(function () {
  return this.questions.filter(
    (q) => q.status === "answered"
  ).length;
});

mockInterviewSchema.virtual("remainingQuestions").get(function () {
  return this.questions.filter(
    (q) => q.status === "pending"
  ).length;
});

mockInterviewSchema.set("toJSON", {
  virtuals: true,
});

mockInterviewSchema.set("toObject", {
  virtuals: true,
});

const MockInterview = mongoose.model(
  "MockInterview",
  mockInterviewSchema
);

export default MockInterview;