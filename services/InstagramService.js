const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class InstagramService extends BaseService {
    constructor() {
        super('instagram', socialMediaConfig.instagram);
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const data = await this.makeRequest('/me', {
                params: {
                    fields: 'followers_count,media_count',
                    access_token: this.accessToken
                }
            });

            return {
                followers: data.followers_count,
                posts_count: data.media_count
            };
        } catch (error) {
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
            throw new Error(`Failed to calculate Instagram engagement rate: ${error.message}`);
        }
    }
}

module.exports = InstagramService; 