const express = require('express');
const router = express.Router();
const Social = require('../models/Social');
const auth = require('../middleware/auth');

// Get social links
router.get('/', async (req, res) => {
  try {
    let social = await Social.findOne();
    if (!social) {
      // Create default social links if none exist
      social = await Social.create({});
    }
    res.json(social);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update social links (protected route)
router.put('/', auth, async (req, res) => {
  try {
    const { github, whatsapp, instagram, linkedin } = req.body;
    let social = await Social.findOne();
    
    if (!social) {
      social = new Social({
        github,
        whatsapp,
        instagram,
        linkedin
      });
    } else {
      social.github = github;
      social.whatsapp = whatsapp;
      social.instagram = instagram;
      social.linkedin = linkedin;
    }

    await social.save();
    res.json(social);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
