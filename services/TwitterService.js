const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class TwitterService extends BaseService {
    constructor() {
        super('twitter', socialMediaConfig.twitter);
        this.bearerToken = process.env.TWITTER_API_KEY;
    }

    async getMetrics() {
        try {
            const [userData, tweets, metrics] = await Promise.all([
                this.makeRequest('/users/me', {
                    headers: { 'Authorization': `Bearer ${this.bearerToken}` },
                    params: {
                        'user.fields': 'public_metrics,profile_views,verified'
                    }
                }),
                this.makeRequest('/users/me/tweets', {
                    headers: { 'Authorization': `Bearer ${this.bearerToken}` },
                    params: {
                        'max_results': 100,
                        'tweet.fields': 'public_metrics,referenced_tweets,context_annotations,entities'
                    }
                }),
                this.makeRequest('/users/me/mentions', {
                    headers: { 'Authorization': `Bearer ${this.bearerToken}` },
                    params: {
                        'max_results': 100
                    }
                })
            ]);

            const tweetAnalytics = this.analyzeTweets(tweets.data);

            return {
                followers: userData.data.public_metrics.followers_count,
                following: userData.data.public_metrics.following_count,
                tweets: userData.data.public_metrics.tweet_count,
                // New metrics
                profile_views: userData.data.profile_views,
                verified_status: userData.data.verified,
                mentions_count: metrics.meta.result_count,
                tweet_analytics: {
                    average_impressions: tweetAnalytics.avgImpressions,
                    average_engagement: tweetAnalytics.avgEngagement,
                    top_performing_topics: tweetAnalytics.topTopics,
                    hashtag_performance: tweetAnalytics.hashtagStats,
                    best_posting_times: tweetAnalytics.bestTimes,
                    media_engagement: tweetAnalytics.mediaStats,
                    reply_rate: tweetAnalytics.replyRate,
                    quote_rate: tweetAnalytics.quoteRate
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch Twitter metrics: ${error.message}`);
        }
    }

    analyzeTweets(tweets) {
        if (!tweets || !tweets.length) {
            return {
                avgImpressions: 0,
                avgEngagement: 0,
                topTopics: [],
                hashtagStats: [],
                bestTimes: [],
                mediaStats: {
                    photos: { count: 0, engagement: 0 },
                    videos: { count: 0, engagement: 0 },
                    links: { count: 0, engagement: 0 }
                },
                replyRate: 0,
                quoteRate: 0
            };
        }

        // Initialize tracking
        const impressions = [];
        const engagements = [];
        const topics = new Map();
        const hashtags = new Map();
        const postingTimes = new Map();
        const mediaStats = {
            photos: { count: 0, totalEngagement: 0 },
            videos: { count: 0, totalEngagement: 0 },
            links: { count: 0, totalEngagement: 0 }
        };
        let totalReplies = 0;
        let totalQuotes = 0;

        // Process each tweet
        tweets.forEach(tweet => {
            const metrics = tweet.public_metrics;
            const engagement = (
                (metrics.like_count || 0) +
                (metrics.reply_count || 0) +
                (metrics.retweet_count || 0) +
                (metrics.quote_count || 0)
            );

            // Track impressions and engagement
            impressions.push(metrics.impression_count || 0);
            engagements.push(engagement);

            // Track topics from context annotations
            tweet.context_annotations?.forEach(context => {
                const domain = context.domain.name;
                const topicStats = topics.get(domain) || {
                    count: 0,
                    engagement: 0
                };
                topicStats.count++;
                topicStats.engagement += engagement;
                topics.set(domain, topicStats);
            });

            // Track hashtags
            tweet.entities?.hashtags?.forEach(hashtag => {
                const tag = hashtag.tag.toLowerCase();
                const stats = hashtags.get(tag) || {
                    count: 0,
                    engagement: 0,
                    impressions: 0
                };
                stats.count++;
                stats.engagement += engagement;
                stats.impressions += metrics.impression_count || 0;
                hashtags.set(tag, stats);
            });

            // Track posting times
            const postTime = new Date(tweet.created_at);
            const timeSlot = `${postTime.getHours()}:00`;
            const timeStats = postingTimes.get(timeSlot) || {
                count: 0,
                engagement: 0,
                impressions: 0
            };
            timeStats.count++;
            timeStats.engagement += engagement;
            timeStats.impressions += metrics.impression_count || 0;
            postingTimes.set(timeSlot, timeStats);

            // Track media types
            if (tweet.entities?.urls?.some(url => url.expanded_url.includes('/photo/'))) {
                mediaStats.photos.count++;
                mediaStats.photos.totalEngagement += engagement;
            }
            if (tweet.entities?.urls?.some(url => url.expanded_url.includes('/video/'))) {
                mediaStats.videos.count++;
                mediaStats.videos.totalEngagement += engagement;
            }
            if (tweet.entities?.urls?.length > 0) {
                mediaStats.links.count++;
                mediaStats.links.totalEngagement += engagement;
            }

            // Track reply and quote rates
            if (tweet.referenced_tweets) {
                tweet.referenced_tweets.forEach(ref => {
                    if (ref.type === 'replied_to') totalReplies++;
                    if (ref.type === 'quoted') totalQuotes++;
                });
            }
        });

        // Calculate averages and stats
        const avgImpressions = impressions.reduce((a, b) => a + b, 0) / tweets.length;
        const avgEngagement = engagements.reduce((a, b) => a + b, 0) / tweets.length;

        // Process top topics
        const topTopics = Array.from(topics.entries())
            .map(([topic, stats]) => ({
                topic,
                count: stats.count,
                engagement_rate: stats.engagement / stats.count
            }))
            .sort((a, b) => b.engagement_rate - a.engagement_rate)
            .slice(0, 5);

        // Process hashtag performance
        const hashtagStats = Array.from(hashtags.entries())
            .map(([tag, stats]) => ({
                tag,
                usage: stats.count,
                avg_engagement: stats.engagement / stats.count,
                avg_impressions: stats.impressions / stats.count
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 10);

        // Find best posting times
        const bestTimes = Array.from(postingTimes.entries())
            .map(([time, stats]) => ({
                time,
                engagement_rate: stats.engagement / stats.count,
                avg_impressions: stats.impressions / stats.count
            }))
            .sort((a, b) => b.engagement_rate - a.engagement_rate)
            .slice(0, 5)
            .map(slot => ({
                time: slot.time,
                engagement_rate: slot.engagement_rate.toFixed(2),
                avg_impressions: Math.round(slot.avg_impressions)
            }));

        // Calculate media engagement rates
        const mediaEngagement = {
            photos: mediaStats.photos.count > 0 
                ? mediaStats.photos.totalEngagement / mediaStats.photos.count 
                : 0,
            videos: mediaStats.videos.count > 0 
                ? mediaStats.videos.totalEngagement / mediaStats.videos.count 
                : 0,
            links: mediaStats.links.count > 0 
                ? mediaStats.links.totalEngagement / mediaStats.links.count 
                : 0
        };

        return {
            avgImpressions,
            avgEngagement,
            topTopics,
            hashtagStats,
            bestTimes,
            mediaStats: {
                photos: { 
                    count: mediaStats.photos.count, 
                    avg_engagement: mediaEngagement.photos 
                },
                videos: { 
                    count: mediaStats.videos.count, 
                    avg_engagement: mediaEngagement.videos 
                },
                links: { 
                    count: mediaStats.links.count, 
                    avg_engagement: mediaEngagement.links 
                }
            },
            replyRate: (totalReplies / tweets.length) * 100,
            quoteRate: (totalQuotes / tweets.length) * 100
        };
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