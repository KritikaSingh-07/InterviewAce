import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: String,
}, { _id: false });

// Canonical, content-managed coding problem. User-specific state lives in TutorSession.
const codingProblemSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true, index: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'], index: true },
  companies: { type: [String], default: [], index: true },
  description: { type: String, required: true },
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  note: String,
  examples: { type: [exampleSchema], default: [] },
  starterCode: { type: Map, of: String, default: {} },
  visibleTestCases: { type: [mongoose.Schema.Types.Mixed], default: [] },
  hiddenTestCases: { type: [mongoose.Schema.Types.Mixed], default: [], select: false },
  solution: { type: mongoose.Schema.Types.Mixed, select: false },
  editorial: { type: String, select: false },
  timeComplexity: String,
  spaceComplexity: String,
  acceptanceRate: String,
  xpReward: { type: Number, default: 50, min: 0 },
  estimatedTime: String,
  source: { type: String, default: 'seed' },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });

codingProblemSchema.index({ isPublished: 1, topic: 1, difficulty: 1, title: 1 });
codingProblemSchema.index({ title: 'text', description: 'text', topic: 'text', companies: 'text' });

export default mongoose.model('CodingProblem', codingProblemSchema);
