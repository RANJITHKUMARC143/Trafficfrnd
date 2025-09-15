const { sendSMS } = require('../services/cashfreeService');

// Send payment link via SMS
async function sendPaymentLink(req, res) {
  try {
    const { phone, paymentLink, orderId, customerName } = req.body;

    if (!phone || !paymentLink || !orderId) {
      return res.status(400).json({ 
        message: 'Phone number, payment link, and order ID are required' 
      });
    }

    const message = `Hi ${customerName || 'Customer'}!

Your order #${orderId} is ready for payment.

Payment Link: ${paymentLink}

Complete payment to confirm your order. Secure payment powered by Cashfree.

Thank you for choosing TrafficFriend!`;

    const result = await sendSMS(phone, message);

    res.json({
      success: true,
      message: 'Payment link sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending payment link SMS:', error);
    res.status(500).json({ 
      message: 'Failed to send payment link SMS', 
      error: error.message 
    });
  }
}

// Send custom SMS
async function sendCustomSMS(req, res) {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ 
        message: 'Phone number and message are required' 
      });
    }

    const result = await sendSMS(phone, message);

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      message: 'Failed to send SMS', 
      error: error.message 
    });
  }
}

module.exports = {
  sendPaymentLink,
  sendCustomSMS
};
