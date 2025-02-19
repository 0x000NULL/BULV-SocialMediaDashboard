const NodeCache = require('node-cache');

class MetricsCache {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, // 5 minutes default TTL
            checkperiod: 60
        });
    }

    getCacheKey(platform, metricType) {
        return `${platform}_${metricType}`;
    }

    async getOrFetch(cacheKey, fetchFn) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) return cachedData;

        const freshData = await fetchFn();
        this.cache.set(cacheKey, freshData);
        return freshData;
    }
}

module.exports = new MetricsCache(); 