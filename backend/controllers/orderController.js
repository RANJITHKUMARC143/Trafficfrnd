const Order = require('../models/Order');
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const fetch = require('node-fetch');
const Earnings = require('../models/Earnings');
const Alert = require('../models/Alert');
const MenuItem = require('../models/MenuItem');

// Utility function to get address from coordinates
async function getAddressFromCoordinates(latitude, longitude) {
  try {
    if (!latitude || !longitude) return '';
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) return '';
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return '';
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return '';
  }
}

async function sendExpoPushNotification(expoPushToken, message, data) {
  if (!expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: data || {},
      priority: 'high',
    }),
  });
}

// Get all orders for the authenticated vendor
const getOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request! req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const orders = await Order.find({ vendorId: req.user._id }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    console.log('[BACKEND] getOrderById called with orderId:', req.params.orderId, 'userId:', req.user && req.user._id, 'role:', req.user && req.user.role);
    if (!req.user || !req.user._id) {
      console.error('No user found on request!');
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }
    // Allow vendor or delivery boy to fetch their order
    const order = await Order.findOne({
      _id: req.params.orderId,
      $or: [
        { vendorId: req.user._id },
        { deliveryBoyId: req.user._id }
      ]
    });

    if (!order) {
      console.log('[BACKEND] Order not found for orderId:', req.params.orderId, 'userId:', req.user._id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('[BACKEND] Order found:', order);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }
    // Find the order first
    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // If vendor is accepting and wants to confirm
    if (req.user.role === 'vendor' && status === 'confirmed') {
      order.vendorConfirmed = true;
      if (!order.status || order.status === 'pending') {
        order.status = 'confirmed';
      }
      order.updatedAt = Date.now();
      await order.save();
      return res.json({ success: true, order });
    }
    // If delivery boy is accepting
    if (
      (order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') &&
      !order.deliveryBoyId &&
      req.user.role === 'delivery' &&
      status === 'confirmed'
    ) {
      order.deliveryBoyId = req.user._id;
      order.status = 'confirmed';
      order.updatedAt = Date.now();
      await order.save();
      // Emit real-time update to all delivery boys
      const io = req.app.get('io');
      if (io) {
        console.log('[SOCKET] Emitting orderClaimed to deliveryBoys:', order._id);
        io.to('deliveryBoys').emit('orderClaimed', order);
      }
      return res.json({ success: true, order });
    }
    // Prevent moving to 'preparing' unless a delivery boy is assigned
    if (status === 'preparing' && !order.deliveryBoyId) {
      return res.status(400).json({ message: 'Cannot move to preparing before a delivery boy is assigned.' });
    }
    // Otherwise, only allow vendor or assigned delivery boy to update
    if (
      order.vendorId.toString() !== req.user._id.toString() &&
      order.deliveryBoyId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Forbidden: Not your order' });
    }
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();
    // Debug log for status transitions
    console.log('updateOrderStatus:', { orderId, currentStatus: order.status, requestedStatus: status, deliveryBoyId: order.deliveryBoyId, user: req.user._id, role: req.user.role });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('No vendor user found on request!');
      return res.status(401).json({ message: 'Unauthorized: No vendor user found' });
    }
    const orders = await Order.find({
      vendorId: req.user._id,
      status: req.params.status
    }).sort({ timestamp: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Error fetching orders by status', error: error.message });
  }
};

// Create a new order (user)
const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      totalAmount, 
      vendorId, 
      deliveryAddress, 
      specialInstructions, 
      vehicleNumber, 
      routeId,
      userLocation, // New field for user's current location
      selectedDeliveryPoint // New: selected delivery point from client
    } = req.body;
    const customerName = req.user.name || req.user.username;

    if (!vendorId) {
      return res.status(400).json({ message: 'vendorId is required' });
    }
    if (!vehicleNumber) {
      return res.status(400).json({ message: 'vehicleNumber is required' });
    }
    if (!routeId) {
      return res.status(400).json({ message: 'routeId is required' });
    }

    // Convert vendorId and routeId to ObjectId if they're strings
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const routeObjectId = new mongoose.Types.ObjectId(routeId);

    // Get vendor's current location
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Prepare location data
    const locationData = {
      user: {
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
        address: userLocation?.address || deliveryAddress || await getAddressFromCoordinates(userLocation?.latitude, userLocation?.longitude),
        timestamp: new Date()
      },
      vendor: {
        latitude: vendor.location?.coordinates?.[1] || null, // MongoDB stores as [longitude, latitude]
        longitude: vendor.location?.coordinates?.[0] || null,
        address: vendor.address ? `${vendor.address.street || ''}, ${vendor.address.city || ''}, ${vendor.address.state || ''}`.trim() : await getAddressFromCoordinates(vendor.location?.coordinates?.[1], vendor.location?.coordinates?.[0]),
        timestamp: new Date()
      },
      deliveryBoy: {
        latitude: null,
        longitude: null,
        address: '',
        timestamp: null
      }
    };

    const order = new Order({
      vendorId: vendorObjectId,
      routeId: routeObjectId,
      customerName,
      items,
      totalAmount,
      status: 'pending',
      deliveryAddress,
      specialInstructions,
      vehicleNumber,
      locations: locationData,
      timestamp: new Date(),
      updatedAt: new Date(),
      user: req.user._id,
      selectedDeliveryPoint: selectedDeliveryPoint || undefined,
    });

    await order.save();
    console.log('Order created with locations:', order);

    // Increment orderCount for each menu item in the order
    if (Array.isArray(items)) {
      for (const item of items) {
        await MenuItem.updateOne(
          { name: item.name, vendorId: vendorObjectId },
          { $inc: { orderCount: item.quantity || 1 } }
        );
      }
    }

    // Notify vendor
    if (vendor.expoPushToken) {
      await sendExpoPushNotification(
        vendor.expoPushToken,
        { title: 'New Order', body: `You have a new order from ${customerName}` },
        { orderId: order._id }
      );
    }

    // Emit socket event for new order
    const io = req.app.get('io');
    if (io) {
      console.log('[SOCKET] Emitting orderCreated to deliveryBoys:', order);
      io.to('deliveryBoys').emit('orderCreated', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get all orders for the authenticated user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders', error: error.message });
  }
};

// Update delivery boy location when accepting order
const updateDeliveryBoyLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, address } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: No delivery boy found' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update delivery boy location in the order
    order.locations.deliveryBoy = {
      latitude: latitude || null,
      longitude: longitude || null,
      address: address || await getAddressFromCoordinates(latitude, longitude),
      timestamp: new Date()
    };

    // Set delivery boy ID if not already set
    if (!order.deliveryBoyId) {
      order.deliveryBoyId = req.user._id;
    }

    await order.save();
    console.log('Delivery boy location updated for order:', orderId);

    res.json(order);
  } catch (error) {
    console.error('Error updating delivery boy location:', error);
    res.status(500).json({ message: 'Error updating delivery boy location', error: error.message });
  }
};

// Get available (unassigned, pending) orders for delivery boys
const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'pending',
      $or: [
        { deliveryBoyId: { $exists: false } },
        { deliveryBoyId: null }
      ]
    }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ message: 'Error fetching available orders', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus,
  createOrder,
  getUserOrders,
  updateDeliveryBoyLocation,
  getAvailableOrders,
}; 