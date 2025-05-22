const mongoose = require('mongoose');

const checkpointProgressSchema = new mongoose.Schema({
  checkpointId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['pending', 'arrived', 'skipped', 'completed'], default: 'pending' },
  updatedAt: { type: Date, default: Date.now }
});

const userRouteSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
  },
  destination: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }
  },
  selectedCheckpoints: [{ type: mongoose.Schema.Types.ObjectId }], // subset of route.checkpoints
  checkpointProgress: [checkpointProgressSchema], // progress for each checkpoint
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('UserRouteSession', userRouteSessionSchema); 