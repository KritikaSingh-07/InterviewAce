import express from 'express';
import { updateProfile, getProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getProfile)
  .put(protect, upload.single('avatar'), updateProfile);

export default router;

