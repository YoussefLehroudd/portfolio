require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectMongo } = require('./config/database');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  try {
    await connectMongo();
    
    // Delete existing admin if any (to fix double hashing)
    await Admin.deleteMany({});

    // Create default admin (plain password, model will hash)
    const defaultUsername = 'Youssef';
    const defaultPassword = 'Youssef2004@'; // Change this in production!

    const admin = new Admin({
      username: defaultUsername,
      password: defaultPassword
    });

    await admin.save();
    console.log(`Default admin created successfully!`);
    console.log(`Username: ${defaultUsername}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('Please change the password after first login for security.');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
