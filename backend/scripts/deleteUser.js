const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trafficfrnd');
    console.log('Connected to MongoDB');

    const email = 'ranjith143432@gmail.com';
    const result = await User.deleteOne({ email });
    if (result.deletedCount > 0) {
      console.log(`User with email ${email} deleted.`);
    } else {
      console.log(`No user found with email ${email}.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

deleteUser(); 