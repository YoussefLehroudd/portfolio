const express = require('express');
const EmailLog = require('../models/EmailLog');
const { getIo } = require('../utils/socket');

const router = express.Router();

const pixel = Buffer.from(
  'R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

const sendPixel = (res) => {
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.status(200).end(pixel);
};

router.get('/track/:token', async (req, res) => {
  const token = typeof req.params?.token === 'string' ? req.params.token.trim() : '';
  if (!token) {
    return sendPixel(res);
  }

  try {
    const log = await EmailLog.findOne({ trackingId: token });
    if (log) {
      const currentCount = Number(log.openCount) || 0;
      log.openCount = currentCount + 1;
      if (!log.openedAt) {
        log.openedAt = new Date();
      }
      await log.save();

      const io = getIo();
      if (io) {
        const payload = log.toJSON ? log.toJSON() : log;
        io.to('admins').emit('email:updated', payload);
      }
    }
  } catch (error) {
    console.error('Email open tracking error:', error);
  }

  return sendPixel(res);
});

module.exports = router;
