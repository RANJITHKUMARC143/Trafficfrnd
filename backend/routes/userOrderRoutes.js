const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, getUserOrders, getOrderById } = require('../controllers/orderController');

// Create a new order (user)
router.post('/', auth, createOrder);

// Get all orders for the authenticated user
router.get('/user', auth, getUserOrders);

// Get a specific order by ID (user)
router.get('/:orderId', auth, getOrderById);

module.exports = router; 