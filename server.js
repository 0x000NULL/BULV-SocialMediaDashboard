const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const securityLogger = require('./middleware/securityLogger');
const apiErrorHandler = require('./middleware/apiErrorHandler');
const metricsScheduler = require('./services/MetricsScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use(securityLogger);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    family: 4
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error details:', {
        message: err.message,
        code: err.code,
        address: process.env.MONGODB_URI
    });
    console.log('Server will continue running, but database features will not work');
});

// Routes
const viewRoutes = require('./routes/views');
const authRoutes = require('./routes/auth');
const socialMediaRoutes = require('./routes/socialMedia');

app.use('/', viewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/social', socialMediaRoutes);

// API error handler (before the main error handler)
app.use(apiErrorHandler);

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('errors/404');
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start the metrics scheduler
if (process.env.NODE_ENV !== 'test') {
    metricsScheduler.start();
}

// Add graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Starting graceful shutdown');
    metricsScheduler.stop();
    // ... other cleanup ...
    process.exit(0);
});

// Add error monitoring for uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    // Give the logger time to write before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('unhandledRejection', (error) => {
    logger.fatal('Unhandled Rejection:', {
        error: error.message,
        stack: error.stack
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 