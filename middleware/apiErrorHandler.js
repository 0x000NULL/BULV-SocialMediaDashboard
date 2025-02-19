const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const apiErrorHandler = (err, req, res, next) => {
    logger.error('API Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query
    });

    // Handle specific API errors
    if (err.response?.data) {
        logger.error('API Response Error:', {
            status: err.response.status,
            data: err.response.data
        });
    }

    if (req.path.startsWith('/api/')) {
        // Convert known errors to AppError
        if (err.name === 'ValidationError') {
            err = new AppError(err.message, 400);
        } else if (err.name === 'CastError') {
            err = new AppError('Invalid data format', 400);
        } else if (err.name === 'JsonWebTokenError') {
            err = new AppError('Invalid token. Please log in again.', 401);
        } else if (err.name === 'TokenExpiredError') {
            err = new AppError('Your token has expired. Please log in again.', 401);
        }

        logger.error('API Error:', {
            error: err.message,
            path: req.path,
            method: req.method,
            user: req.user ? req.user._id : 'unauthenticated',
            statusCode: err.statusCode || 500,
            body: req.body,
            params: req.params,
            query: req.query,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });

        return res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            error: process.env.NODE_ENV === 'production' 
                ? 'An error occurred' 
                : err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
    next(err);
};

module.exports = apiErrorHandler; 