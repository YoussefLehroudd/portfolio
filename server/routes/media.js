const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');
const { Readable } = require('stream');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
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

const sanitizePath = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
};

const resolveBaseFolder = (value) => {
  const cleaned = sanitizePath(value);
  return cleaned || 'portfolio/uploads';
};

const parseLimit = (value, fallback = 60, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
};

router.post('/upload', auth, upload.array('files', 50), async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const baseFolder = resolveBaseFolder(req.body?.folder);
    let paths = [];
    if (typeof req.body?.paths === 'string') {
      try {
        const parsed = JSON.parse(req.body.paths);
        if (Array.isArray(parsed)) {
          paths = parsed.map((item) => (typeof item === 'string' ? item : ''));
        }
      } catch (error) {
        paths = [];
      }
    }

    const uploads = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const rawPath = paths[index] || file.originalname || '';
      const normalizedPath = String(rawPath).replace(/\\/g, '/');
      const dir = normalizedPath.includes('/')
        ? normalizedPath.split('/').slice(0, -1).join('/')
        : '';
      const safeDir = sanitizePath(dir);
      const targetFolder = safeDir ? `${baseFolder}/${safeDir}` : baseFolder;

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: targetFolder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: false
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );

        bufferToStream(file.buffer).pipe(uploadStream);
      });

      uploads.push({
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        bytes: result.bytes,
        format: result.format,
        created_at: result.created_at
      });
    }

    return res.json({ uploaded: uploads });
  } catch (error) {
    console.error('Error uploading media:', error);
    return res.status(500).json({ message: 'Error uploading files' });
  }
});

router.get('/folders', auth, async (req, res) => {
  try {
    const prefixRaw = typeof req.query?.prefix === 'string' ? req.query.prefix : '';
    const prefix = sanitizePath(prefixRaw);
    const options = { type: 'upload' };
    const response = prefix
      ? await cloudinary.api.sub_folders(prefix, options)
      : await cloudinary.api.root_folders(options);
    const folders = Array.isArray(response?.folders) ? response.folders : [];
    return res.json({ folders });
  } catch (error) {
    console.error('Error fetching media folders:', error);
    return res.status(500).json({ message: 'Error fetching folders' });
  }
});

router.post('/folders', auth, async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const parent = typeof req.body?.parent === 'string' ? req.body.parent.trim() : '';
    const cleanedParent = sanitizePath(parent);
    const cleanedName = sanitizePath(name);

    if (!cleanedName) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const fullPath = sanitizePath(cleanedParent ? `${cleanedParent}/${cleanedName}` : cleanedName);
    if (!fullPath) {
      return res.status(400).json({ message: 'Invalid folder path' });
    }

    const folder = await cloudinary.api.create_folder(fullPath);
    return res.json({ folder });
  } catch (error) {
    console.error('Error creating media folder:', error);
    return res.status(500).json({ message: 'Error creating folder' });
  }
});

router.post('/folders/rename', auth, async (req, res) => {
  try {
    const pathValue = typeof req.body?.path === 'string' ? req.body.path.trim() : '';
    const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';

    const cleanedPath = sanitizePath(pathValue);
    const cleanedName = sanitizePath(newName);

    if (!cleanedPath || !cleanedName) {
      return res.status(400).json({ message: 'Folder path and new name are required' });
    }

    const parts = cleanedPath.split('/').filter(Boolean);
    const parent = parts.slice(0, -1).join('/');
    const target = sanitizePath(parent ? `${parent}/${cleanedName}` : cleanedName);

    if (!target) {
      return res.status(400).json({ message: 'Invalid folder path' });
    }

    const result = await cloudinary.api.rename_folder(cleanedPath, target);
    return res.json({ result, from: cleanedPath, to: target });
  } catch (error) {
    console.error('Error renaming media folder:', error);
    return res.status(500).json({ message: 'Error renaming folder' });
  }
});

router.delete('/folders', auth, async (req, res) => {
  try {
    const pathValue = typeof req.body?.path === 'string' ? req.body.path.trim() : '';
    const cleanedPath = sanitizePath(pathValue);
    if (!cleanedPath) {
      return res.status(400).json({ message: 'Folder path is required' });
    }
    const result = await cloudinary.api.delete_folder(cleanedPath);
    return res.json({ result });
  } catch (error) {
    console.error('Error deleting media folder:', error);
    return res.status(500).json({ message: 'Error deleting folder' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const prefixRaw = typeof req.query?.prefix === 'string' ? req.query.prefix : '';
    const prefix = sanitizePath(prefixRaw);
    const resourceTypeRaw = typeof req.query?.resourceType === 'string' ? req.query.resourceType : 'all';
    const resourceType = resourceTypeRaw.toLowerCase();
    const maxResults = parseLimit(req.query?.max, 60, 200);
    const nextCursor = typeof req.query?.nextCursor === 'string' ? req.query.nextCursor : undefined;

    if (resourceType === 'all') {
      const types = ['image', 'video', 'raw'];
      const responses = await Promise.allSettled(
        types.map((type) =>
          cloudinary.api.resources({
            resource_type: type,
            type: 'upload',
            prefix: prefix || undefined,
            max_results: maxResults
          })
        )
      );

      const merged = responses
        .flatMap((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value?.resources || [];
          }
          console.error(`Cloudinary list failed for ${types[index]}:`, result.reason);
          return [];
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.json({
        resources: merged.slice(0, maxResults),
        nextCursor: null
      });
    }

    const resolvedType = ['image', 'video', 'raw'].includes(resourceType) ? resourceType : 'image';
    const response = await cloudinary.api.resources({
      resource_type: resolvedType,
      type: 'upload',
      prefix: prefix || undefined,
      max_results: maxResults,
      next_cursor: nextCursor || undefined
    });

    return res.json({
      resources: Array.isArray(response?.resources) ? response.resources : [],
      nextCursor: response?.next_cursor || null
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return res.status(500).json({ message: 'Error fetching media' });
  }
});

router.delete('/', auth, async (req, res) => {
  try {
    const publicId = typeof req.body?.publicId === 'string' ? req.body.publicId : '';
    const resourceType = typeof req.body?.resourceType === 'string'
      ? req.body.resourceType
      : 'image';

    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required' });
    }

    const resolvedType = ['image', 'video', 'raw'].includes(resourceType) ? resourceType : 'image';
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resolvedType });
    return res.json({ result });
  } catch (error) {
    console.error('Error deleting media:', error);
    return res.status(500).json({ message: 'Error deleting media' });
  }
});

router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ message: 'No items selected' });
    }

    const buckets = {
      image: [],
      video: [],
      raw: []
    };

    items.forEach((item) => {
      const publicId = typeof item?.publicId === 'string' ? item.publicId : '';
      if (!publicId) return;
      const type = typeof item?.resourceType === 'string' ? item.resourceType : 'image';
      const resolvedType = ['image', 'video', 'raw'].includes(type) ? type : 'image';
      buckets[resolvedType].push(publicId);
    });

    const results = {};
    for (const [type, ids] of Object.entries(buckets)) {
      if (!ids.length) continue;
      results[type] = await cloudinary.api.delete_resources(ids, { resource_type: type });
    }

    return res.json({ result: results });
  } catch (error) {
    console.error('Error bulk deleting media:', error);
    return res.status(500).json({ message: 'Error deleting media' });
  }
});

module.exports = router;
