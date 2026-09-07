import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';
import InterviewRequest from '../models/InterviewRequest.js';
import MentorAvailability from '../models/MentorAvailability.js';
import MentorSession from '../models/MentorSession.js';
import SessionFeedback from '../models/SessionFeedback.js';
import { createNotification, sendEmail } from '../services/notificationService.js';
import { getUtcDate, getDayOfWeek } from '../utils/timezone.js';

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

/**
 * Helper to fetch aggregated stats for a mentor.
 */
const aggregateMentorStats = async (mentorUserId) => {
  const reviews = await SessionFeedback.find({ reviewee: mentorUserId, role: 'student' });
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / count : 0;

  const completedCount = await MentorSession.countDocuments({
    mentor: mentorUserId,
    status: 'COMPLETED',
  });

  return {
    rating: parseFloat(avg.toFixed(1)) || 0,
    reviewsCount: count,
    completedSessions: completedCount,
  };
};

// @desc    Get all mentors registered on the platform with search & filters
// @route   GET /api/mentors
// @access  Private (student with pro/agency plan)
const getMentors = async (req, res, next) => {
  try {
    const { search, skills, experience, rating, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Search query for User profile fields
    let userQuery = { role: 'mentor' };
    if (!req.user || !req.user.isTestAccount) {
      userQuery.isTestAccount = { $ne: true };
    }

    const mentorUsers = await User.find(userQuery).select(
      'email profileImage profileImagePublicId'
    );

    const userIds = mentorUsers.map((u) => u._id);

    // Profile query filters
    let profileQuery = { userId: { $in: userIds } };

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      profileQuery.$or = [
        { fullName: regex },
        { company: regex },
        { designation: regex },
        { bio: regex },
      ];
    }

    if (skills) {
      const skillsList = skills.split(',').map(s => new RegExp(s.trim(), 'i'));
      profileQuery.skills = { $in: skillsList };
    }

    if (experience) {
      profileQuery.experience = { $gte: parseInt(experience) || 0 };
    }

    let mentorProfiles = await MentorProfile.find(profileQuery);

    // Map profiles and compute stats
    let mentors = await Promise.all(
      mentorProfiles.map(async (profile) => {
        const user = mentorUsers.find((u) => u._id.toString() === profile.userId.toString());
        const stats = await aggregateMentorStats(profile.userId);

        // Expose availability status indicator (checks if they have any active configurations)
        const availabilityCount = await MentorAvailability.countDocuments({
          mentor: profile.userId,
          isActive: true,
        });

        return {
          _id: profile.userId,
          email: user?.email || '',
          profileImage: user?.profileImage || null,
          fullName: profile.fullName || 'Mentor',
          company: profile.company || '',
          designation: profile.designation || '',
          experience: profile.experience || 0,
          skills: profile.skills || [],
          linkedin: profile.linkedin || '',
          bio: profile.bio || '',
          rating: stats.rating,
          reviewsCount: stats.reviewsCount,
          completedSessions: stats.completedSessions,
          hasAvailability: availabilityCount > 0,
        };
      })
    );

    // Apply rating filter in JS memory after aggregations if requested
    if (rating) {
      const targetRating = parseFloat(rating) || 0;
      mentors = mentors.filter(m => m.rating >= targetRating);
    }

    // Paginate manually after post-query filter
    const totalCount = mentors.length;
    const paginatedMentors = mentors.slice(skipNum, skipNum + limitNum);

    res.json({
      mentors: paginatedMentors,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete details of a single mentor
// @route   GET /api/mentors/:id
// @access  Private (student with pro/agency plan)
const getMentorById = async (req, res, next) => {
  try {
    const mentorId = req.params.id;

    let mentorQuery = { _id: mentorId, role: 'mentor' };
    if (!req.user || !req.user.isTestAccount) {
      mentorQuery.isTestAccount = { $ne: true };
    }

    const mentorUser = await User.findOne(mentorQuery).select(
      'email profileImage'
    );

    if (!mentorUser) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const profile = await MentorProfile.findOne({ userId: mentorId });
    if (!profile) {
      return res.status(404).json({ error: 'Mentor profile details not found' });
    }

    const stats = await aggregateMentorStats(mentorId);

    // Fetch review comments
    const rawReviews = await SessionFeedback.find({ reviewee: mentorId, role: 'student' })
      .populate('reviewer', 'email profileImage')
      .sort({ createdAt: -1 });

    const reviews = await Promise.all(
      rawReviews.map(async (rev) => {
        const { default: StudentProfile } = await import('../models/StudentProfile.js');
        const sp = await StudentProfile.findOne({ userId: rev.reviewer._id }).select('fullName');

        return {
          _id: rev._id,
          reviewerName: sp?.fullName || rev.reviewer.email.split('@')[0] || 'Anonymous student',
          reviewerImage: rev.reviewer.profileImage,
          overallRating: rev.overallRating,
          communication: rev.communication,
          professionalism: rev.professionalism,
          knowledge: rev.knowledge,
          helpfulness: rev.helpfulness,
          comment: rev.comment,
          createdAt: rev.createdAt,
        };
      })
    );

    res.json({
      mentor: {
        _id: profile.userId,
        email: mentorUser.email,
        profileImage: mentorUser.profileImage,
        fullName: profile.fullName || 'Mentor',
        company: profile.company || '',
        designation: profile.designation || '',
        experience: profile.experience || 0,
        skills: profile.skills || [],
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
        rating: stats.rating,
        reviewsCount: stats.reviewsCount,
        completedSessions: stats.completedSessions,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate and fetch available time slots for a mentor on a specific date
// @route   GET /api/mentors/:id/availability
// @access  Private (student with pro/agency plan)
const getMentorAvailabilityForDate = async (req, res, next) => {
  try {
    const mentorId = req.params.id;
    const { date } = req.query; // format: "YYYY-MM-DD"

    if (!date) {
      return res.status(400).json({ error: 'Please specify a target date (YYYY-MM-DD)' });
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const activeConfig = await MentorAvailability.find({
      mentor: mentorId,
      isActive: true,
    });

    if (activeConfig.length === 0) {
      return res.json({ slots: [] });
    }

    const targetTimezone = activeConfig[0].timezone; // assume mentor's timezone
    const dayName = getDayOfWeek(date, targetTimezone); // e.g. "Monday"

    const generatedSlots = [];
    const now = new Date();

    // Fetch confirmed/pending/reschedule sessions for this mentor on this date in one query
    const startOfDayUtc = getUtcDate(date, '00:00', targetTimezone);
    const endOfDayUtc = new Date(startOfDayUtc.getTime() + 24 * 60 * 60 * 1000);
    const daySessions = await MentorSession.find({
      mentor: mentorId,
      status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
      scheduledStart: { $lt: endOfDayUtc },
      scheduledEnd: { $gt: startOfDayUtc },
    });

    // 1. Process date-specific configurations for this date
    const dateSpecificConfigs = activeConfig.filter(
      (c) => !c.isRecurring && c.date === date
    );

    // 2. Process recurring configurations
    const dayRules = activeConfig.filter((c) => c.isRecurring && c.dayOfWeek === dayName);

    // Combine windows, filtering out recurring rules overridden by date-specific entries
    const windowsToProcess = [];

    for (const dConfig of dateSpecificConfigs) {
      windowsToProcess.push({
        _id: dConfig._id,
        startTime: dConfig.startTime,
        endTime: dConfig.endTime,
        duration: dConfig.duration,
        isDateSpecific: true,
      });
    }

    for (const rule of dayRules) {
      const overlapsWithDateSpecific = dateSpecificConfigs.some(
        (d) => rule.startTime < d.endTime && rule.endTime > d.startTime
      );
      if (!overlapsWithDateSpecific) {
        windowsToProcess.push({
          _id: rule._id,
          startTime: rule.startTime,
          endTime: rule.endTime,
          duration: rule.duration,
          isDateSpecific: false,
        });
      }
    }

    for (const window of windowsToProcess) {
      const [startH, startM] = window.startTime.split(':').map(Number);
      const [endH, endM] = window.endTime.split(':').map(Number);
      const durationMin = window.duration; // 30, 45, 60, 90, 120

      let currentH = startH;
      let currentM = startM;

      while (true) {
        let nextM = currentM + durationMin;
        let nextH = currentH + Math.floor(nextM / 60);
        nextM = nextM % 60;

        if (nextH > endH || (nextH === endH && nextM > endM)) {
          break; // past window end boundary
        }

        const formatTime = (h, m) =>
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const slotStartStr = formatTime(currentH, currentM);
        const slotEndStr = formatTime(nextH, nextM);

        const startUtc = getUtcDate(date, slotStartStr, targetTimezone);
        const endUtc = getUtcDate(date, slotEndStr, targetTimezone);

        let status = 'Available';

        if (startUtc < now) {
          status = 'Unavailable';
        } else {
          // Check if there is an overlapping session in daySessions
          const overlap = daySessions.find(
            (s) => s.scheduledStart < endUtc && s.scheduledEnd > startUtc
          );

          if (overlap) {
            if (overlap.status === 'CONFIRMED') {
              status = 'Booked';
            } else if (overlap.status === 'PENDING' || overlap.status === 'RESCHEDULE_REQUESTED') {
              status = 'Requested';
            }
          }
        }

        generatedSlots.push({
          availabilitySlotId: window._id,
          startTime: slotStartStr,
          endTime: slotEndStr,
          startUtc: startUtc.toISOString(),
          endUtc: endUtc.toISOString(),
          status,
          duration: durationMin,
          isDateSpecific: window.isDateSpecific,
        });

        currentH = nextH;
        currentM = nextM;
      }
    }

    // Sort slots by time ascending
    generatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.json({ slots: generatedSlots });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an interview request to a specific mentor (Fallback mock request)
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

    const studentProfile = await getUserDisplayName(req.user._id);

    try {
      const notif = await createNotification({
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
      notif.user = mentor._id;
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

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

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

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

// @desc    Get mentor's weekly recurring availability grouped by weekday
// @route   GET /api/mentors/:id/weekly-availability
// @access  Private (student with pro/agency plan)
const getMentorWeeklyAvailability = async (req, res, next) => {
  try {
    const mentorId = req.params.id;

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const activeConfig = await MentorAvailability.find({
      mentor: mentorId,
      isRecurring: true,
      isActive: true,
    }).sort({ startTime: 1 });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyAvailability = daysOfWeek.map((day) => {
      const slotsForDay = activeConfig
        .filter((c) => c.dayOfWeek === day)
        .map((c) => ({
          _id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          timezone: c.timezone
        }));

      return {
        day,
        slots: slotsForDay,
      };
    });

    const timezone = activeConfig.length > 0 ? activeConfig[0].timezone : 'Asia/Calcutta';

    res.json({
      mentorId,
      timezone,
      weeklyAvailability,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getMentors,
  getMentorById,
  getMentorAvailabilityForDate,
  getMentorWeeklyAvailability,
  createInterviewRequest,
  getMyRequests,
};
