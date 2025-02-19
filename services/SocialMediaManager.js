const TikTokService = require('./TikTokService');
const FacebookService = require('./FacebookService');
const InstagramService = require('./InstagramService');
const TwitterService = require('./TwitterService');
const logger = require('../utils/logger');
const SocialMetrics = require('../models/SocialMetrics');
const RateLimitMonitor = require('./RateLimitMonitor');

class SocialMediaManager {
    constructor() {
        this.services = {
            tiktok: new TikTokService(),
            facebook: new FacebookService(),
            instagram: new InstagramService(),
            twitter: new TwitterService()
        };
    }

    async collectMetrics() {
        for (const [platform, service] of Object.entries(this.services)) {
            try {
                const startTime = Date.now();
                const metrics = await service.getMetrics();
                const engagementRate = await service.getEngagementRate();
                const responseTime = Date.now() - startTime;

                // Get platform-specific metrics
                const platformMetrics = await this.collectPlatformSpecificMetrics(platform, service);

                // Get rate limit info
                const rateLimits = RateLimitMonitor.getRateLimits(platform);

                await SocialMetrics.create({
                    platform,
                    metrics: {
                        // Common metrics
                        followers: metrics.followers,
                        following: metrics.following,
                        likes: metrics.likes,
                        comments: metrics.comments,
                        shares: metrics.shares,
                        views: metrics.views,
                        engagement_rate: engagementRate,
                        profile_views: metrics.profile_views,
                        reach: metrics.reach,
                        impressions: metrics.impressions,

                        // Audience demographics
                        audience_demographics: {
                            gender: metrics.audience_demographics?.gender || new Map(),
                            age: metrics.audience_demographics?.age || new Map(),
                            location: metrics.audience_demographics?.location || new Map(),
                            language: metrics.audience_demographics?.language || new Map(),
                            interests: metrics.audience_demographics?.interests || [],
                            active_times: metrics.audience_demographics?.active_times || new Map()
                        },

                        // Content performance
                        content_performance: {
                            best_times: metrics.best_posting_times || [],
                            top_hashtags: metrics.trending_hashtags || [],
                            media_stats: platformMetrics.mediaStats
                        },

                        // Platform-specific metrics
                        platform_specific: {
                            [platform]: platformMetrics.specificMetrics
                        }
                    },

                    // Post frequency
                    post_frequency: {
                        daily: platformMetrics.postFrequency.daily,
                        weekly: platformMetrics.postFrequency.weekly,
                        monthly: platformMetrics.postFrequency.monthly,
                        by_type: platformMetrics.postFrequency.byType
                    },

                    // API metrics
                    api_metrics: {
                        rate_limits: {
                            remaining: rateLimits.remaining,
                            reset_time: rateLimits.resetTime
                        },
                        response_time: responseTime,
                        error_count: service.errorCount || 0,
                        retry_count: service.retryCount || 0
                    },

                    timestamp: new Date()
                });

                logger.info(`Successfully collected ${platform} metrics`, {
                    platform,
                    metrics: {
                        followers: metrics.followers,
                        engagement_rate: engagementRate,
                        response_time: responseTime
                    }
                });
            } catch (error) {
                logger.error(`Failed to collect ${platform} metrics`, {
                    platform,
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }

    async collectPlatformSpecificMetrics(platform, service) {
        switch (platform) {
            case 'tiktok':
                return {
                    mediaStats: await this.getTikTokMediaStats(service),
                    specificMetrics: await this.getTikTokSpecificMetrics(service),
                    postFrequency: await this.getTikTokPostFrequency(service)
                };
            case 'facebook':
                return {
                    mediaStats: await this.getFacebookMediaStats(service),
                    specificMetrics: await this.getFacebookSpecificMetrics(service),
                    postFrequency: await this.getFacebookPostFrequency(service)
                };
            case 'instagram':
                return {
                    mediaStats: await this.getInstagramMediaStats(service),
                    specificMetrics: await this.getInstagramSpecificMetrics(service),
                    postFrequency: await this.getInstagramPostFrequency(service)
                };
            case 'twitter':
                return {
                    mediaStats: await this.getTwitterMediaStats(service),
                    specificMetrics: await this.getTwitterSpecificMetrics(service),
                    postFrequency: await this.getTwitterPostFrequency(service)
                };
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    // Platform-specific collection methods...
    async getTikTokMediaStats(service) {
        // Implementation for TikTok media stats
    }

    async getFacebookMediaStats(service) {
        // Implementation for Facebook media stats
    }

    // ... Additional platform-specific methods

    async collectMetricsForPlatform(platform, service) {
        try {
            const startTime = Date.now();
            const metrics = await service.getMetrics();
            const engagementRate = await service.getEngagementRate();
            const responseTime = Date.now() - startTime;

            // Get platform-specific metrics
            const platformMetrics = await this.collectPlatformSpecificMetrics(platform, service);

            // Get rate limit info
            const rateLimits = RateLimitMonitor.getRateLimits(platform);

            await SocialMetrics.create({
                platform,
                metrics: {
                    // Common metrics
                    followers: metrics.followers,
                    following: metrics.following,
                    likes: metrics.likes,
                    comments: metrics.comments,
                    shares: metrics.shares,
                    views: metrics.views,
                    engagement_rate: engagementRate,
                    profile_views: metrics.profile_views,
                    reach: metrics.reach,
                    impressions: metrics.impressions,

                    // Audience demographics
                    audience_demographics: {
                        gender: metrics.audience_demographics?.gender || new Map(),
                        age: metrics.audience_demographics?.age || new Map(),
                        location: metrics.audience_demographics?.location || new Map(),
                        language: metrics.audience_demographics?.language || new Map(),
                        interests: metrics.audience_demographics?.interests || [],
                        active_times: metrics.audience_demographics?.active_times || new Map()
                    },

                    // Content performance
                    content_performance: {
                        best_times: metrics.best_posting_times || [],
                        top_hashtags: metrics.trending_hashtags || [],
                        media_stats: platformMetrics.mediaStats
                    },

                    // Platform-specific metrics
                    platform_specific: {
                        [platform]: platformMetrics.specificMetrics
                    }
                },

                // Post frequency
                post_frequency: {
                    daily: platformMetrics.postFrequency.daily,
                    weekly: platformMetrics.postFrequency.weekly,
                    monthly: platformMetrics.postFrequency.monthly,
                    by_type: platformMetrics.postFrequency.byType
                },

                // API metrics
                api_metrics: {
                    rate_limits: {
                        remaining: rateLimits.remaining,
                        reset_time: rateLimits.resetTime
                    },
                    response_time: responseTime,
                    error_count: service.errorCount || 0,
                    retry_count: service.retryCount || 0
                },

                timestamp: new Date()
            });

            logger.info(`Successfully collected ${platform} metrics`, {
                platform,
                metrics: {
                    followers: metrics.followers,
                    engagement_rate: engagementRate,
                    response_time: responseTime
                }
            });

            return true;
        } catch (error) {
            logger.error(`Failed to collect ${platform} metrics`, {
                platform,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new SocialMediaManager(); 