const mongoose = require('mongoose');

const socialMetricsSchema = new mongoose.Schema({
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
        platform_specific: {
            instagram: {
                story_metrics: [{
                    story_id: String,
                    type: {
                        type: String,
                        enum: ['photo', 'video']
                    },
                    impressions: Number,
                    reach: Number,
                    exits: Number,
                    replies: Number,
                    timestamp: Date
                }],
                reel_metrics: [{
                    reel_id: String,
                    plays: Number,
                    reach: Number,
                    likes: Number,
                    comments: Number,
                    shares: Number,
                    saves: Number
                }],
                media_types: {
                    image_count: Number,
                    video_count: Number,
                    carousel_count: Number,
                    reels_count: Number,
                    story_count: Number
                }
            },
            facebook: {
                page_impressions: Number,
                page_engaged_users: Number,
                negative_feedback: Number,
                page_views: Number,
                total_reactions: Number,
                video_metrics: [{
                    video_id: String,
                    title: String,
                    views: Number,
                    duration: Number,
                    avg_watch_time: Number,
                    retention_rate: Number
                }],
                event_metrics: [{
                    event_id: String,
                    name: String,
                    attending: Number,
                    interested: Number,
                    declined: Number
                }],
                ad_metrics: [{
                    ad_id: String,
                    campaign_name: String,
                    impressions: Number,
                    clicks: Number,
                    spend: Number,
                    actions: [{
                        action_type: String,
                        value: Number
                    }]
                }]
            },
            tiktok: {
                average_watch_time: Number,
                completion_rate: Number,
                sound_usage: [{
                    title: String,
                    author: String,
                    usage_count: Number,
                    average_views: Number,
                    average_engagement: Number
                }],
                video_metrics: [{
                    video_id: String,
                    views: Number,
                    likes: Number,
                    comments: Number,
                    shares: Number,
                    watch_time: Number,
                    completion_rate: Number
                }]
            },
            twitter: {
                verified_status: Boolean,
                mentions_count: Number,
                tweet_metrics: {
                    average_impressions: Number,
                    average_engagement: Number,
                    reply_rate: Number,
                    quote_rate: Number,
                    top_topics: [{
                        topic: String,
                        count: Number,
                        engagement_rate: Number
                    }],
                    hashtag_performance: [{
                        tag: String,
                        usage: Number,
                        avg_engagement: Number,
                        avg_impressions: Number
                    }]
                }
            }
        }
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

module.exports = mongoose.model('SocialMetrics', socialMetricsSchema); 