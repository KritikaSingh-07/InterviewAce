import express from 'express';
import {
  generateRoadmap,
  getRoadmaps,
  getRoadmapById,
  completeTask,
  submitPracticeAnswer,
  polishBio,
  deleteRoadmap,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateRoadmap);
router.post('/polish-bio', protect, polishBio);
router.get('/', protect, getRoadmaps);
router.get('/:id', protect, getRoadmapById);
router.delete('/:id', protect, deleteRoadmap);
router.patch('/:id/tasks/:taskId/complete', protect, completeTask);
router.post('/:id/tasks/:taskId/questions/:questionId/answer', protect, submitPracticeAnswer);

export default router;
