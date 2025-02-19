const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class TikTokService extends BaseService {
    constructor() {
        super('tiktok', socialMediaConfig.tiktok);
        this.accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const data = await this.makeRequest('/user/info/', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            return {
                followers: data.followers_count,
                following: data.following_count,
                likes: data.likes_count,
                videos: data.video_count
            };
        } catch (error) {
            throw new Error(`Failed to fetch TikTok metrics: ${error.message}`);
        }
    }

    async getEngagementRate() {
        try {
            const videos = await this.makeRequest('/user/videos', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                    max_count: 50
                }
            });

            const totalEngagement = videos.data.reduce((sum, video) => {
                return sum + video.statistics.like_count + 
                           video.statistics.comment_count + 
                           video.statistics.share_count;
            }, 0);

            const averageEngagement = totalEngagement / videos.data.length;
            const followers = (await this.getMetrics()).followers;
            
            return (averageEngagement / followers) * 100;
        } catch (error) {
            throw new Error(`Failed to calculate TikTok engagement rate: ${error.message}`);
        }
    }
}

module.exports = TikTokService; 