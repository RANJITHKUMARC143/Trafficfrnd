const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Vendor routes are working' });
});

// Register new vendor
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { businessName, ownerName, email, phone, password } = req.body;

    // Validate required fields
    if (!businessName || !ownerName || !email || !phone || !password) {
      console.log('Missing required fields:', { businessName, ownerName, email, phone, password: !!password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      console.log('Vendor already exists with email:', email);
      return res.status(400).json({ message: 'Vendor already exists' });
    }

    // Create new vendor
    const vendor = new Vendor({
      businessName,
      ownerName,
      email,
      phone,
      password,
      role: 'vendor'
    });

    console.log('Attempting to save vendor:', { 
      businessName, 
      ownerName, 
      email, 
      phone, 
      role: 'vendor' 
    });

    await vendor.save();
    console.log('Vendor saved successfully');

    // Generate JWT token
    const token = jwt.sign(
      { 
        vendorId: vendor._id,
        role: vendor.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here', // Fallback for development
      { expiresIn: '7d' }
    );

    console.log('JWT token generated successfully');

    res.status(201).json({
      message: 'Vendor registered successfully',
      token,
      vendor: vendor.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login vendor
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find vendor by email
    const vendor = await Vendor.findOne({ email, role: 'vendor' });
    if (!vendor) {
      console.log('No vendor found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for vendor:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if vendor is active
    if (vendor.status !== 'active') {
      console.log('Inactive vendor account:', email);
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        vendorId: vendor._id,
        role: vendor.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here', // Fallback for development
      { expiresIn: '7d' }
    );

    console.log('Login successful for vendor:', email);

    res.json({
      message: 'Login successful',
      token,
      vendor: vendor.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get vendor profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for vendor:', req.vendor._id);
    const vendor = await Vendor.findById(req.vendor._id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const profile = vendor.getPublicProfile();
    // Transform businessHours to openingHours for frontend compatibility
    if (profile.businessHours) {
      profile.openingHours = profile.businessHours;
      delete profile.businessHours;
    }
    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update vendor profile
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Updating profile for vendor:', req.vendor._id);
    const updates = req.body;
    const vendor = await Vendor.findById(req.vendor._id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Transform openingHours to businessHours for backend compatibility
    if (updates.openingHours) {
      updates.businessHours = updates.openingHours;
      delete updates.openingHours;
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== 'email' && key !== 'role' && key !== 'status') {
        vendor[key] = updates[key];
      }
    });

    await vendor.save();
    const profile = vendor.getPublicProfile();
    // Transform businessHours to openingHours for frontend compatibility
    if (profile.businessHours) {
      profile.openingHours = profile.businessHours;
      delete profile.businessHours;
    }
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Update opening hours
router.patch('/opening-hours', auth, async (req, res) => {
  try {
    console.log('Updating opening hours for vendor:', req.vendor._id);
    const { openingHours } = req.body;
    const vendor = await Vendor.findById(req.vendor._id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.businessHours = openingHours;
    await vendor.save();
    const profile = vendor.getPublicProfile();
    // Transform businessHours to openingHours for frontend compatibility
    if (profile.businessHours) {
      profile.openingHours = profile.businessHours;
      delete profile.businessHours;
    }
    res.json(profile);
  } catch (error) {
    console.error('Update opening hours error:', error);
    res.status(500).json({ message: 'Error updating opening hours' });
  }
});

// Toggle open status
router.patch('/toggle-status', auth, async (req, res) => {
  try {
    console.log('Toggling status for vendor:', req.vendor._id);
    const vendor = await Vendor.findById(req.vendor._id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.isOpen = !vendor.isOpen;
    await vendor.save();
    const profile = vendor.getPublicProfile();
    // Transform businessHours to openingHours for frontend compatibility
    if (profile.businessHours) {
      profile.openingHours = profile.businessHours;
      delete profile.businessHours;
    }
    res.json(profile);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Error toggling status' });
  }
});

module.exports = router; 