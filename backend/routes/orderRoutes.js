const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOrders, getOrderById, updateOrderStatus, getOrdersByStatus } = require('../controllers/orderController');

// Get all orders for the authenticated vendor
router.get('/', auth, getOrders);

// Get a specific order by ID
router.get('/:orderId', auth, getOrderById);

// Update order status
router.patch('/:orderId/status', auth, updateOrderStatus);

// Get orders by status
router.get('/status/:status', auth, getOrdersByStatus);

module.exports = router; 