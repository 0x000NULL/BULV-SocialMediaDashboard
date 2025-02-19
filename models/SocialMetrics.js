const { Schema, model } = require('mongoose');

const socialMetricsSchema = new Schema({
    platform: {
        type: String,
        required: true,
        enum: ['tiktok', 'facebook', 'instagram', 'twitter']
    },
    metrics: {
        // Common metrics across platforms
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

        // Audience Demographics
        audience_demographics: {
            gender: Map,
            age: Map,
            location: Map,
            language: Map,
            interests: [String],
            active_times: Map
        },

        // Content Performance
        content_performance: {
            best_times: [String],
            top_hashtags: [{
                tag: String,
                usage: Number,
                engagement: Number,
                reach: Number,
                impressions: Number
            }],
            media_stats: {
                photos: {
                    count: Number,
                    avg_engagement: Number,
                    total_reach: Number,
                    total_impressions: Number
                },
                videos: {
                    count: Number,
                    avg_engagement: Number,
                    avg_watch_time: Number,
                    completion_rate: Number,
                    total_views: Number,
                    total_reach: Number
                },
                stories: {
                    count: Number,
                    avg_reach: Number,
                    avg_impressions: Number,
                    exit_rate: Number,
                    reply_rate: Number
                },
                reels: {
                    count: Number,
                    avg_plays: Number,
                    avg_engagement: Number,
                    completion_rate: Number,
                    share_rate: Number
                }
            }
        },

        // Platform-specific metrics
        platform_specific: Schema.Types.Mixed
    },

    // Post frequency tracking
    post_frequency: {
        daily: Number,
        weekly: Number,
        monthly: Number,
        by_type: {
            photos: Number,
            videos: Number,
            stories: Number,
            reels: Number,
            carousels: Number
        }
    },

    // API performance metrics
    api_metrics: {
        rate_limits: {
            remaining: Number,
            reset_time: Date
        },
        response_time: Number,
        error_count: Number,
        retry_count: Number
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for common queries
socialMetricsSchema.index({ platform: 1, timestamp: -1 });
socialMetricsSchema.index({ platform: 1, 'metrics.engagement_rate': -1 });
socialMetricsSchema.index({ timestamp: -1 });

module.exports = model('SocialMetrics', socialMetricsSchema); 