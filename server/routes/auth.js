const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token route
router.get('/verify', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }
    const adminData = admin.toJSON ? admin.toJSON() : admin;
    delete adminData.password;
    res.json(adminData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
