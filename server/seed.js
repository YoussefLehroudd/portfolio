const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectMongo } = require('./config/database');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  try {
    await connectMongo();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default admin
    const defaultUsername = 'Youssef';
    const defaultPassword = 'Youssef2004@'; // Change this in production!

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const admin = new Admin({
      username: defaultUsername,
      password: hashedPassword
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
