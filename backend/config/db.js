const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Using the main Trafficfrnd database
    const conn = await mongoose.connect('mongodb://localhost:27017/Trafficfrnd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 