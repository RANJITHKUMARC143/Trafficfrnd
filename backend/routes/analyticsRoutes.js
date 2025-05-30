const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

// Analytics routes
router.get('/metrics', auth, getAnalytics);

module.exports = router; 