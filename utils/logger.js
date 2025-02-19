const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Custom format for detailed logging
const detailedFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (metadata.user) {
        msg += ` | User: ${metadata.user}`;
    }
    if (metadata.path) {
        msg += ` | Path: ${metadata.path}`;
    }
    if (metadata.statusCode) {
        msg += ` | Status: ${metadata.statusCode}`;
    }
    if (metadata.stack && process.env.NODE_ENV !== 'production') {
        msg += `\n${metadata.stack}`;
    }
    
    return msg;
});

// Rotate file configuration
const rotateConfig = {
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    compress: true,
    format: detailedFormat
};

// Create logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata(),
        winston.format.json()
    ),
    transports: [
        // Console transport (fatal errors only)
        new winston.transports.Console({
            level: 'error',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(info => {
                    if (info.level === 'error' && info.fatal) {
                        return `${info.timestamp} ${info.level}: ${info.message}`;
                    }
                    return null;
                })
            )
        }),
        // Error logs
        new DailyRotateFile({
            ...rotateConfig,
            filename: path.join(__dirname, '../logs/error-%DATE%.log'),
            level: 'error'
        }),
        // Access logs
        new DailyRotateFile({
            ...rotateConfig,
            filename: path.join(__dirname, '../logs/access-%DATE%.log'),
            level: 'info'
        }),
        // API logs
        new DailyRotateFile({
            ...rotateConfig,
            filename: path.join(__dirname, '../logs/api-%DATE%.log'),
            level: 'info'
        }),
        // Security logs
        new DailyRotateFile({
            ...rotateConfig,
            filename: path.join(__dirname, '../logs/security-%DATE%.log'),
            level: 'warn'
        })
    ]
});

// Add event handlers for rotate events
logger.transports.forEach(transport => {
    if (transport instanceof DailyRotateFile) {
        transport.on('rotate', function(oldFilename, newFilename) {
            logger.info('Log rotated', {
                oldFile: oldFilename,
                newFile: newFilename,
                timestamp: new Date().toISOString()
            });
        });
    }
});

// Helper function for fatal errors
logger.fatal = function(message, meta = {}) {
    this.error(message, { ...meta, fatal: true });
};

module.exports = logger; 