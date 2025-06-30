const express = require('express');
const router = express.Router();
const Journey = require('../models/Journey');
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

// Save or update journey
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('Received journey save request:', req.body);
    console.log('User from token:', req.user);
    console.log('Requested user ID:', req.params.userId);
    
    // Use the user ID from the token
    const userId = req.user.userId;
    
    if (userId !== req.params.userId) {
      console.error('User ID mismatch:', { tokenUserId: userId, requestedUserId: req.params.userId });
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { currentLocation, finalDestination } = req.body;
    
    if (!currentLocation || !finalDestination) {
      console.error('Invalid journey data:', { currentLocation, finalDestination });
      return res.status(400).json({ message: 'Invalid journey data' });
    }

    let journey = await Journey.findOne({ user: userId });
    
    if (journey) {
      journey.currentLocation = currentLocation;
      journey.finalDestination = finalDestination;
      journey.updatedAt = new Date();
    } else {
      journey = new Journey({
        user: userId,
        currentLocation,
        finalDestination
      });
    }

    console.log('Saving journey:', journey);
    const savedJourney = await journey.save();
    console.log('Journey saved successfully:', savedJourney);
    
    res.json({ message: 'Journey saved', journey: savedJourney });
  } catch (error) {
    console.error('Journey save error:', error);
    res.status(500).json({ 
      message: 'Error saving journey', 
      error: error.message,
      details: error.errors // Include validation errors if any
    });
  }
});

// Get journey
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const journey = await Journey.findOne({ user: req.params.userId });
    
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    res.json(journey);
  } catch (error) {
    console.error('Journey fetch error:', error);
    res.status(500).json({ message: 'Error fetching journey', error: error.message });
  }
});

module.exports = router; 