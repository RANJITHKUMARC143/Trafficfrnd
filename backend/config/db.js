const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB by default
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/Trafficfrnd';
    
    console.log(`Connecting to MongoDB: ${mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Make sure MongoDB is running locally on port 27017');
    process.exit(1);
  }
};

module.exports = connectDB; 