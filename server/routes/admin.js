const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const { getIo } = require('../utils/socket');

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

module.exports = router;
