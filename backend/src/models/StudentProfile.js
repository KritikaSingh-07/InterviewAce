import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Current year is required'],
      min: [1, 'Year must be at least 1'],
    },
    careerGoal: {
      type: String,
      required: [true, 'Career goal is required'],
      trim: true,
    },
    targetCompanies: {
      type: [String],
      required: [true, 'Target companies are required'],
      default: [],
    },
    selfAssessment: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Self-assessment is required'],
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
