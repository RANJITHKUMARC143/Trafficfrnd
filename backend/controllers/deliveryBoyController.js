const DeliveryBoy = require('../models/DeliveryBoy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Earnings = require('../models/Earnings');
const Cashout = require('../models/Cashout');

// Register a new delivery boy
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const {
      fullName,
      email,
      phone,
      password,
      vehicleType,
      vehicleNumber
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password || !vehicleType || !vehicleNumber) {
      console.log('Missing required fields:', { fullName, email, phone, password: !!password, vehicleType, vehicleNumber });
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if delivery boy already exists
    console.log('Checking for existing delivery boy...');
    const existingDeliveryBoy = await DeliveryBoy.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingDeliveryBoy) {
      console.log('Delivery boy already exists with email or phone:', { email, phone });
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already registered'
      });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new delivery boy
    console.log('Creating new delivery boy...');
    const deliveryBoy = new DeliveryBoy({
      fullName,
      email,
      phone,
      password: hashedPassword,
      vehicleType,
      vehicleNumber,
      role: 'delivery'
    });

    console.log('Saving delivery boy to database...');
    await deliveryBoy.save();
    console.log('Delivery boy saved successfully');

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: deliveryBoy._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    console.log('Registration successful, sending response...');
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      deliveryBoy: deliveryBoy.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login delivery boy
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find delivery boy
    const deliveryBoy = await DeliveryBoy.findOne({ email, role: 'delivery' });
    if (!deliveryBoy) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if delivery boy is active
    if (deliveryBoy.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: deliveryBoy._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      deliveryBoy: deliveryBoy.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get delivery boy profile
exports.getProfile = async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user._id)
      .select('-password')
      .lean();

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    // Add real-time data
    const profile = {
      ...deliveryBoy,
      isOnline: deliveryBoy.status === 'active',
      currentLocation: deliveryBoy.currentLocation || { type: 'Point', coordinates: [0, 0] },
      stats: {
        totalDeliveries: deliveryBoy.totalDeliveries || 0,
        rating: deliveryBoy.rating || 0,
        onTimeRate: deliveryBoy.onTimeRate || 0,
        acceptanceRate: deliveryBoy.acceptanceRate || 0,
        cancellationRate: deliveryBoy.cancellationRate || 0
      },
      earnings: deliveryBoy.earnings || {
        total: 0,
        monthly: 0,
        weekly: 0,
        lastPayout: null
      },
      documents: deliveryBoy.documents || {
        license: { number: '', expiryDate: null, verified: false },
        insurance: { policyNumber: '', expiryDate: null, verified: false },
        idProof: { type: '', number: '', verified: false }
      },
      bankDetails: deliveryBoy.bankDetails || {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        verified: false
      },
      preferences: deliveryBoy.preferences || {
        language: 'English',
        notifications: true,
        emergencyContact: null
      },
      lastUpdated: new Date().toISOString()
    };

    // Log profile view activity
    await DeliveryBoy.findByIdAndUpdate(req.user._id, {
      $push: {
        activityLog: {
          action: 'PROFILE_VIEW',
          timestamp: new Date(),
          details: { ip: req.ip }
        }
      }
    });

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

// Update delivery boy profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'fullName', 'phone', 'address', 'documents', 'bankDetails', 
      'preferences', 'vehicleType', 'vehicleNumber'
    ];

    // Filter out non-allowed updates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      { 
        $set: filteredUpdates,
        $push: {
          activityLog: {
            action: 'PROFILE_UPDATE',
            timestamp: new Date(),
            details: { updatedFields: Object.keys(filteredUpdates) }
          }
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      deliveryBoy: deliveryBoy.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update delivery boy location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          lastUpdated: new Date()
        },
        $push: {
          activityLog: {
            action: 'LOCATION_UPDATE',
            timestamp: new Date(),
            details: { latitude, longitude }
          }
        }
      },
      { new: true }
    ).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      deliveryBoy: deliveryBoy.getPublicProfile()
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const status = isOnline ? 'active' : 'inactive';

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      {
        status,
        $push: {
          activityLog: {
            action: 'STATUS_UPDATE',
            timestamp: new Date(),
            details: { status }
          }
        }
      },
      { new: true }
    ).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      deliveryBoy: deliveryBoy.getPublicProfile()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 

// Get earnings summary
exports.getEarningsSummary = async (req, res) => {
  try {
    const { timeframe = 'daily' } = req.query;
    const deliveryBoyId = req.user.id;

    // Get earnings data from database
    const earnings = await Earnings.find({
      deliveryBoyId,
      createdAt: {
        $gte: getTimeframeDate(timeframe)
      }
    });

    // Calculate summary
    const summary = {
      current: earnings.reduce((sum, e) => sum + e.amount, 0),
      previous: 0, // TODO: Calculate previous period earnings
      deliveries: earnings.length,
      hours: earnings.reduce((sum, e) => sum + e.hours, 0),
      data: earnings.map(e => ({
        date: e.date,
        amount: e.amount
      }))
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting earnings summary:', error);
    res.status(500).json({ message: 'Error getting earnings summary' });
  }
};

// Get earnings history
exports.getEarningsHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const deliveryBoyId = req.user.id;

    const earnings = await Earnings.find({ deliveryBoyId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Earnings.countDocuments({ deliveryBoyId });

    res.json({
      earnings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting earnings history:', error);
    res.status(500).json({ message: 'Error getting earnings history' });
  }
};

// Request cashout
exports.requestCashout = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const { amount } = req.body;

    // Create cashout request
    const cashout = new Cashout({
      deliveryBoyId,
      amount,
      status: 'pending'
    });

    await cashout.save();

    res.json({ message: 'Cashout request submitted successfully' });
  } catch (error) {
    console.error('Error requesting cashout:', error);
    res.status(500).json({ message: 'Error requesting cashout' });
  }
};

// Helper function to get date based on timeframe
function getTimeframeDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case 'daily':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'weekly':
      return new Date(now.setDate(now.getDate() - 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() - 1));
    default:
      return new Date(now.setHours(0, 0, 0, 0));
  }
} 