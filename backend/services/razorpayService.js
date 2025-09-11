const crypto = require('crypto');
const Razorpay = require('razorpay');

function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay keys not configured');
  return new Razorpay({ key_id, key_secret });
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


