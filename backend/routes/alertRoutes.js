const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const alertController = require('../controllers/alertController');
const userAuth = require('../controllers/userAuth');
const { sendToUser } = require('../services/pushService');
const User = require('../models/User');

// Get all alerts for the current user
router.get('/', auth, alertController.getAlerts);

// Create a new alert (admin or system)
router.post('/', auth, alertController.createAlert);

// Delete an alert
router.delete('/:id', auth, alertController.deleteAlert);

// Mark an alert as read
router.put('/:id/read', auth, alertController.markAlertRead);

// Register/update push token (reuses userAuth.updatePushToken)
router.post('/register-token', auth, userAuth.updatePushToken);

// Inspect current user's token
router.get('/me/token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('expoPushToken');
    const token = user?.expoPushToken || '';
    let valid = false;
    try {
      const { Expo } = require('expo-server-sdk');
      valid = typeof token === 'string' && Expo.isExpoPushToken(token);
    } catch {}
    res.json({ token, valid });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Test push to current user
router.post('/test-push', auth, async (req, res) => {
  try {
    await sendToUser(req.user._id, req.body?.title || 'Test', req.body?.body || 'This is a test push');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router; 