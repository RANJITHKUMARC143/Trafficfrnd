const mongoose = require('mongoose');

const deliveryPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' }, // optional: link to route
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliveryPoint', deliveryPointSchema); 