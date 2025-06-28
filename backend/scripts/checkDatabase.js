const mongoose = require('mongoose');

const checkDatabase = async () => {
  try {
    // Connect to the same database as the main app
    const conn = await mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to database: ${conn.connection.name}`);
    console.log(`Database host: ${conn.connection.host}`);
    console.log(`Database port: ${conn.connection.port}`);

    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check specific collections
    const userCount = await conn.connection.db.collection('users').countDocuments();
    const deliveryBoyCount = await conn.connection.db.collection('deliveryboys').countDocuments();
    const vendorCount = await conn.connection.db.collection('vendors').countDocuments();
    const orderCount = await conn.connection.db.collection('orders').countDocuments();

    console.log('\nDocument counts:');
    console.log(`Users: ${userCount}`);
    console.log(`Delivery Boys: ${deliveryBoyCount}`);
    console.log(`Vendors: ${vendorCount}`);
    console.log(`Orders: ${orderCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkDatabase(); 