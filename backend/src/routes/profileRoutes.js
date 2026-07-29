import express from 'express';
import { updateProfile, getProfile, uploadImage, removeImage } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getProfile)
  .put(protect, updateProfile); // PUT updates profile details via JSON

router.post('/upload-image', protect, upload.single('image'), uploadImage);
router.delete('/remove-image', protect, removeImage);

export default router;
