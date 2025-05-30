const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

async function getAnalytics(req, res) {
  try {
    const vendorId = req.vendor._id;
    console.log('Fetching analytics for vendor:', vendorId);

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get orders for different time periods
    const [todayOrders, yesterdayOrders, lastWeekOrders, lastMonthOrders] = await Promise.all([
      Order.find({
        vendorId,
        timestamp: { $gte: today }
      }),
      Order.find({
        vendorId,
        timestamp: { $gte: yesterday, $lt: today }
      }),
      Order.find({
        vendorId,
        timestamp: { $gte: lastWeek }
      }),
      Order.find({
        vendorId,
        timestamp: { $gte: lastMonth }
      })
    ]);

    // Calculate metrics
    const metrics = {
      today: {
        revenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: todayOrders.length,
        averageOrderValue: todayOrders.length ? 
          todayOrders.reduce((sum, order) => sum + order.totalAmount, 0) / todayOrders.length : 0
      },
      yesterday: {
        revenue: yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: yesterdayOrders.length,
        averageOrderValue: yesterdayOrders.length ? 
          yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0) / yesterdayOrders.length : 0
      },
      lastWeek: {
        revenue: lastWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: lastWeekOrders.length,
        averageOrderValue: lastWeekOrders.length ? 
          lastWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0) / lastWeekOrders.length : 0
      },
      lastMonth: {
        revenue: lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: lastMonthOrders.length,
        averageOrderValue: lastMonthOrders.length ? 
          lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0) / lastMonthOrders.length : 0
      }
    };

    // Get top selling items
    const allOrders = await Order.find({ vendorId });
    const itemSales = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = {
            quantity: 0,
            revenue: 0
          };
        }
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Get order status distribution
    const statusDistribution = {
      pending: await Order.countDocuments({ vendorId, status: 'pending' }),
      preparing: await Order.countDocuments({ vendorId, status: 'preparing' }),
      ready: await Order.countDocuments({ vendorId, status: 'ready' }),
      completed: await Order.countDocuments({ vendorId, status: 'completed' }),
      cancelled: await Order.countDocuments({ vendorId, status: 'cancelled' })
    };

    // Get vendor rating
    const vendor = await Vendor.findById(vendorId);
    const rating = vendor.rating || 0;

    res.json({
      metrics,
      topSellingItems,
      statusDistribution,
      rating
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
}

module.exports = {
  getAnalytics
}; 