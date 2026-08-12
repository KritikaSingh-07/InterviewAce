import express from 'express';
import {
  getMentors,
  createInterviewRequest,
  getMyRequests,
  requireMentorPlan,
} from '../controllers/mentorSectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All mentor-section routes require authentication AND a pro/agency student plan
router.use(protect);
router.use(requireMentorPlan);

router.get('/', getMentors);
router.post('/requests', createInterviewRequest);
router.get('/my-requests', getMyRequests);

export default router;

