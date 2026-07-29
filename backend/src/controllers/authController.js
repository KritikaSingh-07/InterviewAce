import User from '../models/User.js';
import Profile from '../models/Profile.js';
import StudentProfile from '../models/StudentProfile.js';
import MentorProfile from '../models/MentorProfile.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({ email, password });

    // Create profile
    await Profile.create({
      user: user._id,
      fullName: fullName || 'User',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        onboardingCompleted: user.onboardingCompleted,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.onboardingCompleted) {
      if (user.role === 'student') {
        profile = await StudentProfile.findOne({ userId: user._id });
      } else if (user.role === 'mentor') {
        profile = await MentorProfile.findOne({ userId: user._id });
      }
    }

    if (!profile) {
      profile = await Profile.findOne({ user: req.user._id });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        onboardingCompleted: user.onboardingCompleted,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, getMe };

