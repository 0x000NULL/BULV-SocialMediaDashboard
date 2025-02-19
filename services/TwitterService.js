const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class TwitterService extends BaseService {
    constructor() {
        super('twitter', socialMediaConfig.twitter);
        this.bearerToken = process.env.TWITTER_API_KEY;
    }

    async getMetrics() {
        try {
            const data = await this.makeRequest('/users/me', {
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`
                },
                params: {
                    'user.fields': 'public_metrics'
                }
            });

            return {
                followers: data.data.public_metrics.followers_count,
                following: data.data.public_metrics.following_count,
                tweets: data.data.public_metrics.tweet_count
            };
        } catch (error) {
            throw new Error(`Failed to fetch Twitter metrics: ${error.message}`);
        }
    }

    async getEngagementRate() {
        try {
            const tweets = await this.makeRequest('/users/me/tweets', {
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`
                },
                params: {
                    'max_results': 50,
                    'tweet.fields': 'public_metrics'
                }
            });

            const totalEngagement = tweets.data.reduce((sum, tweet) => {
                const metrics = tweet.public_metrics;
                return sum + 
                    (metrics.like_count || 0) +
                    (metrics.reply_count || 0) +
                    (metrics.retweet_count || 0);
            }, 0);

            const averageEngagement = totalEngagement / tweets.data.length;
            const followers = (await this.getMetrics()).followers;
            
            return (averageEngagement / followers) * 100;
        } catch (error) {
            throw new Error(`Failed to calculate Twitter engagement rate: ${error.message}`);
        }
    }
}

module.exports = TwitterService; 