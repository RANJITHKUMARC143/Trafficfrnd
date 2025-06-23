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

module.exports = router; 