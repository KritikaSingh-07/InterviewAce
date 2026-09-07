import express from 'express';
import {
  getActiveStudents,
  getStudentById,
  createMentorInterview,
  getMentorInterviews,
  getMentorInterviewById,
  submitFeedback,
  getMentorFeedbackAnalytics,
} from '../controllers/mentorController.js';
import {
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from '../controllers/availabilityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All mentor routes require authentication and mentor role (checked in controller)
router.get('/students', protect, getActiveStudents);
router.get('/students/:id', protect, getStudentById);
router.post('/interviews', protect, createMentorInterview);
router.get('/interviews', protect, getMentorInterviews);
router.get('/interviews/:id', protect, getMentorInterviewById);
router.post('/interviews/:id/feedback', protect, submitFeedback);

// Aggregated Mentor Feedback Analytics (SYSTEM 2)
router.get('/feedback-analytics', protect, getMentorFeedbackAnalytics);

// Availability endpoints
router.get('/availability', protect, getMyAvailability);
router.post('/availability', protect, createAvailability);
router.put('/availability/:id', protect, updateAvailability);
router.delete('/availability/:id', protect, deleteAvailability);

export default router;
