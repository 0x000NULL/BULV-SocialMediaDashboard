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

// Get posts for a platform with pagination
router.get('/api/posts/:platform', auth, catchAsync(async (req, res) => {
    const { platform } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const latestMetric = await SocialMetrics.findOne({ platform })
            .sort({ timestamp: -1 });

        if (!latestMetric) {
            return res.status(404).json({ error: 'No metrics found for platform' });
        }

        let posts = [];
        let totalPosts = 0;

        switch (platform) {
            case 'tiktok':
                posts = (latestMetric.metrics?.platform_specific?.video_metrics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'video'
                }));
                totalPosts = posts.length;
                posts = posts.slice(skip, skip + limit);
                break;
            case 'facebook':
                const videos = (latestMetric.metrics?.platform_specific?.video_metrics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'video'
                }));
                const events = (latestMetric.metrics?.platform_specific?.event_metrics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'event'
                }));
                posts = [...videos, ...events];
                totalPosts = posts.length;
                posts = posts.slice(skip, skip + limit);
                break;
            case 'instagram':
                const stories = (latestMetric.metrics?.platform_specific?.story_metrics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'story'
                }));
                const reels = (latestMetric.metrics?.platform_specific?.reel_metrics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'reel'
                }));
                posts = [...stories, ...reels];
                totalPosts = posts.length;
                posts = posts.slice(skip, skip + limit);
                break;
            case 'twitter':
                posts = (latestMetric.metrics?.platform_specific?.tweet_metrics?.top_topics || []).map(post => ({
                    ...post,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'tweet'
                }));
                totalPosts = posts.length;
                posts = posts.slice(skip, skip + limit);
                break;
        }

        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts
        });
    } catch (error) {
        logger.error('Failed to fetch posts', {
            platform,
            error: error.message,
            userId: req.user._id
        });
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
}));

// Render post-list partial
router.post('/partials/post-list', auth, catchAsync(async (req, res) => {
    const { posts, currentPage, totalPages, platform } = req.body;
    res.render('partials/post-list', { 
        posts: posts.map(post => ({
            ...post,
            type: getPostType(platform, post),
            id: post.video_id || post.story_id || post.reel_id || post.tweet_id || post.id
        })),
        currentPage,
        totalPages,
        platform
    });
}));

// Helper function to determine post type
function getPostType(platform, post) {
    switch (platform) {
        case 'tiktok':
            return 'video';
        case 'facebook':
            return post.type || 'post';
        case 'instagram':
            if (post.story_id) return 'story';
            if (post.reel_id) return 'reel';
            return post.type || 'post';
        case 'twitter':
            return 'tweet';
        default:
            return 'post';
    }
}

module.exports = router; 