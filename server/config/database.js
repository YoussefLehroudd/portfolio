const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const ensureDirectories = require('../utils/ensureDirectories');
require('dotenv').config();

const dbType = (process.env.DB_TYPE || 'mongodb').toLowerCase();

// Initialize Sequelize instance early so models can import it
let sequelize = null;
if (dbType === 'mysql') {
  const dbName = process.env.MYSQL_DATABASE || process.env.MYSQL_DB || process.env.DB_NAME;
  sequelize = new Sequelize(
    dbName,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
      host: process.env.MYSQL_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
}

const connectDatabase = async () => {
  // Ensure required directories exist for file uploads
  await ensureDirectories();

  if (dbType === 'mysql') {
    try {
      await sequelize.authenticate();
      // Sync all defined models to ensure tables exist
      await sequelize.sync();
      console.log('Connected to MySQL');
    } catch (err) {
      console.error('MySQL connection error:', err);
      process.exit(1);
    }
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  connectDatabase,
  mongoose,
  sequelize,
  Sequelize,
  DataTypes,
  dbType
};
