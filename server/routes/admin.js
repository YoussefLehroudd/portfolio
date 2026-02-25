const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Subscriber = require('../models/Subscriber');
const { getIo } = require('../utils/socket');

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const getRecordId = (record) => {
  const raw = record?._id || record?.id;
  return raw ? String(raw) : '';
};

// Get all messages
router.get('/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ isRead: 1, createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Delete a message
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    await message.deleteOne();
    const io = getIo();
    if (io) {
      const messageId = message._id || message.id;
      io.to('admins').emit('message:delete', { id: messageId });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Mark a message as read/unread
router.patch('/messages/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const nextRead = typeof req.body?.isRead === 'boolean' ? req.body.isRead : true;
    message.isRead = nextRead;
    await message.save();

    const io = getIo();
    if (io) {
      const messageId = message._id || message.id;
      io.to('admins').emit('message:read', { id: messageId, isRead: nextRead });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message read status:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Reviews (admin)
router.get('/reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

router.patch('/reviews/:id/status', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const status = typeof req.body?.status === 'string' ? req.body.status : '';
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    review.status = status;
    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

router.delete('/reviews/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (typeof review.deleteOne === 'function') {
      await review.deleteOne();
    } else if (typeof Review.findByIdAndDelete === 'function') {
      await Review.findByIdAndDelete(review._id);
    } else {
      await Review.destroy({ where: { id: review._id || review.id } });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalMessages,
      recentMessages
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Get subscribers
router.get('/subscribers', auth, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

router.patch('/subscribers/:id', auth, async (req, res) => {
  try {
    const targetEmail = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const existing = await Subscriber.findOne({ email: targetEmail });
    if (existing && getRecordId(existing) !== String(req.params.id)) {
      return res.status(409).json({ message: 'Email already subscribed' });
    }

    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    subscriber.email = targetEmail;
    await subscriber.save();
    return res.json(subscriber);
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return res.status(500).json({ message: 'Error updating subscriber' });
  }
});

router.delete('/subscribers/:id', auth, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    if (typeof subscriber.deleteOne === 'function') {
      await subscriber.deleteOne();
    } else if (typeof Subscriber.findByIdAndDelete === 'function') {
      await Subscriber.findByIdAndDelete(subscriber._id);
    } else {
      await Subscriber.destroy({ where: { id: subscriber._id || subscriber.id } });
    }

    return res.json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return res.status(500).json({ message: 'Error deleting subscriber' });
  }
});

module.exports = router;
