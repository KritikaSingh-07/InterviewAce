import mongoose from 'mongoose';

const tutorSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    stage: {
      type: String,
      enum: ['socratic', 'hint', 'solution', 'post-solution'],
      default: 'socratic',
    },
    hintLevel: {
      type: Number,
      default: 0, // 0: None, 1: Concept, 2: Edge Case, 3: Pseudo Code
    },
    solutionUnlocked: {
      type: Boolean,
      default: false,
    },
    // Problem status tracking
    status: {
      type: String,
      enum: ['not_started', 'attempted', 'solved'],
      default: 'not_started',
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound index for easy lookups
tutorSessionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const TutorSession = mongoose.model('TutorSession', tutorSessionSchema);
export default TutorSession;
