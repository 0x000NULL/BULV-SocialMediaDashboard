const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');
const logger = require('../utils/logger');

class InstagramService extends BaseService {
    constructor() {
        super('instagram', socialMediaConfig.instagram);
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const [profile, media, insights] = await Promise.all([
                this.makeRequest('/me', {
                    params: {
                        fields: 'followers_count,media_count,profile_views',
                        access_token: this.accessToken
                    }
                }),
                this.makeRequest('/me/media', {
                    params: {
                        fields: 'like_count,comments_count,media_type,media_url,thumbnail_url,permalink,caption,insights.metric(impressions,reach,saved)',
                        limit: 50,
                        access_token: this.accessToken
                    }
                }),
                this.makeRequest('/me/insights', {
                    params: {
                        metric: 'audience_gender,audience_locale,audience_country,online_followers',
                        period: 'lifetime',
                        access_token: this.accessToken
                    }
                })
            ]);

            const mediaMetrics = this.calculateMediaMetrics(media.data);

            return {
                followers: profile.followers_count,
                posts_count: profile.media_count,
                profile_views: profile.profile_views,
                reach: mediaMetrics.totalReach,
                impressions: mediaMetrics.totalImpressions,
                saves: mediaMetrics.totalSaves,
                story_metrics: mediaMetrics.storyPerformance,
                reels_metrics: mediaMetrics.reelsPerformance,
                best_performing_hashtags: mediaMetrics.topHashtags,
                audience_demographics: {
                    gender: insights.data[0].values[0].value,
                    locale: insights.data[1].values[0].value,
                    country: insights.data[2].values[0].value
                },
                peak_activity_times: insights.data[3].values[0].value
            };
        } catch (error) {
            logger.error('Instagram metrics collection failed', {
                error: error.message,
                service: 'instagram',
                method: 'getMetrics',
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to fetch Instagram metrics: ${error.message}`);
        }
    }

    async getEngagementRate() {
        try {
            const media = await this.makeRequest('/me/media', {
                params: {
                    fields: 'like_count,comments_count',
                    limit: 50,
                    access_token: this.accessToken
                }
            });

            const totalEngagement = media.data.reduce((sum, post) => {
                return sum + (post.like_count || 0) + (post.comments_count || 0);
            }, 0);

            const averageEngagement = totalEngagement / media.data.length;
            const followers = (await this.getMetrics()).followers;
            
            return (averageEngagement / followers) * 100;
        } catch (error) {
            logger.error('Instagram engagement rate calculation failed', {
                error: error.message,
                service: 'instagram',
                method: 'getEngagementRate',
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to calculate Instagram engagement rate: ${error.message}`);
        }
    }

