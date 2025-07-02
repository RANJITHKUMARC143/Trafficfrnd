const Alert = require('../models/Alert');
const User = require('../models/User');

// Get all alerts for the current user (global + user-specific)
exports.getAlerts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    // If user is admin, return all alerts
    if (userRole === 'admin') {
      const alerts = await Alert.find({}).sort({ createdAt: -1 });
      res.json(alerts);
    } else {
      // For regular users, return only global alerts and their own alerts
      const alerts = await Alert.find({
        $or: [
          { userId: null },
          { userId: userId }
        ]
      }).sort({ createdAt: -1 });
      res.json(alerts);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

// Create a new alert (admin only, except order-update by system)
exports.createAlert = async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    // Only admin can create unless type is 'order-update'
    if (type !== 'order-update' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create alerts' });
    }
    const alert = new Alert({
      title,
      message,
      type: type || 'info',
      userId: userId || null
    });
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert' });
  }
};

// Delete an alert (admin or user can delete their own)
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    // Only admin or the user who owns the alert can delete
    if (req.user.role !== 'admin' && (!alert.userId || alert.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' });
    }
    await alert.deleteOne();
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Mark an alert as read
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    // Only the user who owns the alert or admin can mark as read
    if (req.user.role !== 'admin' && (!alert.userId || alert.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to mark this alert as read' });
    }
    alert.read = true;
    await alert.save();
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert' });
  }
}; 