import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSessionRequest,
  getSessions,
  getSessionById,
  acceptSession,
  rejectSession,
  cancelSession,
  requestReschedule,
  confirmReschedule,
  addMeetingLink,
  completeSession,
  submitSessionFeedback,
  getSessionFeedback,
} from '../controllers/sessionController.js';

const router = express.Router();

router.use(protect);

router.post('/', createSessionRequest);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.patch('/:id/accept', acceptSession);
router.patch('/:id/reject', rejectSession);
router.patch('/:id/cancel', cancelSession);
router.patch('/:id/reschedule', requestReschedule);
router.patch('/:id/confirm-reschedule', confirmReschedule);
router.patch('/:id/meeting-link', addMeetingLink);
router.post('/:id/complete', completeSession);
router.post('/:id/feedback', submitSessionFeedback);
router.get('/:id/feedback', getSessionFeedback);

export default router;
