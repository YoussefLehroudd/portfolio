const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get all categories (public route)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new category (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name: name.trim()
    });

    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update category (admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name already exists
    if (req.body.name) {
      const existingCategory = await Category.findOne({ 
        name: req.body.name.trim(),
        _id: { $ne: category._id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      category.name = req.body.name.trim();
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used by any projects
    const projectsUsingCategory = await Project.findOne({ category: category.name });
    if (projectsUsingCategory) {
      return res.status(400).json({ 
        message: 'Cannot delete category because it is being used by one or more projects'
      });
    }

    await Category.deleteOne({ _id: category._id });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
