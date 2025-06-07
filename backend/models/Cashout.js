const mongoose = require('mongoose');

const cashoutSchema = new mongoose.Schema({
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cashout', cashoutSchema); 