import MockInterview from '../models/MockInterview.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Leaderboard from '../models/Leaderboard.js';

// @desc    Get all active students with their profiles and AI scores
// @route   GET /api/mentor/students
// @access  Private (Mentor)
const getActiveStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    // Get all student users who completed onboarding
    const studentUsers = await User.find({
      role: 'student',
      onboardingCompleted: true,
    }).select('email profileImage profileImagePublicId');

    // Fetch student profiles
    const studentProfiles = await StudentProfile.find({
      userId: { $in: studentUsers.map((u) => u._id) },
    });

    // Fetch leaderboards for scores
    const leaderboards = await Leaderboard.find({
      user: { $in: studentUsers.map((u) => u._id) },
    }).select('stats.averageScore totalPoints weeklyPoints rank');

    const students = studentUsers.map((user) => {
      const profile = studentProfiles.find(
        (p) => p.userId.toString() === user._id.toString()
      );
      const lb = leaderboards.find(
        (l) => l.user.toString() === user._id.toString()
      );

      return {
        _id: user._id,
        email: user.email,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
        fullName: profile?.fullName || user.email?.split('@')[0] || 'Student',
        college: profile?.college || '',
        degree: profile?.degree || '',
        branch: profile?.branch || '',
        year: profile?.year || 1,
        careerGoal: profile?.careerGoal || '',
        targetCompanies: profile?.targetCompanies || [],
        selfAssessment: profile?.selfAssessment || {},
        score: lb?.stats?.averageScore || 0,
        totalPoints: lb?.totalPoints || 0,
        weeklyPoints: lb?.weeklyPoints || 0,
        interviewsCompleted: lb?.stats?.interviewsCompleted || 0,
      };
    });

    res.json({ students });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/schedule a mentor-led mock interview session
// @route   POST /api/mentor/interviews
// @access  Private (Mentor)
const createMentorInterview = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { studentId, scheduledAt, duration, type } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Please select a student' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ error: 'Please select a start time for the interview' });
    }
    if (!duration) {
      return res.status(400).json({ error: 'Please select an interview duration' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Please select an interview type' });
    }

    // Validate student exists and is a student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Validate interview type
    const validTypes = ['technical', 'behavioral', 'system-design', 'mixed', 'HR Screening'];
    const interviewType = validTypes.includes(type) ? type : 'mixed';

    // Get student profile for role info
    const studentProfile = await StudentProfile.findOne({ userId: studentId });

    const interview = await MockInterview.create({
      user: studentId,
      mentor: req.user._id,
      role: studentProfile?.careerGoal || 'General',
      experience: 'mid',
      type: interviewType,
      duration: Number(duration) || 15,
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt),
      questions: [],
    });

    res.status(201).json({
      message: 'Mock interview session created successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interviews conducted by this mentor
// @route   GET /api/mentor/interviews
// @access  Private (Mentor)
const getMentorInterviews = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const interviews = await MockInterview.find({ mentor: req.user._id })
      .populate('user', 'email profileImage')
      .populate({
        path: 'user',
        populate: { path: 'studentProfile', select: 'fullName' },
      })
      .sort('-createdAt');

    // Attach student full name via StudentProfile lookup
    const userIds = interviews.map((i) => i.user?._id).filter(Boolean);
    const studentProfiles = await StudentProfile.find({
      userId: { $in: userIds },
    }).select('fullName careerGoal college');

    const populated = interviews.map((interview) => {
      const studentProfile = studentProfiles.find(
        (sp) => sp.userId.toString() === interview.user?._id?.toString()
      );
      const obj = interview.toObject();
      return {
        ...obj,
        studentProfile,
        studentName: studentProfile?.fullName || interview.user?.email?.split('@')[0] || 'Student',
      };
    });

    res.json({ interviews: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single mentor interview with full details
// @route   GET /api/mentor/interviews/:id
// @access  Private (Mentor)
const getMentorInterviewById = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const interview = await MockInterview.findOne({
      _id: req.params.id,
      mentor: req.user._id,
    }).populate('user', 'email profileImage');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const studentProfile = await StudentProfile.findOne({
      userId: interview.user._id,
    }).select('fullName careerGoal college degree branch year');

    res.json({
      interview: {
        ...interview.toObject(),
        studentProfile,
        studentName: studentProfile?.fullName || interview.user?.email?.split('@')[0] || 'Student',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit mentor feedback for a completed interview
// @route   POST /api/mentor/interviews/:id/feedback
// @access  Private (Mentor)
const submitFeedback = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { rating, suggestions, strengths, areasToImprove, communicationScore, technicalScore, detailedNotes, status } = req.body;

    const interview = await MockInterview.findOne({
      _id: req.params.id,
      mentor: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (rating !== undefined && (rating < 0 || rating > 100)) {
      return res.status(400).json({ error: 'Rating must be between 0 and 100' });
    }

    interview.rating = rating !== undefined ? Number(rating) : interview.rating;
    interview.suggestions = suggestions || interview.suggestions || '';
    interview.mentorFeedback = {
      strengths: strengths || interview.mentorFeedback?.strengths || [],
      areasToImprove: areasToImprove || interview.mentorFeedback?.areasToImprove || [],
      detailedNotes: detailedNotes || interview.mentorFeedback?.detailedNotes || '',
      communicationScore:
        communicationScore !== undefined
          ? Number(communicationScore)
          : interview.mentorFeedback?.communicationScore || null,
      technicalScore:
        technicalScore !== undefined
          ? Number(technicalScore)
          : interview.mentorFeedback?.technicalScore || null,
    };

    if (status === 'completed') {
      interview.status = 'completed';
      if (interview.totalScore === 0 && rating !== undefined) {
        interview.totalScore = Math.round(Number(rating));
      }
    }

    await interview.save();

    // Sync updated score back to leaderboard average
    if (interview.status === 'completed' && rating !== undefined) {
      try {
        let leaderboard = await Leaderboard.findOne({ user: interview.user });
        if (leaderboard) {
          // Recompute average including this interview
          const allCompleted = await MockInterview.find({
            user: interview.user,
            status: 'completed',
            totalScore: { $gt: 0 },
          }).select('totalScore');

          const total = allCompleted.reduce((sum, i) => sum + (i.totalScore || 0), 0);
          leaderboard.stats.averageScore = allCompleted.length
            ? Math.round(total / allCompleted.length)
            : 0;
          await leaderboard.save();
        }
      } catch (err) {
        console.error('Failed to sync leaderboard score:', err);
      }
    }

    res.json({
      message: 'Feedback submitted successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getActiveStudents,
  createMentorInterview,
  getMentorInterviews,
  getMentorInterviewById,
  submitFeedback,
};

