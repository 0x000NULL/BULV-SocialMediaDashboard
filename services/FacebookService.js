const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');
const logger = require('../utils/logger');

class FacebookService extends BaseService {
    constructor() {
        super('facebook', socialMediaConfig.facebook);
        this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const data = await this.makeRequest('/me', {
                params: {
                    fields: 'followers_count,fan_count,posts.limit(1).summary(true),page_impressions,page_engaged_users,page_negative_feedback,page_views_total,page_actions_post_reactions_total,page_videos_views',
                    access_token: this.accessToken
                }
            });

            const insights = await this.makeRequest('/me/insights', {
                params: {
                    metric: 'page_impressions_by_age_gender_unique,page_impressions_by_country_unique',
                    period: 'day',
                    access_token: this.accessToken
                }
            });

            return {
                followers: data.followers_count || data.fan_count,
                posts_count: data.posts?.summary?.total_count || 0,
                page_impressions: data.page_impressions,
                engaged_users: data.page_engaged_users,
                negative_feedback: data.page_negative_feedback,
                total_views: data.page_views_total,
                total_reactions: data.page_actions_post_reactions_total,
                video_views: data.page_videos_views,
                demographics: insights.data[0].values[0].value,
                geographic_reach: insights.data[1].values[0].value
            };
        } catch (error) {
            logger.error('Facebook metrics collection failed', {
                error: error.message,
                service: 'facebook',
                method: 'getMetrics',
                statusCode: error.response?.status,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to fetch Facebook metrics: ${error.message}`);
        }
    }

    async getEngagementRate() {
        try {
            const posts = await this.makeRequest('/me/posts', {
                params: {
                    fields: 'insights.metric(post_engagements),comments.summary(true),reactions.summary(true)',
                    limit: 50,
                    access_token: this.accessToken
                }
            });

            const totalEngagement = posts.data.reduce((sum, post) => {
                return sum + 
                    (post.reactions?.summary?.total_count || 0) +
                    (post.comments?.summary?.total_count || 0);
            }, 0);

            const averageEngagement = totalEngagement / posts.data.length;
            const followers = (await this.getMetrics()).followers;
            
            return (averageEngagement / followers) * 100;
        } catch (error) {
            throw new Error(`Failed to calculate Facebook engagement rate: ${error.message}`);
        }
    }

    async getPageInsights(period = 'day') {
        try {
            const insights = await this.makeRequest('/me/insights', {
                params: {
                    metric: [
                        'page_impressions',
                        'page_engaged_users',
                        'page_negative_feedback',
                        'page_actions_post_reactions_total',
                        'page_views_total',
                        'page_fan_adds',
                        'page_fan_removes'
                    ].join(','),
                    period,
                    access_token: this.accessToken
                }
            });

            return this.processInsights(insights.data);
        } catch (error) {
            logger.error('Facebook page insights collection failed', {
                error: error.message,
                service: 'facebook',
                method: 'getPageInsights',
                statusCode: error.response?.status,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to fetch Facebook page insights: ${error.message}`);
        }
    }

    processInsights(insightData) {
        const metrics = {};
        
        insightData.forEach(metric => {
            const values = metric.values[0]?.value || 0;
            metrics[metric.name] = values;
        });

        return {
            impressions: metrics.page_impressions || 0,
            engaged_users: metrics.page_engaged_users || 0,
            negative_feedback: metrics.page_negative_feedback || 0,
            total_reactions: metrics.page_actions_post_reactions_total || 0,
            page_views: metrics.page_views_total || 0,
            new_followers: metrics.page_fan_adds || 0,
            lost_followers: metrics.page_fan_removes || 0,
            net_follower_growth: (metrics.page_fan_adds || 0) - (metrics.page_fan_removes || 0)
        };
    }

    async getPostAnalytics(postIds) {
        try {
            const postInsights = await Promise.all(
                postIds.map(id => this.makeRequest(`/${id}/insights`, {
                    params: {
                        metric: [
                            'post_impressions',
                            'post_engaged_users',
                            'post_reactions_by_type_total',
                            'post_clicks',
                            'post_video_views'
                        ].join(','),
                        access_token: this.accessToken
                    }
                }))
            );

            return this.processPostInsights(postInsights);
        } catch (error) {
            throw new Error(`Failed to fetch Facebook post analytics: ${error.message}`);
        }
    }

