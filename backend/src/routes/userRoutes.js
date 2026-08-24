import express from 'express';
import { selectRole, getEditorPreferences, updateEditorPreferences } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/select-role', protect, selectRole);
router.get('/preferences', protect, getEditorPreferences);
router.put('/preferences', protect, updateEditorPreferences);

export default router;
