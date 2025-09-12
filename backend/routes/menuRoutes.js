const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const { validateMenuItem } = require('../middleware/validation');
const Vendor = require('../models/Vendor');

// Get all menu items for a vendor
router.get('/', auth, async (req, res) => {
  try {
    if (!req.vendor || !req.vendor._id) {
      return res.status(401).json({ message: 'Unauthorized: Vendor not authenticated' });
    }
    const menuItems = await MenuItem.find({ vendorId: req.vendor._id });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Get menu items by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find({
      vendorId: req.vendor._id,
      category: req.params.category
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Add new menu item
router.post('/', [auth, validateMenuItem], async (req, res) => {
  try {
    const menuItem = new MenuItem({
      ...req.body,
      vendorId: req.vendor._id
    });
    await menuItem.save();
    
    // Emit real-time update to all clients in the vendor's room
    const io = req.app.get('io');
    io.to(req.vendor._id.toString()).emit('menuItemAdded', menuItem);
    
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(400).json({ message: 'Error adding menu item', error: error.message });
  }
});

// Admin: Add new menu item for a specific vendor (requires admin role)
router.post('/admin', [auth], async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { vendorId, name, description, price, image, category, isAvailable = true, preparationTime = 15, customizationOptions = [], nutritionalInfo, allergens = [] } = req.body || {};
    if (!vendorId) return res.status(400).json({ message: 'vendorId is required' });
    if (!name || !description || typeof price !== 'number' || !image || !category) {
      return res.status(400).json({ message: 'Missing required fields: name, description, price, image, category' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const menuItem = new MenuItem({
      vendorId,
      name,
      description,
      price,
      image,
      category,
      isAvailable,
      preparationTime,
      customizationOptions,
      nutritionalInfo,
      allergens
    });
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error adding menu item (admin):', error);
    res.status(400).json({ message: 'Error adding menu item', error: error.message });
  }
});

// Update menu item
router.put('/:id', [auth, validateMenuItem], async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.vendor._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Emit real-time update to all clients in the vendor's room
    const io = req.app.get('io');
    io.to(req.vendor._id.toString()).emit('menuItemUpdated', menuItem);
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({ message: 'Error updating menu item', error: error.message });
  }
});

// Toggle item availability
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.vendor._id },
      [
        { $set: { isAvailable: { $not: '$isAvailable' } } },
        { $set: { updatedAt: Date.now() } }
      ],
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Emit real-time update to all clients in the vendor's room
    const io = req.app.get('io');
    io.to(req.vendor._id.toString()).emit('menuItemAvailabilityChanged', {
      itemId: menuItem._id,
      isAvailable: menuItem.isAvailable
    });
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(400).json({ message: 'Error updating availability', error: error.message });
  }
});

// Delete menu item
router.delete('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      vendorId: req.vendor._id
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Emit real-time update to all clients in the vendor's room
    const io = req.app.get('io');
    io.to(req.vendor._id.toString()).emit('menuItemDeleted', req.params.id);
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

// Public route: Get all menu items for a vendor by vendorId (no auth)
router.get('/public/:vendorId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ vendorId: req.params.vendorId });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Public route: Get all menu items across all vendors for explore page
router.get('/public/explore/all', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true })
      .populate('vendorId', 'businessName') // Populate vendor information
      .sort({ createdAt: -1 }); // Sort by newest first
    
    // Transform the data to include vendor name and filter out items with null vendorId
    const transformedItems = menuItems
      .filter(item => item.vendorId) // Filter out items with null vendorId
      .map(item => ({
        ...item.toObject(),
        vendorName: item.vendorId.businessName || 'Unknown Vendor'
      }));
    
    res.json(transformedItems);
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Public route: item suggestions by query string
router.get('/public/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json([]);
    const items = await MenuItem.find({
      isAvailable: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name price image vendorId category')
      .sort({ orderCount: -1, createdAt: -1 })
      .limit(15)
      .lean();

    // Attach vendorName for convenience if populated later is not desired
    res.json(items);
  } catch (error) {
    console.error('Error searching menu items:', error);
    res.status(500).json({ message: 'Error searching items', error: error.message });
  }
});

// Test route to create sample menu items
router.post('/test/sample-items', async (req, res) => {
  try {
    const testVendor = await Vendor.findOne({ email: 'test4@restaurant.com' });
    if (!testVendor) {
      return res.status(404).json({ message: 'Test vendor not found' });
    }
    const vendorId = testVendor._id;

    const sampleItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce and mozzarella',
        price: 299,
        image: 'https://placehold.co/400x300/e2e8f0/64748b?text=Pizza',
        category: 'Fast Food',
        isAvailable: true,
        preparationTime: 15,
        vendorId: vendorId,
        customizationOptions: [
          {
            name: 'Size',
            options: [
              { name: 'Small', price: 0 },
              { name: 'Medium', price: 50 },
              { name: 'Large', price: 100 }
            ]
          }
        ]
      },
      {
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with fresh vegetables',
        price: 199,
        image: 'https://placehold.co/400x300/e2e8f0/64748b?text=Burger',
        category: 'Fast Food',
        isAvailable: true,
        preparationTime: 10,
        vendorId: vendorId,
        customizationOptions: [
          {
            name: 'Spice Level',
            options: [
              { name: 'Mild', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Hot', price: 0 }
            ]
          }
        ]
      }
    ];

    const createdItems = await MenuItem.insertMany(sampleItems);
    res.status(201).json(createdItems);
  } catch (error) {
    console.error('Error creating sample items:', error);
    res.status(500).json({ message: 'Error creating sample items', error: error.message });
  }
});

// Admin route: Get all menu items for a vendor by vendorId (with auth)
router.get('/vendor/:vendorId', auth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ vendorId: req.params.vendorId })
      .sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

module.exports = router; 