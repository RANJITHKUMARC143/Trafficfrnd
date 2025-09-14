const Order = require('../models/Order');
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Earnings = require('../models/Earnings');
const DeliveryBoy = require('../models/DeliveryBoy');
const Alert = require('../models/Alert');
const MenuItem = require('../models/MenuItem');
const haversine = require('haversine-distance');
// ---- Delivery Fee Calculation (Traffic Frnd Model) ----
function calculateBaseFareByDistance(meters) {
  // Updated slabs per latest request
  if (meters <= 500) return 45;        // 0–500 m
  if (meters <= 1000) return 40;       // 500–1000 m
  if (meters <= 2000) return 30;       // 1000–2000 m
  if (meters <= 3000) return 30;       // 2000–3000 m
  return 30;                            // >3000 m
}

function calculateTimeAdjustment(actualMinutes = 0, freeMinutes = 20, ratePerMinute = 1) {
  const over = Math.max(0, Math.round(actualMinutes) - freeMinutes);
  return over * ratePerMinute;
}

async function computeDeliveryFee({
  userLat,
  userLng,
  pointLat,
  pointLng,
  etaMinutes = 0,
  surgePeak = false,
  surgeRain = false,
  surgeFestival = false,
}) {
  let distanceMeters = 0;
  if (
    typeof userLat === 'number' && typeof userLng === 'number' &&
    typeof pointLat === 'number' && typeof pointLng === 'number'
  ) {
    try {
      distanceMeters = haversine(
        { lat: pointLat, lon: pointLng },
        { lat: userLat, lon: userLng }
      );
    } catch (e) {
      distanceMeters = 0;
    }
  }

  const baseFare = calculateBaseFareByDistance(distanceMeters);
  const timeAdj = calculateTimeAdjustment(etaMinutes);
  const surgeReasons = [];
  let surgePercent = 0;
  if (surgePeak) { surgePercent += 0.3; surgeReasons.push('peak'); }
  if (surgeRain) { surgePercent += 0.2; surgeReasons.push('rain'); }
  if (surgeFestival) { surgePercent += 0.2; surgeReasons.push('festival'); }
  // Global driver surge (+20%) if any driver toggled surge recently
  try {
    const DeliveryBoyModel = require('../models/DeliveryBoy');
    const windowMs = 30 * 60 * 1000;
    const anySurge = await DeliveryBoyModel.exists({ 'surge.enabled': true, 'surge.lastToggledAt': { $gte: new Date(Date.now() - windowMs) } });
    if (anySurge) { surgePercent += 0.2; surgeReasons.push('driver_surge'); }
  } catch {}
  const preSurge = baseFare + timeAdj;
  const finalFee = Math.max(0, Math.round(preSurge * (1 + surgePercent)));

  return {
    deliveryFee: finalFee,
    feeBreakdown: {
      baseFare,
      distanceMeters: Math.round(distanceMeters),
      timeMinutes: etaMinutes || 0,
      timeFreeMinutes: 20,
      timeAdjustment: timeAdj,
      surgePercent,
      surgeReasons,
      finalFee,
    },
  };
}


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
  try {
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
  } catch (err) {
    console.warn('Expo push send failed (non-fatal):', err?.message || err);
  }
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
    
    // For users, allow them to fetch their own orders
    // For vendors/delivery boys, allow them to fetch orders they're involved with
    let query = { _id: req.params.orderId };
    
    if (req.user.role === 'user') {
      query.user = req.user._id;
    } else if (req.user.role === 'vendor') {
      query.vendorId = req.user._id;
    } else if (req.user.role === 'delivery') {
      query.deliveryBoyId = req.user._id;
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admin can fetch any order
      query = { _id: req.params.orderId };
    }

    const order = await Order.findOne(query)
      .populate('deliveryBoyId', 'fullName phone vehicleType vehicleNumber rating totalDeliveries onTimeRate currentLocation')
      .populate('vendorId', 'businessName phone address location')
      .populate('user', 'name email phone');

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
    let { status } = req.body;
    // Normalize client aliases to match Order enum
    const statusAliasMap = {
      out_for_delivery: 'enroute',
      en_route: 'enroute',
      on_the_way: 'enroute',
      delivered: 'completed'
    };
    if (typeof status === 'string' && statusAliasMap[status]) {
      status = statusAliasMap[status];
    }
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
    const isVendorOwner = order.vendorId && order.vendorId.toString() === req.user._id.toString();
    const isAssignedDeliveryBoy = order.deliveryBoyId && order.deliveryBoyId.toString() === req.user._id.toString();
    if (!isVendorOwner && !isAssignedDeliveryBoy) {
      return res.status(403).json({ message: 'Forbidden: Not your order' });
    }

    // Optional: whitelist of known statuses; if unknown, keep but log
    const allowedStatuses = [
      'pending',
      'confirmed',
      'enroute',
      'preparing',
      'ready',
      'completed',
      'cancelled'
    ];
    if (!allowedStatuses.includes(status)) {
      console.warn('updateOrderStatus: unrecognized status received, proceeding:', status);
    }

    console.log('updateOrderStatus: attempting to set status', { orderId, from: order.status, to: status });
    order.status = status;
    order.updatedAt = Date.now();
    try {
      await order.save();
    } catch (saveErr) {
      console.error('updateOrderStatus: save failed', saveErr);
      return res.status(500).json({ message: 'Failed to update order status', error: saveErr.message });
    }
    // Emit targeted update to involved parties
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${orderId}`).emit('orderStatusUpdated', { orderId, status: order.status });
      if (order.deliveryBoyId) io.to(`deliveryBoy:${String(order.deliveryBoyId)}`).emit('orderStatusUpdated', { orderId, status: order.status });
    }
    console.log('updateOrderStatus: success', { orderId, currentStatus: order.status, requestedStatus: status, deliveryBoyId: order.deliveryBoyId, user: req.user._id, role: req.user.role });
    // Return freshly loaded order to ensure client sees persisted changes
    const fresh = await Order.findById(orderId);
    res.json({ success: true, order: fresh || order });
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
      selectedDeliveryPoint, // New: selected delivery point from client
      userId, // Optional: admin creating order for a specific user
      customerName: customerNameOverride,
      payment // Payment information from client
    } = req.body;
    // If admin/super_admin passes a userId, allow creating orders on behalf of that user
    let orderUserId = req.user._id;
    if (userId) {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Forbidden: Only admin can specify userId' });
      }
      orderUserId = userId;
    }
    const customerName = customerNameOverride || req.user.name || req.user.username || 'Customer';

    // Sanitize items: drop blanks, coerce numbers, enforce min quantity 1
    let sanitizedItems = Array.isArray(items) ? items
      .filter(it => it && typeof it.name === 'string' && it.name.trim().length > 0)
      .map(it => ({
        name: String(it.name).trim(),
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Math.max(0, Number(it.price) || 0)
      })) : [];
    if (sanitizedItems.length === 0) {
      return res.status(400).json({ message: 'At least one item with a name is required' });
    }
    const computedTotal = sanitizedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    // vendorId and routeId are optional for admin-created orders
    // Vehicle number is optional in the new flow

    // Convert vendorId and routeId to ObjectId if provided
    const vendorObjectId = vendorId ? new mongoose.Types.ObjectId(vendorId) : null;
    const routeObjectId = routeId ? new mongoose.Types.ObjectId(routeId) : null;

    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
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
        latitude: vendor?.location?.coordinates?.[1] || null, // MongoDB stores as [longitude, latitude]
        longitude: vendor?.location?.coordinates?.[0] || null,
        address: vendor ? (vendor.address ? `${vendor.address.street || ''}, ${vendor.address.city || ''}, ${vendor.address.state || ''}`.trim() : await getAddressFromCoordinates(vendor.location?.coordinates?.[1], vendor.location?.coordinates?.[0])) : '',
        timestamp: new Date()
      },
      deliveryBoy: {
        latitude: null,
        longitude: null,
        address: '',
        timestamp: null
      }
    };

    // Compute delivery fee based on distance between user and selected delivery point (preferred),
    // fallback to vendor-user distance if point not provided
    const { surgePeak = false, surgeRain = false, surgeFestival = false, etaMinutes } = req.body || {};
    const usePoint = req.body?.selectedDeliveryPoint &&
      typeof req.body.selectedDeliveryPoint.latitude === 'number' &&
      typeof req.body.selectedDeliveryPoint.longitude === 'number';
    const calcInput = usePoint ? {
      userLat: locationData.user.latitude,
      userLng: locationData.user.longitude,
      pointLat: req.body.selectedDeliveryPoint.latitude,
      pointLng: req.body.selectedDeliveryPoint.longitude,
      etaMinutes: typeof etaMinutes === 'number' ? etaMinutes : 0,
      surgePeak,
      surgeRain,
      surgeFestival,
    } : {
      userLat: locationData.user.latitude,
      userLng: locationData.user.longitude,
      pointLat: locationData.vendor.latitude,
      pointLng: locationData.vendor.longitude,
      etaMinutes: typeof etaMinutes === 'number' ? etaMinutes : 0,
      surgePeak,
      surgeRain,
      surgeFestival,
    };
    const fee = await computeDeliveryFee(calcInput);

    // Prepare selectedDeliveryPoint with GeoJSON location
    let processedDeliveryPoint = selectedDeliveryPoint;
    if (selectedDeliveryPoint && selectedDeliveryPoint.latitude && selectedDeliveryPoint.longitude) {
      processedDeliveryPoint = {
        ...selectedDeliveryPoint,
        location: {
          type: 'Point',
          coordinates: [selectedDeliveryPoint.longitude, selectedDeliveryPoint.latitude]
        }
      };
    }

    const order = new Order({
      vendorId: vendorObjectId || undefined,
      routeId: routeObjectId || undefined,
      customerName,
      items: sanitizedItems,
      totalAmount: typeof totalAmount === 'number' && totalAmount > 0 ? totalAmount : computedTotal,
      deliveryFee: fee.deliveryFee,
      feeBreakdown: fee.feeBreakdown,
      status: 'pending',
      deliveryAddress,
      specialInstructions,
      vehicleNumber,
      locations: locationData,
      timestamp: new Date(),
      updatedAt: new Date(),
      user: orderUserId,
      selectedDeliveryPoint: processedDeliveryPoint || undefined,
      payment: payment || { 
        method: 'cod', 
        status: 'pending', 
        amount: 0, 
        gateway: null,
        refund: { amount: 0, id: null, at: null }
      }
    });

    await order.save();
    console.log('Order created with locations:', order);

    // Increment orderCount for each menu item in the order
    if (Array.isArray(sanitizedItems) && vendorObjectId) {
      for (const item of sanitizedItems) {
        await MenuItem.updateOne(
          { name: item.name, vendorId: vendorObjectId },
          { $inc: { orderCount: item.quantity || 1 } }
        );
      }
    }

    // Notify vendor
    if (vendor?.expoPushToken) {
      await sendExpoPushNotification(
        vendor.expoPushToken,
        { title: 'New Order', body: `You have a new order from ${customerName}` },
        { orderId: order._id }
      );
    }

    // Smart assignment: assign only to nearest available delivery boy within 1km of selectedDeliveryPoint
    try {
      const io = req.app.get('io');
      const point = order.selectedDeliveryPoint;
      if (point && typeof point.latitude === 'number' && typeof point.longitude === 'number') {
        const lng = point.longitude;
        const lat = point.latitude;
        // Find nearby candidates within 1km, sorted by distance
        const candidates = await DeliveryBoy.find({
          isActive: true,
          status: 'active',
          currentLocation: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: 1000
            }
          }
        }).limit(10).lean();

        // Current-load counts should match our canonical in-progress statuses
        const activeStatuses = ['confirmed', 'preparing', 'enroute'];
        // Compute current load for each candidate
        const candidatesWithLoad = await Promise.all(candidates.map(async (c, index) => {
          const load = await Order.countDocuments({ deliveryBoyId: c._id, status: { $in: activeStatuses } });
          return { candidate: c, load, index };
        }));

        // Prioritize: online first (if flag exists), then lowest load, then by nearest (original order)
        candidatesWithLoad.sort((a, b) => {
          const aOnline = !!a.candidate.isOnline ? 0 : 1;
          const bOnline = !!b.candidate.isOnline ? 0 : 1;
          if (aOnline !== bOnline) return aOnline - bOnline;
          if (a.load !== b.load) return a.load - b.load;
          return a.index - b.index;
        });

        const top = candidatesWithLoad[0];
        if (top && top.candidate) {
          // Do NOT assign yet. Emit to nearest candidate as an available (unassigned) order.
          // The driver will accept to claim, which sets deliveryBoyId in updateOrderStatus.
          if (io) {
            console.log('[SOCKET] Emitting orderCreated to deliveryBoy room:', String(top.candidate._id));
            io.to(`deliveryBoy:${String(top.candidate._id)}`).emit('orderCreated', order);
          }
        } else {
          console.log('[ASSIGNMENT] No nearby drivers <1km. Not broadcasting to pool. Order remains pending and unassigned.');
        }
      } else {
        console.log('[ASSIGNMENT] No selectedDeliveryPoint. Skipping broadcast.');
      }
    } catch (assignErr) {
      console.error('Smart assignment failed. Not broadcasting to pool:', assignErr);
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

// Get available (unassigned, pending) orders for delivery boys - geofenced by 1km from driver's currentLocation
const getAvailableOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: No delivery boy found' });
    }
    // Load driver's latest location
    const driver = await DeliveryBoy.findById(req.user._id).lean();
    const coords = driver?.currentLocation?.coordinates;
    if (!coords || coords.length !== 2 || (coords[0] === 0 && coords[1] === 0)) {
      // No valid location → no available orders
      return res.json([]);
    }
    const [driverLng, driverLat] = coords; // [lng, lat]

    // Only pending & unassigned orders within 1km of driver, using selectedDeliveryPoint
    // selectedDeliveryPoint is stored in order as { latitude, longitude }
    const nearby = await Order.aggregate([
      { $geoNear: {
          near: { type: 'Point', coordinates: [ driverLng, driverLat ] },
          distanceField: 'distance',
          maxDistance: 1000,
          spherical: true,
          query: {
            status: 'pending',
            $or: [ { deliveryBoyId: { $exists: false } }, { deliveryBoyId: null } ],
            'selectedDeliveryPoint.location': { $exists: true }
          }
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    res.json(nearby);
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