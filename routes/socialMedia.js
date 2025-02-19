const express = require('express');
const router = express.Router();
const SocialMetrics = require('../models/SocialMetrics');
const auth = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

// Get metrics for all platforms
router.get('/metrics', auth, catchAsync(async (req, res) => {
    const metrics = await SocialMetrics.find()
        .sort({ timestamp: -1 })
        .limit(10);
    res.json(metrics);
}));

// Get metrics for specific platform
router.get('/metrics/:platform', auth, catchAsync(async (req, res) => {
    const metrics = await SocialMetrics.find({ 
        platform: req.params.platform.toLowerCase() 
    })
    .sort({ timestamp: -1 })
    .limit(5);
    res.json(metrics);
}));

// Get metrics with date range
router.get('/metrics/range', auth, catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const metrics = await SocialMetrics.find({
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }).sort({ timestamp: 1 });
    
    res.json(metrics);
}));

// Add new metrics
router.post('/metrics', auth, catchAsync(async (req, res) => {
    const metrics = new SocialMetrics({
        platform: req.body.platform,
        metrics: req.body.metrics,
        post_frequency: req.body.post_frequency
    });

    const newMetrics = await metrics.save();
    res.status(201).json(newMetrics);
}));

module.exports = router; 