const express = require('express');
const router = express.Router();
const About = require('../models/About');
const auth = require('../middleware/auth');

// Get about data
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      // Create default about data if none exists
      about = await About.create({
        description: "I'm a passionate Full Stack Developer with expertise in modern web technologies. I specialize in creating engaging and responsive web applications using React, Node.js, and other cutting-edge tools. My approach combines clean code practices with creative problem-solving to deliver exceptional user experiences.",
        skillCategories: [
          {
            title: "Frontend",
            skills: ["React.js", "JavaScript", "HTML & CSS", "Responsive Design"]
          },
          {
            title: "Backend",
            skills: ["Node.js", "Express.js", "RESTful APIs", "MongoDB"]
          },
          {
            title: "Tools & Others",
            skills: ["Git & GitHub", "VS Code", "Figma", "Docker"]
          }
        ]
      });
    }
    res.json(about);
  } catch (error) {
    console.error('Error fetching about data:', error);
    res.status(500).json({ message: 'Error fetching about data' });
  }
});

// Update about data (protected route)
router.put('/', auth, async (req, res) => {
  try {
    const { description, skillCategories } = req.body;
    
    let about = await About.findOne();
    if (!about) {
      about = new About();
    }

    about.description = description;
    about.skillCategories = skillCategories;

    await about.save();
    res.json(about);
  } catch (error) {
    console.error('Error updating about data:', error);
    res.status(500).json({ message: 'Error updating about data' });
  }
});

module.exports = router;
