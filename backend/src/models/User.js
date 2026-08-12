import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'student', 'mentor'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'agency'],
      default: 'free',
    },
    planStartedAt: {
      type: Date,
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    profileImage: {
      type: String,
      default: null,
    },
    profileImagePublicId: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtuals for populate() support.
// The leaderboard and mentor controllers populate these paths on the User model.
userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('studentProfile', {
  ref: 'StudentProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// // Include virtuals in JSON/object serialization
// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
export default User;

