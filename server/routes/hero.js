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
      secondaryButton,
      cvButton
    } = req.body;

    if (!firstName || !lastName || !title || !description) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    let heroData = await Hero.findOne();

    if (heroData) {
      heroData.firstName = firstName;
      heroData.lastName = lastName;
      heroData.title = title;
      heroData.description = description;
      heroData.splineUrl = splineUrl;

      if (primaryButton && typeof primaryButton === 'object') {
        heroData.primaryButton = primaryButton;
      }
      if (secondaryButton && typeof secondaryButton === 'object') {
        heroData.secondaryButton = secondaryButton;
      }
      if (cvButton && typeof cvButton === 'object') {
        heroData.cvButton = cvButton;
      }

      await heroData.save();
    } else {
      heroData = await Hero.create({
        firstName,
        lastName,
        title,
        description,
        splineUrl,
        primaryButton: primaryButton && typeof primaryButton === 'object' ? primaryButton : undefined,
        secondaryButton: secondaryButton && typeof secondaryButton === 'object' ? secondaryButton : undefined,
        cvButton: cvButton && typeof cvButton === 'object' ? cvButton : undefined,
      });
    }

    res.json({ message: 'Hero data updated successfully', data: heroData });
  } catch (error) {
    console.error('Error updating hero data:', error);
    res.status(500).json({ message: 'Error updating hero data' });
  }
});


module.exports = router;
