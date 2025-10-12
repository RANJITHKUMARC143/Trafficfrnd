const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const MenuItem = require('../models/MenuItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Trafficfrnd';

const sampleMenuItems = [
  {
    name: 'Chicken Biryani',
    description: 'Spicy and aromatic rice with tender chicken pieces',
    price: 250,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d4d9?w=400',
    category: 'Main Course',
    isAvailable: true,
    preparationTime: 20,
    rating: 4.5
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 299,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    category: 'Pizza',
    isAvailable: true,
    preparationTime: 15,
    rating: 4.3
  },
  {
    name: 'Veggie Burger',
    description: 'Grilled veggie patty with lettuce, tomato, and sauce',
    price: 180,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    category: 'Burger',
    isAvailable: true,
    preparationTime: 10,
    rating: 4.2
  },
  {
    name: 'Chocolate Cake',
    description: 'Rich and moist chocolate cake with chocolate frosting',
    price: 120,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    category: 'Dessert',
    isAvailable: true,
    preparationTime: 5,
    rating: 4.7
  },
  {
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato mixture',
    price: 80,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    category: 'South Indian',
    isAvailable: true,
    preparationTime: 12,
    rating: 4.4
  },
  {
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and cream sauce',
    price: 320,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    category: 'Main Course',
    isAvailable: true,
    preparationTime: 25,
    rating: 4.6
  }
];

async function addMenuItems() {
  await mongoose.connect(MONGO_URI);
  
  // Update vendors with proper names
  const vendors = await Vendor.find({});
  console.log('Found', vendors.length, 'vendors');
  
  for (let i = 0; i < vendors.length; i++) {
    const vendor = vendors[i];
    if (!vendor.businessName) {
      vendor.businessName = `Restaurant ${i + 1}`;
      await vendor.save();
      console.log('Updated vendor:', vendor.businessName);
    }
    
    // Check if vendor already has menu items
    const existingItems = await MenuItem.countDocuments({ vendorId: vendor._id });
    if (existingItems === 0) {
      // Add menu items for this vendor
      const itemsToInsert = sampleMenuItems.map(item => ({
        ...item,
        vendorId: vendor._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await MenuItem.insertMany(itemsToInsert);
      console.log(`Added ${itemsToInsert.length} menu items for ${vendor.businessName}`);
    } else {
      console.log(`${vendor.businessName} already has ${existingItems} menu items`);
    }
  }
  
  await mongoose.disconnect();
  console.log('Done!');
}

addMenuItems().catch(console.error);
