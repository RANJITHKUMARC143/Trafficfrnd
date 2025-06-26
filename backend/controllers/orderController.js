const Order = require('../models/Order');
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const fetch = require('node-fetch');
const Earnings = require('../models/Earnings');

async function sendExpoPushNotification(expoPushToken, message, data) {
  if (!expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: data || {},
      priority: 'high',
    }),
  });
}

// Get all orders for the authenticated vendor
const getOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request! req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const orders = await Order.find({ vendorId: req.user._id }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    console.log('[BACKEND] getOrderById called with orderId:', req.params.orderId, 'vendorId:', req.user && req.user._id);
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request!');
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const order = await Order.findOne({
      _id: req.params.orderId,
      vendorId: req.user._id
    });

    if (!order) {
      console.log('[BACKEND] Order not found for orderId:', req.params.orderId, 'vendorId:', req.user._id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('[BACKEND] Order found:', order);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request!');
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, vendorId: req.user._id },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('orderStatusUpdate', order);

    // Notify user
    const user = await User.findById(order.user);
    if (user && user.expoPushToken) {
      await sendExpoPushNotification(
        user.expoPushToken,
        { title: 'Order Update', body: `Your order status is now: ${status}` },
        { orderId: order._id, status }
      );
    }

    // Create Earnings record if order is completed and not already present
    if (status === 'completed' && order.deliveryBoyId) {
      const existingEarning = await Earnings.findOne({ orderId: order._id });
      if (!existingEarning) {
        await Earnings.create({
          deliveryBoyId: order.deliveryBoyId,
          orderId: order._id,
          amount: order.totalAmount,
          hours: 1, // You may want to calculate actual hours
          date: new Date(),
          status: 'completed',
        });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request!');
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const orders = await Order.find({
      vendorId: req.user._id,
      status: req.params.status
    }).sort({ timestamp: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Error fetching orders by status', error: error.message });
  }
};

// Create a new order (user)
const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, vendorId, deliveryAddress, specialInstructions, vehicleNumber, routeId } = req.body;
    const customerName = req.user.name || req.user.username;

    if (!vendorId) {
      return res.status(400).json({ message: 'vendorId is required' });
    }
    if (!vehicleNumber) {
      return res.status(400).json({ message: 'vehicleNumber is required' });
    }
    if (!routeId) {
      return res.status(400).json({ message: 'routeId is required' });
    }

    // Convert vendorId and routeId to ObjectId if they're strings
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const routeObjectId = new mongoose.Types.ObjectId(routeId);

    const order = new Order({
      vendorId: vendorObjectId,
      routeId: routeObjectId,
      customerName,
      items,
      totalAmount,
      status: 'pending',
      deliveryAddress,
      specialInstructions,
      vehicleNumber,
      timestamp: new Date(),
      updatedAt: new Date(),
      user: req.user._id,
    });

    await order.save();
    console.log('Order created:', order);

    // Notify vendor
    const vendor = await Vendor.findById(vendorId);
    if (vendor && vendor.expoPushToken) {
      await sendExpoPushNotification(
        vendor.expoPushToken,
        { title: 'New Order', body: `You have a new order from ${customerName}` },
        { orderId: order._id }
      );
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get all orders for the authenticated user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus,
  createOrder,
  getUserOrders,
}; 