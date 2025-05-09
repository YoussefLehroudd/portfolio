const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// MongoDB configuration
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// MySQL configuration
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  connectMongo,
  connectMySQL,
  sequelize,
  mongoose
};
