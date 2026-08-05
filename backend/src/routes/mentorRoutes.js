import express from 'express';
import {
  getActiveStudents,
  createMentorInterview,
  getMentorInterviews,
  getMentorInterviewById,
  submitFeedback,
} from '../controllers/mentorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All mentor routes require authentication and mentor role (checked in controller)
router.get('/students', protect, getActiveStudents);
router.post('/interviews', protect, createMentorInterview);
router.get('/interviews', protect, getMentorInterviews);
router.get('/interviews/:id', protect, getMentorInterviewById);
router.post('/interviews/:id/feedback', protect, submitFeedback);

export default router;
