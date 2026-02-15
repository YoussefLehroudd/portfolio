const express = require('express');
const router = express.Router();
const Statistics = require('../models/Statistics');
const VisitLog = require('../models/VisitLog');
const { getIo } = require('../utils/socket');
const geoip = require('geoip-lite');
const auth = require('../middleware/auth');

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const candidate = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress;

    if (!candidate) return '';
    if (candidate.startsWith('::ffff:')) return candidate.slice(7);
    if (candidate === '::1') return '127.0.0.1';
    return candidate;
};

const buildVisitPayload = (req) => {
    const ip = getClientIp(req);
    const lookup = ip ? geoip.lookup(ip) : null;
    const ll = Array.isArray(lookup?.ll) ? lookup.ll : [];

    return {
        ip,
        country: lookup?.country || 'Unknown',
        region: lookup?.region || '',
        city: lookup?.city || '',
        timezone: lookup?.timezone || '',
        latitude: ll[0] ?? null,
        longitude: ll[1] ?? null,
        userAgent: req.headers['user-agent'] || '',
        referrer: req.body?.referrer || req.get('referer') || '',
        path: req.body?.path || '',
        language: req.body?.language || req.headers['accept-language'] || '',
        device: req.body?.device || '',
        platform: req.body?.platform || '',
        screen: req.body?.screen || ''
    };
};

// Record a new visit
router.post('/visit', async (req, res) => {
    try {
        const result = await Statistics.incrementVisits();
        try {
            const payload = buildVisitPayload(req);
            const created = await VisitLog.create(payload);
            const io = getIo();
            if (io && created) {
                const visitPayload = created.toJSON ? created.toJSON() : created;
                io.to('admins').emit('visit:new', visitPayload);
            }
        } catch (logError) {
            console.error('Error recording visit log:', logError);
        }
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

// Get recent visit logs (protected route)
router.get('/visits', auth, async (req, res) => {
    try {
        const rawLimit = parseInt(req.query.limit, 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
        const visits = await VisitLog.getRecent(limit);
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
