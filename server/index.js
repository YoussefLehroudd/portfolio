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

dotenv.config();

// Check for required Cloudinary environment variables
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('FATAL ERROR: Cloudinary credentials are not defined.');
  process.exit(1);
}

// JWT Secret
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://portfolio-qjxg.onrender.com']  // Replace with your actual frontend domain
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectMongo();

// Serve static JS/CSS files first with proper headers
app.use('/static', express.static(path.join(__dirname, '../build/static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Serve other build files
app.use(express.static(path.join(__dirname, '../build'), {
  index: false // Don't serve index.html for directory requests
}));

// API Routes after static files
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistics', require('./routes/statistics'));

// Serve public files with proper content types
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
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
  }
}));

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

// Special handling for admin routes
app.get('/admin/*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
