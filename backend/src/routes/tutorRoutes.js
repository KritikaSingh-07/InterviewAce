import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getProblems,
  getProblemFilters,
  getProblemById,
  getSession,
  sendChatMessage,
  unlockHint,
  unlockSolution,
  runCode,
  submitCode,
  toggleBookmark,
} from '../controllers/tutorController.js';

const router = express.Router();

// Apply auth protection middleware to all tutor endpoints
router.use(protect);

router.get('/problems', getProblems);
router.get('/problems/filters', getProblemFilters);
router.get('/problems/:id', getProblemById);
router.get('/session/:problemId', getSession);
router.post('/session/:problemId/chat', sendChatMessage);
router.post('/session/:problemId/hint', unlockHint);
router.post('/session/:problemId/solution', unlockSolution);
router.post('/session/:problemId/submit', submitCode);
router.post('/session/:problemId/bookmark', toggleBookmark);
router.post('/run', runCode);

export default router;
