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

const buildPublicId = (filename) => {
  if (!filename) return 'youssef_cv';
  const ext = path.extname(filename).replace('.', '').toLowerCase();
  const base = path.basename(filename, path.extname(filename));
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'youssef_cv';
  return safeBase;
};

// Upload CV route
router.post('/cv', auth, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File must be PNG, JPG, SVG or PDF' });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const originalName = req.file.originalname || 'youssef_cv';
    const publicId = buildPublicId(originalName);

    // Always use fixed filename youssef_cv
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio/cv',
          public_id: publicId,
          overwrite: true,
          resource_type: isPdf ? 'image' : 'auto', // PDFs need image type for previews
          format: isPdf ? 'pdf' : undefined,
          transformation: isPdf ? undefined : [
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
    const fileNameWithExt = `${publicId}${isPdf ? '.pdf' : path.extname(originalName) || '.png'}`;

    // Update Hero document with new CV URL
    const hero = await Hero.findOne();
    if (hero) {
      let currentCv = hero.cvButton;
      if (typeof currentCv === 'string') {
        try {
          currentCv = JSON.parse(currentCv);
        } catch {
          currentCv = {};
        }
      }

      hero.cvButton = {
        text: typeof currentCv?.text === 'string' ? currentCv.text : 'Download CV',
        link: fileUrl
      };
      await hero.save();
    }

    res.json({
      fileUrl,
      fileName: fileNameWithExt,
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
