const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SocialMetrics = require('../models/SocialMetrics');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

// Home page
router.get('/', (req, res) => {
    res.render('index');
});

// Login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Dashboard page (protected)
router.get('/dashboard', auth, catchAsync(async (req, res) => {
    const metrics = {};
    const platforms = ['tiktok', 'facebook', 'instagram', 'twitter'];

    try {
        for (const platform of platforms) {
            const latestMetric = await SocialMetrics.findOne({ platform })
                .sort({ timestamp: -1 });
            metrics[platform] = latestMetric || null;
            // Debug output for each platform's metrics
            console.log(`\n${platform.toUpperCase()} METRICS:`, {
                platform_specific: latestMetric?.metrics?.platform_specific,
                full_structure: latestMetric
            });
        }

        logger.info('Dashboard accessed', {
            userId: req.user._id,
            platforms: Object.keys(metrics).filter(k => metrics[k])
        });

        res.render('dashboard', { 
            user: req.user,
            metrics: metrics
        });
    } catch (error) {
        logger.error('Dashboard metrics fetch failed', {
            userId: req.user._id,
            error: error.message
        });
        res.status(500).render('errors/500', { 
            error: 'Failed to fetch social media metrics' 
        });
    }
}));

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router; 