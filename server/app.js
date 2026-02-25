const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDatabase, dbType } = require('./config/database');
const { getIo } = require('./utils/socket');
const runInitialSeed = require('./seeders/initialSeed');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projects');
const categoryRoutes = require('./routes/categories');
const heroRoutes = require('./routes/hero');
const aboutRoutes = require('./routes/about');
const careerRoutes = require('./routes/career');
const socialRoutes = require('./routes/social');
const profileRoutes = require('./routes/profile');
const seoRoutes = require('./routes/seo');
const uploadRoutes = require('./routes/upload');
const statisticsRoutes = require('./routes/statistics');
const reviewRoutes = require('./routes/reviews');
const avatarRoutes = require('./routes/avatars');
const adminAvatarRoutes = require('./routes/adminAvatars');
const emailSettingsRoutes = require('./routes/emailSettings');
const emailLogRoutes = require('./routes/emailLogs');
const emailTrackingRoutes = require('./routes/emailTracking');
const subscriberRoutes = require('./routes/subscribers');
const mediaRoutes = require('./routes/media');
const Message = require('./models/Message');

dotenv.config();

// Guard required env vars (skip exiting in serverless to allow logs)
const ensureEnv = (key, message) => {
  if (!process.env[key]) {
    console.error(message);
    if (process.env.VERCEL) return false;
    process.exit(1);
  }
  return true;
};

ensureEnv('CLOUDINARY_NAME', 'FATAL ERROR: Cloudinary credentials are not defined.');
ensureEnv('CLOUDINARY_API_KEY', 'FATAL ERROR: Cloudinary credentials are not defined.');
ensureEnv('CLOUDINARY_API_SECRET', 'FATAL ERROR: Cloudinary credentials are not defined.');
ensureEnv('JWT_SECRET', 'FATAL ERROR: JWT_SECRET is not defined.');

const app = express();
app.set('trust proxy', true);

// CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'https://portfolio-56vu.vercel.app',
          'https://portfolio-one-iota-84.vercel.app',
          'portfolio-rho-gold-83.vercel.app',
          'https://portfolio-git-main-bots-projects-2568c239.vercel.app',
          'https://portfolio-wbwj.onrender.com',
          'https://youssefhrd.com',
      ])
  );
}
app.set('allowedOrigins', allowedOrigins);
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
    credentials: true,
  })
);
app.use(express.json());

// Block source maps in production (avoid exposing source file structure)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.path.endsWith('.map')) {
      return res.status(404).end();
    }
    return next();
  });
}

// DB connect + seed
const dbReady = connectDatabase().then(() => runInitialSeed()).catch((err) => {
  console.error('DB init error:', err);
  if (!process.env.VERCEL) process.exit(1);
});

// Routes
app.use('/api/admin/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/admin/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/admin/avatars', adminAvatarRoutes);
app.use('/api/admin/email-settings', emailSettingsRoutes);
app.use('/api/admin/email-logs', emailLogRoutes);
app.use('/api/admin/media', mediaRoutes);
app.use('/api/email', emailTrackingRoutes);
app.use('/api/subscribers', subscriberRoutes);

// Public media redirect (use custom domain URLs like /media/image/portfolio/uploads/file.jpg)
app.get('/media/:resourceType/*', (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_NAME;
    if (!cloudName) {
      return res.status(404).end();
    }
    const resourceTypeRaw = req.params.resourceType || 'image';
    const resourceType = ['image', 'video', 'raw'].includes(resourceTypeRaw)
      ? resourceTypeRaw
      : resourceTypeRaw === 'file'
        ? 'raw'
        : 'image';
    const requestedPath = req.params[0] || '';
    if (!requestedPath) {
      return res.status(404).end();
    }
    const ext = path.extname(requestedPath);
    const publicId = ext ? requestedPath.slice(0, -ext.length) : requestedPath;
    const safePublicId = publicId.replace(/^\//, '');
    const targetUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${safePublicId}${ext}`;
    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('Error redirecting media:', error);
    return res.status(500).end();
  }
});

// Serve static (for local prod build)
app.use(express.static(path.join(__dirname, '../build')));
app.use(
  express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
      if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
      if (filePath.endsWith('.ico')) res.setHeader('Content-Type', 'image/x-icon');
      if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Portfolio API', dbType });
});

// Messages
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new Message({ name, email, message, isRead: false });
    await newMessage.save();
    const io = getIo();
    if (io) {
      const payload = newMessage.toJSON ? newMessage.toJSON() : newMessage;
      io.to('admins').emit('message:new', payload);
    }
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Error retrieving messages' });
  }
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Expose app and dbReady for both server and serverless
app.ready = dbReady;

module.exports = app;
