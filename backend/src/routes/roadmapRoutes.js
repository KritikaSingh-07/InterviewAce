import express from 'express';
import {
  generateRoadmap,
  getRoadmaps,
  getRoadmapById,
  completeTask,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateRoadmap);
router.get('/', protect, getRoadmaps);
router.get('/:id', protect, getRoadmapById);
router.patch('/:id/tasks/:taskId/complete', protect, completeTask);

export default router;

