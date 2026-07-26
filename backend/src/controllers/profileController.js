import Profile from '../models/Profile.js';
import User from '../models/User.js';

// @desc    Create or update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, linkedinUrl, githubUrl, targetRole, yearsOfExperience, skills, preferences } = req.body;

    const profileData = {
      fullName,
      bio,
      linkedinUrl,
      githubUrl,
      targetRole,
      yearsOfExperience,
      skills,
      preferences,
    };

    if (req.file) {
      profileData.avatar = `/uploads/${req.file.filename}`;
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    // Mark profile as complete if all required fields are filled
    if (profile.fullName) {
      await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true });
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

export { updateProfile, getProfile };

