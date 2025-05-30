const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/dashboardController');

// Get dashboard metrics
router.get('/metrics', auth, getDashboardMetrics);

module.exports = router; 