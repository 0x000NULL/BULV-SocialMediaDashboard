const TikTokService = require('./TikTokService');
const FacebookService = require('./FacebookService');
const InstagramService = require('./InstagramService');
const TwitterService = require('./TwitterService');
const logger = require('../utils/logger');
const SocialMetrics = require('../models/SocialMetrics');

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
                const metrics = await service.getMetrics();
                const engagementRate = await service.getEngagementRate();

                await SocialMetrics.create({
                    platform,
                    metrics: {
                        ...metrics,
                        engagement_rate: engagementRate
                    },
                    timestamp: new Date()
                });

                logger.info(`Successfully collected ${platform} metrics`, {
                    platform,
                    metrics: {
                        followers: metrics.followers,
                        engagement_rate: engagementRate
                    }
                });
            } catch (error) {
                logger.error(`Failed to collect ${platform} metrics`, {
                    platform,
                    error: error.message
                });
            }
        }
    }
}

module.exports = new SocialMediaManager(); 