const config = {
    tiktok: {
        baseUrl: 'https://open.tiktokapis.com/v2',
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 100
        }
    },
    facebook: {
        baseUrl: 'https://graph.facebook.com/v18.0',
        rateLimit: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 200
        }
    },
    instagram: {
        baseUrl: 'https://graph.instagram.com/v18.0',
        rateLimit: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 200
        }
    },
    twitter: {
        baseUrl: 'https://api.twitter.com/2',
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 450
        }
    }
};

module.exports = config; 