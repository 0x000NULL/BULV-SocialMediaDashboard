const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');
const catchAsync = require('../utils/catchAsync');
const logActivity = require('../middleware/activityLogger');

// Get activity logs (admin only)
router.get('/', auth, catchAsync(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).render('errors/403', {
            message: 'You do not have permission to view logs'
        });
    }

    const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    
    if (action) {
        query.action = action;
    }
    
    if (userId) {
        query.userId = userId;
    }
    
    if (startDate || endDate) {
        query.timestamp = {};
        
        if (startDate) {
            query.timestamp.$gte = new Date(startDate);
        }
        
        if (endDate) {
            query.timestamp.$lte = new Date(endDate);
        }
    }
    
    // Get total count for pagination
    const total = await ActivityLog.countDocuments(query);
    
    // Get logs with pagination
    const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();
    
    // Log this activity
    logger.info('Activity logs viewed', {
        userId: req.user._id,
        username: req.user.username,
        action: 'view_logs',
        query: req.query
    });
    
    // Render logs page
    res.render('logs', {
        user: req.user,
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        filters: {
            action,
            userId,
            startDate,
            endDate
        }
    });
}));

// Export logs as CSV (admin only)
router.get('/export', auth, logActivity('logs_export'), catchAsync(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to export logs' });
    }

    const { action, userId, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    
    if (action) {
        query.action = action;
    }
    
    if (userId) {
        query.userId = userId;
    }
    
    if (startDate || endDate) {
        query.timestamp = {};
        
        if (startDate) {
            query.timestamp.$gte = new Date(startDate);
        }
        
        if (endDate) {
            query.timestamp.$lte = new Date(endDate);
        }
    }
    
    // Get logs
    const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .lean();
    
    // Convert to CSV
    const fields = ['username', 'action', 'timestamp', 'ipAddress', 'userAgent'];
    const csv = [
        fields.join(','),
        ...logs.map(log => {
            return fields.map(field => {
                let value = log[field];
                
                // Format date
                if (field === 'timestamp') {
                    value = new Date(value).toISOString();
                }
                
                // Escape commas and quotes
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    if (value.includes(',')) {
                        value = `"${value}"`;
                    }
                }
                
                return value || '';
            }).join(',');
        })
    ].join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
    
    // Send CSV
    res.send(csv);
}));

module.exports = router; 