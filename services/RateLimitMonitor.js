const logger = require('../utils/logger');

class RateLimitMonitor {
    constructor() {
        this.limits = new Map();
    }

    trackRateLimit(platform, response) {
        const remaining = response.headers['x-rate-limit-remaining'];
        const reset = response.headers['x-rate-limit-reset'];
        
        if (remaining && reset) {
            this.limits.set(platform, {
                remaining: parseInt(remaining),
                reset: new Date(reset * 1000)
            });

            if (parseInt(remaining) < 10) {
                logger.warn(`${platform} API rate limit running low`, {
                    platform,
                    remaining,
                    resetTime: new Date(reset * 1000)
                });
            }
        }
    }

    canMakeRequest(platform) {
        const limit = this.limits.get(platform);
        if (!limit) return true;

        if (limit.remaining <= 0 && new Date() < limit.reset) {
            return false;
        }

        return true;
    }
}

module.exports = new RateLimitMonitor(); 