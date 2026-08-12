import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';
import InterviewRequest from '../models/InterviewRequest.js';
import { createNotification, sendEmail } from '../services/notificationService.js';

// Plans that are allowed to access the Mentor Section
export const MENTOR_SECTION_PLANS = ['pro', 'agency'];

// Access-denied message used across the feature
export const MENTOR_SECTION_DENIED_MESSAGE =
  'The Mentor Section is exclusively available for Model Pro and Agency users.';

/**
 * Middleware to restrict access to the Mentor Section.
 * Allowed only for "pro" or "agency" tier students.
 */
export const requireMentorPlan = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  if (req.user.role !== 'student' || !MENTOR_SECTION_PLANS.includes(req.user.plan)) {
    return res.status(403).json({ error: MENTOR_SECTION_DENIED_MESSAGE });
  }

  next();
};

// @desc    Get all mentors registered on the platform
// @route   GET /api/mentors
// @access  Private (student with pro/agency plan)
const getMentors = async (req, res, next) => {
  try {
    const mentorUsers = await User.find({ role: 'mentor' }).select(
      'email profileImage profileImagePublicId fullName'
    );

    const mentorProfiles = await MentorProfile.find({
      userId: { $in: mentorUsers.map((u) => u._id) },
    });

    const mentors = mentorUsers.map((user) => {
      const profile = mentorProfiles.find(
        (p) => p.userId.toString() === user._id.toString()
      );

      return {
        _id: user._id,
        email: user.email,
        profileImage: user.profileImage,
        fullName: profile?.fullName || user.email?.split('@')[0] || 'Mentor',
        company: profile?.company || '',
        designation: profile?.designation || '',
        experience: profile?.experience || 0,
        skills: profile?.skills || [],
        linkedin: profile?.linkedin || '',
        bio: profile?.bio || '',
      };
    });

    res.json({ mentors });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an interview request to a specific mentor
// @route   POST /api/mentors/requests
// @access  Private (student with pro/agency plan)
const createInterviewRequest = async (req, res, next) => {
  try {
    const { mentorId, targetRole, bio } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: 'Please select a mentor' });
    }
    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({ error: 'Please provide your target role' });
    }
    if (!bio || !bio.trim()) {
      return res.status(400).json({ error: 'Please provide a short bio' });
    }

    // Validate the mentor exists and is actually a mentor
    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const request = await InterviewRequest.create({
      student: req.user._id,
      mentor: mentor._id,
      targetRole: targetRole.trim(),
      bio: bio.trim(),
      status: 'pending',
    });

    // Grab student name for the notification message
    const studentProfile = await getUserDisplayName(req.user._id);

    // 1) Persist a system notification for the mentor
    try {
      await createNotification({
        recipient: mentor._id,
        type: 'interview_request',
        title: 'New Interview Request',
        message: `${studentProfile} has requested an interview for the role: ${request.targetRole}`,
        data: {
          requestId: request._id,
          studentId: req.user._id,
          targetRole: request.targetRole,
          bio: request.bio,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // 2) Send an email alert to the mentor
    try {
      await sendEmail({
        to: mentor.email,
        subject: 'New Interview Request on InterviewAce',
        text: `${studentProfile} has requested a mock interview for the role "${request.targetRole}".\n\nBio: ${request.bio}\n\nStatus: Pending`,
        html: `<p><strong>${studentProfile}</strong> has requested a mock interview for the role <strong>"${request.targetRole}"</strong>.</p><p>Bio:</p><p>${request.bio}</p><p>Status: <strong>Pending</strong></p>`,
      });
    } catch (emailErr) {
      console.error('Failed to send email alert:', emailErr);
    }

    res.status(201).json({
      message: 'Interview request sent successfully',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the current student's interview requests
// @route   GET /api/mentors/my-requests
// @access  Private (student with pro/agency plan)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await InterviewRequest.find({ student: req.user._id })
      .populate('mentor', 'email profileImage')
      .sort('-createdAt');

    const populated = requests.map((request) => {
      const obj = request.toObject();
      return obj;
    });

    res.json({ requests: populated });
  } catch (error) {
    next(error);
  }
};

// Helper: best-effort display name for a user (student in this context)
const getUserDisplayName = async (userId) => {
  try {
    const { default: StudentProfile } = await import('../models/StudentProfile.js');
    const sp = await StudentProfile.findOne({ userId }).select('fullName');
    if (sp?.fullName) return sp.fullName;

    const user = await User.findById(userId).select('email');
    return user?.email?.split('@')[0] || 'A student';
  } catch {
    return 'A student';
  }
};

export { getMentors, createInterviewRequest, getMyRequests };

