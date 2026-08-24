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
        enum: [
          'article', 'video', 'documentation', 'practice', 'quiz',
          'course', 'book', 'tutorial', 'tool', 'github', 'exercise',
          'podcast', 'website', 'other',
        ],
        // Default unrecognized types to 'article'
        set: (v) => [
          'article','video','documentation','practice','quiz',
          'course','book','tutorial','tool','github','exercise',
          'podcast','website','other',
        ].includes(v) ? v : 'article',
      },
    },
  ],
  practiceQuestions: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      question: String,
      type: {
        type: String,
        enum: ['technical', 'behavioral', 'system-design', 'system design', 'coding', 'conceptual', 'mixed'],
        set: (v) => {
          if (!v) return 'technical';
          const s = v.toLowerCase().trim();
          if (s.includes('behav')) return 'behavioral';
          if (s.includes('system')) return 'system-design';
          if (s.includes('cod')) return 'technical';
          return ['technical','behavioral','system-design','system design','coding','conceptual','mixed'].includes(s) ? s : 'technical';
        },
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        set: (v) => ['easy','medium','hard'].includes(v?.toLowerCase()) ? v.toLowerCase() : 'medium',
      },
      answered: { type: Boolean, default: false },
      userAnswer: { type: String, default: '' },
      score: { type: Number, default: 0 },
      aiFeedback: {
        idealAnswer: { type: String, default: '' },
        explanation: { type: String, default: '' },
        keyPoints: [String],
        score: { type: Number, default: 0 },
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
    set: (v) => ['low','medium','high','critical'].includes(v?.toLowerCase()) ? v.toLowerCase() : 'medium',
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

