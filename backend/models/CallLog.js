const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema(
  {
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    campaignId: { type: String },
    providerStatus: { type: Number },
    providerMessage: { type: String },
    success: { type: Boolean, default: false },
    error: { type: String },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallLog', CallLogSchema);


