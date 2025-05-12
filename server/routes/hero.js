const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hero = require('../models/Hero');

// Get hero data
router.get('/', async (req, res) => {
  try {
    let heroData = await Hero.findOne();
    
    // If no hero data exists, create default data
    if (!heroData) {
      heroData = await Hero.create({});
    }
    
    res.json(heroData);
  } catch (error) {
    console.error('Error fetching hero data:', error);
    res.status(500).json({ message: 'Error fetching hero data' });
  }
});

// Update hero data (protected route)
router.put('/', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      title,
      description,
      splineUrl,
      primaryButton,
      secondaryButton
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !title || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find existing hero data or create new one
    let heroData = await Hero.findOne();
    
    if (heroData) {
      // Update existing hero data
      heroData.firstName = firstName;
      heroData.lastName = lastName;
      heroData.title = title;
      heroData.description = description;
      heroData.splineUrl = splineUrl;
      heroData.primaryButton = primaryButton;
      heroData.secondaryButton = secondaryButton;
      
      await heroData.save();
    } else {
      // Create new hero data
      heroData = await Hero.create({
        firstName,
        lastName,
        title,
        description,
        splineUrl,
        primaryButton,
        secondaryButton
      });
    }

    res.json({ message: 'Hero data updated successfully', data: heroData });
  } catch (error) {
    console.error('Error updating hero data:', error);
    res.status(500).json({ message: 'Error updating hero data' });
  }
});

module.exports = router;
