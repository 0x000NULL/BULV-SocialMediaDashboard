const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SocialMetrics = require('../models/SocialMetrics');

// Home page
router.get('/', (req, res) => {
    res.render('index');
});

// Login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Dashboard page (protected)
router.get('/dashboard', auth, async (req, res) => {
    try {
        const metrics = {};
        const platforms = ['tiktok', 'facebook', 'instagram', 'twitter'];

        for (const platform of platforms) {
            const latestMetric = await SocialMetrics.findOne({ platform })
                .sort({ timestamp: -1 });
            metrics[platform] = latestMetric?.metrics || null;
        }

        res.render('dashboard', { 
            user: req.user,
            metrics: metrics
        });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router; 