const mongoose = require('mongoose');

const socialMetricsSchema = new mongoose.Schema({
    platform: {
        type: String,
        required: true,
        enum: ['tiktok', 'facebook', 'instagram', 'twitter']
    },
    metrics: {
        followers: Number,
        following: Number,
        likes: Number,
        comments: Number,
        shares: Number,
        views: Number,
        engagement_rate: Number,
        profile_views: Number,
        reach: Number,
        impressions: Number,
        audience_demographics: {
            gender: Map,
            age: Map,
            location: Map,
            language: Map
        },
        content_performance: {
            best_times: [String],
            top_hashtags: [{
                tag: String,
                usage: Number,
                engagement: Number
            }],
            media_stats: {
                photos: {
                    count: Number,
                    avg_engagement: Number
                },
                videos: {
                    count: Number,
                    avg_engagement: Number,
                    avg_watch_time: Number
                }
            }
        },
        platform_specific: mongoose.Schema.Types.Mixed
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