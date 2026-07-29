import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema(
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
    company: {
      type: String,
      required: [true, 'Current company is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    skills: {
      type: [String],
      required: [true, 'Primary skills are required'],
      default: [],
    },
    linkedin: {
      type: String,
      required: [true, 'LinkedIn URL is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
export default MentorProfile;
