const express = require('express');
const Profile = require('../models/Profile');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const profile = await Profile.findOne();
    if (!profile) {
      return res.json({ title: '', description: '', image: '' });
    }

    const data = profile.toJSON ? profile.toJSON() : profile;
    return res.json({
      title: typeof data.seoTitle === 'string' ? data.seoTitle : '',
      description: typeof data.seoDescription === 'string' ? data.seoDescription : '',
      image: typeof data.seoImage === 'string' ? data.seoImage : ''
    });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return res.status(500).json({ message: 'Error fetching SEO settings' });
  }
});

module.exports = router;
