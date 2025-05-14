const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// Upload image route
router.post('/image', upload.single('image'), async (req, res) => {
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
