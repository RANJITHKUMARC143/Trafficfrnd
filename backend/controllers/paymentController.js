const Order = require('../models/Order');
const { createOrderRzp, verifySignature } = require('../services/razorpayService');

// Create Razorpay order for an existing orderId
async function createPaymentOrder(req, res) {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Compute payable amount server-side
    const amount = Math.round((order.totalAmount + (order.deliveryFee || 0)) * 100); // in paise
    const rzp = await createOrderRzp(amount, String(order._id));
    order.payment = {
      ...(order.payment || {}),
      method: 'online',
      status: 'pending',
      amount: amount / 100,
      gateway: 'razorpay',
      gatewayOrderId: rzp.id,
    };
    await order.save();
    res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: rzp.id, amount, currency: 'INR', receipt: rzp.receipt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create payment order', error: e.message });
  }
}

// Confirm payment from client (after SDK success)
async function confirmPayment(req, res) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!verifySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature })) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    order.payment = {
      ...(order.payment || {}),
      status: 'paid',
      gatewayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    };
    await order.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to confirm payment', error: e.message });
  }
}

// Webhook handler (idempotency to be added via event log if needed)
async function webhook(req, res) {
  try {
    // For now acknowledge; production: verify webhook signature 'X-Razorpay-Signature'
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ message: 'Webhook error' });
  }
}

module.exports = { createPaymentOrder, confirmPayment, webhook };


