const express = require('express');
const auth = require('../middleware/auth');
const EmailLog = require('../models/EmailLog');
const { getIo } = require('../utils/socket');

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

router.delete('/:id', auth, async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Email log not found' });
    }

    const logId = log._id || log.id || req.params.id;

    if (typeof log.deleteOne === 'function') {
      await log.deleteOne();
    } else if (typeof EmailLog.findByIdAndDelete === 'function') {
      await EmailLog.findByIdAndDelete(log._id || log.id);
    } else {
      await EmailLog.destroy({ where: { id: log._id || log.id } });
    }

    const io = getIo();
    if (io) {
      io.to('admins').emit('email:deleted', { id: logId });
    }

    return res.json({ message: 'Email log deleted successfully' });
  } catch (error) {
    console.error('Error deleting email log:', error);
    return res.status(500).json({ message: 'Error deleting email log' });
  }
});

module.exports = router;
