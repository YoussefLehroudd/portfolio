const express = require('express');
const router = express.Router();
const Career = require('../models/Career');
const auth = require('../middleware/auth');
const { resolveEmailSettings } = require('../utils/emailSettings');
const { sendToSubscribers, renderCareerEmail, renderCareerEmailText, getSiteUrl } = require('../utils/subscriberMailer');

const normalizeCareer = (career) => {
  const careerData = career?.toJSON ? career.toJSON() : career || {};
  let items = careerData.items;

  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  careerData.items = items;
  return careerData;
};

const defaultCareer = {
  headline: 'Career Journey',
  subheadline: 'Where I studied and what I build today',
  intro:
    'From structured learning to real-world delivery, I build full-stack products that feel fast, intentional, and reliable.',
  items: [
    {
      title: 'Full Stack Developer',
      place: 'Freelance / Remote',
      period: '2023 — Present',
      description:
        'Designing and shipping end-to-end web products with React, Node.js, and modern databases, focusing on performance and clean UX.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'UI/UX'],
      isCurrent: true
    },
    {
      title: 'Software Engineering Studies',
      place: 'University / Institute',
      period: '2019 — 2023',
      description:
        'Built strong foundations in algorithms, systems, and web engineering while delivering multiple academic and personal projects.',
      tags: ['Computer Science', 'Algorithms', 'Systems', 'Projects'],
      isCurrent: false
    }
  ]
};

// Get career data
router.get('/', async (req, res) => {
  try {
    let career = await Career.findOne();
    if (!career) {
      career = await Career.create(defaultCareer);
    }
    res.json(normalizeCareer(career));
  } catch (error) {
    console.error('Error fetching career data:', error);
    res.status(500).json({ message: 'Error fetching career data' });
  }
});

// Update career data (protected route)
router.put('/', auth, async (req, res) => {
  try {
    const { headline, subheadline, intro, items } = req.body;

    let career = await Career.findOne();
    const previousItems = normalizeCareer(career).items || [];
    if (!career) {
      career = new Career();
    }

    const nextItems = Array.isArray(items) ? items : [];

    career.headline = headline || '';
    career.subheadline = subheadline || '';
    career.intro = intro || '';
    career.items = nextItems;

    await career.save();
    res.json(normalizeCareer(career));

    const buildKey = (item) => {
      const stableId = item?._id || item?.id || item?.createdAt;
      if (stableId) return String(stableId);
      return [
        item?.title,
        item?.place,
        item?.period
      ].map((value) => String(value || '').trim().toLowerCase()).join('|');
    };

    const previousKeys = new Set(
      previousItems
        .filter((item) => item?.title || item?.place || item?.period)
        .map(buildKey)
    );

    const newItems = nextItems.filter((item) => {
      if (!(item?.title || item?.place || item?.period)) return false;
      const key = buildKey(item);
      return key && !previousKeys.has(key);
    });

    if (newItems.length) {
      try {
        const siteUrl = getSiteUrl(req);
        const settings = await resolveEmailSettings();
        sendToSubscribers({
          subject: 'New career update',
          siteUrl,
          provider: settings.provider,
          tracking: { enabled: true, category: 'career' },
          renderEmail: ({ unsubscribeUrl }) => ({
            html: renderCareerEmail(newItems, {
              siteUrl,
              fromName: settings.fromName,
              logoUrl: settings.logoUrl,
              unsubscribeUrl
            }),
            text: renderCareerEmailText(newItems, {
              siteUrl,
              fromName: settings.fromName,
              unsubscribeUrl
            })
          })
        }).catch((error) => {
          console.error('Career announcement send error:', error);
        });
      } catch (mailError) {
        console.error('Failed to send career announcement:', mailError);
      }
    }
  } catch (error) {
    console.error('Error updating career data:', error);
    res.status(500).json({ message: 'Error updating career data' });
  }
});

module.exports = router;
