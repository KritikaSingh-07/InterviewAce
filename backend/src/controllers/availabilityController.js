import MentorAvailability from '../models/MentorAvailability.js';
import MentorSession from '../models/MentorSession.js';
import { getUtcDate, getDayOfWeek } from '../utils/timezone.js';

// @desc    Get current mentor's availability configurations
// @route   GET /api/mentor/availability
// @access  Private (Mentor only)
export const getMyAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const availability = await MentorAvailability.find({ mentor: req.user._id })
      .sort({ date: 1, dayOfWeek: 1, startTime: 1 })
      .lean();

    // Dynamically check if each slot has active session bookings
    const availabilityWithStatus = await Promise.all(
      availability.map(async (slot) => {
        if (!slot.isRecurring) {
          const hasActiveSessions = await MentorSession.findOne({
            availabilitySlot: slot._id,
            status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
          });
          return {
            ...slot,
            status: hasActiveSessions ? 'BOOKED' : 'AVAILABLE',
          };
        }
        return {
          ...slot,
          status: 'AVAILABLE',
        };
      })
    );

    res.json({ availability: availabilityWithStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new availability configuration slot
// @route   POST /api/mentor/availability
// @access  Private (Mentor only)
export const createAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { dayOfWeek, date, startTime, endTime, duration, timezone, isRecurring } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Please provide start time and end time' });
    }

    // Validate times are in HH:mm format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Times must be in 24h format (HH:mm)' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    const durationNum = Number(duration) || 30;
    if (![30, 45, 60, 90, 120].includes(durationNum)) {
      return res.status(400).json({ error: 'Duration must be 30, 45, 60, 90, or 120 minutes' });
    }

    const targetTimezone = timezone || 'UTC';

    if (date) {
      // Date-specific slot
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
      }

      const startDateTimeUTC = getUtcDate(date, startTime, targetTimezone);
      const endDateTimeUTC = getUtcDate(date, endTime, targetTimezone);
      const now = new Date();

      if (startDateTimeUTC < now) {
        return res.status(400).json({ error: 'Cannot create availability in the past' });
      }

      // Check overlap with other date-specific configurations
      const dateOverlaps = await MentorAvailability.find({
        mentor: req.user._id,
        isActive: true,
        date: { $exists: true, $ne: null },
        $or: [
          { startDateTimeUTC: { $lt: endDateTimeUTC }, endDateTimeUTC: { $gt: startDateTimeUTC } }
        ]
      });

      if (dateOverlaps.length > 0) {
        return res.status(400).json({
          error: 'Slot overlaps with an existing date-specific availability configuration.',
        });
      }

      // Check overlap with recurring configurations on the same day of week
      const dayName = getDayOfWeek(date, targetTimezone);
      const recurringOverlaps = await MentorAvailability.find({
        mentor: req.user._id,
        isActive: true,
        isRecurring: true,
        dayOfWeek: dayName,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });

      if (recurringOverlaps.length > 0) {
        return res.status(400).json({
          error: 'Slot overlaps with a weekly recurring availability configuration.',
        });
      }

      const availability = await MentorAvailability.create({
        mentor: req.user._id,
        date,
        startTime,
        endTime,
        startDateTimeUTC,
        endDateTimeUTC,
        duration: durationNum,
        timezone: targetTimezone,
        isRecurring: false,
        isActive: true,
      });

      const availabilityObj = availability.toObject();
      availabilityObj.status = 'AVAILABLE';
      res.status(201).json({
        message: 'Availability slot created successfully',
        availability: availabilityObj,
      });
    } else {
      // Weekly recurring availability
      if (!dayOfWeek) {
        return res.status(400).json({ error: 'Please provide either a day of week or a specific date' });
      }

      // Check for configuration overlaps on the same day for this mentor
      const overlaps = await MentorAvailability.find({
        mentor: req.user._id,
        dayOfWeek,
        isRecurring: true,
        isActive: true,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        ],
      });

      if (overlaps.length > 0) {
        return res.status(400).json({
          error: 'Availability slot overlaps with an existing configuration on the same day.',
        });
      }

      // Check overlap with any existing date-specific availability configurations that land on this weekday
      const dateConfigs = await MentorAvailability.find({
        mentor: req.user._id,
        isActive: true,
        isRecurring: false,
        date: { $exists: true, $ne: null }
      });

      for (const dConfig of dateConfigs) {
        const weekday = getDayOfWeek(dConfig.date, dConfig.timezone);
        if (weekday === dayOfWeek) {
          if (startTime < dConfig.endTime && endTime > dConfig.startTime) {
            return res.status(400).json({
              error: 'Availability slot overlaps with a date-specific configuration scheduled for ' + dConfig.date + '.',
            });
          }
        }
      }

      const availability = await MentorAvailability.create({
        mentor: req.user._id,
        dayOfWeek,
        startTime,
        endTime,
        duration: durationNum,
        timezone: targetTimezone,
        isRecurring: true,
        isActive: true,
      });

      const availabilityObj = availability.toObject();
      availabilityObj.status = 'AVAILABLE';
      res.status(201).json({
        message: 'Availability slot created successfully',
        availability: availabilityObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update an availability slot configuration
// @route   PUT /api/mentor/availability/:id
// @access  Private (Mentor only)
export const updateAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const { dayOfWeek, date, startTime, endTime, duration, timezone, isRecurring, isActive } = req.body;

    const availability = await MentorAvailability.findOne({
      _id: req.params.id,
      mentor: req.user._id,
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    // Check if slot has active bookings before modification
    const hasActiveSessions = await MentorSession.findOne({
      availabilitySlot: req.params.id,
      status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
    });

    if (hasActiveSessions) {
      return res.status(400).json({
        error: 'Cannot update: this availability slot is associated with a pending or confirmed session.',
      });
    }

    const newStart = startTime || availability.startTime;
    const newEnd = endTime || availability.endTime;
    const newDuration = duration !== undefined ? Number(duration) : availability.duration;
    const targetTimezone = timezone || availability.timezone;

    if (newStart >= newEnd) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    if (date || availability.date) {
      const targetDate = date || availability.date;
      const startDateTimeUTC = getUtcDate(targetDate, newStart, targetTimezone);
      const endDateTimeUTC = getUtcDate(targetDate, newEnd, targetTimezone);

      // Check overlap excluding self
      const dateOverlaps = await MentorAvailability.find({
        _id: { $ne: req.params.id },
        mentor: req.user._id,
        isActive: true,
        date: { $exists: true, $ne: null },
        $or: [
          { startDateTimeUTC: { $lt: endDateTimeUTC }, endDateTimeUTC: { $gt: startDateTimeUTC } }
        ]
      });

      if (dateOverlaps.length > 0) {
        return res.status(400).json({
          error: 'Slot overlaps with an existing date-specific availability configuration.',
        });
      }

      availability.date = targetDate;
      availability.startDateTimeUTC = startDateTimeUTC;
      availability.endDateTimeUTC = endDateTimeUTC;
      availability.isRecurring = false;
    } else {
      const newDay = dayOfWeek || availability.dayOfWeek;
      const overlaps = await MentorAvailability.find({
        _id: { $ne: req.params.id },
        mentor: req.user._id,
        dayOfWeek: newDay,
        isRecurring: true,
        isActive: true,
        $or: [
          { startTime: { $lt: newEnd }, endTime: { $gt: newStart } },
        ],
      });

      if (overlaps.length > 0) {
        return res.status(400).json({
          error: 'Update failed: Slot overlaps with an existing availability configuration.',
        });
      }

      availability.dayOfWeek = newDay;
      availability.isRecurring = true;
    }

    availability.startTime = newStart;
    availability.endTime = newEnd;
    availability.duration = newDuration;
    availability.timezone = targetTimezone;
    availability.isActive = isActive !== undefined ? isActive : availability.isActive;

    await availability.save();

    const availabilityObj = availability.toObject();
    availabilityObj.status = 'AVAILABLE';
    res.json({
      message: 'Availability slot updated successfully',
      availability: availabilityObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an availability slot configuration
// @route   DELETE /api/mentor/availability/:id
// @access  Private (Mentor only)
export const deleteAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor only.' });
    }

    const hasActiveSessions = await MentorSession.findOne({
      availabilitySlot: req.params.id,
      status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
    });

    if (hasActiveSessions) {
      return res.status(400).json({
        error: 'Cannot delete: this availability slot is associated with a pending or confirmed session.',
      });
    }

    const availability = await MentorAvailability.findOneAndDelete({
      _id: req.params.id,
      mentor: req.user._id,
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    res.json({ message: 'Availability slot deleted successfully' });
  } catch (error) {
    next(error);
  }
};
