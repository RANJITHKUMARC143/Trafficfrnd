/*
  Backfill Earnings from completed orders.
  Usage: node scripts/backfillEarnings.js [--deliveryBoyId <id>]
*/

const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const Earnings = require('../models/Earnings');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Trafficfrnd';
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB for backfill');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--deliveryBoyId' && args[i + 1]) {
      params.deliveryBoyId = args[i + 1];
      i++;
    }
  }
  return params;
}

async function backfill({ deliveryBoyId } = {}) {
  const match = { status: 'completed', deliveryFee: { $gte: 0 } };
  if (deliveryBoyId) {
    match.deliveryBoyId = new mongoose.Types.ObjectId(deliveryBoyId);
  }

  const orders = await Order.find(match).select('_id deliveryBoyId deliveryFee totalAmount updatedAt');
  console.log(`Found ${orders.length} completed orders to check`);

  let created = 0;
  for (const order of orders) {
    const exists = await Earnings.exists({ orderId: order._id });
    if (exists) continue;
    const amount = typeof order.deliveryFee === 'number' ? order.deliveryFee : Math.max(0, Math.round((order.totalAmount || 0) * 0.1));
    await Earnings.create({
      deliveryBoyId: order.deliveryBoyId,
      orderId: order._id,
      amount,
      date: order.updatedAt || new Date(),
      hours: 0,
      status: 'Paid',
    });
    created++;
  }
  console.log(`Backfill complete. Created ${created} earnings records.`);
}

(async () => {
  try {
    const params = parseArgs();
    await connect();
    await backfill(params);
  } catch (e) {
    console.error('Backfill failed:', e);
    process.exitCode = 1;
  } finally {
    try { await mongoose.connection.close(); } catch {}
  }
})();


