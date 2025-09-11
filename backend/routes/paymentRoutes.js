const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPaymentOrder, confirmPayment, webhook } = require('../controllers/paymentController');

// Client needs key id to init SDK (no secret)
router.get('/config', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
});

router.post('/online/order', auth, createPaymentOrder);
router.post('/online/confirm', auth, confirmPayment);
router.post('/webhook', webhook);

module.exports = router;


