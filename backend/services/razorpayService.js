const crypto = require('crypto');
let RazorpayModule = null;

function getClient() {
  if (!RazorpayModule) {
    try {
      // Lazy-load to avoid crashing if package isn't installed in local/dev
      // or when payments are not configured.
      // eslint-disable-next-line global-require
      RazorpayModule = require('razorpay');
    } catch (e) {
      throw new Error('Razorpay SDK not installed. Run "npm install razorpay" or disable online payments.');
    }
  }
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay keys not configured');
  return new RazorpayModule({ key_id, key_secret });
}

async function createOrderRzp(amountInPaise, receiptId) {
  const client = getClient();
  return await client.orders.create({ amount: amountInPaise, currency: 'INR', receipt: receiptId, payment_capture: 1 });
}

function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

module.exports = { createOrderRzp, verifySignature };


