const { Schema, model } = require('mongoose');

const activityLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'data_upload',
            'data_download',
            'template_download',
            'historical_data_retrieval',
            'manual_data_collection',
            'settings_change',
            'password_change',
            'account_creation',
            'account_deletion',
            'api_access',
            'other'
        ]
    },
    details: {
        type: Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for common queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = model('ActivityLog', activityLogSchema); 