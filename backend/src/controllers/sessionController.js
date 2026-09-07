import MentorSession from '../models/MentorSession.js';
import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';
import MentorAvailability from '../models/MentorAvailability.js';
import SessionFeedback from '../models/SessionFeedback.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../services/socketService.js';
import { getUtcDate, getDayOfWeek } from '../utils/timezone.js';

// Helper to check for overlapping confirmed or pending sessions
const checkOverlap = async (userId, role, start, end, excludeSessionId = null) => {
  const query = {
    status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
    scheduledStart: { $lt: end },
    scheduledEnd: { $gt: start },
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  if (role === 'student') {
    query.student = userId;
  } else {
    query.mentor = userId;
  }

  return await MentorSession.findOne(query);
};

// @desc    Request a new mentor session slot
// @route   POST /api/sessions
// @access  Private (Student with pro/agency plan)
export const createSessionRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }

    const { mentorId, date, startTime, duration, topic, studentMessage, availabilitySlotId } = req.body;

    if (!mentorId || !date || !startTime || !duration || !topic) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const durationNum = Number(duration);
    if (![30, 45, 60, 90, 120].includes(durationNum)) {
      return res.status(400).json({ error: 'Session duration must be 30, 45, 60, 90, or 120 minutes' });
    }

    // Verify mentor eligibility
    const mentorUser = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentorUser) {
      return res.status(404).json({ error: 'Mentor not found or invalid role' });
    }

    if (req.user._id.toString() === mentorId) {
      return res.status(400).json({ error: 'You cannot request a session with yourself' });
    }

    // Find the availability configuration timezone and rules
    let timezone = 'UTC';
    let matchingConfigs = [];

    if (availabilitySlotId) {
      const slotConfig = await MentorAvailability.findOne({
        _id: availabilitySlotId,
        mentor: mentorId,
        isActive: true,
      });
      if (slotConfig) {
        timezone = slotConfig.timezone;
        matchingConfigs = [slotConfig];
      }
    }

    if (matchingConfigs.length === 0) {
      const activeConfigs = await MentorAvailability.find({
        mentor: mentorId,
        isActive: true,
      });
      if (activeConfigs.length === 0) {
        return res.status(400).json({ error: 'Mentor has no availability configured.' });
      }
      timezone = activeConfigs[0].timezone;
      const dayName = getDayOfWeek(date, timezone);
      const dateSpecificConfigs = activeConfigs.filter(c => !c.isRecurring && c.date === date);
      if (dateSpecificConfigs.length > 0) {
        matchingConfigs = dateSpecificConfigs;
      } else {
        matchingConfigs = activeConfigs.filter(c => c.isRecurring && c.dayOfWeek === dayName);
      }
    }

    const startUtc = getUtcDate(date, startTime, timezone);
    const endUtc = new Date(startUtc.getTime() + durationNum * 60 * 1000);

    const now = new Date();
    if (startUtc < now) {
      return res.status(400).json({ error: 'You cannot request a session in the past' });
    }

    // Verify slot falls inside start/end boundaries of mentor's availability window
    let matchesWindow = false;
    let selectedAvailabilitySlot = null;

    for (const config of matchingConfigs) {
      const windowStartUtc = getUtcDate(date, config.startTime, timezone);
      const windowEndUtc = getUtcDate(date, config.endTime, timezone);

      if (startUtc >= windowStartUtc && endUtc <= windowEndUtc) {
        const diffMs = startUtc.getTime() - windowStartUtc.getTime();
        const diffMins = Math.round(diffMs / (60 * 1000));
        if (diffMins % config.duration === 0 && durationNum === config.duration) {
          matchesWindow = true;
          selectedAvailabilitySlot = config._id;
          break;
        }
      }
    }

    if (!matchesWindow) {
      return res.status(400).json({ error: 'Requested time slot is outside the mentor\'s configured availability window grid.' });
    }

    // Concurrency double booking check (Student)
    const studentOverlap = await checkOverlap(req.user._id, 'student', startUtc, endUtc);
    if (studentOverlap) {
      return res.status(400).json({ error: 'You have an overlapping pending/confirmed session request.' });
    }

    // Concurrency double booking check (Mentor)
    const mentorOverlap = await checkOverlap(mentorId, 'mentor', startUtc, endUtc);
    if (mentorOverlap) {
      return res.status(409).json({ error: 'This slot has just been booked by another student. Please select another slot.' });
    }

    const session = await MentorSession.create({
      student: req.user._id,
      mentor: mentorId,
      availabilitySlot: selectedAvailabilitySlot,
      scheduledStart: startUtc,
      scheduledEnd: endUtc,
      timezone,
      topic,
      studentMessage: studentMessage || '',
      status: 'PENDING',
      timeline: [{
        action: 'requested',
        by: req.user._id,
        note: `Session requested on topic "${topic}"`,
      }],
    });

    // Notify mentor
    const studentName = req.user.fullName || req.user.email.split('@')[0] || 'Student';
    const notif = await createNotification({
      recipient: mentorId,
      type: 'interview_request',
      title: 'New Session Request',
      message: `${studentName} requested a session: "${topic}" on ${date} at ${startTime}.`,
      data: { sessionId: session._id },
    });
    notif.user = mentorId;
    await notif.save();

    emitToUser(mentorId, 'session:request', { sessionId: session._id, topic });

    res.status(201).json({
      message: 'Session requested successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sessions list for current student or mentor
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const query = {};
    if (req.user.role === 'mentor') {
      query.mentor = req.user._id;
    } else {
      query.student = req.user._id;
    }

    if (status) {
      if (status === 'CONFIRMED') {
        query.status = { $in: ['CONFIRMED', 'RESCHEDULE_REQUESTED'] };
      } else {
        query.status = status;
      }
    }

    const sessions = await MentorSession.find(query)
      .populate('student mentor', 'email profileImage fullName')
      .sort({ scheduledStart: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const count = await MentorSession.countDocuments(query);

    // Decorate sessions with displayName mappings for student profiles
    const decorated = await Promise.all(
      sessions.map(async (sess) => {
        const obj = sess.toObject();
        if (req.user.role === 'mentor') {
          const { default: StudentProfile } = await import('../models/StudentProfile.js');
          const sp = await StudentProfile.findOne({ userId: sess.student._id }).select('fullName college branch degree year');
          obj.studentName = sp?.fullName || sess.student.email.split('@')[0];
          obj.studentProfile = sp;
        } else {
          const mp = await MentorProfile.findOne({ userId: sess.mentor._id }).select('fullName company designation');
          obj.mentorName = mp?.fullName || sess.mentor.email.split('@')[0];
          obj.mentorProfile = mp;
        }

        // Check if feedback already submitted by current user for this session
        const existingFeedback = await SessionFeedback.findOne({
          session: sess._id,
          reviewer: req.user._id,
        });
        obj.feedbackSubmitted = !!existingFeedback;

        return obj;
      })
    );

    res.json({
      sessions: decorated,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalCount: count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session details
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res, next) => {
  try {
    const session = await MentorSession.findById(req.params.id)
      .populate('student mentor', 'email profileImage fullName');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Access authorization check
    const isStudent = session.student._id.toString() === req.user._id.toString();
    const isMentor = session.mentor._id.toString() === req.user._id.toString();
    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to view this session' });
    }

    const obj = session.toObject();

    // Populate profile names
    const { default: StudentProfile } = await import('../models/StudentProfile.js');
    const sp = await StudentProfile.findOne({ userId: session.student._id }).select('fullName college degree branch year');
    obj.studentName = sp?.fullName || session.student.email.split('@')[0];
    obj.studentProfile = sp;

    const mp = await MentorProfile.findOne({ userId: session.mentor._id }).select('fullName company designation');
    obj.mentorName = mp?.fullName || session.mentor.email.split('@')[0];
    obj.mentorProfile = mp;

    // Check if feedback already submitted by current user
    const feedback = await SessionFeedback.findOne({ session: session._id, reviewer: req.user._id });
    obj.feedbackSubmitted = !!feedback;

    res.json({ session: obj });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept session request (Mentor only)
// @route   PATCH /api/sessions/:id/accept
// @access  Private (Mentor only)
export const acceptSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const session = await MentorSession.findOne({
      _id: req.params.id,
      mentor: req.user._id,
      status: 'PENDING',
    });

    if (!session) {
      return res.status(404).json({ error: 'Pending session request not found' });
    }

    // Double check slot availability overlaps before confirmation
    const overlap = await checkOverlap(
      req.user._id,
      'mentor',
      session.scheduledStart,
      session.scheduledEnd,
      session._id
    );

    if (overlap) {
      return res.status(400).json({ error: 'Accept failed: You have an overlapping confirmed slot.' });
    }

    session.status = 'CONFIRMED';
    session.acceptedAt = new Date();
    session.timeline.push({
      action: 'accepted',
      by: req.user._id,
      note: 'Session request accepted by mentor.',
    });

    await session.save();

    // Automatically reject any other pending requests overlapping with this slot
    const conflictingRequests = await MentorSession.find({
      mentor: req.user._id,
      status: 'PENDING',
      scheduledStart: { $lt: session.scheduledEnd },
      scheduledEnd: { $gt: session.scheduledStart },
      _id: { $ne: session._id }
    });

    for (const conf of conflictingRequests) {
      conf.status = 'REJECTED';
      conf.rejectionReason = 'This slot was booked and confirmed by another student.';
      conf.timeline.push({
        action: 'rejected',
        by: req.user._id,
        note: 'Automatically rejected due to conflicting confirmed slot',
      });
      await conf.save();

      const mentorName = req.user.fullName || req.user.email.split('@')[0] || 'Mentor';
      const cNotif = await createNotification({
        recipient: conf.student,
        type: 'interview_declined',
        title: 'Session Request Rejected',
        message: `${mentorName} confirmed another booking for this time slot.`,
        data: { sessionId: conf._id },
      });
      cNotif.user = conf.student;
      await cNotif.save();
      emitToUser(conf.student, 'session:rejected', { sessionId: conf._id, reason: 'Slot confirmed for another student' });
    }

    // Notify student
    const mentorName = req.user.fullName || req.user.email.split('@')[0] || 'Mentor';
    const notif = await createNotification({
      recipient: session.student,
      type: 'interview_accepted',
      title: 'Session Request Confirmed',
      message: `${mentorName} accepted your session request on "${session.topic}".`,
      data: { sessionId: session._id },
    });
    notif.user = session.student;
    await notif.save();

    emitToUser(session.student, 'session:accepted', { sessionId: session._id });

    res.json({ message: 'Session accepted successfully', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject session request (Mentor only)
// @route   PATCH /api/sessions/:id/reject
// @access  Private (Mentor only)
export const rejectSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { reason } = req.body;

    const session = await MentorSession.findOne({
      _id: req.params.id,
      mentor: req.user._id,
      status: 'PENDING',
    });

    if (!session) {
      return res.status(404).json({ error: 'Pending session request not found' });
    }

    session.status = 'REJECTED';
    session.rejectedAt = new Date();
    session.rejectionReason = reason || '';
    session.timeline.push({
      action: 'rejected',
      by: req.user._id,
      note: `Session request rejected. Reason: ${reason || 'None specified'}`,
    });

    await session.save();

    // Notify student
    const mentorName = req.user.fullName || req.user.email.split('@')[0] || 'Mentor';
    const notif = await createNotification({
      recipient: session.student,
      type: 'interview_declined',
      title: 'Session Request Rejected',
      message: `${mentorName} rejected your session request. Reason: ${reason || 'None specified'}.`,
      data: { sessionId: session._id },
    });
    notif.user = session.student;
    await notif.save();

    emitToUser(session.student, 'session:rejected', { sessionId: session._id, reason });

    res.json({ message: 'Session request rejected', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel session booking
// @route   PATCH /api/sessions/:id/cancel
// @access  Private
export const cancelSession = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const session = await MentorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isMentor = session.mentor.toString() === req.user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to cancel this session' });
    }

    if (!['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(session.status)) {
      return res.status(400).json({ error: 'Only pending, confirmed, or reschedule-requested sessions can be cancelled' });
    }

    const oldStatus = session.status;
    session.status = isStudent ? 'CANCELLED_BY_STUDENT' : 'CANCELLED_BY_MENTOR';
    session.cancelledAt = new Date();
    session.cancelledBy = req.user._id;
    session.timeline.push({
      action: 'cancelled',
      by: req.user._id,
      note: `Cancelled. Reason: ${reason || 'None specified'}. Previously: ${oldStatus}`,
    });

    await session.save();

    const targetUser = isStudent ? session.mentor : session.student;
    const senderName = req.user.fullName || req.user.email.split('@')[0];

    const notif = await createNotification({
      recipient: targetUser,
      type: 'general',
      title: 'Session Cancelled',
      message: `${senderName} cancelled the session on "${session.topic}". Reason: ${reason || 'None'}.`,
      data: { sessionId: session._id },
    });
    notif.user = targetUser;
    await notif.save();

    emitToUser(targetUser, 'session:cancelled', { sessionId: session._id, reason });

    res.json({ message: 'Session cancelled successfully', session });
  } catch (error) {
    next(error);
  }
};


// @desc    Request reschedule of confirmed session
// @route   PATCH /api/sessions/:id/reschedule
// @access  Private
export const requestReschedule = async (req, res, next) => {
  try {
    const { date, startTime, reason } = req.body; // date: YYYY-MM-DD, startTime: HH:mm

    if (!date || !startTime) {
      return res.status(400).json({ error: 'Please specify new date and time' });
    }

    const session = await MentorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isMentor = session.mentor.toString() === req.user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to reschedule this session' });
    }

    if (!['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(session.status)) {
      return res.status(400).json({ error: 'Only pending, confirmed, or reschedule-requested sessions can be rescheduled' });
    }

    const durationMin = Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (60 * 1000));
    const startUtc = getUtcDate(date, startTime, session.timezone);
    const endUtc = new Date(startUtc.getTime() + durationMin * 60 * 1000);

    if (startUtc < new Date()) {
      return res.status(400).json({ error: 'Rescheduled time slot must be in the future' });
    }

    // Verify proposed rescheduled slot is covered by mentor's availability window
    const activeConfigs = await MentorAvailability.find({
      mentor: session.mentor,
      isActive: true,
    });

    const dayName = getDayOfWeek(date, session.timezone);
    const dateSpecificConfigs = activeConfigs.filter(c => !c.isRecurring && c.date === date);
    let matchingConfigs = [];
    if (dateSpecificConfigs.length > 0) {
      matchingConfigs = dateSpecificConfigs;
    } else {
      matchingConfigs = activeConfigs.filter(c => c.isRecurring && c.dayOfWeek === dayName);
    }

    let matchesWindow = false;
    for (const config of matchingConfigs) {
      const windowStartUtc = getUtcDate(date, config.startTime, session.timezone);
      const windowEndUtc = getUtcDate(date, config.endTime, session.timezone);

      if (startUtc >= windowStartUtc && endUtc <= windowEndUtc) {
        const diffMs = startUtc.getTime() - windowStartUtc.getTime();
        const diffMins = Math.round(diffMs / (60 * 1000));
        if (diffMins % config.duration === 0 && durationMin === config.duration) {
          matchesWindow = true;
          break;
        }
      }
    }

    if (!matchesWindow) {
      return res.status(400).json({ error: 'Proposed slot is outside the mentor\'s configured availability window grid.' });
    }

    // Verify overlaps
    const studentOverlap = await checkOverlap(session.student, 'student', startUtc, endUtc, session._id);
    if (studentOverlap) {
      return res.status(400).json({ error: 'Conflict: Student has an overlapping slot.' });
    }

    const mentorOverlap = await checkOverlap(session.mentor, 'mentor', startUtc, endUtc, session._id);
    if (mentorOverlap) {
      return res.status(400).json({ error: 'Conflict: Mentor has an overlapping slot.' });
    }

    session.rescheduleRequest = {
      initiator: req.user._id,
      scheduledStart: startUtc,
      scheduledEnd: endUtc,
      reason: reason || '',
      createdAt: new Date(),
    };
    session.status = 'RESCHEDULE_REQUESTED';

    session.timeline.push({
      action: 'reschedule_requested',
      by: req.user._id,
      note: `Requested reschedule to ${date} ${startTime}. Reason: ${reason || 'None'}`,
    });

    await session.save();

    const targetUser = isStudent ? session.mentor : session.student;
    const senderName = req.user.fullName || req.user.email.split('@')[0];

    const notif = await createNotification({
      recipient: targetUser,
      type: 'general',
      title: 'Reschedule Requested',
      message: `${senderName} requested to reschedule the session to ${date} at ${startTime}.`,
      data: { sessionId: session._id },
    });
    notif.user = targetUser;
    await notif.save();

    emitToUser(targetUser, 'session:rescheduled', { sessionId: session._id });

    res.json({ message: 'Reschedule request submitted', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm proposed reschedule request
// @route   PATCH /api/sessions/:id/confirm-reschedule
// @access  Private
export const confirmReschedule = async (req, res, next) => {
  try {
    const session = await MentorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.rescheduleRequest) {
      return res.status(400).json({ error: 'No active reschedule request exists' });
    }

    if (session.rescheduleRequest.initiator.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot approve your own reschedule request' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isMentor = session.mentor.toString() === req.user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to view this session' });
    }

    const { scheduledStart, scheduledEnd } = session.rescheduleRequest;

    // Final checks for slot overlap
    const studentOverlap = await checkOverlap(session.student, 'student', scheduledStart, scheduledEnd, session._id);
    if (studentOverlap) {
      return res.status(400).json({ error: 'Cannot confirm: Student has an overlapping slot.' });
    }

    const mentorOverlap = await checkOverlap(session.mentor, 'mentor', scheduledStart, scheduledEnd, session._id);
    if (mentorOverlap) {
      return res.status(400).json({ error: 'Cannot confirm: Mentor has an overlapping slot.' });
    }

    session.scheduledStart = scheduledStart;
    session.scheduledEnd = scheduledEnd;
    session.rescheduleRequest = null;
    session.status = 'CONFIRMED';
    session.timeline.push({
      action: 'reschedule_confirmed',
      by: req.user._id,
      note: 'Reschedule request accepted.',
    });

    await session.save();

    // Auto-reject conflicting pending requests for this mentor
    const conflictingRequests = await MentorSession.find({
      mentor: session.mentor,
      status: 'PENDING',
      scheduledStart: { $lt: scheduledEnd },
      scheduledEnd: { $gt: scheduledStart },
      _id: { $ne: session._id }
    });

    for (const conf of conflictingRequests) {
      conf.status = 'REJECTED';
      conf.rejectionReason = 'This slot was booked and confirmed by another student.';
      conf.timeline.push({
        action: 'rejected',
        by: req.user._id,
        note: 'Automatically rejected due to conflicting confirmed slot',
      });
      await conf.save();

      const mentorName = req.user.fullName || req.user.email.split('@')[0] || 'Mentor';
      const cNotif = await createNotification({
        recipient: conf.student,
        type: 'interview_declined',
        title: 'Session Request Rejected',
        message: `${mentorName} confirmed another booking for this time slot.`,
        data: { sessionId: conf._id },
      });
      cNotif.user = conf.student;
      await cNotif.save();
      emitToUser(conf.student, 'session:rejected', { sessionId: conf._id, reason: 'Slot confirmed for another student' });
    }

    const targetUser = isStudent ? session.mentor : session.student;
    const senderName = req.user.fullName || req.user.email.split('@')[0];

    const notif = await createNotification({
      recipient: targetUser,
      type: 'general',
      title: 'Reschedule Confirmed',
      message: `${senderName} accepted the reschedule request. Session is confirmed.`,
      data: { sessionId: session._id },
    });
    notif.user = targetUser;
    await notif.save();

    emitToUser(targetUser, 'session:accepted', { sessionId: session._id });

    res.json({ message: 'Reschedule confirmed successfully', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Google Meet link (Mentor only)
// @route   PATCH /api/sessions/:id/meeting-link
// @access  Private (Mentor only)
export const addMeetingLink = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { meetingLink } = req.body;

    if (!meetingLink) {
      return res.status(400).json({ error: 'Please provide a Google Meet link' });
    }

    // Google Meet format validation
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-zA-Z0-9-_]+$/;
    if (!meetRegex.test(meetingLink)) {
      return res.status(400).json({ error: 'Invalid Google Meet Link format. Example: https://meet.google.com/abc-defg-hij' });
    }

    const session = await MentorSession.findOne({
      _id: req.params.id,
      mentor: req.user._id,
      status: 'CONFIRMED',
    });

    if (!session) {
      return res.status(404).json({ error: 'Confirmed session not found' });
    }

    session.meetingLink = meetingLink;
    session.meetingLinkAddedAt = new Date();
    session.timeline.push({
      action: 'link_added',
      by: req.user._id,
      note: `Google Meet link added: ${meetingLink}`,
    });

    await session.save();

    // Notify student
    const notif = await createNotification({
      recipient: session.student,
      type: 'general',
      title: 'Meeting Link Ready',
      message: `Your Google Meet link for session on "${session.topic}" is ready.`,
      data: { sessionId: session._id },
    });
    notif.user = session.student;
    await notif.save();

    emitToUser(session.student, 'session:meeting-link-added', { sessionId: session._id, meetingLink });

    res.json({ message: 'Google Meet link added successfully', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually mark session completed (Mentor only)
// @route   POST /api/sessions/:id/complete
// @access  Private (Mentor only)
export const completeSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const session = await MentorSession.findOne({
      _id: req.params.id,
      mentor: req.user._id,
      status: 'CONFIRMED',
    });

    if (!session) {
      return res.status(404).json({ error: 'Confirmed session not found' });
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.timeline.push({
      action: 'completed',
      by: req.user._id,
      note: 'Session marked as completed by mentor.',
    });

    await session.save();

    // Notify student for reviews
    const notif = await createNotification({
      recipient: session.student,
      type: 'general',
      title: 'Session Concluded',
      message: `Your session on "${session.topic}" has concluded. Please submit feedback.`,
      data: { sessionId: session._id },
    });
    notif.user = session.student;
    await notif.save();

    emitToUser(session.student, 'session:completed', { sessionId: session._id });

    res.json({ message: 'Session marked completed', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit session feedback
// @route   POST /api/sessions/:id/feedback
// @access  Private
export const submitSessionFeedback = async (req, res, next) => {
  try {
    const {
      overallRating,
      communication,
      professionalism,
      explanation,
      technicalKnowledge,
      knowledge,
      problemSolving,
      patience,
      guidance,
      helpfulness,
      preparation,
      technicalSkills,
      engagement,
      comment,
    } = req.body;

    const session = await MentorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Feedback can only be submitted for completed sessions' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isMentor = session.mentor.toString() === req.user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to submit feedback for this session' });
    }

    const revieweeId = isStudent ? session.mentor : session.student;
    const reviewerRole = isStudent ? 'student' : 'mentor';

    // Prevent double feedback by same reviewer for same session
    const existing = await SessionFeedback.findOne({
      session: session._id,
      reviewer: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ error: 'Feedback already submitted' });
    }

    const ratingVal = Number(overallRating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
    }

    const feedbackData = {
      session: session._id,
      reviewer: req.user._id,
      reviewee: revieweeId,
      role: reviewerRole,
      overallRating: ratingVal,
      communication: Number(communication) || null,
      professionalism: Number(professionalism) || null,
      comment: comment || '',
    };

    if (isStudent) {
      // Categories submitted by student rating mentor
      const techK = Number(technicalKnowledge) || Number(knowledge) || null;
      const guid = Number(guidance) || Number(helpfulness) || null;

      feedbackData.technicalKnowledge = techK;
      feedbackData.knowledge = techK;
      feedbackData.explanation = Number(explanation) || null;
      feedbackData.problemSolving = Number(problemSolving) || null;
      feedbackData.patience = Number(patience) || null;
      feedbackData.guidance = guid;
      feedbackData.helpfulness = guid;
    } else {
      // Categories submitted by mentor rating student for improvement
      feedbackData.explanation = Number(explanation) || null;
      feedbackData.problemSolving = Number(problemSolving) || null;
      feedbackData.technicalSkills = Number(technicalSkills) || Number(knowledge) || null;
      feedbackData.preparation = Number(preparation) || null;
      feedbackData.engagement = Number(engagement) || null;
    }

    const feedback = await SessionFeedback.create(feedbackData);

    session.timeline.push({
      action: 'feedback_submitted',
      by: req.user._id,
      note: isStudent
        ? 'Student submitted session feedback.'
        : 'Mentor provided improvement feedback.',
    });
    await session.save();

    // Notifications:
    if (isStudent) {
      // Anonymous notification to mentor - NO student name, NO comment, NO rating
      const notif = await createNotification({
        recipient: revieweeId,
        type: 'general',
        title: 'New Student Feedback',
        message: 'A student submitted feedback for a session. Your overall performance score has been updated.',
        data: {},
      });
      notif.user = revieweeId;
      await notif.save();
    } else {
      // Notification to student about mentor's improvement feedback
      const reviewerName = req.user.fullName || req.user.email.split('@')[0];
      const notif = await createNotification({
        recipient: revieweeId,
        type: 'general',
        title: 'Mentor Feedback Available',
        message: `${reviewerName} provided improvement feedback for your session.`,
        data: { sessionId: session._id },
      });
      notif.user = revieweeId;
      await notif.save();
    }

    emitToUser(revieweeId, 'feedback:submitted', { sessionId: session._id });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session improvement feedback (Mentor feedback given to student)
// @route   GET /api/sessions/:id/feedback
// @access  Private (Participants only)
export const getSessionFeedback = async (req, res, next) => {
  try {
    const session = await MentorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isMentor = session.mentor.toString() === req.user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Unauthorized to view feedback' });
    }

    // PRIVACY SYSTEM RULE:
    // Only return feedback given by the MENTOR to the STUDENT (Session Improvement Feedback).
    // Student feedback about mentor is NEVER returned for individual sessions.
    const feedbacks = await SessionFeedback.find({
      session: session._id,
      role: 'mentor',
    }).populate('reviewer', 'email fullName');

    res.json({ feedbacks });
  } catch (error) {
    next(error);
  }
};
