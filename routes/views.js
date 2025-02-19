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
    const { id } = req.query;
    
    console.log('\n=== GET POSTS REQUEST ===');
    console.log('Platform:', platform);
    console.log('Post ID:', id);

    // If an ID is provided, return just that post
    if (id) {
        try {
            const latestMetric = await SocialMetrics.findOne({ platform })
                .sort({ timestamp: -1 });

            console.log('\nFetching single post:', {
                platform,
                id,
                hasMetrics: !!latestMetric
            });

            if (!latestMetric) {
                return res.status(404).json({ error: 'No metrics found for platform' });
            }

            let post = null;
            
            switch (platform) {
                case 'tiktok':
                    post = latestMetric.metrics?.platform_specific?.video_metrics?.find(p => p.video_id === id);
                    break;
                case 'facebook':
                    post = latestMetric.metrics?.platform_specific?.video_metrics?.find(p => p.video_id === id) ||
                          latestMetric.metrics?.platform_specific?.event_metrics?.find(p => p.event_id === id);
                    break;
                case 'instagram':
                    post = latestMetric.metrics?.platform_specific?.story_metrics?.find(p => p.story_id === id) ||
                          latestMetric.metrics?.platform_specific?.reel_metrics?.find(p => p.reel_id === id);
                    break;
                case 'twitter':
                    post = latestMetric.metrics?.platform_specific?.tweet_metrics?.top_topics?.find(p => p.tweet_id === id);
                    break;
            }

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            return res.json({ post });
        } catch (error) {
            console.error('\nError fetching single post:', {
                platform,
                postId: id,
                error: error.message,
                userId: req.user._id
            });
            return res.status(500).json({ error: 'Failed to fetch post' });
        }
    }

    // Handle pagination
    const pageNum = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    try {
        const latestMetric = await SocialMetrics.findOne({ platform })
            .sort({ timestamp: -1 });

        console.log('\nFound metrics:', {
            platform,
            hasMetrics: !!latestMetric,
            hasSpecificMetrics: !!latestMetric?.metrics?.platform_specific,
            metricsTimestamp: latestMetric?.timestamp
        });

        if (!latestMetric) {
            return res.status(404).json({ error: 'No metrics found for platform' });
        }

        let posts = [];
        let totalPosts = 0;

        switch (platform) {
            case 'tiktok':
                posts = (latestMetric.metrics?.platform_specific?.video_metrics || []).map(post => ({
                    ...post,
                    id: post.video_id,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'video'
                }));
                break;
            case 'facebook':
                const videos = (latestMetric.metrics?.platform_specific?.video_metrics || []).map(post => ({
                    ...post,
                    id: post.video_id,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'video'
                }));
                const events = (latestMetric.metrics?.platform_specific?.event_metrics || []).map(post => ({
                    ...post,
                    id: post.event_id,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'event'
                }));
                posts = [...videos, ...events];
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
                break;
            case 'twitter':
                posts = (latestMetric.metrics?.platform_specific?.tweet_metrics?.top_topics || []).map((post, index) => ({
                    ...post,
                    id: post.tweet_id || `tweet_${index}`,
                    timestamp: post.timestamp || latestMetric.timestamp,
                    type: 'tweet'
                }));
                break;
        }

        console.log('\nProcessed posts:', {
            platform,
            totalPosts: posts.length,
            firstPost: posts[0] ? {
                id: posts[0].id,
                type: posts[0].type,
                timestamp: posts[0].timestamp
            } : null,
            lastPost: posts[posts.length - 1] ? {
                id: posts[posts.length - 1].id,
                type: posts[posts.length - 1].type,
                timestamp: posts[posts.length - 1].timestamp
            } : null
        });

        totalPosts = posts.length;
        const paginatedPosts = posts.slice(skip, skip + limitNum);

        res.json({
            posts: paginatedPosts,
            currentPage: pageNum,
            totalPages: Math.ceil(totalPosts / limitNum),
            totalPosts
        });
    } catch (error) {
        console.error('\nError fetching posts:', {
            platform,
            error: error.message,
            stack: error.stack
        });
        logger.error('Failed to fetch posts', {
            platform,
            error: error.message,
            stack: error.stack,
            userId: req.user._id
        });
        res.status(500).json({ 
            error: 'Failed to fetch posts',
            details: error.message
        });
    }
}));

// Render post-list partial
router.post('/partials/post-list', auth, catchAsync(async (req, res) => {
    try {
        const { posts, currentPage, totalPages, platform } = req.body;
        console.log('\n=== RENDERING POST LIST ===');
        console.log('Post list data:', {
            platform,
            postsCount: posts?.length,
            currentPage,
            totalPages,
            samplePost: posts?.[0] ? {
                id: posts[0].id,
                type: posts[0].type,
                timestamp: posts[0].timestamp
            } : null
        });

        res.render('partials/post-list', { 
            posts: posts.map(post => {
                const id = post.video_id || post.story_id || post.reel_id || post.tweet_id || post.id || 
                    (post._id ? post._id.toString() : undefined);
                const type = getPostType(platform, post);
                return {
                    ...post,
                    type,
                    id,
                    url: getPostUrl(platform, { id, type })
                };
            }),
            currentPage,
            totalPages,
            platform
        });
    } catch (error) {
        console.error('\nError rendering post list:', {
            error: error.message,
            stack: error.stack
        });
        logger.error('Failed to render post-list partial', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to render post list',
            details: error.message
        });
    }
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

/**
 * Generate platform-specific URLs for social media posts
 * @param {string} platform - The social media platform
 * @param {Object} post - Post object containing id and type
 * @param {string} post.id - The post's unique identifier
 * @param {string} post.type - The type of post (video, story, etc.)
 * @returns {string} The platform-specific URL for the post
 */
function getPostUrl(platform, post) {
    const id = post.video_id || post.story_id || post.reel_id || post.tweet_id || post.id || 
        (post._id ? post._id.toString() : undefined);
        
    if (!id) {
        console.warn('\nWarning: No ID found for post:', {
            platform,
            postType: post.type,
            availableFields: Object.keys(post)
        });
        return '#';
    }

    switch (platform) {
        case 'tiktok':
            return `https://www.tiktok.com/@budgetvegas/video/${id}`;
        case 'instagram':
            if (post.type === 'story') {
                return `https://www.instagram.com/stories/budgetvegas/${id}`;
            } else if (post.type === 'reel') {
                return `https://www.instagram.com/reel/${id}`;
            }
            return `https://www.instagram.com/p/${id}`;
        case 'facebook':
            if (post.type === 'video') {
                return `https://www.facebook.com/watch/?v=${id}`;
            } else if (post.type === 'event') {
                return `https://www.facebook.com/events/${id}`;
            }
            return `https://www.facebook.com/budgetvegas/posts/${id}`;
        case 'twitter':
            if (post.id.startsWith('tweet_')) {
                return 'https://twitter.com/budgetvegas';
            }
            return `https://twitter.com/budgetvegas/status/${post.id}`;
        default:
            return '#';
    }
}

module.exports = router; 