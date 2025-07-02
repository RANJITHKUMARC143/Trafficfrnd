const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// CHANGE THIS TO THE DELIVERY BOY ID YOU WANT TO TEST
const DELIVERY_BOY_ID = '683ea6a7edbddaf17411e75c';

mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createOrdersForDeliveryBoy = async () => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(DELIVERY_BOY_ID);
    if (!deliveryBoy) {
      console.log('Delivery boy not found:', DELIVERY_BOY_ID);
      return;
    }
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
          coordinates: [77.2090, 28.6139]
        }
      });
      await vendor.save();
      console.log('Created test vendor');
    }
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
    const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const items = [
      { name: 'Burger', quantity: 2, price: 150 },
      { name: 'Pizza', quantity: 1, price: 300 },
      { name: 'French Fries', quantity: 1, price: 100 },
      { name: 'Chicken Wings', quantity: 6, price: 250 },
      { name: 'Pasta', quantity: 1, price: 200 }
    ];
    const orders = [];
    for (let i = 0; i < 10; i++) {
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
        vehicleNumber: deliveryBoy.vehicleNumber,
        routeId: new mongoose.Types.ObjectId(),
        deliveryBoyId: deliveryBoy._id,
        user: user._id,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      orders.push(order);
    }
    await Order.insertMany(orders);
    console.log(`Created ${orders.length} test orders for delivery boy ${deliveryBoy.fullName} (${DELIVERY_BOY_ID})`);
    const orderCount = await Order.countDocuments({ deliveryBoyId: deliveryBoy._id });
    console.log(`Total orders for this delivery boy: ${orderCount}`);
  } catch (error) {
    console.error('Error creating test orders:', error);
  } finally {
    mongoose.connection.close();
  }
};

createOrdersForDeliveryBoy(); 