const mongoose = require('mongoose');

const selectedCheckpointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  checkpoint: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'arrived', 'completed'],
    default: 'pending'
  }
});

module.exports = mongoose.model('SelectedCheckpoint', selectedCheckpointSchema); 