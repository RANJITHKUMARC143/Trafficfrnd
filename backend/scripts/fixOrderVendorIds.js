// Script to fix vendorId type in all orders
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trafficfrnd';

async function fixVendorIds() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const orders = await Order.find({});
  let fixedCount = 0;

  for (const order of orders) {
    if (order.vendorId && typeof order.vendorId === 'string') {
      order.vendorId = mongoose.Types.ObjectId(order.vendorId);
      await order.save();
      fixedCount++;
      console.log(`Fixed order ${order._id}: vendorId set to ObjectId`);
    }
  }

  console.log(`Done. Fixed ${fixedCount} orders.`);
  await mongoose.disconnect();
}

fixVendorIds().catch(err => {
  console.error('Error fixing vendorIds:', err);
  process.exit(1);
}); 