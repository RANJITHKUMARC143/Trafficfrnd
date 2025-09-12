const express = require('express');
const router = express.Router();
const deliveryBoyController = require('../controllers/deliveryBoyController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all routes
router.use(limiter);

// --- DELIVERY BOY AUTHENTICATION ROUTES ---
router.post('/register', deliveryBoyController.register);
router.post('/login', deliveryBoyController.login);

// --- DELIVERY BOY PROFILE ROUTES ---
router.get('/profile', auth, deliveryBoyController.getProfile);
router.put('/profile', auth, deliveryBoyController.updateProfile);
router.put('/location', auth, deliveryBoyController.updateLocation);
router.put('/status', auth, deliveryBoyController.updateOnlineStatus);

// Delivery boy toggles surge state
router.put('/me/surge', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'delivery') return res.status(403).json({ message: 'Forbidden' });
    const DeliveryBoy = require('../models/DeliveryBoy');
    const { enabled } = req.body || {};
    const updated = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      { $set: { surge: { enabled: !!enabled, lastToggledAt: new Date() } } },
      { new: true }
    ).select('-password');
    try {
      const io = req.app.get('io');
      if (io) io.to(`deliveryBoy:${String(req.user._id)}`).emit('deliveryProfileUpdated', updated);
    } catch {}
    return res.json({ success: true, surge: updated.surge });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update surge', error: e.message });
  }
});

// --- ORDER ROUTES ---
router.put('/orders/:orderId/location', auth, require('../controllers/orderController').updateDeliveryBoyLocation);

// Add logging to orders endpoint
router.get('/:id/orders', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    console.log('Fetching orders for deliveryBoyId:', req.params.id);
    const orders = await Order.find({ deliveryBoyId: req.params.id });
    console.log('Orders found:', orders.length, orders.map(o => o._id));
    const Vendor = require('../models/Vendor');
    const ordersWithId = orders.map(order => ({
      ...order.toObject(),
      id: order._id.toString(),
      _id: order._id.toString(),
      vendor: order.vendorId ? order.vendorId.toString() : null
    }));
    res.json(ordersWithId);
  } catch (error) {
    console.error('Error fetching delivery partner orders:', error);
    res.status(500).json({ message: 'Error fetching delivery partner orders', error: error.message });
  }
});

// --- EARNINGS ROUTES ---
router.get('/earnings/summary', auth, deliveryBoyController.getEarningsSummary);
router.get('/earnings/history', auth, deliveryBoyController.getEarningsHistory);
router.post('/earnings/summary/cashout', auth, deliveryBoyController.requestCashout);

// --- ADMIN CRUD ENDPOINTS ---
// List all delivery boys (admin only)
const DeliveryBoy = require('../models/DeliveryBoy');
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const deliveryBoys = await DeliveryBoy.find({}).sort({ fullName: 1 });
    // Map _id to id for consistency and ensure all fields are present
    const deliveryBoysWithId = deliveryBoys.map(deliveryBoy => {
      const deliveryBoyObj = deliveryBoy.toObject();
      return {
        id: deliveryBoyObj._id.toString(),
        _id: deliveryBoyObj._id.toString(),
        fullName: deliveryBoyObj.fullName || '',
        email: deliveryBoyObj.email || '',
        phone: deliveryBoyObj.phone || '',
        role: deliveryBoyObj.role || 'delivery',
        vehicleType: deliveryBoyObj.vehicleType || '',
        vehicleNumber: deliveryBoyObj.vehicleNumber || '',
        isActive: deliveryBoyObj.isActive !== undefined ? deliveryBoyObj.isActive : true,
        status: deliveryBoyObj.status || 'active',
        rating: deliveryBoyObj.rating || 0,
        totalDeliveries: deliveryBoyObj.totalDeliveries || 0,
        onTimeRate: deliveryBoyObj.onTimeRate || 0,
        acceptanceRate: deliveryBoyObj.acceptanceRate || 0,
        cancellationRate: deliveryBoyObj.cancellationRate || 0,
        currentLocation: deliveryBoyObj.currentLocation || {},
        address: deliveryBoyObj.address || {},
        documents: deliveryBoyObj.documents || {},
        bankDetails: deliveryBoyObj.bankDetails || {},
        preferences: deliveryBoyObj.preferences || {},
        earnings: deliveryBoyObj.earnings || {},
        activityLog: deliveryBoyObj.activityLog || [],
        createdAt: deliveryBoyObj.createdAt,
        updatedAt: deliveryBoyObj.updatedAt
      };
    });
    res.json(deliveryBoysWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery partners', error: error.message });
  }
});

