const express = require('express');
const router = express.Router();
const UserRouteSession = require('../models/UserRouteSession');
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

// Create or update a user's route session
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('Received route session save request:', req.body);
    console.log('User from token:', req.user);
    console.log('Requested user ID:', req.params.userId);
    
    // Use the user ID from the token
    const userId = req.user.userId;
    
    if (userId !== req.params.userId) {
      console.error('User ID mismatch:', { tokenUserId: userId, requestedUserId: req.params.userId });
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { route, currentLocation, destination, selectedCheckpoints } = req.body;
    
    if (!route || !currentLocation || !destination) {
      console.error('Invalid route session data:', { route, currentLocation, destination });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let session = await UserRouteSession.findOne({ user: userId, route });
    
    if (session) {
      session.currentLocation = currentLocation;
      session.destination = destination;
      session.selectedCheckpoints = selectedCheckpoints || [];
      session.updatedAt = new Date();
    } else {
      session = new UserRouteSession({
        user: userId,
        route,
        currentLocation,
        destination,
        selectedCheckpoints: selectedCheckpoints || []
      });
    }

    console.log('Saving route session:', session);
    const savedSession = await session.save();
    console.log('Route session saved successfully:', savedSession);
    
    res.json({ message: 'Route session saved', session: savedSession });
  } catch (error) {
    console.error('Route session save error:', error);
    res.status(500).json({ 
      message: 'Error saving route session', 
      error: error.message,
      details: error.errors // Include validation errors if any
    });
  }
});

// Get user's route session
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const session = await UserRouteSession.findOne({ user: req.params.userId });
    
    if (!session) {
      return res.status(404).json({ message: 'Route session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Route session fetch error:', error);
    res.status(500).json({ message: 'Error fetching route session', error: error.message });
  }
});

module.exports = router; 