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

// Public routes
router.post('/register', deliveryBoyController.register);
router.post('/login', deliveryBoyController.login);

// Protected routes
router.get('/profile', auth, deliveryBoyController.getProfile);
router.put('/profile', auth, deliveryBoyController.updateProfile);
router.put('/location', auth, deliveryBoyController.updateLocation);
router.put('/status', auth, deliveryBoyController.updateOnlineStatus);

// Orders routes for delivery boy
router.get('/orders', auth, deliveryBoyController.getAssignedOrders);
router.get('/orders/:id', auth, deliveryBoyController.getOrderById);
router.put('/orders/:id/status', auth, deliveryBoyController.updateOrderStatus);
router.put('/orders/:orderId/location', auth, require('../controllers/orderController').updateDeliveryBoyLocation);

// Earnings routes
router.get('/earnings/summary', auth, deliveryBoyController.getEarningsSummary);
router.get('/earnings/history', auth, deliveryBoyController.getEarningsHistory);
router.post('/earnings/summary/cashout', auth, deliveryBoyController.requestCashout);

// --- ADMIN CRUD ENDPOINTS ---
// List all delivery partners
router.get('/', auth, async (req, res) => {
  try {
    // Optionally: check if req.user.role === 'admin'
    const deliveryBoys = await require('../models/DeliveryBoy').find({}, '-password');
    const deliveryBoysWithId = deliveryBoys.map(d => ({ ...d.toObject(), id: d._id }));
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
    res.status(201).json({ deliveryBoy: deliveryBoy.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ message: 'Error adding delivery partner', error: error.message });
  }
});

// Edit a delivery partner
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
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
    res.json(deliveryBoy.getPublicProfile());
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