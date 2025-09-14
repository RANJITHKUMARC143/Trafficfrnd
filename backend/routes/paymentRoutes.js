const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createCashfreeUPIOrder,
  createCashfreePaymentSession,
  verifyCashfreePayment,
  cashfreeWebhook,
  getPaymentMethods
} = require('../controllers/paymentController');

// Client needs key id to init SDK (no secret)
router.get('/config', (req, res) => {
  res.json({ 
    cashfreeClientId: process.env.CASHFREE_CLIENT_ID || '',
    environment: process.env.CASHFREE_ENVIRONMENT || 'sandbox'
  });
});

// Cashfree routes
router.post('/cashfree/upi/order', auth, createCashfreeUPIOrder);
router.post('/cashfree/session', auth, createCashfreePaymentSession);
router.post('/cashfree/verify', auth, verifyCashfreePayment);
router.post('/cashfree/webhook', cashfreeWebhook);
router.get('/methods', getPaymentMethods);

module.exports = router;


