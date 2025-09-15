const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendPaymentLink, sendCustomSMS } = require('../controllers/smsController');

// Send payment link via SMS
router.post('/send-payment-link', auth, sendPaymentLink);

// Send custom SMS
router.post('/send', auth, sendCustomSMS);

module.exports = router;
