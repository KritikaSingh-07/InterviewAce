import express from 'express';
import { selectRole } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/select-role', protect, selectRole);

export default router;
