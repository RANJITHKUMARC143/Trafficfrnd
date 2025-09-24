const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const alertController = require('../controllers/alertController');
const userAuth = require('../controllers/userAuth');

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

module.exports = router; 