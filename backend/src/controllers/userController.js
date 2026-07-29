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

export { selectRole };
