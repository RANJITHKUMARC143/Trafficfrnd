console.log('[DEBUG] orderRoutes.js loaded');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOrders, getOrderById, updateOrderStatus, getOrdersByStatus, createOrder, getAvailableOrders } = require('../controllers/orderController');
const { quoteDeliveryFee } = require('../services/quoteService');
const Order = require('../models/Order');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const DeliveryBoy = require('../models/DeliveryBoy');

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
    const { status } = req.body;
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
      }
    } catch (e) {
      console.warn('Admin status emit failed:', e?.message || e);
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

module.exports = router; 