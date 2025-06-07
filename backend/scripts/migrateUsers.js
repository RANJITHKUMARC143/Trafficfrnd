const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sample users to migrate (replace with actual AsyncStorage data)
const usersToMigrate = [
  {
    username: 'RANJITHKUMAR C',
    email: 'ranjith143432@gmail.com',
    password: 'your_password_here',
    name: 'Ranjithkumar C',
    phone: '',
    address: '',
    role: 'user'
  },
  {
    username: 'Harsha',
    email: 'ranjith752000@gmail.com',
    password: 'your_password_here',
    name: 'Harsha',
    phone: '',
    address: '',
    role: 'user'
  }
];

async function migrateUsers() {
  try {
    console.log('Starting user migration...');
    
    for (const userData of usersToMigrate) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (existingUser) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`Migrated user: ${userData.email}`);
    }

    console.log('User migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUsers(); 