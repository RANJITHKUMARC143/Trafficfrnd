const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const resetAdminPassword = async () => {
  try {
    console.log('Resetting admin password...');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@trafficfrnd.com' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@trafficfrnd.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully!');
      console.log('Email: admin@trafficfrnd.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user found. Resetting password...');
      
      // Reset password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser.password = hashedPassword;
      await adminUser.save();
      
      console.log('Admin password reset successfully!');
      console.log('Email: admin@trafficfrnd.com');
      console.log('Password: admin123');
    }

    console.log('\nYou can now log into the admin console with these credentials.');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    mongoose.connection.close();
  }
};

resetAdminPassword(); 