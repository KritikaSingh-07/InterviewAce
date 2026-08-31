import MockInterview from '../models/MockInterview.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Leaderboard from '../models/Leaderboard.js';
import Profile from '../models/Profile.js';
import Roadmap from '../models/Roadmap.js';
import MentorProfile from '../models/MentorProfile.js';

// Allowed student plans for mentor view
const ALLOWED_MENTOR_STUDENT_PLANS = ['pro', 'agency'];

// Helper to normalize and map plan names
const formatPlanName = (plan) => {
  if (plan === 'agency') return 'Agency';
  if (plan === 'pro') return 'Model Pro';
  return plan || 'Model Pro';
};

// @desc    Get all active students with pro/agency plans, profiles, and AI scores
// @route   GET /api/mentor/students
// @access  Private (Mentor)
const getActiveStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    // Parse requested plan_type filter from query params
    const rawPlan = req.query.plan_type || req.query.plan || req.query.plans;
    let targetPlans = ALLOWED_MENTOR_STUDENT_PLANS;

    if (rawPlan) {
      const parsedPlans = (Array.isArray(rawPlan) ? rawPlan : String(rawPlan).split(','))
        .map((p) => p.trim().toLowerCase())
        .map((p) => (p === 'model_pro' ? 'pro' : p))
        .filter((p) => ALLOWED_MENTOR_STUDENT_PLANS.includes(p));

      if (parsedPlans.length > 0) {
        targetPlans = parsedPlans;
      }
    }

    // Get student users who completed onboarding and have pro/agency plans
    const studentUsers = await User.find({
      role: 'student',
      onboardingCompleted: true,
      plan: { $in: targetPlans },
    }).select('email plan planStartedAt planExpiresAt profileImage profileImagePublicId codingPreferences');

    const userIds = studentUsers.map((u) => u._id);

    // Fetch student profiles (onboarding details)
    const studentProfiles = await StudentProfile.find({
      userId: { $in: userIds },
    });

    // Fetch legacy profiles (bio, skills, linkedinUrl, etc.)
    const legacyProfiles = await Profile.find({
      user: { $in: userIds },
    });

    // Fetch leaderboards for AI interview scores and points
    const leaderboards = await Leaderboard.find({
      user: { $in: userIds },
    }).select('user stats.averageScore stats.interviewsCompleted totalPoints weeklyPoints rank');

    const students = studentUsers.map((user) => {
      const sProfile = studentProfiles.find(
        (p) => p.userId && p.userId.toString() === user._id.toString()
      );
      const lProfile = legacyProfiles.find(
        (p) => p.user && p.user.toString() === user._id.toString()
      );
      const lb = leaderboards.find(
        (l) => l.user && l.user.toString() === user._id.toString()
      );

      const targetCompanies =
        sProfile?.targetCompanies && sProfile.targetCompanies.length > 0
          ? sProfile.targetCompanies
          : user.codingPreferences?.targetCompanies || [];


      return {
        _id: user._id,
        email: user.email,
        plan: user.plan || 'pro',
        planName: formatPlanName(user.plan),
        planStartedAt: user.planStartedAt,
        planExpiresAt: user.planExpiresAt,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
        fullName: sProfile?.fullName || lProfile?.fullName || user.email?.split('@')[0] || 'Student',
        college: sProfile?.college || '',
        degree: sProfile?.degree || '',
        branch: sProfile?.branch || '',
        year: sProfile?.year || 1,
        careerGoal: sProfile?.careerGoal || lProfile?.targetRole || '',
        targetCompanies,
        selfAssessment: sProfile?.selfAssessment || {},
        bio: lProfile?.bio || '',
        skills: lProfile?.skills || [],
        linkedinUrl: lProfile?.linkedinUrl || '',
        githubUrl: lProfile?.githubUrl || '',
        yearsOfExperience: lProfile?.yearsOfExperience || 0,
        score: lb?.stats?.averageScore || 0,
        totalPoints: lb?.totalPoints || 0,
        weeklyPoints: lb?.weeklyPoints || 0,
        rank: lb?.rank || 0,
        interviewsCompleted: lb?.stats?.interviewsCompleted || 0,
        codingPreferences: user.codingPreferences,
      };
    });

    res.json({
      count: students.length,
      filteredPlans: targetPlans,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete student profile details by ID
// @route   GET /api/mentor/students/:id
// @access  Private (Mentor)
const getStudentById = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { id } = req.params;

    const studentUser = await User.findOne({
      _id: id,
      role: 'student',
    }).select('email plan planStartedAt planExpiresAt profileImage profileImagePublicId codingPreferences editorPreferences createdAt');

    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [studentProfile, legacyProfile, leaderboard, roadmaps, mockInterviews] = await Promise.all([
      StudentProfile.findOne({ userId: studentUser._id }),
      Profile.findOne({ user: studentUser._id }),
      Leaderboard.findOne({ user: studentUser._id }).select('stats totalPoints weeklyPoints rank streak badges'),
      Roadmap.find({ user: studentUser._id })
        .select('targetRole careerBio progress status createdAt durationWeeks')
        .sort('-createdAt')
        .limit(3),
      MockInterview.find({ user: studentUser._id })
        .select('role type duration rating totalScore status scheduledAt createdAt mentorFeedback suggestions mentor')
        .populate('mentor', 'email')
        .sort('-createdAt')
        .limit(5),
    ]);

    const targetCompanies =
      studentProfile?.targetCompanies && studentProfile.targetCompanies.length > 0
        ? studentProfile.targetCompanies
        : studentUser.codingPreferences?.targetCompanies || [];

    const studentDetail = {
      _id: studentUser._id,
      email: studentUser.email,
      plan: studentUser.plan || 'pro',
      planName: formatPlanName(studentUser.plan),
      planStartedAt: studentUser.planStartedAt,
      planExpiresAt: studentUser.planExpiresAt,
      profileImage: studentUser.profileImage,
      profileImagePublicId: studentUser.profileImagePublicId,
      fullName: studentProfile?.fullName || legacyProfile?.fullName || studentUser.email?.split('@')[0] || 'Student',
      college: studentProfile?.college || '',
      degree: studentProfile?.degree || '',
      branch: studentProfile?.branch || '',
      year: studentProfile?.year || 1,
      careerGoal: studentProfile?.careerGoal || legacyProfile?.targetRole || roadmaps[0]?.targetRole || '',
      targetCompanies,
      selfAssessment: studentProfile?.selfAssessment || {},
      bio: legacyProfile?.bio || roadmaps[0]?.careerBio || '',
      skills: legacyProfile?.skills || [],
      linkedinUrl: legacyProfile?.linkedinUrl || '',
      githubUrl: legacyProfile?.githubUrl || '',
      yearsOfExperience: legacyProfile?.yearsOfExperience || 0,
      resumeUrl: legacyProfile?.resumeUrl || '',
      score: leaderboard?.stats?.averageScore || 0,
      totalPoints: leaderboard?.totalPoints || 0,
      weeklyPoints: leaderboard?.weeklyPoints || 0,
      rank: leaderboard?.rank || 0,
      streak: leaderboard?.streak || { current: 0, longest: 0 },
      badges: leaderboard?.badges || [],
      interviewsCompleted: leaderboard?.stats?.interviewsCompleted || 0,
      roadmaps: roadmaps || [],
      mockInterviews: mockInterviews || [],
      codingPreferences: studentUser.codingPreferences,
      joinedAt: studentUser.createdAt,
    };

    res.json({ student: studentDetail });
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

    // Check if mentor has session rate and if payment is required
    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    if (mentorProfile?.sessionRate > 0 && !req.body.sessionPaymentId) {
      // Mentor-initiated sessions don't require student payment
      // Only student-initiated bookings require payment
      // This endpoint is mentor-only, so no payment needed here
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
      .sort('-createdAt');

    // Attach student full name via StudentProfile lookup
    const userIds = interviews
      .map((i) => i.user?._id)
      .filter(Boolean);
    const studentProfiles = await StudentProfile.find({
      userId: { $in: userIds },
    }).select('userId fullName careerGoal college');

    const profileByUserId = new Map(
      studentProfiles
        .filter((sp) => sp.userId)
        .map((sp) => [sp.userId.toString(), sp])
    );

    const populated = interviews.map((interview) => {
      const userId = interview.user?._id?.toString();
      const studentProfile = userId ? profileByUserId.get(userId) : null;

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

    if (!interview.user?._id) {
      return res.status(404).json({ error: 'Student account not found for this interview' });
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
  getStudentById,
  createMentorInterview,
  getMentorInterviews,
  getMentorInterviewById,
  submitFeedback,
};


