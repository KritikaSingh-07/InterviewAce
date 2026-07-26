import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  topics: [String],
  resources: [
    {
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'documentation', 'practice', 'quiz'],
      },
    },
  ],
  practiceQuestions: [
    {
      question: String,
      type: {
        type: String,
        enum: ['technical', 'behavioral', 'system-design'],
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
      },
    },
  ],
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
});

const skillGapSchema = new mongoose.Schema({
  skill: String,
  currentLevel: String,
  targetLevel: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  resources: [String],
});

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
    },
    careerBio: {
      type: String,
      default: '',
    },
    durationWeeks: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['generating', 'active', 'completed', 'paused', 'archived'],
      default: 'generating',
    },
    skillGapAnalysis: [skillGapSchema],
    weeklyStructure: [
      {
        week: Number,
        focus: String,
        days: [taskSchema],
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    progress: {
      totalTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    aiPromptUsed: String,
    rawAiResponse: String,
  },
  {
    timestamps: true,
  }
);

// Virtual for completion percentage
roadmapSchema.virtual('completionPercentage').get(function () {
  if (this.progress.totalTasks === 0) return 0;
  return Math.round((this.progress.completedTasks / this.progress.totalTasks) * 100);
});

roadmapSchema.set('toJSON', { virtuals: true });
roadmapSchema.set('toObject', { virtuals: true });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;

