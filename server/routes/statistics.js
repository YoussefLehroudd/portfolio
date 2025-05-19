const express = require('express');
const router = express.Router();
const Statistics = require('../models/Statistics');
const auth = require('../middleware/auth');

// Record a new visit
router.post('/visit', async (req, res) => {
    try {
        const result = await Statistics.incrementVisits();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Record a project click
router.post('/project-click', async (req, res) => {
    try {
        const { projectId, title, image } = req.body;
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        const result = await Statistics.incrementProjectClicks(projectId, title, image);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get statistics (protected route)
router.get('/', auth, async (req, res) => {
    try {
        const stats = await Statistics.getStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
