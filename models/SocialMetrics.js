const mongoose = require('mongoose');

const socialMetricsSchema = new mongoose.Schema({
    platform: {
        type: String,
        required: true,
        enum: ['tiktok', 'facebook', 'instagram', 'twitter']
    },
    metrics: {
        followers: Number,
        likes: Number,
        comments: Number,
        shares: Number,
        views: Number,
        engagement_rate: Number
    },
    post_frequency: {
        daily: Number,
        weekly: Number,
        monthly: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SocialMetrics', socialMetricsSchema); 