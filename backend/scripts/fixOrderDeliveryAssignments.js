const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');

mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixOrderDeliveryAssignments = async () => {
  try {
    console.log('Fixing order delivery assignments...');

    // Get all delivery partners
    const deliveryPartners = await DeliveryBoy.find({});
    console.log(`Found ${deliveryPartners.length} delivery partners`);

    if (deliveryPartners.length === 0) {
      console.log('No delivery partners found. Please create some delivery partners first.');
      return;
    }

    // Get all orders without deliveryBoyId
    const ordersWithoutDelivery = await Order.find({ 
      $or: [
        { deliveryBoyId: { $exists: false } },
        { deliveryBoyId: null },
        { deliveryBoyId: undefined }
      ]
    });
    
    console.log(`Found ${ordersWithoutDelivery.length} orders without delivery partner assignment`);

    if (ordersWithoutDelivery.length === 0) {
      console.log('All orders already have delivery partners assigned.');
      return;
    }

    // Assign orders to delivery partners
    let updatedCount = 0;
    for (const order of ordersWithoutDelivery) {
      // Randomly assign to a delivery partner
      const randomPartner = deliveryPartners[Math.floor(Math.random() * deliveryPartners.length)];
      
      // Update the order with missing required fields
      const updateData = {
        deliveryBoyId: randomPartner._id
      };

      // Add missing required fields if they don't exist
      if (!order.routeId) {
        updateData.routeId = new mongoose.Types.ObjectId();
      }
      
      if (!order.vehicleNumber) {
        updateData.vehicleNumber = randomPartner.vehicleNumber;
      }

      // Use updateOne to avoid validation issues
      await Order.updateOne(
        { _id: order._id },
        { $set: updateData }
      );
      
      updatedCount++;
      console.log(`Assigned order ${order._id} to delivery partner ${randomPartner.fullName}`);
    }

    console.log(`\nSuccessfully assigned ${updatedCount} orders to delivery partners`);

    // Verify the assignments
    const totalOrders = await Order.countDocuments();
    const ordersWithDelivery = await Order.countDocuments({ 
      deliveryBoyId: { $exists: true, $ne: null } 
    });
    
    console.log(`\nVerification:`);
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with delivery partners: ${ordersWithDelivery}`);

    // Show orders per delivery partner
    for (const dp of deliveryPartners) {
      const orderCount = await Order.countDocuments({ deliveryBoyId: dp._id });
      console.log(`${dp.fullName}: ${orderCount} orders`);
    }

    console.log('\nOrder delivery assignments fixed successfully!');
  } catch (error) {
    console.error('Error fixing order delivery assignments:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixOrderDeliveryAssignments(); 