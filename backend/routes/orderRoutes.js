console.log('[DEBUG] orderRoutes.js loaded');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOrders, getOrderById, updateOrderStatus, getOrdersByStatus, createOrder, getAvailableOrders, startTowardsDeliveryPoint } = require('../controllers/orderController');
const { quoteDeliveryFee } = require('../services/quoteService');
const Order = require('../models/Order');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const DeliveryBoy = require('../models/DeliveryBoy');
const Alert = require('../models/Alert');
const DeliveryAlert = require('../models/DeliveryAlert');

// --- ADMIN ORDER MANAGEMENT ENDPOINTS ---
// List all orders (admin)
router.get('/admin', auth, async (req, res) => {
  try {
    const { vendorId } = req.query;
    let query = {};
    
    // If vendorId is provided, filter by vendor
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    const orders = await Order.find(query)
      .populate('vendorId', 'businessName')
      .populate('deliveryBoyId', 'fullName')
      .populate('routeId', 'name')
      .sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all orders', error: error.message });
  }
});
// Get order by ID (admin)
router.get('/admin/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('vendorId', 'businessName')
      .populate('deliveryBoyId', 'fullName')
      .populate('routeId', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});
// Update order status (admin)
router.patch('/admin/:orderId/status', auth, async (req, res) => {
  try {
    console.log('PATCH /admin/:orderId/status called by user:', req.user);
    let { status } = req.body;
    if (status === 'preparing') status = 'confirmed';
    // Only allow admin or super_admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Forbidden: Only admins can update order status' });
    }
    const prev = await Order.findById(req.params.orderId);
    if (!prev) return res.status(404).json({ message: 'Order not found' });
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Emit real-time notifications for admin actions as well
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('adminOrderStatusUpdated', { orderId: String(order._id), status: order.status });
        io.emit('adminEvent', {
          action: 'status_changed',
          orderId: String(order._id),
          from: prev.status,
          to: order.status,
          at: new Date().toISOString(),
          by: 'admin'
        });
        // Notify assigned delivery boy via socket
        if (order.deliveryBoyId) {
          io.to(`deliveryBoy:${String(order.deliveryBoyId)}`).emit('deliveryNotification', {
            type: 'order-update',
            orderId: String(order._id),
            title: 'Order Status Updated',
            message: `Order #${String(order._id).slice(-8)} is now ${order.status}`
          });
        }
      }
    } catch (e) {
      console.warn('Admin status emit failed:', e?.message || e);
    }
    // Create user alert for admin-driven status changes as well
    try {
      const statusTextMap = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        enroute: 'On the way',
        ready: 'Ready for pickup',
        completed: 'Delivered',
        cancelled: 'Cancelled'
      };
      const created = await Alert.create({
        title: 'Order Update',
        message: `Order #${String(order._id).slice(-8)}: ${statusTextMap[order.status] || order.status}`,
        type: 'order-update',
        userId: order.user,
      });
      console.log('[ALERT] Admin status alert created:', created && created._id, 'for user', String(order.user), 'order', String(order._id), 'status', order.status);
    } catch (e) {
      console.warn('Admin status alert failed:', e?.message || e);
    }
    // Create delivery alert for assigned driver
    try {
      if (order.deliveryBoyId) {
        const statusTextMapDriver = {
          pending: 'Pending',
          confirmed: 'Confirmed',
          preparing: 'Preparing',
          enroute: 'On the way',
          ready: 'Ready for pickup',
          completed: 'Delivered',
          cancelled: 'Cancelled'
        };
        await DeliveryAlert.create({
          title: 'Order Update',
          message: `Order #${String(order._id).slice(-8)}: ${statusTextMapDriver[order.status] || order.status}`,
          type: 'order-update',
          deliveryBoyId: order.deliveryBoyId,
        });
      }
    } catch (e) {
      console.warn('Admin driver alert (status) failed:', e?.message || e);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});
// Delete order (admin)
router.delete('/admin/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully', id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

// Assign order to a delivery boy (admin)
router.post('/admin/:orderId/assign', auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Forbidden: Only admins can assign' });
    }
    const { deliveryBoyId } = req.body || {};
    if (!deliveryBoyId) return res.status(400).json({ message: 'deliveryBoyId is required' });
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.deliveryBoyId = deliveryBoyId;
    if (!order.status || order.status === 'pending') order.status = 'confirmed';
    order.updatedAt = Date.now();
    await order.save();
    // Alert new driver
    try {
      await DeliveryAlert.create({
        title: 'Order Assigned',
        message: `You have been assigned order #${String(order._id).slice(-8)}`,
        type: 'order-update',
        deliveryBoyId: order.deliveryBoyId,
      });
      const io = req.app.get('io');
      if (io) {
        io.to(`deliveryBoy:${String(order.deliveryBoyId)}`).emit('deliveryNotification', {
          type: 'order-update',
          orderId: String(order._id),
          title: 'Order Assigned',
          message: `You have been assigned order #${String(order._id).slice(-8)}`
        });
      }
    } catch (e) { console.warn('Assign alert failed:', e?.message || e); }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning order', error: error.message });
  }
});

