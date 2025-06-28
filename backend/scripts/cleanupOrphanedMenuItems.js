const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');
require('dotenv').config();

async function cleanupOrphanedMenuItems() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trafficfrnd');
    console.log('Connected to MongoDB');

    // Get all menu items
    const menuItems = await MenuItem.find({});
    console.log(`Found ${menuItems.length} menu items`);

    // Get all vendor IDs
    const vendors = await Vendor.find({}, '_id');
    const vendorIds = vendors.map(v => v._id.toString());
    console.log(`Found ${vendorIds.length} vendors`);

    // Find orphaned menu items (menu items with vendorId that doesn't exist)
    const orphanedItems = menuItems.filter(item => {
      const itemVendorId = item.vendorId.toString();
      return !vendorIds.includes(itemVendorId);
    });

    console.log(`Found ${orphanedItems.length} orphaned menu items`);

    if (orphanedItems.length > 0) {
      console.log('Orphaned menu items:');
      orphanedItems.forEach(item => {
        console.log(`- ${item.name} (ID: ${item._id}, VendorID: ${item.vendorId})`);
      });

      // Delete orphaned menu items
      const result = await MenuItem.deleteMany({
        _id: { $in: orphanedItems.map(item => item._id) }
      });

      console.log(`Deleted ${result.deletedCount} orphaned menu items`);
    } else {
      console.log('No orphaned menu items found');
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupOrphanedMenuItems();
}

module.exports = cleanupOrphanedMenuItems; 