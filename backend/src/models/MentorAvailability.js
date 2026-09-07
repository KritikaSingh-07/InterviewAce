import mongoose from 'mongoose';

const mentorAvailabilitySchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: false,
    },
    date: {
      type: String, // format: "YYYY-MM-DD"
      required: false,
    },
    startTime: {
      type: String, // format: "HH:mm" (e.g. "09:00")
      required: true,
    },
    endTime: {
      type: String, // format: "HH:mm" (e.g. "17:00")
      required: true,
    },
    startDateTimeUTC: {
      type: Date,
      required: false,
    },
    endDateTimeUTC: {
      type: Date,
      required: false,
    },
    duration: {
      type: Number, // duration in minutes (e.g. 30 or 60)
      required: true,
      default: 30,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

mentorAvailabilitySchema.index({ mentor: 1, dayOfWeek: 1 });
mentorAvailabilitySchema.index({ mentor: 1, startDateTimeUTC: 1, endDateTimeUTC: 1 });

const MentorAvailability = mongoose.model('MentorAvailability', mentorAvailabilitySchema);
export default MentorAvailability;
