import Profile from '../models/Profile.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import MentorProfile from '../models/MentorProfile.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { deleteCloudinaryImage } from '../utils/deleteCloudinaryImage.js';

// @desc    Create or update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const { fullName, college, degree, branch, year, careerGoal, targetCompanies, selfAssessment } = req.body;

      if (!fullName || !college || !degree || !branch || !year || !careerGoal || !targetCompanies || selfAssessment === undefined) {
        return res.status(400).json({ error: 'All student profile fields are required' });
      }

      const studentProfile = await StudentProfile.findOneAndUpdate(
        { userId: req.user._id },
        {
          $set: {
            fullName,
            college,
            degree,
            branch,
            year: Number(year),
            careerGoal,
            targetCompanies,
            selfAssessment,
          },
        },
        { new: true, runValidators: true }
      );

      // Sync legacy profile
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

      // Construct return profile format
      const mappedProfile = {
        _id: studentProfile._id,
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          profileImage: req.user.profileImage,
          profileImagePublicId: req.user.profileImagePublicId,
        },
        fullName: studentProfile.fullName,
        college: studentProfile.college,
        degree: studentProfile.degree,
        branch: studentProfile.branch,
        year: studentProfile.year,
        careerGoal: studentProfile.careerGoal,
        targetCompanies: studentProfile.targetCompanies,
        selfAssessment: studentProfile.selfAssessment,
        createdAt: studentProfile.createdAt,
        updatedAt: studentProfile.updatedAt,
      };

      return res.json({ profile: mappedProfile });
    } else if (req.user.role === 'mentor') {
      const { fullName, company, designation, experience, skills, linkedin, bio } = req.body;

      if (!fullName || !company || !designation || experience === undefined || !skills || !linkedin || !bio) {
        return res.status(400).json({ error: 'All mentor profile fields are required' });
      }

      const mentorProfile = await MentorProfile.findOneAndUpdate(
        { userId: req.user._id },
        {
          $set: {
            fullName,
            company,
            designation,
            experience: Number(experience),
            skills,
            linkedin,
            bio,
          },
        },
        { new: true, runValidators: true }
      );

      // Sync legacy profile
      await Profile.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            fullName,
            bio,
            linkedinUrl: linkedin,
            targetRole: designation,
            yearsOfExperience: Number(experience),
            skills: skills.map(skillName => ({ name: skillName, level: 'expert' })),
          },
        },
        { new: true, upsert: true }
      );

      // Construct return profile format
      const mappedProfile = {
        _id: mentorProfile._id,
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          profileImage: req.user.profileImage,
          profileImagePublicId: req.user.profileImagePublicId,
        },
        fullName: mentorProfile.fullName,
        company: mentorProfile.company,
        designation: mentorProfile.designation,
        experience: mentorProfile.experience,
        skills: mentorProfile.skills,
        linkedin: mentorProfile.linkedin,
        bio: mentorProfile.bio,
        createdAt: mentorProfile.createdAt,
        updatedAt: mentorProfile.updatedAt,
      };

      return res.json({ profile: mappedProfile });
    } else {
      // Legacy profile update fallback
      const { fullName, bio, linkedinUrl, githubUrl, targetRole, yearsOfExperience, skills, preferences } = req.body;
      const profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            fullName,
            bio,
            linkedinUrl,
            githubUrl,
            targetRole,
            yearsOfExperience,
            skills,
            preferences,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      return res.json({
        profile: {
          ...profile.toObject(),
          user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            profileImage: req.user.profileImage,
            profileImagePublicId: req.user.profileImagePublicId,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    let profile = null;

    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (studentProfile) {
        profile = {
          _id: studentProfile._id,
          user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            profileImage: req.user.profileImage,
            profileImagePublicId: req.user.profileImagePublicId,
          },
          fullName: studentProfile.fullName,
          college: studentProfile.college,
          degree: studentProfile.degree,
          branch: studentProfile.branch,
          year: studentProfile.year,
          careerGoal: studentProfile.careerGoal,
          targetCompanies: studentProfile.targetCompanies,
          selfAssessment: studentProfile.selfAssessment,
          createdAt: studentProfile.createdAt,
          updatedAt: studentProfile.updatedAt,
          // legacy fields for compatibility
          bio: '',
          linkedinUrl: '',
          githubUrl: '',
          targetRole: studentProfile.careerGoal,
          yearsOfExperience: 0,
          skills: [],
          preferences: {
            emailNotifications: true,
            darkMode: false,
          },
        };
      }
    } else if (req.user.role === 'mentor') {
      const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
      if (mentorProfile) {
        profile = {
          _id: mentorProfile._id,
          user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            profileImage: req.user.profileImage,
            profileImagePublicId: req.user.profileImagePublicId,
          },
          fullName: mentorProfile.fullName,
          company: mentorProfile.company,
          designation: mentorProfile.designation,
          experience: mentorProfile.experience,
          skills: mentorProfile.skills,
          linkedin: mentorProfile.linkedin,
          bio: mentorProfile.bio,
          createdAt: mentorProfile.createdAt,
          updatedAt: mentorProfile.updatedAt,
          // legacy fields for compatibility
          linkedinUrl: mentorProfile.linkedin,
          githubUrl: '',
          targetRole: mentorProfile.designation,
          yearsOfExperience: mentorProfile.experience,
          preferences: {
            emailNotifications: true,
            darkMode: false,
          },
        };
      }
    }

    // Fallback to legacy Profile if not a student/mentor or profile not created yet
    if (!profile) {
      const legacyProfile = await Profile.findOne({ user: req.user._id });
      if (legacyProfile) {
        profile = {
          ...legacyProfile.toObject(),
          user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            profileImage: req.user.profileImage,
            profileImagePublicId: req.user.profileImagePublicId,
          },
        };
      }
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile image to Cloudinary
// @route   POST /api/profile/upload-image
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }

    // Upload direct from buffer to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    // Delete previous image if exists
    if (req.user.profileImagePublicId) {
      await deleteCloudinaryImage(req.user.profileImagePublicId);
    }

    // Save public url and public ID in User
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profileImage: result.secure_url,
          profileImagePublicId: result.public_id,
        },
      },
      { new: true }
    );

    // Sync legacy Profile
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { avatar: result.secure_url } }
    );

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: updatedUser.profileImage,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        isProfileComplete: updatedUser.isProfileComplete,
        onboardingCompleted: updatedUser.onboardingCompleted,
        profileImage: updatedUser.profileImage,
        profileImagePublicId: updatedUser.profileImagePublicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profile image
// @route   DELETE /api/profile/remove-image
// @access  Private
const removeImage = async (req, res, next) => {
  try {
    if (req.user.profileImagePublicId) {
      await deleteCloudinaryImage(req.user.profileImagePublicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profileImage: null,
          profileImagePublicId: null,
        },
      },
      { new: true }
    );

    // Sync legacy Profile
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { avatar: '' } }
    );

    res.json({
      message: 'Profile image removed successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        isProfileComplete: updatedUser.isProfileComplete,
        onboardingCompleted: updatedUser.onboardingCompleted,
        profileImage: null,
        profileImagePublicId: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { updateProfile, getProfile, uploadImage, removeImage };
