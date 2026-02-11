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

const shouldExit = () => !process.env.VERCEL; // avoid process.exit in serverless

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
      if (shouldExit()) process.exit(1);
      throw err;
    }
    return;
  }

  if (!process.env.MONGODB_URI) {
    const msg = 'FATAL ERROR: MONGODB_URI is not defined.';
    console.error(msg);
    if (shouldExit()) process.exit(1);
    throw new Error(msg);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (shouldExit()) process.exit(1);
    throw err;
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
