import express from 'express';
import {
  getMentors,
  getMentorById,
  getMentorAvailabilityForDate,
  getMentorWeeklyAvailability,
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
router.get('/:id', getMentorById);
router.get('/:id/availability', getMentorAvailabilityForDate);
router.get('/:id/weekly-availability', getMentorWeeklyAvailability);
router.post('/requests', createInterviewRequest);
router.get('/my-requests', getMyRequests);

export default router;

