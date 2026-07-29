import express from 'express';
import { createStudentProfile } from '../controllers/studentProfileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createStudentProfile);

export default router;
