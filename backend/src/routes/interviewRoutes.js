import express from 'express';
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterviews,
  getInterviewById,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', protect, startInterview);
router.get('/', protect, getInterviews);
router.get('/:id', protect, getInterviewById);
router.post('/:id/question/:questionId/answer', protect, submitAnswer);
router.post('/:id/complete', protect, completeInterview);

export default router;

