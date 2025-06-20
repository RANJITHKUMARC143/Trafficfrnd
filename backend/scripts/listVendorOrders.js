// Script to list all orders for a given vendorId
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trafficfrnd';

async function listVendorOrders(vendorId) {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const orders = await Order.find({ vendorId: new mongoose.Types.ObjectId(vendorId) });
  console.log(`Found ${orders.length} orders for vendor ${vendorId}`);
  for (const order of orders) {
    console.log(`Order ID: ${order._id}, Status: ${order.status}, Total: ${order.totalAmount}, Timestamp: ${order.timestamp}`);
  }

  await mongoose.disconnect();
}

const vendorId = process.argv[2];
if (!vendorId) {
  console.error('Usage: node listVendorOrders.js <vendorId>');
  process.exit(1);
}

listVendorOrders(vendorId).catch(err => {
  console.error('Error listing vendor orders:', err);
  process.exit(1);
}); 