const express = require('express');
const router = express.Router();
const DeliveryPoint = require('../models/DeliveryPoint');

// Get all (optionally by route)
router.get('/', async (req, res) => {
  const { route } = req.query;
  const filter = route ? { route } : {};
  const points = await DeliveryPoint.find(filter);
  res.json(points);
});

// Add
router.post('/', async (req, res) => {
  const point = new DeliveryPoint(req.body);
  await point.save();
  res.status(201).json(point);
});

// Update
router.put('/:id', async (req, res) => {
  const point = await DeliveryPoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(point);
});

// Delete
router.delete('/:id', async (req, res) => {
  await DeliveryPoint.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router; 