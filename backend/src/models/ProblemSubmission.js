import mongoose from 'mongoose';

const problemSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemSlug: { type: String, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  passed: { type: Boolean, required: true, index: true },
  testsPassed: { type: Number, default: 0 },
  testsTotal: { type: Number, default: 0 },
}, { timestamps: true });

problemSubmissionSchema.index({ userId: 1, problemSlug: 1, createdAt: -1 });
export default mongoose.model('ProblemSubmission', problemSubmissionSchema);
