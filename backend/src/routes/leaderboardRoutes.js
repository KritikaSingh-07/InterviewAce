import express from 'express';
import {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getMyStats,
} from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/me', protect, getMyStats);

export default router;

