import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// @desc    Create mentor profile
// @route   POST /api/mentor-profile
// @access  Private
const createMentorProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      company,
      designation,
      experience,
      skills,
      linkedin,
      bio,
    } = req.body;

    if (!fullName || !company || !designation || experience === undefined || !skills || !linkedin || !bio) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if role is mentor
    if (req.user.role !== 'mentor') {
      return res.status(400).json({ error: 'User role must be mentor to create mentor profile' });
    }

    // Check if profile already exists
    let mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    if (mentorProfile) {
      return res.status(400).json({ error: 'Mentor profile already exists' });
    }

    mentorProfile = await MentorProfile.create({
      userId: req.user._id,
      fullName,
      company,
      designation,
      experience,
      skills,
      linkedin,
      bio,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      profileId: mentorProfile._id,
      roleProfileModel: 'MentorProfile',
      onboardingCompleted: true,
      isProfileComplete: true,
    });

    // Create or update legacy Profile for compatibility
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          fullName,
          bio,
          linkedinUrl: linkedin,
          targetRole: designation,
          yearsOfExperience: experience,
          skills: skills.map(skillName => ({ name: skillName, level: 'expert' })),
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: 'Mentor onboarding completed successfully',
      profile: mentorProfile,
    });
  } catch (error) {
    next(error);
  }
};

export { createMentorProfile };
