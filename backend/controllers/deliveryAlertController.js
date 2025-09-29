const DeliveryAlert = require('../models/DeliveryAlert');
const DeliveryBoy = require('../models/DeliveryBoy');

// Get all alerts for current delivery boy (global + personal)
exports.getAlerts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const deliveryId = req.user?._id;
    const alerts = await DeliveryAlert.find({
      $or: [
        { deliveryBoyId: null },
        { deliveryBoyId: deliveryId }
      ]
    }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching delivery alerts' });
  }
};

// Create a new delivery alert (admin/system)
exports.createAlert = async (req, res) => {
  try {
    const { title, message, type, deliveryBoyId } = req.body;
    if (req.user.role !== 'admin' && req.user.role !== 'system') {
      return res.status(403).json({ message: 'Only admin can create delivery alerts' });
    }
    const alert = new DeliveryAlert({
      title,
      message,
      type: type || 'info',
      deliveryBoyId: deliveryBoyId || null
    });
    await alert.save();
    res.status(201).json(alert);
  } catch (e) {
    res.status(500).json({ message: 'Error creating delivery alert' });
  }
};

// Delete an alert (admin or the owner)
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await DeliveryAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (req.user.role !== 'admin' && (!alert.deliveryBoyId || String(alert.deliveryBoyId) !== String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' });
    }
    await alert.deleteOne();
    res.json({ message: 'Alert deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Mark alert as read
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await DeliveryAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (req.user.role !== 'admin' && (!alert.deliveryBoyId || String(alert.deliveryBoyId) !== String(req.user._id))) {
      if (!alert.deliveryBoyId) {
        alert.read = true;
        await alert.save();
        return res.json({ message: 'Alert marked as read' });
      }
      return res.status(403).json({ message: 'Not authorized to mark this alert as read' });
    }
    alert.read = true;
    await alert.save();
    res.json({ message: 'Alert marked as read' });
  } catch (e) {
    res.status(500).json({ message: 'Error updating alert' });
  }
};

// Register/update Expo push token for delivery boy
exports.updatePushToken = async (req, res) => {
  try {
    const token = req.body?.expoPushToken || '';
    const id = req.user?._id;
    const driver = await DeliveryBoy.findById(id).select('_id');
    if (!driver) return res.status(404).json({ message: 'Delivery account not found' });
    driver.expoPushToken = token;
    await driver.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Register/update FCM token for delivery boy
exports.updateFCMToken = async (req, res) => {
  try {
    const token = req.body?.fcmToken || '';
    const id = req.user?._id;
    const driver = await DeliveryBoy.findById(id).select('_id');
    if (!driver) return res.status(404).json({ message: 'Delivery account not found' });
    driver.fcmToken = token;
    await driver.save();
    console.log('FCM token updated for delivery boy:', id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Send a test alert to the current delivery account (for verification)
exports.sendTestAlert = async (req, res) => {
  try {
    const id = req.user?._id;
    if (!id) return res.status(401).json({ message: 'Unauthorized' });

    const alert = new (require('../models/DeliveryAlert'))({
      title: 'Test Alert',
      message: 'This is a test delivery alert',
      type: 'info',
      deliveryBoyId: id
    });
    await alert.save();

    // Also emit over socket to verify realtime path
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`deliveryBoy:${String(id)}`).emit('deliveryNotification', {
          type: 'info',
          title: 'Test Alert',
          message: 'This is a test delivery alert',
          deliveryAlertId: String(alert._id)
        });
      }
    } catch {}

    res.json({ ok: true, alert });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};


