const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hero = require('../models/Hero');

const parseButton = (value, defaults) => {
  let btn = value;
  if (typeof btn === 'string') {
    try {
      btn = JSON.parse(btn);
    } catch {
      btn = {};
    }
  }

  return {
    text: typeof btn?.text === 'string' ? btn.text : defaults.text,
    link: typeof btn?.link === 'string' ? btn.link : defaults.link
  };
};

const normalizeHero = (heroData) => {
  if (!heroData) return heroData;
  const data = heroData.toJSON ? heroData.toJSON() : heroData;

  return {
    ...data,
    primaryButton: parseButton(data.primaryButton, { text: 'View My Work', link: '#projects' }),
    secondaryButton: parseButton(data.secondaryButton, { text: 'Get in Touch', link: '#contact' }),
    cvButton: parseButton(data.cvButton, { text: 'Download CV', link: '/youssef_cv.pdf' })
  };
};

const hydrateButtonsOnInstance = (heroInstance) => {
  if (!heroInstance) return;
  heroInstance.primaryButton = parseButton(heroInstance.primaryButton, { text: 'View My Work', link: '#projects' });
  heroInstance.secondaryButton = parseButton(heroInstance.secondaryButton, { text: 'Get in Touch', link: '#contact' });
  heroInstance.cvButton = parseButton(heroInstance.cvButton, { text: 'Download CV', link: '/youssef_cv.pdf' });
};

// Get hero data
router.get('/', async (req, res) => {
  try {
    let heroData = await Hero.findOne();
    hydrateButtonsOnInstance(heroData);

    // If no hero data exists, create default data
    if (!heroData) {
      heroData = await Hero.create({});
    }
    
    res.json(normalizeHero(heroData));
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
    hydrateButtonsOnInstance(heroData);

    if (heroData) {
      heroData.firstName = firstName;
      heroData.lastName = lastName;
      heroData.title = title;
      heroData.description = description;
      heroData.splineUrl = splineUrl;

      if (primaryButton && typeof primaryButton === 'object') {
        heroData.primaryButton = parseButton(primaryButton, heroData.primaryButton);
      }
      if (secondaryButton && typeof secondaryButton === 'object') {
        heroData.secondaryButton = parseButton(secondaryButton, heroData.secondaryButton);
      }
      if (cvButton && typeof cvButton === 'object') {
        heroData.cvButton = parseButton(cvButton, heroData.cvButton);
      }

      await heroData.save();
    } else {
      heroData = await Hero.create({
        firstName,
        lastName,
        title,
        description,
        splineUrl,
        primaryButton: primaryButton && typeof primaryButton === 'object'
          ? parseButton(primaryButton, { text: 'View My Work', link: '#projects' })
          : undefined,
        secondaryButton: secondaryButton && typeof secondaryButton === 'object'
          ? parseButton(secondaryButton, { text: 'Get in Touch', link: '#contact' })
          : undefined,
        cvButton: cvButton && typeof cvButton === 'object'
          ? parseButton(cvButton, { text: 'Download CV', link: '/youssef_cv.pdf' })
          : undefined,
      });
    }

    res.json({ message: 'Hero data updated successfully', data: normalizeHero(heroData) });
  } catch (error) {
    console.error('Error updating hero data:', error);
    res.status(500).json({ message: 'Error updating hero data' });
  }
});


module.exports = router;
