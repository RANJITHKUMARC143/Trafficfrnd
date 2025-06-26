const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const Vendor = require('../models/Vendor');
const Route = require('../models/Route');

async function createTestOrder() {
  try {
    // Connect to database directly
    await mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a delivery boy (use the one from your login)
    const deliveryBoy = await DeliveryBoy.findOne({ email: 'ranjith752000@gmail.com' });
    if (!deliveryBoy) {
      console.log('No delivery boy found with email: ranjith752000@gmail.com');
      return;
    }

    console.log('Found delivery boy:', deliveryBoy.fullName);

    // Find or create a vendor
    let vendor = await Vendor.findOne({});
    if (!vendor) {
      console.log('No vendor found, creating a test vendor...');
      vendor = new Vendor({
        name: 'Test Restaurant',
        email: 'test@restaurant.com',
        phone: '+1234567890',
        address: '123 Restaurant Street',
        cuisine: 'Test Cuisine',
        status: 'active'
      });
      await vendor.save();
      console.log('Test vendor created:', vendor.name);
    } else {
      console.log('Using existing vendor:', vendor.name);
    }

    // Find or create a route
    let route = await Route.findOne({});
    if (!route) {
      console.log('No route found, creating a test route...');
      route = new Route({
        name: 'Test Route',
        startLocation: 'Test Start',
        endLocation: 'Test End',
        waypoints: ['Waypoint 1', 'Waypoint 2'],
        estimatedDuration: 30,
        status: 'active'
      });
      await route.save();
      console.log('Test route created:', route.name);
    } else {
      console.log('Using existing route:', route.name);
    }

    // Create a test order
    const testOrder = new Order({
      vendorId: vendor._id,
      customerName: 'Test Customer',
      customerPhone: '+1234567890',
      customerAddress: '123 Test Street, Test City',
      pickupAddress: '456 Pickup Street, Test City',
      items: [
        {
          name: 'Test Item 1',
          quantity: 2,
          price: 15.99
        },
        {
          name: 'Test Item 2',
          quantity: 1,
          price: 12.50
        }
      ],
      totalAmount: 44.48,
      status: 'pending',
      vehicleNumber: deliveryBoy.vehicleNumber,
      routeId: route._id,
      deliveryBoyId: deliveryBoy._id,
      timestamp: new Date(),
      updatedAt: new Date()
    });

    await testOrder.save();
    console.log('Test order created successfully!');
    console.log('Order ID:', testOrder._id);
    console.log('Order Status:', testOrder.status);
    console.log('Delivery Boy:', deliveryBoy.fullName);
    console.log('Vendor:', vendor.name);
    console.log('Route:', route.name);

    // Create another test order with different status
    const testOrder2 = new Order({
      vendorId: vendor._id,
      customerName: 'Another Customer',
      customerPhone: '+1987654321',
      customerAddress: '789 Delivery Street, Test City',
      pickupAddress: '321 Pickup Ave, Test City',
      items: [
        {
          name: 'Pizza',
          quantity: 1,
          price: 18.99
        }
      ],
      totalAmount: 18.99,
      status: 'confirmed',
      vehicleNumber: deliveryBoy.vehicleNumber,
      routeId: route._id,
      deliveryBoyId: deliveryBoy._id,
      timestamp: new Date(),
      updatedAt: new Date()
    });

    await testOrder2.save();
    console.log('Second test order created successfully!');
    console.log('Order ID:', testOrder2._id);
    console.log('Order Status:', testOrder2.status);

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error creating test order:', error);
    mongoose.connection.close();
  }
}

createTestOrder(); 