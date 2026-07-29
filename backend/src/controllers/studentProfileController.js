import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// @desc    Create student profile
// @route   POST /api/student-profile
// @access  Private
const createStudentProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      college,
      degree,
      branch,
      year,
      careerGoal,
      targetCompanies,
      selfAssessment,
    } = req.body;

    if (!fullName || !college || !degree || !branch || !year || !careerGoal || !targetCompanies || selfAssessment === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if role is student
    if (req.user.role !== 'student') {
      return res.status(400).json({ error: 'User role must be student to create student profile' });
    }

    // Check if profile already exists
    let studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (studentProfile) {
      return res.status(400).json({ error: 'Student profile already exists' });
    }

    studentProfile = await StudentProfile.create({
      userId: req.user._id,
      fullName,
      college,
      degree,
      branch,
      year,
      careerGoal,
      targetCompanies,
      selfAssessment,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      profileId: studentProfile._id,
      roleProfileModel: 'StudentProfile',
      onboardingCompleted: true,
      isProfileComplete: true,
    });

    // Create or update legacy Profile for compatibility
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          fullName,
          targetRole: careerGoal,
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: 'Student onboarding completed successfully',
      profile: studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

export { createStudentProfile };
