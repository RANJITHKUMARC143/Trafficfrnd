const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

const sampleMenuItems = [
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil.',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format',
    category: 'Pizza',
    isAvailable: true,
    preparationTime: 15,
    customizationOptions: [],
    nutritionalInfo: { calories: 250, protein: 10, carbs: 30, fat: 8 },
    allergens: ['dairy', 'gluten'],
  },
  {
    name: 'Veggie Burger',
    description: 'Grilled veggie patty with lettuce, tomato, and sauce.',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format',
    category: 'Burger',
    isAvailable: true,
    preparationTime: 10,
    customizationOptions: [],
    nutritionalInfo: { calories: 200, protein: 8, carbs: 25, fat: 6 },
    allergens: ['gluten'],
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan.',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format',
    category: 'Salad',
    isAvailable: true,
    preparationTime: 8,
    customizationOptions: [],
    nutritionalInfo: { calories: 180, protein: 6, carbs: 15, fat: 10 },
    allergens: ['dairy', 'gluten'],
  }
];

async function addMenuItems() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get the first vendor ID from the database
    const vendors = await mongoose.model('Vendor').find({});
    if (!vendors.length) {
      console.log('No vendors found in the database');
      process.exit(1);
    }

    const vendorId = vendors[0]._id;
    console.log('Adding menu items for vendor:', vendorId);

    // Add menu items for the vendor
    const itemsToInsert = sampleMenuItems.map(item => ({
      ...item,
      vendorId: vendorId,
    }));

    await MenuItem.insertMany(itemsToInsert);
    console.log(`Successfully added ${itemsToInsert.length} menu items`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMenuItems(); 