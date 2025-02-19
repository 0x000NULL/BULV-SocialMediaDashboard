const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Check if the error is a MongoDB error
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            // Duplicate key error
            return res.status(400).render('errors/500', {
                error: 'A record with this information already exists.'
            });
        }
    }

    // Check if headers have already been sent
    if (res.headersSent) {
        return next(err);
    }

    // Handle different types of errors
    switch (err.status || err.statusCode) {
        case 400:
            res.status(400).render('errors/400', {
                error: err.message
            });
            break;
        case 401:
            res.status(401).render('errors/401', {
                error: err.message
            });
            break;
        case 403:
            res.status(403).render('errors/403', {
                error: err.message
            });
            break;
        case 404:
            res.status(404).render('errors/404');
            break;
        case 422:
            res.status(422).render('errors/422', {
                error: err.message,
                errors: err.errors
            });
            break;
        case 429:
            res.status(429).render('errors/429', {
                error: err.message
            });
            break;
        default:
            // Development error handler
            if (process.env.NODE_ENV === 'development') {
                res.status(err.status || 500).render('errors/500', {
                    error: err.message,
                    stack: err.stack
                });
            } else {
                // Production error handler
                res.status(err.status || 500).render('errors/500', {
                    error: 'Something went wrong'
                });
            }
    }
};

module.exports = errorHandler; 