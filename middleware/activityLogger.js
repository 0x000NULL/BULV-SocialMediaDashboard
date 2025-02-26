const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

/**
 * Middleware to log user activity
 * @param {string} action - The action being performed
 * @param {Object} detailsGenerator - Function that returns details object from req
 * @returns {Function} Express middleware
 */
const logActivity = (action, detailsGenerator = null) => {
    return async (req, res, next) => {
        // Only log activity for authenticated users
        if (!req.user) {
            return next();
        }

        try {
            // Generate details if a generator function is provided
            const details = detailsGenerator ? detailsGenerator(req) : {};

            // Create activity log
            const activityLog = new ActivityLog({
                userId: req.user._id,
                username: req.user.username,
                action,
                details,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Save activity log asynchronously (don't wait for it to complete)
            activityLog.save()
                .then(() => {
                    logger.info(`Activity logged: ${action}`, {
                        userId: req.user._id,
                        username: req.user.username,
                        action
                    });
                })
                .catch(err => {
                    logger.error('Error saving activity log', {
                        error: err.message,
                        userId: req.user._id,
                        action
                    });
                });

            // Continue with the request
            next();
        } catch (error) {
            // Log error but don't block the request
            logger.error('Error in activity logger middleware', {
                error: error.message,
                stack: error.stack,
                userId: req.user?._id,
                action
            });
            next();
        }
    };
};

module.exports = logActivity; 