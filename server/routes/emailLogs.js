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

router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const normalizedIds = Array.from(new Set(
      ids.map((value) => String(value || '').trim()).filter(Boolean)
    ));

    if (!normalizedIds.length) {
      return res.status(400).json({ message: 'No email logs selected' });
    }

    if (normalizedIds.length > 200) {
      return res.status(400).json({ message: 'Too many logs selected at once' });
    }

    let deletedCount = 0;

    if (typeof EmailLog.deleteMany === 'function') {
      const result = await EmailLog.deleteMany({ _id: { $in: normalizedIds } });
      deletedCount = result?.deletedCount || 0;
    } else if (typeof EmailLog.destroy === 'function') {
      deletedCount = await EmailLog.destroy({ where: { id: normalizedIds } });
    } else if (typeof EmailLog.findById === 'function') {
      const results = await Promise.all(normalizedIds.map(async (id) => {
        const log = await EmailLog.findById(id);
        if (!log) return 0;
        if (typeof log.deleteOne === 'function') {
          await log.deleteOne();
        } else if (typeof EmailLog.findByIdAndDelete === 'function') {
          await EmailLog.findByIdAndDelete(id);
        } else if (typeof EmailLog.destroy === 'function') {
          await EmailLog.destroy({ where: { id } });
        }
        return 1;
      }));
      deletedCount = results.reduce((sum, value) => sum + value, 0);
    }

    const io = getIo();
    if (io) {
      normalizedIds.forEach((id) => {
        io.to('admins').emit('email:deleted', { id });
      });
    }

    return res.json({ deleted: deletedCount });
  } catch (error) {
    console.error('Error bulk deleting email logs:', error);
    return res.status(500).json({ message: 'Error deleting email logs' });
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
