const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const Review = require('../models/Review');
const cloudinary = require('../utils/cloudinary');
const Avatar = require('../models/Avatar');
const { getIo } = require('../utils/socket');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

const bufferToStream = (buffer) => {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
  return readable;
};

const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Public: get approved reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(30);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Public: submit review (optional image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Image must be PNG, JPG, or WEBP.' });
      }

      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'portfolio/reviews',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        bufferToStream(req.file.buffer).pipe(uploadStream);
      });

      const result = await uploadPromise;
      imageUrl = result.secure_url;
    } else if (req.body?.avatarId) {
      const avatar = await Avatar.findById(req.body.avatarId);
      if (!avatar || !avatar.isActive) {
        return res.status(400).json({ message: 'Selected avatar is not available.' });
      }
      imageUrl = avatar.imageUrl;
    }

    const review = new Review({
      name,
      message,
      imageUrl,
      status: 'pending'
    });

    const saved = await review.save();
    const io = getIo();
    if (io) {
      const payload = saved?.toJSON ? saved.toJSON() : saved;
      io.to('admins').emit('review:new', payload);
    }
    res.status(201).json({ message: 'Review submitted', review: saved });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

module.exports = router;
