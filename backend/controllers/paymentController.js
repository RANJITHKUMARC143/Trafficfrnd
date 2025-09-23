const Order = require('../models/Order');
const { createRazorpayOrder, verifyRazorpayPayment, fetchRazorpayPayment, createRazorpayPaymentLink, notifyPaymentLink } = require('../services/razorpayService');

// Create Razorpay order for an existing orderId
async function createRazorpayOrderController(req, res) {
  try {
    const { orderId } = req.body;
    
    // Get the order details with populated user data
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate total amount
    const totalAmount = order.totalAmount + (order.deliveryFee || 0);

    // Create customer details from real user data
    const customerDetails = {
      name: order.customerName || (order.user?.name) || 'Customer',
      email: order.user?.email || 'customer@example.com',
      phone: order.user?.phone || '9999999999'
    };

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      totalAmount,
      orderId,
      customerDetails
    );

    // Update order with payment details
    if (!order.payment) {
      order.payment = {};
    }
    
    // Create a clean payment object without undefined values
    const cleanPayment = {
      method: 'online',
      status: 'pending',
      amount: totalAmount,
      gateway: 'razorpay',
      gatewayOrderId: razorpayOrder.id,
      currency: 'INR',
      refund: {
        amount: 0
      }
    };
    
    // Only include existing valid fields
    if (order.payment.gatewayPaymentId) cleanPayment.gatewayPaymentId = order.payment.gatewayPaymentId;
    if (order.payment.paidAt) cleanPayment.paidAt = order.payment.paidAt;
    if (order.payment.signature) cleanPayment.signature = order.payment.signature;
    
    order.payment = cleanPayment;
    await order.save();

    console.log('Razorpay order created:', razorpayOrder);

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
  }
}

// Verify Razorpay payment
async function verifyRazorpayPaymentController(req, res) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify payment signature
    const isSignatureValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    
    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await fetchRazorpayPayment(razorpayPaymentId);
    
    if (paymentDetails.success && paymentDetails.status === 'captured') {
      // Create a clean payment object without undefined values
      const cleanPayment = {
        method: order.payment.method || 'online',
        status: 'paid',
        amount: order.payment.amount || 0,
        gateway: order.payment.gateway || 'razorpay',
        gatewayOrderId: order.payment.gatewayOrderId,
        gatewayPaymentId: razorpayPaymentId,
        currency: order.payment.currency || 'INR',
        refund: {
          amount: 0
        },
        paidAt: new Date()
      };
      
      // Only include existing valid fields
      if (order.payment.signature) cleanPayment.signature = order.payment.signature;
      
      order.payment = cleanPayment;
      // Mark order as confirmed only after successful capture
      if (order.status === 'pending') {
        order.status = 'confirmed';
      }
      await order.save();
    }

    res.json({
      success: true,
      paymentStatus: order.payment.status,
      paymentId: razorpayPaymentId,
      orderStatus: paymentDetails.status
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
}

// Razorpay webhook handler
async function razorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const parsed = Buffer.isBuffer(req.body) ? JSON.parse(rawBody.toString('utf8')) : (req.body || {});
    const { event, payload } = parsed;
    
    if (event === 'payment.captured') {
      const { payment } = payload;
      const dbOrder = await Order.findOne({ 'payment.gatewayOrderId': payment.order_id });
      
      if (dbOrder) {
        // Create a clean payment object without undefined values
        const cleanPayment = {
          method: dbOrder.payment.method || 'online',
          status: 'paid',
          amount: dbOrder.payment.amount || 0,
          gateway: dbOrder.payment.gateway || 'razorpay',
          gatewayOrderId: dbOrder.payment.gatewayOrderId,
          gatewayPaymentId: payment.id,
          currency: dbOrder.payment.currency || 'INR',
          refund: {
            amount: 0
          },
          paidAt: new Date()
        };
        
        // Only include existing valid fields
        if (dbOrder.payment.signature) cleanPayment.signature = dbOrder.payment.signature;
        
        dbOrder.payment = cleanPayment;
        // Mark order as confirmed only after successful capture
        if (dbOrder.status === 'pending') {
          dbOrder.status = 'confirmed';
        }
        await dbOrder.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
}

// Get available payment methods
async function getPaymentMethods(req, res) {
  try {
    res.json({
      success: true,
      methods: [
        {
          id: 'cod',
          name: 'Cash on Delivery',
          description: 'Pay when your order arrives',
          enabled: true
        },
        {
          id: 'razorpay',
          name: 'Online Payment',
          description: 'Pay securely with UPI, Cards, Net Banking',
          enabled: !!process.env.RAZORPAY_KEY_ID
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods', error: error.message });
  }
}

// Get payment configuration
async function getPaymentConfig(req, res) {
  try {
    res.json({
      success: true,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      environment: process.env.RAZORPAY_ENVIRONMENT || 'sandbox'
    });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    res.status(500).json({ message: 'Failed to fetch payment config', error: error.message });
  }
}

// Generate a Razorpay payment link for an order
async function generatePaymentLinkController(req, res) {
  try {
    const { orderId, amount, customerDetails, purpose } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const totalAmount = amount || (order.totalAmount + (order.deliveryFee || 0));
    const details = {
      name: (customerDetails && customerDetails.name) || order.customerName || order.user?.name || 'Customer',
      email: (customerDetails && customerDetails.email) || order.user?.email || 'customer@example.com',
      phone: (customerDetails && customerDetails.phone) || order.user?.phone || '9999999999'
    };

    const link = await createRazorpayPaymentLink(totalAmount, orderId, details, purpose);

    // Persist payment link and set pending online payment intent
    order.paymentLink = link.short_url || link.shortUrl || link.url || '';
    // Store link id if available for reliable notify
    const linkId = link.id || (order.paymentLink.split('/').pop());
    order.payment = {
      ...order.payment,
      method: 'online',
      status: 'pending',
      amount: totalAmount,
      gateway: 'razorpay',
      refund: { amount: 0 },
      paymentLink: order.paymentLink,
      paymentLinkId: linkId
    };
    await order.save();

    res.json({ success: true, link_url: order.paymentLink, data: link });
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ message: 'Failed to generate payment link', error: error.message });
  }
}

// Ask Razorpay to (re)send the payment link via SMS/email
async function notifyPaymentLinkController(req, res) {
  try {
    const { orderId, medium } = req.body; // medium: 'sms' | 'email'
    if (!orderId || !['sms', 'email'].includes(medium)) {
      return res.status(400).json({ message: 'orderId and medium (sms|email) are required' });
    }
    const order = await Order.findById(orderId);
    if (!order || !order.paymentLink) {
      return res.status(404).json({ message: 'Order or payment link not found' });
    }
    // Use stored paymentLinkId when available; fallback to parsing URL
    const id = order.payment?.paymentLinkId || (order.paymentLink ? order.paymentLink.split('/').pop() : '');
    const resp = await notifyPaymentLink(id, medium);
    res.json({ success: true, data: resp });
  } catch (error) {
    console.error('Error notifying payment link:', error);
    res.status(500).json({ message: 'Failed to notify payment link', error: error.message });
  }
}

module.exports = { 
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  razorpayWebhook,
  getPaymentMethods,
  getPaymentConfig,
  generatePaymentLinkController,
  notifyPaymentLinkController
};