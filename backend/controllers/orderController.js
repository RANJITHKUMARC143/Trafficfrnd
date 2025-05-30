const Order = require('../models/Order');

// Get all orders for the authenticated vendor
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.vendor._id }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      vendorId: req.vendor._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, vendorId: req.vendor._id },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit real-time update
    req.app.get('io').to(req.vendor._id.toString()).emit('orderStatusUpdate', order);

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find({
      vendorId: req.vendor._id,
      status: req.params.status
    }).sort({ timestamp: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Error fetching orders by status', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus
}; 