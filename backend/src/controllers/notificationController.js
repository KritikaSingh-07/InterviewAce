import Notification from '../models/Notification.js';

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Helper: create a notification (used internally by other controllers)
const createNotification = async ({ userId, type, title, message, referenceId, referenceModel }) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

export { getNotifications, markAsRead, markAllAsRead, createNotification };
