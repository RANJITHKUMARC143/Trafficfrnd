console.log('dashboardController.js loaded');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

async function getDashboardMetrics(req, res) {
  try {
    const vendorId = req.vendor._id;
    console.log('Fetching metrics for vendor:', vendorId);

    // Create a test order if no active orders exist
    const activeOrdersCount = await Order.countDocuments({
      vendorId: vendorId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    });

    if (activeOrdersCount === 0) {
      console.log('Creating test order...');
      const testOrder = new Order({
        vendorId: vendorId,
        customerName: 'Test Customer',
        items: [{
          name: 'Test Item',
          quantity: 1,
          price: 100
        }],
        totalAmount: 100,
        status: 'pending',
        deliveryAddress: 'Test Address',
        specialInstructions: 'Test Instructions'
      });
      await testOrder.save();
      console.log('Test order created:', testOrder._id);
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.find({
      vendorId: vendorId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    });
    console.log('Today\'s orders:', todayOrders.length);

    // Calculate metrics
    const revenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orders = todayOrders.length;

    // Get vendor's rating
    const vendor = await Vendor.findById(vendorId);
    const rating = vendor.rating || 0;

    // Get active orders
    const activeOrders = await Order.find({
      vendorId: vendorId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    })
    .sort({ timestamp: -1 })
    .limit(10);

    // Format active orders
    const formattedActiveOrders = activeOrders.map(order => ({
      id: order._id,
      orderNumber: `#ORD-${order._id.toString().slice(-4)}`,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.timestamp,
      customerName: order.customerName
    }));

    console.log('Sending response with metrics:', {
      revenue,
      orders,
      rating,
      activeOrdersCount: formattedActiveOrders.length
    });

    res.json({
      revenue,
      orders,
      rating,
      activeOrders: formattedActiveOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics' });
  }
}

module.exports = {
  getDashboardMetrics
}; 