const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const vendorAuthRoutes = require('./routes/vendorAuth');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const deliveryBoyRoutes = require('./routes/deliveryBoyRoutes');
const callRoutes = require('./routes/callRoutes');
const userAuthRoutes = require('./routes/userAuth');
const routeRoutes = require('./routes/routeRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const routeSessionRoutes = require('./routes/routeSessionRoutes');
const userOrderRoutes = require('./routes/userOrderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const rateLimit = require('express-rate-limit');
const DeliveryBoy = require('./models/DeliveryBoy');
const authenticateToken = require('./middleware/auth');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Set default JWT secret if not in environment
if (!process.env.JWT_SECRET) {
  console.log('JWT_SECRET not set in environment, using default for local development');
  process.env.JWT_SECRET = 'curiospry';
}

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Add timeout settings
server.timeout = 30000; // 30 seconds timeout
server.keepAliveTimeout = 30000; // 30 seconds keep-alive timeout

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.vendorId = decoded.vendorId;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Make io accessible to routes
app.set('io', io);

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Routes
app.use('/api/vendors', vendorAuthRoutes);
app.use('/api/vendors/menu', menuRoutes);
app.use('/api/vendors/orders', orderRoutes);
app.use('/api/vendors/dashboard', dashboardRoutes);
app.use('/api/vendors/analytics', analyticsRoutes);
app.use('/api/delivery', deliveryBoyRoutes);
app.use('/api/call', callRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users/journey', journeyRoutes);
app.use('/api/users/route-session', routeSessionRoutes);
app.use('/api', userAuthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user/orders', userOrderRoutes);
app.use('/api/payments', paymentRoutes);
// Registrations (admin)
app.use('/api/registrations', registrationRoutes);
// Static + uploads
const path = require('path');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/upload', uploadRoutes);

// Add delivery points route for admin console
app.use('/api/delivery-points', require('./routes/deliveryPointRoutes'));

// Register alert routes
app.use('/api/alerts', require('./routes/alertRoutes'));

// Register settings routes
app.use('/api/settings', require('./routes/settingsRoutes'));

// Profile update endpoints (JSON only)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user._id ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const updates = req.body || {};
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, select: '-password' }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Profile update error (profile):', error);
    return res.status(500).json({ message: 'Error updating profile' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Trust authenticated user; update their own profile regardless of path param
    const targetId = req.user && req.user._id ? req.user._id : null;
    if (!targetId) return res.status(401).json({ message: 'Unauthorized' });
    const updates = req.body || {};
    const user = await User.findByIdAndUpdate(
      targetId,
      { $set: updates },
      { new: true, select: '-password' }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Profile update error (by id):', error);
    return res.status(500).json({ message: 'Error updating profile' });
  }
});

// Guard old path to avoid ObjectId cast on "/api/orders/user"
app.get('/api/orders/user', authenticateToken, (req, res) => {
  return res.status(410).json({ message: 'Endpoint moved. Use /api/user/orders/user' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Add a root route for Render and browser visits
app.get('/', (req, res) => {
  res.send('Traffic Frnd API is running!');
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: 'Not Found' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  console.log('Socket handshake auth:', socket.handshake.auth);
  // If the client is a delivery boy, join the deliveryBoys room and a personal room
  if (socket.handshake.auth && socket.handshake.auth.role === 'delivery') {
    socket.join('deliveryBoys');
    const auth = socket.handshake.auth || {};
    const deliveryBoyId = String(auth.id || auth._id || '').trim();
    if (deliveryBoyId) {
      socket.join(`deliveryBoy:${deliveryBoyId}`);
      console.log('Socket', socket.id, 'joined rooms deliveryBoys and', `deliveryBoy:${deliveryBoyId}`);
    } else {
      console.log('Socket', socket.id, 'joined deliveryBoys room (no personal id provided)');
    }
  }

  // Handle delivery boy location updates
  socket.on('updateLocation', async (data) => {
    try {
      const { deliveryBoyId, location } = data;
      if (!deliveryBoyId || !location) return;
      const { latitude, longitude } = location;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
      // Update GeoJSON currentLocation
      await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          lastUpdated: new Date()
        }
      });
      // Broadcast to all clients
      io.emit('locationUpdated', { deliveryBoyId, location });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  });

  // Handle order status updates
  socket.on('updateOrderStatus', async (data) => {
    try {
      const { orderId, status } = data;
      // Update order status in database
      await Order.findByIdAndUpdate(orderId, { status });
      // Broadcast to all clients
      io.emit('orderStatusUpdated', { orderId, status });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  // Handle new orders: emit only to the assigned deliveryBoy if present; otherwise to the pool
  socket.on('newOrder', (order) => {
    try {
      const assignedId = order && order.deliveryBoyId ? String(order.deliveryBoyId) : '';
      if (assignedId) {
        io.to(`deliveryBoy:${assignedId}`).emit('orderCreated', order);
      } else {
        io.to('deliveryBoys').emit('orderCreated', order);
      }
    } catch (e) {
      console.error('Error emitting newOrder:', e);
    }
  });

  // Handle delivery boy status updates
  socket.on('updateDeliveryStatus', async (data) => {
    try {
      const { deliveryBoyId, status } = data;
      await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, { status });
      io.emit('deliveryStatusUpdated', { deliveryBoyId, status });
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  });

  // Handle room joining for specific orders
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
  });

  // Handle room leaving
  socket.on('leaveOrderRoom', (orderId) => {
    socket.leave(`order_${orderId}`);
    console.log(`Socket ${socket.id} left order room: order_${orderId}`);
  });

  // Handle chat messages
  socket.on('message', async (data) => {
    try {
      const { orderId, message, sender } = data;
      if (!orderId || !message || !sender) return;

      // Create message object
      const messageObj = {
        id: Date.now().toString(),
        text: message,
        sender,
        timestamp: new Date(),
        orderId
      };

      // Broadcast message to all clients in the order room
      io.to(`order_${orderId}`).emit('message', messageObj);
      console.log(`Message sent to order room ${orderId}:`, messageObj);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';  // Bind to all network interfaces
    
    server.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local URL: http://localhost:${PORT}`);
      console.log(`Network URL: http://${HOST}:${PORT}`);
      console.log('Available network interfaces:');
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`- http://${net.address}:${PORT}`);
          }
        }
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
}); 