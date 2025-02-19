const cron = require('node-cron');
const socialMediaManager = require('./SocialMediaManager');
const logger = require('../utils/logger');
const SocialMetrics = require('../models/SocialMetrics');

class MetricsScheduler {
    constructor() {
        // Schedule metrics collection every hour
        this.hourlyJob = cron.schedule('0 * * * *', this.runHourlyCollection.bind(this));
        
        // Schedule daily summary at midnight
        this.dailyJob = cron.schedule('0 0 * * *', this.runDailySummary.bind(this));
    }

    async runHourlyCollection() {
        logger.info('Starting hourly metrics collection');
        try {
            await socialMediaManager.collectMetrics();
        } catch (error) {
            logger.error('Hourly metrics collection failed', {
                error: error.message
            });
        }
    }

    async runDailySummary() {
        logger.info('Generating daily metrics summary');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get metrics for each platform
            for (const platform of ['tiktok', 'facebook', 'instagram', 'twitter']) {
                const dailyMetrics = await SocialMetrics.find({
                    platform,
                    timestamp: {
                        $gte: yesterday,
                        $lt: today
                    }
                });

                if (dailyMetrics.length > 0) {
                    // Calculate daily statistics
                    const stats = this.calculateDailyStats(dailyMetrics);
                    
                    // Update the last record with post frequency
                    await SocialMetrics.findByIdAndUpdate(
                        dailyMetrics[dailyMetrics.length - 1]._id,
                        {
                            post_frequency: {
                                daily: stats.postFrequency,
                                weekly: await this.calculateWeeklyPostFrequency(platform),
                                monthly: await this.calculateMonthlyPostFrequency(platform)
                            }
                        }
                    );

                    logger.info(`Daily summary generated for ${platform}`, {
                        platform,
                        stats
                    });
                }
            }
        } catch (error) {
            logger.error('Failed to generate daily summary', {
                error: error.message
            });
        }
    }

    calculateDailyStats(metrics) {
        const latest = metrics[metrics.length - 1];
        const earliest = metrics[0];

        return {
            followerGrowth: latest.metrics.followers - earliest.metrics.followers,
            averageEngagement: metrics.reduce((sum, m) => sum + m.metrics.engagement_rate, 0) / metrics.length,
            postFrequency: metrics.length
        };
    }

    async calculateWeeklyPostFrequency(platform) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const count = await SocialMetrics.countDocuments({
            platform,
            timestamp: { $gte: weekAgo }
        });

        return Math.round(count / 7);
    }

    async calculateMonthlyPostFrequency(platform) {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const count = await SocialMetrics.countDocuments({
            platform,
            timestamp: { $gte: monthAgo }
        });

        return Math.round(count / 30);
    }

    start() {
        this.hourlyJob.start();
        this.dailyJob.start();
        logger.info('Metrics scheduler started');
    }

    stop() {
        this.hourlyJob.stop();
        this.dailyJob.stop();
        logger.info('Metrics scheduler stopped');
    }
}

module.exports = new MetricsScheduler(); 