    processPostInsights(postsData) {
        return postsData.map(post => {
            const metrics = {};
            post.data.forEach(metric => {
                metrics[metric.name] = metric.values[0]?.value || 0;
            });

            return {
                impressions: metrics.post_impressions || 0,
                engaged_users: metrics.post_engaged_users || 0,
                reactions: metrics.post_reactions_by_type_total || {},
                clicks: metrics.post_clicks || 0,
                video_views: metrics.post_video_views || 0,
                engagement_rate: metrics.post_engaged_users 
                    ? (metrics.post_engaged_users / metrics.post_impressions) * 100 
                    : 0
            };
        });
    }

    async getDemographics() {
        try {
            const demographics = await this.makeRequest('/me/insights', {
                params: {
                    metric: [
                        'page_fans_gender_age',
                        'page_fans_country',
                        'page_fans_city',
                        'page_fans_locale'
                    ].join(','),
                    access_token: this.accessToken
                }
            });

            return this.processDemographics(demographics.data);
        } catch (error) {
            throw new Error(`Failed to fetch Facebook demographics: ${error.message}`);
        }
    }

    processDemographics(data) {
        const demographics = {
            gender_age: {},
            countries: {},
            cities: {},
            languages: {}
        };

        data.forEach(metric => {
            const values = metric.values[0]?.value || {};
            switch (metric.name) {
                case 'page_fans_gender_age':
                    demographics.gender_age = values;
                    break;
                case 'page_fans_country':
                    demographics.countries = values;
                    break;
                case 'page_fans_city':
                    demographics.cities = values;
                    break;
                case 'page_fans_locale':
                    demographics.languages = values;
                    break;
            }
        });

        return demographics;
    }

    async getVideoMetrics() {
        try {
            const videos = await this.makeRequest('/me/videos', {
                params: {
                    fields: 'title,description,views,length,video_insights',
                    access_token: this.accessToken
                }
            });

            return videos.data.map(video => ({
                id: video.id,
                title: video.title,
                description: video.description,
                views: video.views,
                duration: video.length,
                insights: this.processVideoInsights(video.video_insights?.data || [])
            }));
        } catch (error) {
            throw new Error(`Failed to fetch Facebook video metrics: ${error.message}`);
        }
    }

    processVideoInsights(insights) {
        const metrics = {};
        insights.forEach(insight => {
            metrics[insight.name] = insight.values[0]?.value || 0;
        });
        return metrics;
    }

    async getEventMetrics() {
        try {
            const events = await this.makeRequest('/me/events', {
                params: {
                    fields: 'name,start_time,end_time,attending_count,interested_count,declined_count',
                    access_token: this.accessToken
                }
            });

            return events.data.map(event => ({
                id: event.id,
                name: event.name,
                startTime: event.start_time,
                endTime: event.end_time,
                metrics: {
                    attending: event.attending_count || 0,
                    interested: event.interested_count || 0,
                    declined: event.declined_count || 0
                }
            }));
        } catch (error) {
            throw new Error(`Failed to fetch Facebook event metrics: ${error.message}`);
        }
    }

    async getAdMetrics() {
        try {
            const ads = await this.makeRequest('/me/ads', {
                params: {
                    fields: 'campaign_name,impressions,clicks,spend,actions',
                    access_token: this.accessToken
                }
            });

            return ads.data.map(ad => ({
                id: ad.id,
                campaignName: ad.campaign_name,
                metrics: {
                    impressions: ad.impressions || 0,
                    clicks: ad.clicks || 0,
                    spend: ad.spend || 0,
                    actions: ad.actions || []
                }
            }));
        } catch (error) {
            logger.error('Facebook ad metrics collection failed', {
                error: error.message,
                service: 'facebook',
                method: 'getAdMetrics',
                statusCode: error.response?.status,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Failed to fetch Facebook ad metrics: ${error.message}`);
        }
    }
}

module.exports = FacebookService; 