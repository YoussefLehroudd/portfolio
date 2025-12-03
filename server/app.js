const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectMongo } = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projects');
const categoryRoutes = require('./routes/categories');
const heroRoutes = require('./routes/hero');
const aboutRoutes = require('./routes/about');
const socialRoutes = require('./routes/social');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const Message = require('./models/Message');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate required env vars early
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('FATAL ERROR: Cloudinary credentials are not defined.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const app = express();
const isServerless = !!process.env.VERCEL;

const buildAllowedOrigins = () => {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null;
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['https://portfolio-wbwj.onrender.com', 'https://youssefhrd.com'];

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_ORIGIN,
    process.env.FRONTEND_URL,
    vercelUrl,
    vercelBranchUrl,
    ...configuredOrigins
  ].filter(Boolean);
};

const allowedOrigins = buildAllowedOrigins();
const isOriginAllowed = (origin) => {
  if (!origin) return true; // allow same-origin or server-to-server
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Vercel preview/production domain by default
  return origin.endsWith('.vercel.app');
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB once
connectMongo();

// API Routes first to ensure they take precedence
app.use('/api/admin/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistics', require('./routes/statistics'));

// Health check and basic API routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Portfolio API' });
});

// Message endpoints
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
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

// Serve static assets when running the full server (local/dev/monolith)
if (!isServerless) {
  app.use(express.static(path.join(__dirname, '../build')));
  app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
      if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      }
      if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

module.exports = app;

