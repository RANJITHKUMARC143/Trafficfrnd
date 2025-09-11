const express = require('express');
const router = express.Router();

// In-memory storage for settings (in production, use a database)
let settings = {
  phoneNumber: '+91-9876543210'
};

// GET phone number setting
router.get('/phone-number', (req, res) => {
  try {
    res.json({
      success: true,
      phoneNumber: settings.phoneNumber
    });
  } catch (error) {
    console.error('Error getting phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get phone number setting'
    });
  }
});

// PUT phone number setting
router.put('/phone-number', (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    settings.phoneNumber = phoneNumber;
    
    res.json({
      success: true,
      message: 'Phone number updated successfully',
      phoneNumber: settings.phoneNumber
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update phone number setting'
    });
  }
});

module.exports = router;
