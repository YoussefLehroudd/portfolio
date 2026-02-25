const express = require('express');
const auth = require('../middleware/auth');
const EmailLog = require('../models/EmailLog');

const router = express.Router();

const parseLimit = (value, fallback = 50, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
};

router.get('/', auth, async (req, res) => {
  try {
    const limit = parseLimit(req.query?.limit);
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json(Array.isArray(logs) ? logs : []);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ message: 'Error fetching email logs' });
  }
});

module.exports = router;
