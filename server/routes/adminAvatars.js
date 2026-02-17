const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const auth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');
const Avatar = require('../models/Avatar');

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

router.get('/', auth, async (req, res) => {
  try {
    const avatars = await Avatar.find().sort({ createdAt: -1 });
    res.json(avatars);
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({ message: 'Error fetching avatars' });
  }
});

router.post(
  '/',
  auth,
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req, res) => {
  try {
    const files = [...(req.files?.images || []), ...(req.files?.image || [])];
    if (!files.length) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const invalidFile = files.find((file) => !allowedMimes.includes(file.mimetype));
    if (invalidFile) {
      return res.status(400).json({ message: 'Image must be PNG, JPG, or WEBP.' });
    }

    const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
    const uploads = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'portfolio/avatars',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          bufferToStream(file.buffer).pipe(uploadStream);
        })
    );

    const results = await Promise.all(uploads);
    const entries = results.map((result) => ({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      label,
      isActive: true
    }));

    let saved = [];
    if (typeof Avatar.insertMany === 'function') {
      saved = await Avatar.insertMany(entries, { ordered: true });
    } else {
      saved = await Promise.all(entries.map((entry) => new Avatar(entry).save()));
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
  }
);

router.patch('/:id/active', auth, async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    const nextActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : !avatar.isActive;
    avatar.isActive = nextActive;
    await avatar.save();

    res.json(avatar);
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    if (avatar.publicId) {
      try {
        await cloudinary.uploader.destroy(avatar.publicId, { resource_type: 'image' });
      } catch (error) {
        console.warn('Failed to delete avatar from cloudinary:', error?.message || error);
      }
    }

    if (typeof avatar.deleteOne === 'function') {
      await avatar.deleteOne();
    } else if (typeof Avatar.findByIdAndDelete === 'function') {
      await Avatar.findByIdAndDelete(avatar._id);
    } else {
      await Avatar.destroy({ where: { id: avatar._id || avatar.id } });
    }

    res.json({ message: 'Avatar deleted' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ message: 'Error deleting avatar' });
  }
});

module.exports = router;
