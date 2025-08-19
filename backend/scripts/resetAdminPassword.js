const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Trafficfrnd';

async function resetAdminPassword() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const email = 'admin@trafficfrnd.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await User.updateOne(
    { email },
    { $set: { role: 'admin', password: hashedPassword } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Role set to 'admin' and password reset for user: ${email}`);
  } else if (result.matchedCount > 0) {
    console.log(`User found but no changes made (already admin/password unchanged): ${email}`);
    } else {
    console.log(`User not found: ${email}`);
  }
  await mongoose.disconnect();
    }

resetAdminPassword().catch(err => {
  console.error('Error updating admin role/password:', err);
  process.exit(1);
}); 