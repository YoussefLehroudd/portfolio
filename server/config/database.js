const mongoose = require('mongoose');
const ensureDirectories = require('../utils/ensureDirectories');
require('dotenv').config();

const connectMongo = async () => {
  // Ensure required directories exist
  await ensureDirectories();
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    if (mongoose.connection.readyState === 2) {
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  connectMongo,
  mongoose
};
