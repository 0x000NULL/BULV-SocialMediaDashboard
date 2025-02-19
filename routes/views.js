const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SocialMetrics = require('../models/SocialMetrics');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const socialMediaManager = require('../services/SocialMediaManager');

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

// Admin route to manually collect metrics for a specific platform
router.post('/api/collect/:platform', auth, catchAsync(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Only administrators can manually collect metrics' 
        });
    }

    const { platform } = req.params;
    const validPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok'];

    if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ 
            error: 'Invalid platform specified' 
        });
    }

    try {
        // Get the service for the specified platform
        const service = socialMediaManager.services[platform];
        
        // Collect metrics for the platform
        await socialMediaManager.collectMetricsForPlatform(platform, service);

        logger.info(`Manual metrics collection completed for ${platform}`, {
            userId: req.user._id,
            platform
        });

        res.json({ 
            success: true, 
            message: `Successfully collected ${platform} metrics` 
        });
    } catch (error) {
        logger.error(`Manual metrics collection failed for ${platform}`, {
            userId: req.user._id,
            platform,
            error: error.message
        });
        
        res.status(500).json({ 
            error: `Failed to collect ${platform} metrics: ${error.message}` 
        });
    }
}));

module.exports = router; 