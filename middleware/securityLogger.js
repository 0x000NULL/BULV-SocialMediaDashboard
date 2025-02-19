const logger = require('../utils/logger');

const securityLogger = (req, res, next) => {
    // Log authentication attempts
    if (req.path === '/api/auth/login') {
        logger.warn('Login attempt', {
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        });
    }

    // Log unauthorized access attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
        logger.warn('Unauthorized access attempt', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            user: req.user ? req.user._id : 'unauthenticated',
            userAgent: req.get('user-agent')
        });
    }

    next();
};

module.exports = securityLogger; 