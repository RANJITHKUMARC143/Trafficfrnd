const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, default: '' }
}, { _id: false });

const journeySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentLocation: locationSchema,
  finalDestination: locationSchema,
  checkpoints: {
    type: [locationSchema],
    validate: [arr => arr.length === 3, 'Exactly 3 checkpoints required']
  },
  selectedCheckpoint: { type: Number, min: 0, max: 2 }, // index of checkpoints array
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Journey', journeySchema); 