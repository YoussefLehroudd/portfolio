const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'public', 'images', 'projects'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all projects (public)
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ isVisible: true }).sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all projects (admin)
router.get('/admin', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      technologies: JSON.parse(req.body.technologies),
      features: JSON.parse(req.body.features)
    };

    if (req.file) {
      projectData.image = '/images/projects/' + req.file.filename;
    }

    const project = new Project(projectData);
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project
router.patch('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = { ...req.body };

    // Parse JSON strings back to arrays
    if (projectData.technologies) {
      projectData.technologies = JSON.parse(projectData.technologies);
    }
    if (projectData.features) {
      projectData.features = JSON.parse(projectData.features);
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (project.image) {
        try {
          const oldImagePath = path.join(__dirname, '..', '..', 'public', project.image);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      projectData.image = '/images/projects/' + req.file.filename;
    }

    Object.keys(projectData).forEach(key => {
      project[key] = projectData[key];
    });

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete project image if it exists
    if (project.image) {
      try {
        const imagePath = path.join(__dirname, '..', '..', 'public', project.image);
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with project deletion even if image deletion fails
      }
    }

    await Project.deleteOne({ _id: project._id });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Toggle project visibility
router.patch('/:id/toggle-visibility', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.isVisible = !project.isVisible;
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
