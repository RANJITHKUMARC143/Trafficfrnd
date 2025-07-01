const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

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
      process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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

// Public route: Get all active vendors
router.get('/public', async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
});

// Test route to create a sample vendor
router.post('/test/sample-vendor', async (req, res) => {
  try {
    const sampleVendor = new Vendor({
      businessName: 'Test Restaurant',
      ownerName: 'Test Owner',
      email: 'test4@restaurant.com',
      password: 'test123', // Will be hashed by pre-save hook
      phone: '1234567890',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      cuisine: ['Italian', 'American'],
      isVerified: true
    });

    const savedVendor = await sampleVendor.save();
    res.status(201).json(savedVendor);
  } catch (error) {
    console.error('Error creating sample vendor:', error);
    res.status(500).json({ message: 'Error creating sample vendor', error: error.message });
  }
});

// Update vendor's Expo push token
router.put('/push-token', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.expoPushToken = req.body.expoPushToken;
    await vendor.save();
    res.json({ message: 'Expo push token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating push token', error: error.message });
  }
});

// Get all vendors (admin)
router.get('/', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const vendors = await Vendor.find({}, 'businessName email').sort({ businessName: 1 });
  res.json(vendors);
});

// Add vendor (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, password, status, isVerified, isOpen, address, businessHours, rating, totalRatings, expoPushToken } = req.body;
    if (!businessName || !ownerName || !email || !phone || !password) {
      return res.status(400).json({ message: 'businessName, ownerName, email, phone, and password are required' });
    }
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor with this email already exists' });
    }
    const vendor = new Vendor({
      businessName,
      ownerName,
      email,
      phone,
      password,
      status: status || 'active',
      isVerified: isVerified || false,
      isOpen: isOpen || false,
      address: address || {},
      businessHours: businessHours || {},
      rating: rating || 0,
      totalRatings: totalRatings || 0,
      expoPushToken: expoPushToken || ''
    });
    await vendor.save();
    res.status(201).json({ vendor: vendor.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ message: 'Error adding vendor', error: error.message });
  }
});

// Update vendor by ID (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor.getPublicProfile());
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor', error: error.message });
  }
});

// Delete vendor by ID (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vendor', error: error.message });
  }
});

// Get vendor activity (admin)
router.get('/:vendorId/activity', auth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10 } = req.query;
    
    // Get recent orders for this vendor
    const orders = await Order.find({ vendorId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name');
    
    // Get recent menu updates
    const menuUpdates = await MenuItem.find({ vendorId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));
    
    // Format activity data
    const activity = [];
    
    // Add order activities
    orders.forEach(order => {
      activity.push({
        type: 'order',
        action: order.status === 'completed' ? 'completed' : 'received',
        description: `Order #${order.orderId} ${order.status === 'completed' ? 'completed' : 'received'}`,
        timestamp: order.timestamp,
        data: {
          orderId: order.orderId,
          amount: order.totalAmount,
          status: order.status,
          customerName: order.user?.name || 'Unknown'
        }
      });
    });
    
    // Add menu activities
    menuUpdates.forEach(item => {
      activity.push({
        type: 'menu',
        action: 'updated',
        description: `Menu item "${item.name}" updated`,
        timestamp: item.updatedAt,
        data: {
          itemName: item.name,
          price: item.price,
          isAvailable: item.isAvailable
        }
      });
    });
    
    // Sort by timestamp and limit
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(activity.slice(0, parseInt(limit)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor activity', error: error.message });
  }
});

module.exports = router; 