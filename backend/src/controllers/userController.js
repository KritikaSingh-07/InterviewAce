import User from '../models/User.js';

// @desc    Select user role
// @route   POST /api/users/select-role
// @access  Private
const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || (role !== 'student' && role !== 'mentor')) {
      return res.status(400).json({ error: 'Role must be student or mentor' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.onboardingCompleted) {
      return res.status(400).json({ error: 'Role cannot be changed after onboarding is completed' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'Role selected successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get editor preferences
// @route   GET /api/users/preferences
// @access  Private
const getEditorPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('editorPreferences');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, preferences: user.editorPreferences || {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Update editor preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateEditorPreferences = async (req, res, next) => {
  try {
    const { theme, fontSize, wordWrap, minimap, autoSave } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.editorPreferences) user.editorPreferences = {};
    if (theme !== undefined) user.editorPreferences.theme = theme;
    if (fontSize !== undefined) user.editorPreferences.fontSize = fontSize;
    if (wordWrap !== undefined) user.editorPreferences.wordWrap = wordWrap;
    if (minimap !== undefined) user.editorPreferences.minimap = minimap;
    if (autoSave !== undefined) user.editorPreferences.autoSave = autoSave;

    user.markModified('editorPreferences');
    await user.save();
    return res.json({ success: true, preferences: user.editorPreferences });
  } catch (error) {
    next(error);
  }
};

export { selectRole, getEditorPreferences, updateEditorPreferences };
