const BaseService = require('./BaseService');
const socialMediaConfig = require('../config/socialMedia');

class TikTokService extends BaseService {
    constructor() {
        super('tiktok', socialMediaConfig.tiktok);
        this.accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    }

    async getMetrics() {
        try {
            const [userInfo, videoStats] = await Promise.all([
                this.makeRequest('/user/info/', {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                }),
                this.makeRequest('/user/videos', {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` },
                    params: { max_count: 50 }
                })
            ]);

            // Calculate video performance metrics
            const videoMetrics = this.calculateVideoMetrics(videoStats.data);

            return {
                followers: userInfo.followers_count,
                following: userInfo.following_count,
                likes: userInfo.likes_count,
                videos: userInfo.video_count,
                // New metrics
                average_views: videoMetrics.averageViews,
                average_watch_time: videoMetrics.averageWatchTime,
                completion_rate: videoMetrics.completionRate,
                trending_hashtags: videoMetrics.trendingHashtags,
                best_posting_times: videoMetrics.bestPostingTimes,
                audience_demographics: userInfo.audience_demographics,
                sound_usage: videoMetrics.soundUsage
            };
        } catch (error) {
            throw new Error(`Failed to fetch TikTok metrics: ${error.message}`);
        }
    }

    calculateVideoMetrics(videos) {
        if (!videos || !videos.length) {
            return {
                averageViews: 0,
                averageWatchTime: 0,
                completionRate: 0,
                trendingHashtags: [],
                bestPostingTimes: [],
                soundUsage: []
            };
        }

        // Initialize metrics
        const viewCounts = [];
        const watchTimes = [];
        const completionRates = [];
        const hashtagStats = new Map();
        const postingTimes = new Map();
        const soundStats = new Map();

        // Process each video
        videos.forEach(video => {
            // Track views
            viewCounts.push(video.statistics.play_count || 0);

            // Track watch time
            const avgWatchTime = video.statistics.avg_watch_time || 0;
            watchTimes.push(avgWatchTime);

            // Calculate completion rate (watch time / video duration)
            const completionRate = video.duration > 0 
                ? (avgWatchTime / video.duration) * 100 
                : 0;
            completionRates.push(completionRate);

            // Track hashtags
            video.hashtags?.forEach(tag => {
                const stats = hashtagStats.get(tag.name) || { 
                    count: 0, 
                    views: 0, 
                    engagement: 0 
                };
                stats.count++;
                stats.views += video.statistics.play_count || 0;
                stats.engagement += (
                    (video.statistics.like_count || 0) + 
                    (video.statistics.comment_count || 0) + 
                    (video.statistics.share_count || 0)
                );
                hashtagStats.set(tag.name, stats);
            });

            // Track posting times
            const postTime = new Date(video.create_time * 1000);
            const timeSlot = `${postTime.getHours()}:00`;
            const timeStats = postingTimes.get(timeSlot) || { 
                count: 0, 
                views: 0 
            };
            timeStats.count++;
            timeStats.views += video.statistics.play_count || 0;
            postingTimes.set(timeSlot, timeStats);

            // Track sound usage
            if (video.music_info) {
                const soundId = video.music_info.id;
                const soundStats = soundStats.get(soundId) || {
                    id: soundId,
                    title: video.music_info.title,
                    author: video.music_info.author,
                    usage_count: 0,
                    total_views: 0,
                    total_engagement: 0
                };
                soundStats.usage_count++;
                soundStats.total_views += video.statistics.play_count || 0;
                soundStats.total_engagement += (
                    (video.statistics.like_count || 0) + 
                    (video.statistics.comment_count || 0)
                );
                soundStats.set(soundId, soundStats);
            }
        });

        // Calculate averages and trends
        const averageViews = viewCounts.reduce((a, b) => a + b, 0) / videos.length;
        const averageWatchTime = watchTimes.reduce((a, b) => a + b, 0) / videos.length;
        const completionRate = completionRates.reduce((a, b) => a + b, 0) / videos.length;

        // Get top hashtags by engagement
        const trendingHashtags = Array.from(hashtagStats.entries())
            .map(([tag, stats]) => ({
                tag,
                usage: stats.count,
                views: stats.views,
                engagement: stats.engagement / stats.count // average engagement per use
            }))
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, 10);

        // Get best posting times by average views
        const bestPostingTimes = Array.from(postingTimes.entries())
            .map(([time, stats]) => ({
                time,
                average_views: stats.views / stats.count
            }))
            .sort((a, b) => b.average_views - a.average_views)
            .slice(0, 5)
            .map(slot => slot.time);

        // Get top performing sounds
        const topSounds = Array.from(soundStats.values())
            .sort((a, b) => b.total_engagement - a.total_engagement)
            .slice(0, 5)
            .map(sound => ({
                title: sound.title,
                author: sound.author,
                usage_count: sound.usage_count,
                average_views: sound.total_views / sound.usage_count,
                average_engagement: sound.total_engagement / sound.usage_count
            }));

        return {
            averageViews,
            averageWatchTime,
            completionRate,
            trendingHashtags,
            bestPostingTimes,
            soundUsage: topSounds
        };
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