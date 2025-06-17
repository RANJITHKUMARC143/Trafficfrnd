const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

// Replace with your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

const sampleMenuItems = [
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil.',
    price: 9.99,
    image: 'https://example.com/margherita.jpg',
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
    image: 'https://example.com/veggieburger.jpg',
    category: 'Burger',
    isAvailable: true,
    preparationTime: 10,
    customizationOptions: [],
    nutritionalInfo: { calories: 200, protein: 8, carbs: 25, fat: 6 },
    allergens: ['gluten'],
  },
];

async function seedMenuItems() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const vendors = await Vendor.find({});
  if (!vendors.length) {
    console.log('No vendors found.');
    process.exit(0);
  }

  for (const vendor of vendors) {
    const count = await MenuItem.countDocuments({ vendorId: vendor._id });
    if (count === 0) {
      // Insert sample items for this vendor
      const itemsToInsert = sampleMenuItems.map(item => ({
        ...item,
        vendorId: vendor._id,
      }));
      await MenuItem.insertMany(itemsToInsert);
      console.log(`Inserted ${itemsToInsert.length} menu items for vendor ${vendor.name} (${vendor._id})`);
    } else {
      console.log(`Vendor ${vendor.name} (${vendor._id}) already has ${count} menu items.`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedMenuItems().catch(err => {
  console.error('Error seeding menu items:', err);
  process.exit(1);
}); 