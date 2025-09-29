const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/deliveryAlertController');

// Get alerts for current delivery boy
router.get('/', auth, ctrl.getAlerts);

// Create alert (admin)
router.post('/', auth, ctrl.createAlert);

// Delete alert
router.delete('/:id', auth, ctrl.deleteAlert);

// Mark as read
router.put('/:id/read', auth, ctrl.markAlertRead);

// Register/update push token
router.post('/register-token', auth, ctrl.updatePushToken);

// Register/update FCM token
router.post('/register-fcm-token', auth, ctrl.updateFCMToken);

// Test alert to current delivery user
router.post('/test', auth, ctrl.sendTestAlert);

module.exports = router;


