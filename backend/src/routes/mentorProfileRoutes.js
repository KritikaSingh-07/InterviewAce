import express from 'express';
import { createMentorProfile } from '../controllers/mentorProfileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createMentorProfile);

export default router;
