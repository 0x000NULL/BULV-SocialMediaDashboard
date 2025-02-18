const express = require('express');
const router = express.Router();
const SocialMetrics = require('../models/SocialMetrics');
const auth = require('../middleware/auth');

// Get metrics for all platforms
router.get('/metrics', auth, async (req, res) => {
    try {
        const metrics = await SocialMetrics.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get metrics for specific platform
router.get('/metrics/:platform', auth, async (req, res) => {
    try {
        const metrics = await SocialMetrics.find({ 
            platform: req.params.platform.toLowerCase() 
        })
        .sort({ timestamp: -1 })
        .limit(5);
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new metrics
router.post('/metrics', auth, async (req, res) => {
    const metrics = new SocialMetrics({
        platform: req.body.platform,
        metrics: req.body.metrics,
        post_frequency: req.body.post_frequency
    });

    try {
        const newMetrics = await metrics.save();
        res.status(201).json(newMetrics);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 