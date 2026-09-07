import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const rescheduleRequestSchema = new mongoose.Schema(
  {
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const mentorSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    availabilitySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorAvailability',
      default: null,
    },
    scheduledStart: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    studentMessage: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'REJECTED',
        'CANCELLED_BY_STUDENT',
        'CANCELLED_BY_MENTOR',
        'COMPLETED',
        'NO_SHOW',
        'RESCHEDULE_REQUESTED',
      ],
      default: 'PENDING',
      index: true,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    meetingLinkAddedAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminders: {
      '24h': {
        type: Boolean,
        default: false,
      },
      '10h': {
        type: Boolean,
        default: false,
      },
      '1h': {
        type: Boolean,
        default: false,
      },
    },
    rescheduleRequest: {
      type: rescheduleRequestSchema,
      default: null,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up queries for students, mentors, schedules, and active bookings
mentorSessionSchema.index({ mentor: 1, scheduledStart: 1, scheduledEnd: 1 });
mentorSessionSchema.index({ student: 1, scheduledStart: 1, scheduledEnd: 1 });

const MentorSession = mongoose.model('MentorSession', mentorSessionSchema);
export default MentorSession;
