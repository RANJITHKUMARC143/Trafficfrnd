const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findOne({ _id: decoded.vendorId });

    if (!vendor) {
      return res.status(401).json({ message: 'Vendor not found' });
    }

    if (vendor.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.token = token;
    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth; 