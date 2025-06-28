const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOrders, getOrderById, updateOrderStatus, getOrdersByStatus } = require('../controllers/orderController');
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
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
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

// Get a specific order by ID
router.get('/:orderId', auth, getOrderById);

// Update order status
router.patch('/:orderId/status', auth, updateOrderStatus);

// Get orders by status
router.get('/status/:status', auth, getOrdersByStatus);

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

module.exports = router; 