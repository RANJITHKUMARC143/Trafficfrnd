const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createTestOrders = async () => {
  try {
    console.log('Creating test orders...');

    // Get all delivery partners
    const deliveryPartners = await DeliveryBoy.find({});
    console.log(`Found ${deliveryPartners.length} delivery partners`);

    if (deliveryPartners.length === 0) {
      console.log('No delivery partners found. Please create some delivery partners first.');
      return;
    }

    // Get or create a test vendor
    let vendor = await Vendor.findOne({});
    if (!vendor) {
      vendor = new Vendor({
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        email: 'test@restaurant.com',
        phone: '1234567890',
        status: 'active',
        rating: 4.5,
        totalRatings: 100,
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi coordinates
        }
      });
      await vendor.save();
      console.log('Created test vendor');
    }

    // Get or create a test user
    let user = await User.findOne({});
    if (!user) {
      user = new User({
        fullName: 'Test Customer',
        email: 'customer@test.com',
        phone: '9876543210',
        status: 'active'
      });
      await user.save();
      console.log('Created test user');
    }

    // Create test orders
    const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const items = [
      { name: 'Burger', quantity: 2, price: 150 },
      { name: 'Pizza', quantity: 1, price: 300 },
      { name: 'French Fries', quantity: 1, price: 100 },
      { name: 'Chicken Wings', quantity: 6, price: 250 },
      { name: 'Pasta', quantity: 1, price: 200 }
    ];

    const orders = [];

    // Create 30 more test orders (to add to existing 7)
    for (let i = 0; i < 30; i++) {
      const deliveryPartner = deliveryPartners[Math.floor(Math.random() * deliveryPartners.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const orderItems = [items[Math.floor(Math.random() * items.length)]];
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      const order = new Order({
        vendorId: vendor._id,
        customerName: `Customer ${i + 1}`,
        items: orderItems,
        totalAmount: totalAmount,
        status: status,
        deliveryAddress: `${i + 1} Test Street, Test City`,
        specialInstructions: i % 3 === 0 ? 'Please deliver quickly' : '',
        vehicleNumber: deliveryPartner.vehicleNumber,
        routeId: new mongoose.Types.ObjectId(), // Create a dummy route ID
        deliveryBoyId: deliveryPartner._id,
        user: user._id,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });

      orders.push(order);
    }

    // Save all orders
    await Order.insertMany(orders);
    console.log(`Created ${orders.length} additional test orders`);

    // Verify the orders were created
    const totalOrders = await Order.countDocuments();
    const ordersWithDelivery = await Order.countDocuments({ deliveryBoyId: { $exists: true, $ne: null } });
    
    console.log(`Total orders in database: ${totalOrders}`);
    console.log(`Orders with delivery partners: ${ordersWithDelivery}`);

    // Show orders per delivery partner
    for (const dp of deliveryPartners) {
      const orderCount = await Order.countDocuments({ deliveryBoyId: dp._id });
      console.log(`${dp.fullName}: ${orderCount} orders`);
    }

    console.log('Test orders created successfully!');
  } catch (error) {
    console.error('Error creating test orders:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestOrders(); 