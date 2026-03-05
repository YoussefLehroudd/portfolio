const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Stock = require('../models/Stock');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => normalizeText(tag)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[#,]/)
      .map((tag) => normalizeText(tag))
      .filter(Boolean);
  }
  return [];
};

const normalizeStatus = (value) => {
  if (value === 'active') return 'active';
  if (value === 'draft') return 'draft';
  return '';
};

// Get all stock items (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const items = await Stock.find().sort('-createdAt');
    res.json(items);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Error fetching stocks' });
  }
});

// Create stock item
router.post('/', auth, async (req, res) => {
  try {
    const title = normalizeText(req.body?.title);
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const emailBody = typeof req.body?.emailBody === 'string' ? req.body.emailBody : '';
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : '';
    const status = normalizeStatus(req.body?.status) || 'draft';
    if (!['draft', 'active'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const tags = normalizeTags(req.body?.tags);

    const stock = new Stock({
      title,
      emailBody,
      imageUrl,
      status,
      tags
    });

    const saved = await stock.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating stock:', error);
    return res.status(500).json({ message: 'Error creating stock' });
  }
});

// Update stock item
router.patch('/:id', auth, async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (typeof req.body?.title === 'string') {
      const title = normalizeText(req.body.title);
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      stock.title = title;
    }

    if (typeof req.body?.emailBody === 'string') {
      stock.emailBody = req.body.emailBody;
    }

    if (typeof req.body?.imageUrl === 'string') {
      stock.imageUrl = req.body.imageUrl;
    }

    if (req.body?.status !== undefined) {
      const status = normalizeStatus(req.body.status);
      if (!['draft', 'active'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      stock.status = status;
    }

    if (req.body?.tags !== undefined) {
      stock.tags = normalizeTags(req.body.tags);
    }

    const saved = await stock.save();
    return res.json(saved);
  } catch (error) {
    console.error('Error updating stock:', error);
    return res.status(500).json({ message: 'Error updating stock' });
  }
});

// Delete stock item
router.delete('/:id', auth, async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (typeof stock.deleteOne === 'function') {
      await stock.deleteOne();
    } else if (typeof Stock.findByIdAndDelete === 'function') {
      await Stock.findByIdAndDelete(stock._id);
    } else {
      await Stock.destroy({ where: { id: stock._id || stock.id } });
    }

    return res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    return res.status(500).json({ message: 'Error deleting stock' });
  }
});

module.exports = router;