// Reassign order to a different delivery boy (admin)
router.post('/admin/:orderId/reassign', auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Forbidden: Only admins can reassign' });
    }
    const { deliveryBoyId } = req.body || {};
    if (!deliveryBoyId) return res.status(400).json({ message: 'deliveryBoyId is required' });
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const oldDriverId = order.deliveryBoyId ? String(order.deliveryBoyId) : null;
    order.deliveryBoyId = deliveryBoyId;
    order.updatedAt = Date.now();
    await order.save();
    const io = req.app.get('io');
    // Alert old driver
    try {
      if (oldDriverId) {
        await DeliveryAlert.create({
          title: 'Order Reassigned',
          message: `Order #${String(order._id).slice(-8)} has been reassigned`,
          type: 'info',
          deliveryBoyId: oldDriverId,
        });
        if (io) io.to(`deliveryBoy:${oldDriverId}`).emit('deliveryNotification', { type: 'info', orderId: String(order._id), title: 'Order Reassigned', message: 'This order has been reassigned.' });
      }
    } catch (e) { console.warn('Old driver alert failed:', e?.message || e); }
    // Alert new driver
    try {
      await DeliveryAlert.create({
        title: 'New Order Assigned',
        message: `You have been assigned order #${String(order._id).slice(-8)}`,
        type: 'order-update',
        deliveryBoyId: order.deliveryBoyId,
      });
      if (io) io.to(`deliveryBoy:${String(order.deliveryBoyId)}`).emit('deliveryNotification', { type: 'order-update', orderId: String(order._id), title: 'New Order Assigned', message: `You have been assigned order #${String(order._id).slice(-8)}` });
    } catch (e) { console.warn('New driver alert failed:', e?.message || e); }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Error reassigning order', error: error.message });
  }
});

// Add admin note/message to assigned driver
router.post('/admin/:orderId/note', auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Forbidden: Only admins can add notes' });
    }
    const { title, message, type } = req.body || {};
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.deliveryBoyId) return res.status(400).json({ message: 'No delivery boy assigned' });
    const alert = await DeliveryAlert.create({
      title: title || 'Admin Message',
      message: message || 'You have a message regarding this order',
      type: type || 'info',
      deliveryBoyId: order.deliveryBoyId,
    });
    const io = req.app.get('io');
    if (io) io.to(`deliveryBoy:${String(order.deliveryBoyId)}`).emit('deliveryNotification', { type: alert.type, orderId: String(order._id), title: alert.title, message: alert.message });
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Get all orders for the authenticated vendor
router.get('/', auth, getOrders);

// Update order status
router.patch('/:orderId/status', auth, (req, res, next) => {
  console.log('[BACKEND] PATCH /api/orders/:orderId/status called for orderId:', req.params.orderId, 'by user:', req.user && req.user._id);
  next();
}, updateOrderStatus);

// Get orders by status
router.get('/status/:status', auth, getOrdersByStatus);

// Get available (unassigned, pending) orders for delivery boys
router.get('/available', auth, (req, res, next) => {
  console.log('HIT /orders/available');
  next();
}, getAvailableOrders);

// Get a specific order by ID
router.get('/:orderId', auth, async (req, res) => {
  console.log('HIT /orders/:orderId', req.params.orderId);
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('deliveryBoyId', 'fullName phone vehicleType vehicleNumber rating totalDeliveries onTimeRate currentLocation')
      .populate('vendorId', 'businessName phone address location')
      .populate('user', 'name email phone');
    console.log('Order found:', order);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get detailed order information (admin)
router.get('/admin/:orderId/details', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('vendorId', 'businessName ownerName email phone address')
      .populate('deliveryBoyId', 'fullName email phone vehicleType vehicleNumber currentLocation')
      .populate('routeId', 'startLocation destination checkpoints distance duration')
      .populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
});

// Create a new order
router.post('/', auth, createOrder);

// Quote delivery fee (distance user -> delivery point) — public for preview
router.post('/quote', quoteDeliveryFee);

// Admin create order (same handler; supports userId in body)
router.post('/admin', auth, (req, res, next) => {
  // Only admins or super_admins may use this explicit admin endpoint
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
}, createOrder);

// Driver starts movement towards selected delivery point (Let's Go)
router.post('/:orderId/checkpoint', auth, startTowardsDeliveryPoint);

module.exports = router; 