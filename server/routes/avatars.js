const express = require('express');
const Avatar = require('../models/Avatar');

const router = express.Router();

// Public: list active avatars
router.get('/', async (req, res) => {
  try {
    const avatars = await Avatar.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(avatars);
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({ message: 'Error fetching avatars' });
  }
});

module.exports = router;
