const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Auth middleware - Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    console.log('Auth middleware - Token decoded:', decoded);

    if (!decoded.vendorId) {
      console.log('Auth middleware - No vendorId in token');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    console.log('Auth middleware - Finding vendor:', decoded.vendorId);
    const vendor = await Vendor.findById(decoded.vendorId);

    if (!vendor) {
      console.log('Auth middleware - Vendor not found');
      return res.status(401).json({ message: 'Vendor not found' });
    }

    if (vendor.status !== 'active') {
      console.log('Auth middleware - Vendor not active:', vendor.status);
      return res.status(403).json({ message: 'Account is not active' });
    }

    console.log('Auth middleware - Authentication successful');
    req.token = token;
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

module.exports = auth; 