const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Post-save hook to send a push notification to the alert's user
try {
  const push = require('../services/pushService');
  alertSchema.post('save', async function(doc) {
    try {
      if (!doc || !doc.userId) return; // only push user-specific alerts
      const title = doc.title || 'Notification';
      const body = doc.message || '';
      const data = { type: doc.type || 'info', alertId: String(doc._id) };
      await push.sendToUser(doc.userId, title, body, data);
    } catch (e) {
      console.warn('Alert post-save push error:', e?.message || e);
    }
  });
} catch (e) {
  // ignore require errors in environments without push service
}

module.exports = mongoose.model('Alert', alertSchema);