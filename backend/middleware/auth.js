const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const DeliveryBoy = require('../models/DeliveryBoy');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Raw Authorization header:', req.header('Authorization'));
    console.log('Auth middleware - Token after replace:', token);
    
    if (!token || token === 'null' || token === 'undefined' || token.split('.').length !== 3) {
      console.log('Auth middleware - No valid token provided (final check)');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Auth middleware - Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);

    let user = null;
    if (decoded.vendorId) {
      console.log('Auth middleware - Finding vendor:', decoded.vendorId);
      user = await Vendor.findById(decoded.vendorId);
      if (user) {
        req.vendor = user;
      }
    } else if (decoded.id) {
      console.log('Auth middleware - Finding delivery boy:', decoded.id);
      user = await DeliveryBoy.findById(decoded.id);
      if (user && user.status && user.status !== 'active' && user.status !== 'approved') {
        console.log('Auth middleware - Delivery boy not active/approved:', user.status);
        return res.status(403).json({ message: 'Account is not active or approved' });
      }
    } else if (decoded.userId) {
      console.log('Auth middleware - Finding user:', decoded.userId);
      user = await User.findById(decoded.userId);
    }

    if (!user) {
      console.log('Auth middleware - User (Vendor, Delivery Boy, or User) not found');
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    console.log('Auth middleware - Authentication successful for user ID:', user._id);
    req.token = token;
    req.user = user;
    // Update lastActive for the user
    if (decoded.userId) {
      await User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() });
    }
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.message === 'Account is not active or approved') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

module.exports = auth; 