import MentorSession from '../models/MentorSession.js';
import { createNotification } from './notificationService.js';
import { emitToUser } from './socketService.js';

/**
 * Checks for upcoming confirmed meetings and generates notifications at
 * 24h, 10h, and 1h thresholds. Also marks past confirmed meetings as completed.
 */
export const runReminderCheck = async () => {
  const now = new Date();

  try {
    // ----------------------------------------------------
    // 1. Process Meeting Reminders
    // ----------------------------------------------------
    const upcomingSessions = await MentorSession.find({
      status: 'CONFIRMED',
      scheduledStart: { $gt: now },
    }).populate('student mentor', 'email');

    for (const session of upcomingSessions) {
      const timeDiffMs = session.scheduledStart.getTime() - now.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      let reminderType = null;

      if (timeDiffHours <= 1 && !session.reminders['1h']) {
        reminderType = '1h';
      } else if (timeDiffHours <= 10 && timeDiffHours > 1 && !session.reminders['10h']) {
        reminderType = '10h';
      } else if (timeDiffHours <= 24 && timeDiffHours > 10 && !session.reminders['24h']) {
        reminderType = '24h';
      }

      if (reminderType) {
        session.reminders[reminderType] = true;
        await session.save();

        const timeMsg = reminderType === '1h' ? '1 hour' : `${reminderType}s`;

        // Notify student
        const studentNotif = await createNotification({
          recipient: session.student._id,
          type: 'general',
          title: 'Meeting Reminder',
          message: `Reminder: Your session on "${session.topic}" starts in ${timeMsg}.`,
          data: { sessionId: session._id },
        });

        // Notify mentor
        const mentorNotif = await createNotification({
          recipient: session.mentor._id,
          type: 'general',
          title: 'Meeting Reminder',
          message: `Reminder: Your session on "${session.topic}" with student starts in ${timeMsg}.`,
          data: { sessionId: session._id },
        });

        // Set dual fields for compatibility with query controllers
        studentNotif.user = session.student._id;
        mentorNotif.user = session.mentor._id;
        await Promise.all([studentNotif.save(), mentorNotif.save()]);

        // Push real-time WS events
        emitToUser(session.student._id, 'session:reminder', { sessionId: session._id, threshold: reminderType });
        emitToUser(session.mentor._id, 'session:reminder', { sessionId: session._id, threshold: reminderType });
      }
    }

    // ----------------------------------------------------
    // 2. Auto-Complete Past Confirmed Sessions
    // ----------------------------------------------------
    const pastSessions = await MentorSession.find({
      status: 'CONFIRMED',
      scheduledEnd: { $lte: now },
    });

    for (const session of pastSessions) {
      session.status = 'COMPLETED';
      session.completedAt = now;
      session.timeline.push({
        action: 'completed',
        by: session.mentor, // attribute completion to system/mentor
        note: 'Session automatically completed after reaching scheduled end time.',
        timestamp: now,
      });
      await session.save();

      // Notify student for feedback submission
      const studentNotif = await createNotification({
        recipient: session.student,
        type: 'general',
        title: 'Session Completed',
        message: `Your session on "${session.topic}" has concluded. Please submit your feedback.`,
        data: { sessionId: session._id },
      });

      // Notify mentor for feedback submission
      const mentorNotif = await createNotification({
        recipient: session.mentor,
        type: 'general',
        title: 'Session Completed',
        message: `Your session on "${session.topic}" has concluded. Please submit student review.`,
        data: { sessionId: session._id },
      });

      studentNotif.user = session.student;
      mentorNotif.user = session.mentor;
      await Promise.all([studentNotif.save(), mentorNotif.save()]);

      emitToUser(session.student, 'session:completed', { sessionId: session._id });
      emitToUser(session.mentor, 'session:completed', { sessionId: session._id });
      console.log(`[ReminderWorker] Session ${session._id} auto-completed.`);
    }
  } catch (error) {
    console.error('[ReminderWorker] Error executing background reminder sweeps:', error.message);
  }
};

let intervalId = null;

/**
 * Starts the periodic reminder check job.
 * @param {number} intervalMs - Poll rate in ms (default: 5 minutes)
 */
export const startReminderScheduler = (intervalMs = 5 * 60 * 1000) => {
  if (intervalId) return;

  // Run once immediately on start
  runReminderCheck();

  intervalId = setInterval(runReminderCheck, intervalMs);
  console.log(`[ReminderWorker] Scheduler started. Checking every ${intervalMs / 1000}s`);
};

/**
 * Stops the scheduler.
 */
export const stopReminderScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[ReminderWorker] Scheduler stopped.');
  }
};