    calculateMediaMetrics(mediaItems) {
        if (!mediaItems || !mediaItems.length) {
            return {
                totalReach: 0,
                totalImpressions: 0,
                totalSaves: 0,
                storyPerformance: {},
                reelsPerformance: {},
                topHashtags: []
            };
        }

        const hashtagStats = new Map();
        const mediaTypeStats = {
            IMAGE: { count: 0, engagement: 0, reach: 0 },
            VIDEO: { count: 0, engagement: 0, reach: 0 },
            CAROUSEL_ALBUM: { count: 0, engagement: 0, reach: 0 },
            REELS: { count: 0, engagement: 0, reach: 0, plays: 0 },
            STORY: { count: 0, engagement: 0, reach: 0, exits: 0 }
        };

        let totalReach = 0;
        let totalImpressions = 0;
        let totalSaves = 0;

        // Process each media item
        mediaItems.forEach(media => {
            const insights = media.insights?.data || {};
            const engagement = (media.like_count || 0) + (media.comments_count || 0);
            const reach = insights.reach || 0;
            const impressions = insights.impressions || 0;
            const saves = insights.saved || 0;

            // Track totals
            totalReach += reach;
            totalImpressions += impressions;
            totalSaves += saves;

            // Track media type performance
            const mediaType = media.media_type;
            const stats = mediaTypeStats[mediaType];
            if (stats) {
                stats.count++;
                stats.engagement += engagement;
                stats.reach += reach;

                if (mediaType === 'REELS') {
                    stats.plays += insights.plays || 0;
                }
                if (mediaType === 'STORY') {
                    stats.exits += insights.exits || 0;
                }
            }

            // Track hashtags
            const caption = media.caption || '';
            const hashtags = caption.match(/#[\w-]+/g) || [];
            hashtags.forEach(tag => {
                const stats = hashtagStats.get(tag) || {
                    count: 0,
                    engagement: 0,
                    reach: 0
                };
                stats.count++;
                stats.engagement += engagement;
                stats.reach += reach;
                hashtagStats.set(tag, stats);
            });
        });

        // Calculate top performing hashtags
        const topHashtags = Array.from(hashtagStats.entries())
            .map(([tag, stats]) => ({
                tag,
                usage: stats.count,
                avg_engagement: stats.engagement / stats.count,
                total_reach: stats.reach
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 10);

        return {
            totalReach,
            totalImpressions,
            totalSaves,
            storyPerformance: {
                count: mediaTypeStats.STORY.count,
                avg_reach: mediaTypeStats.STORY.count > 0 
                    ? mediaTypeStats.STORY.reach / mediaTypeStats.STORY.count 
                    : 0,
                exit_rate: mediaTypeStats.STORY.count > 0 
                    ? (mediaTypeStats.STORY.exits / mediaTypeStats.STORY.count) * 100 
                    : 0
            },
            reelsPerformance: {
                count: mediaTypeStats.REELS.count,
                avg_plays: mediaTypeStats.REELS.count > 0 
                    ? mediaTypeStats.REELS.plays / mediaTypeStats.REELS.count 
                    : 0,
                avg_engagement: mediaTypeStats.REELS.count > 0 
                    ? mediaTypeStats.REELS.engagement / mediaTypeStats.REELS.count 
                    : 0
            },
            topHashtags
        };
    }

    async getStoryMetrics() {
        try {
            const stories = await this.makeRequest('/me/stories', {
                params: {
                    fields: 'media_type,media_url,timestamp,insights.metric(impressions,reach,exits,replies)',
                    access_token: this.accessToken
                }
            });

            return stories.data.map(story => ({
                id: story.id,
                type: story.media_type,
                url: story.media_url,
                timestamp: story.timestamp,
                metrics: {
                    impressions: story.insights?.data[0]?.values[0]?.value || 0,
                    reach: story.insights?.data[1]?.values[0]?.value || 0,
                    exits: story.insights?.data[2]?.values[0]?.value || 0,
                    replies: story.insights?.data[3]?.values[0]?.value || 0
                }
            }));
        } catch (error) {
            logger.error('Instagram story metrics collection failed', {
                error: error.message,
                service: 'instagram',
                method: 'getStoryMetrics',
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to fetch Instagram story metrics: ${error.message}`);
        }
    }

    async getReelMetrics() {
        try {
            const reels = await this.makeRequest('/me/media', {
                params: {
                    fields: 'media_type,media_url,thumbnail_url,timestamp,insights.metric(plays,reach,likes,comments,shares,saved)',
                    access_token: this.accessToken,
                    type: 'REELS'
                }
            });

            return reels.data.map(reel => ({
                id: reel.id,
                url: reel.media_url,
                thumbnail: reel.thumbnail_url,
                timestamp: reel.timestamp,
                metrics: {
                    plays: reel.insights?.data[0]?.values[0]?.value || 0,
                    reach: reel.insights?.data[1]?.values[0]?.value || 0,
                    likes: reel.insights?.data[2]?.values[0]?.value || 0,
                    comments: reel.insights?.data[3]?.values[0]?.value || 0,
                    shares: reel.insights?.data[4]?.values[0]?.value || 0,
                    saves: reel.insights?.data[5]?.values[0]?.value || 0
                }
            }));
        } catch (error) {
            throw new Error(`Failed to fetch Instagram reel metrics: ${error.message}`);
        }
    }
}

module.exports = InstagramService; 