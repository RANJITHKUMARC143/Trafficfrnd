const express = require('express');
const router = express.Router();
const userAuth = require('../controllers/userAuth');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userAuth.register);
router.post('/login', userAuth.login);

// Protected routes
router.get('/profile', auth, userAuth.getProfile);
router.put('/profile', auth, userAuth.updateProfile);
router.put('/location', auth, userAuth.updateLocation);
router.put('/push-token', auth, userAuth.updatePushToken);

router.get('/', async (req, res) => {
  try {
    const users = await require('../models/User').find({}, '-password');
    // Map _id to id for consistency
    const usersWithId = users.map(user => ({
      ...user.toObject(),
      id: user._id
    }));
    res.json(usersWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Delete user by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Update user by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    const user = await require('../models/User').findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Add user (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { username, email, password, name, phone, address, role } = req.body;
    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: 'Username, email, password, and name are required' });
    }
    const existingUser = await require('../models/User').findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already registered' });
    }
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await require('../models/User').create({
      username,
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      address: address || '',
      role: role || 'user'
    });
    res.status(201).json({ user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Error adding user', error: error.message });
  }
});

module.exports = router; 