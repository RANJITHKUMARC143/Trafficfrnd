// Usage: node backend/scripts/fixOrphanedPreparingOrders.js
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trafficfrnd';

async function fixOrphanedPreparingOrders() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await Order.updateMany(
    { status: 'preparing', $or: [ { deliveryBoyId: { $exists: false } }, { deliveryBoyId: null } ] },
    { $set: { status: 'confirmed' } }
  );
  console.log(`Updated ${result.nModified || result.modifiedCount} orphaned 'preparing' orders to 'confirmed'.`);
  await mongoose.disconnect();
}

fixOrphanedPreparingOrders().catch(err => {
  console.error('Error running fixOrphanedPreparingOrders:', err);
  process.exit(1);
}); 