// Add a delivery partner
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, email, phone, password, vehicleType, vehicleNumber, status, isActive, address } = req.body;
    if (!fullName || !email || !phone || !password || !vehicleType || !vehicleNumber) {
      return res.status(400).json({ message: 'fullName, email, phone, password, vehicleType, and vehicleNumber are required' });
    }
    const DeliveryBoy = require('../models/DeliveryBoy');
    const existing = await DeliveryBoy.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ message: 'Delivery partner with this email or phone already exists' });
    }
    const deliveryBoy = new DeliveryBoy({
      fullName,
      email,
      phone,
      password,
      vehicleType,
      vehicleNumber,
      status: status || 'active',
      isActive: isActive !== undefined ? isActive : true,
      address: address || {},
      role: 'delivery'
    });
    await deliveryBoy.save();
    const deliveryBoyObj = deliveryBoy.toObject();
    res.status(201).json({ 
      deliveryBoy: {
        ...deliveryBoyObj,
        id: deliveryBoyObj._id.toString(),
        _id: deliveryBoyObj._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding delivery partner', error: error.message });
  }
});

// --- TEST ROUTE (temporary for debugging) ---
router.get('/test/:id', async (req, res) => {
  try {
    console.log('TEST route hit with ID:', req.params.id);
    
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findById(req.params.id).select('-password');
    
    console.log('Delivery boy found:', deliveryBoy ? 'Yes' : 'No');
    
    if (!deliveryBoy) {
      console.log('Delivery partner not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    const response = {
      ...deliveryBoy.toObject(),
      id: deliveryBoy._id.toString(),
      _id: deliveryBoy._id.toString(),
      message: 'Test route working'
    };

    console.log('Sending test response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in TEST route:', error);
    res.status(500).json({ message: 'Error in test route', error: error.message });
  }
});

// --- SPECIFIC DELIVERY PARTNER ROUTES (must come after general routes) ---
// Get delivery partner details with full information
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /:id route hit with ID:', req.params.id);
    console.log('User from auth:', req.user);
    
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findById(req.params.id).select('-password');
    
    console.log('Delivery boy found:', deliveryBoy ? 'Yes' : 'No');
    
    if (!deliveryBoy) {
      console.log('Delivery partner not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    // Get additional statistics
    const Order = require('../models/Order');
    const totalOrders = await Order.countDocuments({ deliveryBoyId: req.params.id });
    const completedOrders = await Order.countDocuments({ 
      deliveryBoyId: req.params.id, 
      status: 'completed' 
    });
    const cancelledOrders = await Order.countDocuments({ 
      deliveryBoyId: req.params.id, 
      status: 'cancelled' 
    });

    console.log('Order statistics:', { totalOrders, completedOrders, cancelledOrders });

    const response = {
      ...deliveryBoy.toObject(),
      id: deliveryBoy._id.toString(),
      _id: deliveryBoy._id.toString(),
      totalDeliveries: totalOrders,
      onTimeRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      cancellationRate: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
      acceptanceRate: 95 // This would need to be calculated based on actual acceptance data
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in GET /:id route:', error);
    res.status(500).json({ message: 'Error fetching delivery partner details', error: error.message });
  }
});

// Get vendors that a delivery partner has worked with
router.get('/:id/vendors', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Vendor = require('../models/Vendor');
    
    // Get unique vendor IDs from orders
    const vendorIds = await Order.distinct('vendorId', { deliveryBoyId: req.params.id });
    
    // Get vendor details
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .select('businessName ownerName email phone status rating totalRatings address location')
      .lean();

    const vendorsWithId = vendors.map(vendor => ({
      ...vendor,
      id: vendor._id.toString(),
      _id: vendor._id.toString()
    }));

    res.json(vendorsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery partner vendors', error: error.message });
  }
});

// Get activity log for a delivery partner
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findById(req.params.id)
      .select('activityLog')
      .lean();

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    const activityLog = deliveryBoy.activityLog || [];
    const activityWithId = activityLog.map((activity, index) => ({
      ...activity,
      id: index,
      timestamp: activity.timestamp
    }));

    res.json(activityWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery partner activity', error: error.message });
  }
});

// Edit a delivery partner
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    console.log('Admin updating delivery partner', req.params.id, 'with updates:', JSON.stringify(updates));
    delete updates.password; // Do not allow password update here
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }
    const deliveryBoyObj = deliveryBoy.toObject();
    console.log('Update successful. New bankDetails:', deliveryBoyObj.bankDetails);
    // Emit socket event to notify the specific delivery boy client about profile updates (including bankDetails)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`deliveryBoy:${req.params.id}`).emit('deliveryProfileUpdated', {
          id: deliveryBoyObj._id.toString(),
          bankDetails: deliveryBoyObj.bankDetails || {},
          updatedAt: deliveryBoyObj.updatedAt,
        });
      }
    } catch (e) {}

    res.json({
      ...deliveryBoyObj,
      id: deliveryBoyObj._id.toString(),
      _id: deliveryBoyObj._id.toString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery partner', error: error.message });
  }
});

// Delete a delivery partner
router.delete('/:id', auth, async (req, res) => {
  try {
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findByIdAndDelete(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }
    res.json({ message: 'Delivery partner deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery partner', error: error.message });
  }
});

module.exports = router; 