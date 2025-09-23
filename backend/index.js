const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Item = require('./models/Item');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Journey = require('./models/Journey');
const Route = require('./models/Route');
const SelectedCheckpoint = require('./models/SelectedCheckpoint');
const UserRouteSession = require('./models/UserRouteSession');

const app = express();

// Configure CORS with more detailed options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Content-Length', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the public directory
app.use('/public', express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/profile-images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/Trafficfrnd';
console.log(`Connecting to MongoDB: ${mongoURI}`);

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    console.error('Make sure MongoDB is running locally on port 27017');
  });

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// User registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, name, phone, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      name,
      phone,
      address,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create and assign token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Construct full profile image URL if it exists
    const profileImageUrl = user.profileImage 
      ? `${req.protocol}://${req.get('host')}${user.profileImage}`
      : '';

    // Return user data with full profile image URL
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        profileImage: profileImageUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    // If a file was uploaded, add the path to updates
    if (req.file) {
      updates.profileImage = `/public/profile-images/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Fallback: Update user by ID (ensures compatibility if /api/users/profile is unavailable)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId.toString() !== id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updates = req.body || {};
    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, select: '-password' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile update (by id) error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create a new item
app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      seller: req.user.userId
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
});

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().populate('seller', 'username email');
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Error fetching items' });
  }
});

// Get a specific item
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('seller', 'username email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Error fetching item' });
  }
});

// Update an item
app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, seller: req.user.userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }

    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Error updating item' });
  }
});

// Delete an item
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.userId
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Error deleting item' });
  }
});

// Search items
app.get('/api/items/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const items = await Item.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    }).populate('seller', 'username email');
    res.json(items);
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ message: 'Error searching items' });
  }
});

// Get items by category
app.get('/api/items/category/:category', async (req, res) => {
  try {
    const items = await Item.find({ category: req.params.category })
      .populate('seller', 'username email');
    res.json(items);
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({ message: 'Error fetching items by category' });
  }
});

// Get items by seller
app.get('/api/sellers/:sellerId/items', async (req, res) => {
  try {
    const items = await Item.find({ seller: req.params.sellerId })
      .populate('seller', 'username email');
    res.json(items);
  } catch (error) {
    console.error('Get seller items error:', error);
    res.status(500).json({ message: 'Error fetching seller items' });
  }
});

// Upload profile photo
app.post('/api/users/:userId/profile-photo', authenticateToken, upload.single('profileImage'), async (req, res) => {
  console.log('=== Profile Photo Upload Request ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('File:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype,
    size: req.file.size,
    destination: req.file.destination,
    filename: req.file.filename,
    path: req.file.path
  } : 'No file uploaded');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if the user is updating their own profile
    if (req.user.userId !== req.params.userId) {
      console.log('User ID mismatch:', {
        tokenUserId: req.user.userId,
        requestedUserId: req.params.userId
      });
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      console.log('User not found:', req.params.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, user.profileImage);
      console.log('Checking old image path:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('Deleted old profile image:', oldImagePath);
      }
    }

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, 'public/profile-images');
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Update user's profile image
    const profileImagePath = `/public/profile-images/${req.file.filename}`;
    console.log('Setting new profile image path:', profileImagePath);
    
    user.profileImage = profileImagePath;
    await user.save();
    console.log('User profile updated in database');

    // Verify the file exists after save
    const fullPath = path.join(__dirname, profileImagePath);
    console.log('Verifying file exists at:', fullPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Uploaded file not found after save');
    }

    // Return the full URL for the profile image
    const profileImageUrl = `${req.protocol}://${req.get('host')}${profileImagePath}`;
    console.log('Returning profile image URL:', profileImageUrl);

    res.json({
      message: 'Profile photo updated successfully',
      profileImage: profileImageUrl
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      console.log('Attempting to clean up file after error:', filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up uploaded file after error');
      }
    }

    res.status(500).json({ 
      message: 'Error uploading profile photo',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete profile photo
app.delete('/api/users/:userId/profile-photo', authenticateToken, async (req, res) => {
  try {
    // Check if the user is updating their own profile
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the old profile image file if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Clear the profile image field
    user.profileImage = '';
    await user.save();

    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({ message: 'Error deleting profile photo' });
  }
});

// Update user location
app.post('/api/users/:userId/location', authenticateToken, async (req, res) => {
  try {
    console.log('Received location update request:', {
      userId: req.params.userId,
      tokenUserId: req.user.userId,
      location: req.body
    });

    // Check if the user is updating their own location
    if (req.user.userId !== req.params.userId) {
      console.log('User ID mismatch:', {
        tokenUserId: req.user.userId,
        requestedUserId: req.params.userId
      });
      return res.status(403).json({ message: 'Not authorized to update this user\'s location' });
    }

    const { latitude, longitude, address } = req.body;

    // Enhanced validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ 
        message: 'Invalid location data',
        details: 'Latitude and longitude must be numbers'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: 'Invalid latitude',
        details: 'Latitude must be between -90 and 90 degrees'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: 'Invalid longitude',
        details: 'Longitude must be between -180 and 180 degrees'
      });
    }

    // Validate address if provided
    if (address && typeof address !== 'string') {
      return res.status(400).json({
        message: 'Invalid address',
        details: 'Address must be a string'
      });
    }

    // Check if user exists before updating
    const existingUser = await User.findById(req.params.userId);
    if (!existingUser) {
      console.log('User not found:', req.params.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's location with validation
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          location: {
            latitude,
            longitude,
            address: address || '',
            updatedAt: new Date()
          }
        }
      },
      { 
        new: true, 
        select: '-password',
        runValidators: true // Enable mongoose validation
      }
    );

    console.log('Location updated successfully:', {
      userId: user._id,
      location: user.location
    });

    // Return the updated location with a success message
    res.json({
      message: 'Location updated successfully',
      location: {
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        address: user.location.address,
        updatedAt: user.location.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Error updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user location
app.get('/api/users/:userId/location', authenticateToken, async (req, res) => {
  try {
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.userId).select('location');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has no location set, return null
    if (!user.location || !user.location.latitude || !user.location.longitude) {
      return res.json({
        location: null,
        message: 'No location set for this user'
      });
    }

    // Return the location with a timestamp
    res.json({
      location: {
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        address: user.location.address || '',
        updatedAt: user.location.updatedAt
      },
      message: 'Location retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      message: 'Error fetching location',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Save or update journey
app.post('/api/users/:userId/journey', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { currentLocation, finalDestination, checkpoints, selectedCheckpoint } = req.body;
    if (!currentLocation || !finalDestination || !Array.isArray(checkpoints) || checkpoints.length !== 3) {
      return res.status(400).json({ message: 'Invalid journey data' });
    }
    let journey = await Journey.findOne({ user: req.params.userId });
    if (journey) {
      journey.currentLocation = currentLocation;
      journey.finalDestination = finalDestination;
      journey.checkpoints = checkpoints;
      journey.selectedCheckpoint = selectedCheckpoint;
      journey.updatedAt = new Date();
      await journey.save();
    } else {
      journey = new Journey({
        user: req.params.userId,
        currentLocation,
        finalDestination,
        checkpoints,
        selectedCheckpoint
      });
      await journey.save();
    }
    res.json({ message: 'Journey saved', journey });
  } catch (error) {
    console.error('Journey save error:', error);
    res.status(500).json({ message: 'Error saving journey' });
  }
});

// Get journey
app.get('/api/users/:userId/journey', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const journey = await Journey.findOne({ user: req.params.userId });
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    console.error('Journey fetch error:', error);
    res.status(500).json({ message: 'Error fetching journey' });
  }
});

// Save route and checkpoints
app.post('/api/routes', authenticateToken, async (req, res) => {
  try {
    const { startLocation, destination, checkpoints, distance, duration } = req.body;
    
    if (!startLocation || !destination || !Array.isArray(checkpoints)) {
      return res.status(400).json({ message: 'Invalid route data' });
    }

    const route = new Route({
      user: req.user.userId,
      startLocation,
      destination,
      checkpoints,
      distance,
      duration
    });

    await route.save();
    res.status(201).json({ message: 'Route saved successfully', route });
  } catch (error) {
    console.error('Route save error:', error);
    res.status(500).json({ message: 'Error saving route' });
  }
});

// Get user's routes
app.get('/api/routes', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

// Select checkpoint
app.post('/api/routes/:routeId/checkpoint', authenticateToken, async (req, res) => {
  try {
    const { checkpointId } = req.body;
    const route = await Route.findById(req.params.routeId);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const checkpoint = route.checkpoints.id(checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ message: 'Checkpoint not found in route' });
    }

    let selectedCheckpoint = await SelectedCheckpoint.findOne({
      user: req.user.userId,
      route: route._id
    });

    if (selectedCheckpoint) {
      selectedCheckpoint.checkpoint = checkpointId;
      selectedCheckpoint.status = 'pending';
      selectedCheckpoint.selectedAt = new Date();
    } else {
      selectedCheckpoint = new SelectedCheckpoint({
        user: req.user.userId,
        route: route._id,
        checkpoint: checkpointId
      });
    }

    await selectedCheckpoint.save();
    res.json({ message: 'Checkpoint selected successfully', selectedCheckpoint });
  } catch (error) {
    console.error('Select checkpoint error:', error);
    res.status(500).json({ message: 'Error selecting checkpoint' });
  }
});

// Get selected checkpoint
app.get('/api/routes/:routeId/selected-checkpoint', authenticateToken, async (req, res) => {
  try {
    const selectedCheckpoint = await SelectedCheckpoint.findOne({
      user: req.user.userId,
      route: req.params.routeId
    }).populate('route');

    if (!selectedCheckpoint) {
      return res.status(404).json({ message: 'No checkpoint selected for this route' });
    }

    res.json({ selectedCheckpoint });
  } catch (error) {
    console.error('Get selected checkpoint error:', error);
    res.status(500).json({ message: 'Error fetching selected checkpoint' });
  }
});

// Update checkpoint status
app.put('/api/routes/:routeId/checkpoint-status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'arrived', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const selectedCheckpoint = await SelectedCheckpoint.findOneAndUpdate(
      {
        user: req.user.userId,
        route: req.params.routeId
      },
      { status },
      { new: true }
    );

    if (!selectedCheckpoint) {
      return res.status(404).json({ message: 'Selected checkpoint not found' });
    }

    res.json({ message: 'Checkpoint status updated successfully', selectedCheckpoint });
  } catch (error) {
    console.error('Update checkpoint status error:', error);
    res.status(500).json({ message: 'Error updating checkpoint status' });
  }
});

// Create or update a user's real-time route session
app.post('/api/users/:userId/route-session', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { route, currentLocation, destination, selectedCheckpoints } = req.body;
    if (!route || !currentLocation || !destination) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let session = await UserRouteSession.findOne({ user: req.params.userId, route });
    if (session) {
      session.currentLocation = currentLocation;
      session.destination = destination;
      session.selectedCheckpoints = selectedCheckpoints || [];
      session.updatedAt = new Date();
      await session.save();
    } else {
      session = new UserRouteSession({
        user: req.params.userId,
        route,
        currentLocation,
        destination,
        selectedCheckpoints: selectedCheckpoints || []
      });
      await session.save();
    }
    res.json({ message: 'Route session saved', session });
  } catch (error) {
    console.error('Route session error:', error);
    res.status(500).json({ message: 'Error saving route session' });
  }
});

