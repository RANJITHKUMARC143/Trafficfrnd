const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Trafficfrnd';

async function setAdminRole() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const email = 'admin@trafficfrnd.com';
  const result = await User.updateOne(
    { email },
    { $set: { role: 'admin' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Role set to 'admin' for user: ${email}`);
  } else if (result.matchedCount > 0) {
    console.log(`User found but role was already 'admin': ${email}`);
  } else {
    console.log(`User not found: ${email}`);
  }
  await mongoose.disconnect();
}

setAdminRole().catch(err => {
  console.error('Error updating admin role:', err);
  process.exit(1);
}); 