const express = require('express');
const router = express.Router();
const deliveryBoyController = require('../controllers/deliveryBoyController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all routes
router.use(limiter);

// Public routes
router.post('/register', deliveryBoyController.register);
router.post('/login', deliveryBoyController.login);

// Protected routes
router.get('/profile', auth, deliveryBoyController.getProfile);
router.put('/profile', auth, deliveryBoyController.updateProfile);
router.put('/location', auth, deliveryBoyController.updateLocation);
router.put('/status', auth, deliveryBoyController.updateOnlineStatus);

// Earnings routes
router.get('/earnings/summary', auth, deliveryBoyController.getEarningsSummary);
router.get('/earnings/history', auth, deliveryBoyController.getEarningsHistory);
router.post('/earnings/summary/cashout', auth, deliveryBoyController.requestCashout);

module.exports = router; 