// Update only the current location in a session
app.put('/api/users/:userId/route-session/location', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { routeId, latitude, longitude } = req.body;
    if (!routeId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }
    const session = await UserRouteSession.findOne({ user: req.params.userId, route: routeId });
    if (!session) {
      return res.status(404).json({ message: 'Route session not found' });
    }
    session.currentLocation = { latitude, longitude, updatedAt: new Date() };
    await session.save();
    res.json({ message: 'Current location updated', session });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Error updating current location' });
  }
});

// Update checkpoint progress in a session
app.put('/api/users/:userId/route-session/checkpoint', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { routeId, checkpointId, status } = req.body;
    if (!routeId || !checkpointId || !['pending', 'arrived', 'skipped', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }
    const session = await UserRouteSession.findOne({ user: req.params.userId, route: routeId });
    if (!session) {
      return res.status(404).json({ message: 'Route session not found' });
    }
    // Find or add checkpoint progress
    let cp = session.checkpointProgress.find(c => c.checkpointId.toString() === checkpointId);
    if (cp) {
      cp.status = status;
      cp.updatedAt = new Date();
    } else {
      session.checkpointProgress.push({ checkpointId, status, updatedAt: new Date() });
    }
    await session.save();
    res.json({ message: 'Checkpoint progress updated', session });
  } catch (error) {
    console.error('Update checkpoint progress error:', error);
    res.status(500).json({ message: 'Error updating checkpoint progress' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.use('/api/delivery-points', require('./routes/deliveryPointRoutes'));
// Payments
app.use('/api/payments', require('./routes/paymentRoutes'));

// Click-to-call proxy route
app.use('/api/call', require('./routes/callRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} and listening on all interfaces`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Network URL: http://192.168.92.230:${PORT}`);
});