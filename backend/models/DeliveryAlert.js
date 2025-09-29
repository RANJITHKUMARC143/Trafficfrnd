const mongoose = require('mongoose');

const deliveryAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'order-update'],
    default: 'info'
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Post-save hook to send a push notification to the alert's delivery boy
try {
  const push = require('../services/pushService');
  deliveryAlertSchema.post('save', async function(doc) {
    try {
      if (!doc || !doc.deliveryBoyId) return; // only push delivery-specific alerts
      const title = doc.title || 'Notification';
      const body = doc.message || '';
      const data = { type: doc.type || 'info', deliveryAlertId: String(doc._id) };
      if (typeof push.sendToDeliveryBoy === 'function') {
        await push.sendToDeliveryBoy(doc.deliveryBoyId, title, body, data);
      }
    } catch (e) {
      console.warn('DeliveryAlert post-save push error:', e?.message || e);
    }
  });
} catch (e) {
  // ignore require errors in environments without push service
}

module.exports = mongoose.model('DeliveryAlert', deliveryAlertSchema);


