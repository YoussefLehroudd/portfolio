const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Hero = require('../models/Hero');
const cloudinary = require('../utils/cloudinary');
const { Readable } = require('stream');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to convert buffer to stream
const bufferToStream = (buffer) => {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readable;
};

// Upload CV route
router.post('/cv', auth, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File must be PNG, JPG or SVG' });
    }

    // Always use fixed filename youssef_cv
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio/cv',
          resource_type: 'image',
          public_id: 'youssef_cv',
          overwrite: true,
          format: 'png',
          transformation: [
            { width: 1200, crop: 'scale', quality: 100 }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      bufferToStream(req.file.buffer).pipe(uploadStream);
    });

    const result = await uploadPromise;
    const fileUrl = result.secure_url;

    // Update Hero document with new CV URL
    const hero = await Hero.findOne();
    if (hero) {
      hero.cvButton.link = fileUrl;
      await hero.save();
    }

    res.json({
      fileUrl,
      message: 'CV uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({ error: 'Error uploading CV' });
  }
});

// Upload image route
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create upload stream using cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to cloudinary
      bufferToStream(req.file.buffer).pipe(uploadStream);
    });

    // Wait for upload to complete
    const result = await uploadPromise;

    // Return the secure URL from cloudinary
    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

module.exports = router;
