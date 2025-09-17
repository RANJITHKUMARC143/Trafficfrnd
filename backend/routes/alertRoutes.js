const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const alertController = require('../controllers/alertController');

// Get all alerts for the current user
router.get('/', auth, alertController.getAlerts);

// Create a new alert (admin or system)
router.post('/', auth, alertController.createAlert);

// Delete an alert
router.delete('/:id', auth, alertController.deleteAlert);

// Mark an alert as read
router.put('/:id/read', auth, alertController.markAlertRead);

// Mark an alert as read
router.put('/:id/read', auth, alertController.markAlertRead);

module.exports = router; 