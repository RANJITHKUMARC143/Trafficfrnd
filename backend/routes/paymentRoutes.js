const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  razorpayWebhook,
  getPaymentMethods,
  getPaymentConfig,
  generatePaymentLinkController,
  notifyPaymentLinkController
} = require('../controllers/paymentController');

// Get payment configuration
router.get('/config', getPaymentConfig);

// Razorpay routes
router.post('/razorpay/order', auth, createRazorpayOrderController);
router.post('/razorpay/verify', auth, verifyRazorpayPaymentController);
// Razorpay requires raw body to verify signature
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Payment link route
router.post('/payment-link', auth, generatePaymentLinkController);
router.post('/payment-link/notify', auth, notifyPaymentLinkController);
router.get('/methods', getPaymentMethods);

module.exports = router;