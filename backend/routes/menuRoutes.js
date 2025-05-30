const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const { validateMenuItem } = require('../middleware/validation');

// Get all menu items for a vendor
router.get('/', auth, async (req, res) => {
  try {
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
    
    // Emit real-time update
    req.app.get('io').to(req.vendor._id.toString()).emit('menuItemAdded', menuItem);
    
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
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

    // Emit real-time update
    req.app.get('io').to(req.vendor._id.toString()).emit('menuItemUpdated', menuItem);
    
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

    // Emit real-time update
    req.app.get('io').to(req.vendor._id.toString()).emit('menuItemAvailabilityChanged', {
      id: menuItem._id,
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

    // Emit real-time update
    req.app.get('io').to(req.vendor._id.toString()).emit('menuItemDeleted', req.params.id);
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

module.exports = router; 