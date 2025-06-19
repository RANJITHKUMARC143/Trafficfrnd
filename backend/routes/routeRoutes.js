const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const SelectedCheckpoint = require('../models/SelectedCheckpoint');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Invalid token' });
      }
      
      // Log the decoded token to see its structure
      console.log('Decoded token:', decoded);
      
      // Check if we have either userId or id in the token
      if (!decoded.userId && !decoded.id) {
        console.error('No userId or id in token');
        return res.status(403).json({ message: 'Invalid token: no user ID' });
      }

      // Use userId if available, otherwise use id
      req.user = { userId: decoded.userId || decoded.id };
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Save route and checkpoints
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Received route save request:', req.body);
    console.log('User from token:', req.user);
    
    const { startLocation, destination, checkpoints, distance, duration } = req.body;
    
    if (!startLocation || !destination || !Array.isArray(checkpoints)) {
      console.error('Invalid route data:', { startLocation, destination, checkpoints });
      return res.status(400).json({ message: 'Invalid route data' });
    }

    const route = new Route({
      user: req.user.userId, // This should now be properly set from the token
      startLocation,
      destination,
      checkpoints,
      distance,
      duration
    });

    console.log('Saving route:', route);
    const savedRoute = await route.save();
    console.log('Route saved successfully:', savedRoute);
    
    res.status(201).json({ message: 'Route saved successfully', route: savedRoute });
  } catch (error) {
    console.error('Route save error:', error);
    res.status(500).json({ 
      message: 'Error saving route', 
      error: error.message,
      details: error.errors // Include validation errors if any
    });
  }
});

// Get user's routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
});

// Select checkpoint
router.post('/:routeId/checkpoint', authenticateToken, async (req, res) => {
  try {
    const { checkpointId } = req.body;
    const route = await Route.findById(req.params.routeId);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const checkpoint = route.checkpoints.id(checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ message: 'Checkpoint not found in route' });
    }

    let selectedCheckpoint = await SelectedCheckpoint.findOne({
      user: req.user.userId,
      route: route._id
    });

    if (selectedCheckpoint) {
      selectedCheckpoint.checkpoint = checkpointId;
      selectedCheckpoint.status = 'pending';
      selectedCheckpoint.selectedAt = new Date();
    } else {
      selectedCheckpoint = new SelectedCheckpoint({
        user: req.user.userId,
        route: route._id,
        checkpoint: checkpointId
      });
    }

    await selectedCheckpoint.save();
    res.json({ message: 'Checkpoint selected successfully', selectedCheckpoint });
  } catch (error) {
    console.error('Select checkpoint error:', error);
    res.status(500).json({ message: 'Error selecting checkpoint', error: error.message });
  }
});

// Get selected checkpoint
router.get('/:routeId/selected-checkpoint', authenticateToken, async (req, res) => {
  try {
    const selectedCheckpoint = await SelectedCheckpoint.findOne({
      user: req.user.userId,
      route: req.params.routeId
    });

    if (!selectedCheckpoint) {
      return res.status(404).json({ message: 'No checkpoint selected for this route' });
    }

    // Fetch the route and find the checkpoint object
    const Route = require('../models/Route');
    const route = await Route.findById(selectedCheckpoint.route);
    let checkpointObj = null;
    if (route && selectedCheckpoint.checkpoint) {
      checkpointObj = route.checkpoints.id(selectedCheckpoint.checkpoint);
    }

    if (!checkpointObj) {
      return res.status(404).json({ message: 'Checkpoint object not found in route' });
    }

    // Return the selectedCheckpoint with the full checkpoint object
    res.json({ selectedCheckpoint: { ...selectedCheckpoint.toObject(), checkpoint: checkpointObj } });
  } catch (error) {
    console.error('Get selected checkpoint error:', error);
    res.status(500).json({ message: 'Error fetching selected checkpoint', error: error.message });
  }
});

// Update checkpoint status
router.put('/:routeId/checkpoint-status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'arrived', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const selectedCheckpoint = await SelectedCheckpoint.findOneAndUpdate(
      {
        user: req.user.userId,
        route: req.params.routeId
      },
      { status },
      { new: true }
    );

    if (!selectedCheckpoint) {
      return res.status(404).json({ message: 'Selected checkpoint not found' });
    }

    res.json({ message: 'Checkpoint status updated successfully', selectedCheckpoint });
  } catch (error) {
    console.error('Update checkpoint status error:', error);
    res.status(500).json({ message: 'Error updating checkpoint status', error: error.message });
  }
});

module.exports = router; 