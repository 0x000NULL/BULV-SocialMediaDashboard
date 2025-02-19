const axios = require('axios');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const metricsCache = require('./MetricsCache');
const rateLimitMonitor = require('./RateLimitMonitor');

class BaseService {
    constructor(platform, config) {
        this.platform = platform;
        this.config = config;
        this.baseUrl = config.baseUrl;
        this.rateLimiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.maxRequests
        });
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    async makeRequest(endpoint, options = {}, retryCount = 0) {
        if (!rateLimitMonitor.canMakeRequest(this.platform)) {
            throw new Error(`Rate limit exceeded for ${this.platform}`);
        }

        try {
            const response = await axios({
                url: `${this.baseUrl}${endpoint}`,
                ...options,
                headers: {
                    ...options.headers,
                    'User-Agent': 'Budget-Vegas-Social/1.0'
                }
            });

            rateLimitMonitor.trackRateLimit(this.platform, response);
            return response.data;
        } catch (error) {
            if (this.shouldRetry(error) && retryCount < this.maxRetries) {
                logger.warn(`Retrying ${this.platform} API request`, {
                    endpoint,
                    retryCount: retryCount + 1,
                    error: error.message
                });

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.makeRequest(endpoint, options, retryCount + 1);
            }

            logger.error(`${this.platform} API Error:`, {
                endpoint,
                error: error.message,
                response: error.response?.data
            });
            throw error;
        }
    }

    shouldRetry(error) {
        const status = error.response?.status;
        return (
            status === 429 || // Rate limit exceeded
            status === 503 || // Service unavailable
            status === 504 || // Gateway timeout
            !status // Network error
        );
    }

    async getMetrics() {
        const cacheKey = metricsCache.getCacheKey(this.platform, 'metrics');
        return metricsCache.getOrFetch(cacheKey, () => this._fetchMetrics());
    }

    async _fetchMetrics() {
        throw new Error('_fetchMetrics must be implemented by child class');
    }

    async getEngagementRate() {
        throw new Error('getEngagementRate must be implemented by child class');
    }
}

module.exports = BaseService; 