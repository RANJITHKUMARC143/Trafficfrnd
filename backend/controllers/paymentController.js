const Order = require('../models/Order');
const { createUPIOrder, createUPIPaymentLink, createPaymentLink, verifyPayment, verifyWebhookSignature, getAvailablePaymentMethods } = require('../services/cashfreeService');

// Create Cashfree UPI order for an existing orderId
async function createCashfreeUPIOrder(req, res) {
  try {
    const { orderId, upiId } = req.body;
    
    // Always use the UPI ID from environment variable (ignore frontend value)
    const finalUpiId = process.env.DEFAULT_UPI_ID || 'ranjith0707@ptaxis';
    console.log('Using UPI ID:', finalUpiId, 'from env:', process.env.DEFAULT_UPI_ID);

    // Get the order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate total amount
    const totalAmount = order.totalAmount + order.deliveryFee;

    // Create customer details
    const customerDetails = {
      customerId: order.user.toString(),
      name: order.customerName,
      email: order.user.email || 'customer@example.com',
      phone: order.user.phone || '9999999999'
    };

    // Create payment link using Cashfree service
    const paymentLink = await createUPIPaymentLink(
      totalAmount,
      orderId,
      customerDetails,
      finalUpiId
    );

    // Update order with payment details
    order.payment.paymentLink = paymentLink.linkUrl;
    order.payment.paymentSessionId = paymentLink.linkId;
    order.payment.amount = totalAmount;
    order.payment.upiId = finalUpiId;
    await order.save();

    console.log('Payment link created:', paymentLink);

    res.json({
      success: true,
      linkId: paymentLink.linkId,
      linkUrl: paymentLink.linkUrl,
      linkStatus: paymentLink.linkStatus,
      amount: totalAmount,
      currency: 'INR',
      orderId: orderId
    });
  } catch (error) {
    console.error('Error creating Cashfree UPI order:', error);
    res.status(500).json({ message: 'Failed to create UPI payment order', error: error.message });
  }
}

// Create Cashfree payment session for mobile app
async function createCashfreePaymentSession(req, res) {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get customer details
    const customerDetails = {
      name: order.customerName || 'Customer',
      email: order.customerEmail || 'customer@example.com',
      phone: order.customerPhone || '9999999999',
      customerId: order.customerId || `customer_${order._id}`
    };

    // Compute payable amount
    const amount = order.totalAmount + (order.deliveryFee || 0);
    
    // Create payment order for mobile SDK
    const paymentResult = await createUPIOrder(amount, order._id, customerDetails);
    
    // Update order with payment details
    order.payment = {
      ...(order.payment || {}),
      method: 'online',
      status: 'pending',
      amount: amount,
      gateway: 'cashfree',
      gatewayOrderId: paymentResult.orderId,
      paymentSessionId: paymentResult.paymentSessionId
    };
    await order.save();

    res.json({
      success: true,
      orderId: paymentResult.orderId,
      paymentSessionId: paymentResult.paymentSessionId,
      orderStatus: paymentResult.orderStatus,
      amount: amount,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error creating Cashfree payment session:', error);
    res.status(500).json({ message: 'Failed to create payment session', error: error.message });
  }
}

// Verify Cashfree payment
async function verifyCashfreePayment(req, res) {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify payment with Cashfree
    const verificationResult = await verifyPayment(order.payment.gatewayOrderId);
    
    if (verificationResult.success && verificationResult.orderStatus === 'PAID') {
      // Update order payment status
      order.payment = {
        ...order.payment,
        status: 'paid',
        paidAt: new Date()
      };
      await order.save();
    }

    res.json({
      success: true,
      orderStatus: verificationResult.orderStatus,
      paymentStatus: order.payment.status
    });
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
}

// Cashfree webhook handler
async function cashfreeWebhook(req, res) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature, process.env.CASHFREE_WEBHOOK_SECRET);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { type, data } = req.body;
    
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      const dbOrder = await Order.findOne({ 'payment.gatewayOrderId': order.order_id });
      
      if (dbOrder) {
        dbOrder.payment = {
          ...dbOrder.payment,
          status: 'paid',
          gatewayPaymentId: order.cf_payment_id,
          paidAt: new Date()
        };
        await dbOrder.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
}

// Create payment link using official Cashfree Payment Links API
async function createPaymentLinkController(req, res) {
  try {
    const { orderId, amount, customerDetails, purpose } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Order ID and amount are required' });
    }

    // Get the order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate total amount
    const totalAmount = amount || (order.totalAmount + order.deliveryFee);

    // Prepare customer details
    const customerInfo = {
      name: customerDetails?.name || order.customerName || 'Customer',
      email: customerDetails?.email || order.customerEmail || 'customer@example.com',
      phone: customerDetails?.phone || order.customerPhone || '9999999999'
    };

    // Create Payment Link using official Cashfree Payment Links API
    let paymentLink;
    try {
      paymentLink = await createPaymentLink(
        totalAmount,
        orderId,
        {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        purpose || `Order Payment - ${orderId}`
      );
    } catch (plErr) {
      const msg = (plErr && plErr.message) ? plErr.message : '';
      const isFeatureDisabled = msg.includes('link_creation is not enabled') || msg.includes('feature_not_enabled');
      if (!isFeatureDisabled) throw plErr;
      // Fallback to UPI deep link so the order can continue
      const upiId = process.env.DEFAULT_UPI_ID || 'ranjith0707@ptaxis';
      paymentLink = await createUPIPaymentLink(
        totalAmount,
        orderId,
        {
          customerId: order.user?.toString() || orderId,
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        upiId
      );
      // Normalize keys to match Payment Links shape for response/storage below
      paymentLink = {
        cf_link_id: paymentLink.linkId,
        link_id: paymentLink.linkId,
        link_url: paymentLink.linkUrl,
        link_status: paymentLink.linkStatus,
        link_amount: paymentLink.amount,
        link_currency: paymentLink.currency
      };
    }

    // Update order with payment details (field-by-field to avoid nested cast issues)
    if (!order.payment) {
      order.payment = {};
    }
    order.payment.method = 'online';
    order.payment.status = 'pending';
    order.payment.amount = totalAmount;
    order.payment.gateway = 'cashfree';
    order.payment.paymentLink = paymentLink.link_url;
    order.payment.paymentLinkId = paymentLink.link_id;
    order.payment.cfLinkId = paymentLink.cf_link_id;
    if (!order.payment.refund || typeof order.payment.refund !== 'object') {
      order.payment.refund = { amount: 0 };
    }
    await order.save();

    // No manual SMS here. Cashfree will send SMS because link_notify.send_sms=true

    console.log('Payment link created:', paymentLink);

    res.json({
      success: true,
      cf_link_id: paymentLink.cf_link_id,
      link_id: paymentLink.link_id,
      link_url: paymentLink.link_url,
      link_status: paymentLink.link_status,
      link_amount: paymentLink.link_amount,
      link_currency: paymentLink.link_currency,
      link_qrcode: paymentLink.link_qrcode,
      orderId: orderId
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to create payment link', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Get available payment methods
async function getPaymentMethods(req, res) {
  try {
    const result = await getAvailablePaymentMethods();
    res.json(result);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods', error: error.message });
  }
}

module.exports = { 
  createCashfreeUPIOrder,
  createCashfreePaymentSession,
  verifyCashfreePayment,
  cashfreeWebhook,
  createPaymentLinkController,
  getPaymentMethods
};


