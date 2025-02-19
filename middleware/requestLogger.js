const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userId = req.user ? req.user._id : 'unauthenticated';
        
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            user: userId,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    });

    next();
};

module.exports = requestLogger; 