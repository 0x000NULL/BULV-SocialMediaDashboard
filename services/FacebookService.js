const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class FacebookService extends BaseService {
    constructor() {
        super('facebook', socialMediaConfig.facebook);
        this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const data = await this.makeRequest('/me', {
                params: {
                    fields: 'followers_count,fan_count,posts.limit(1).summary(true)',
                    access_token: this.accessToken
                }
            });

            return {
                followers: data.followers_count || data.fan_count,
                posts_count: data.posts?.summary?.total_count || 0
            };
        } catch (error) {
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
}

module.exports = FacebookService; 