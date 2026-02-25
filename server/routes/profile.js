const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.admin.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      currentPassword,
      password,
      seoTitle,
      seoDescription,
      seoImage
    } = req.body;

    const cleanedSeoTitle = typeof seoTitle === 'string' ? seoTitle.trim() : '';
    const cleanedSeoDescription = typeof seoDescription === 'string' ? seoDescription.trim() : '';
    const cleanedSeoImage = typeof seoImage === 'string' ? seoImage.trim() : '';

    // If trying to change password, verify current password
    if (password) {
      const admin = await Admin.findById(req.admin.id);
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await Admin.findByIdAndUpdate(req.admin.id, { password: hashedPassword });
    }

    // Update profile
    let profile = await Profile.findOne({ userId: req.admin.id });
    if (!profile) {
      profile = new Profile({
        userId: req.admin.id,
        firstName,
        lastName,
        email,
        seoTitle: cleanedSeoTitle,
        seoDescription: cleanedSeoDescription,
        seoImage: cleanedSeoImage
      });
    } else {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.email = email;
      profile.seoTitle = cleanedSeoTitle;
      profile.seoDescription = cleanedSeoDescription;
      profile.seoImage = cleanedSeoImage;
    }

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
