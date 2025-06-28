const mongoose = require('mongoose');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trafficfrnd');
    console.log('Connected to MongoDB');

    const email = 'ranjith143432@gmail.com';
    const username = 'Ranjith';
    const users = await User.find({ $or: [ { email }, { username } ] });
    if (users.length > 0) {
      console.log(`Found ${users.length} user(s) with email or username:`);
      users.forEach(user => {
        console.log(JSON.stringify(user, null, 2));
      });
    } else {
      console.log('No user found with email or username.');
    }
    
    // Check DeliveryBoy collection
    const deliveryBoy = await DeliveryBoy.findOne({ email });
    console.log('\n=== Checking DeliveryBoy Collection ===');
    if (deliveryBoy) {
      console.log('DeliveryBoy found:');
      console.log('ID:', deliveryBoy._id);
      console.log('Email:', deliveryBoy.email);
      console.log('FullName:', deliveryBoy.fullName);
      console.log('Role:', deliveryBoy.role);
      console.log('Has password:', !!deliveryBoy.password);
      console.log('Created at:', deliveryBoy.createdAt);
    } else {
      console.log('DeliveryBoy not found with email:', email);
    }
    
    // Check all users
    const allUsers = await User.find({}, 'email name username role');
    console.log('\n=== All Users in Database ===');
    if (allUsers.length === 0) {
      console.log('No users found in User collection');
    } else {
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.name || 'no name'}) - ${u.role}`);
      });
    }
    
    // Check all delivery boys
    const allDeliveryBoys = await DeliveryBoy.find({}, 'email fullName role');
    console.log('\n=== All DeliveryBoys in Database ===');
    if (allDeliveryBoys.length === 0) {
      console.log('No delivery boys found in DeliveryBoy collection');
    } else {
      allDeliveryBoys.forEach(d => {
        console.log(`- ${d.email} (${d.fullName || 'no name'}) - ${d.role}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser(); 