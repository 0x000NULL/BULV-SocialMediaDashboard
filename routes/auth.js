const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

// Validation rules
const registerValidation = [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

// Register route
router.post('/register', registerValidation, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Registration validation failed', {
            errors: errors.array(),
            ip: req.ip
        });
        return res.status(400).render('errors/400', { 
            error: errors.array()[0].msg 
        });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
        logger.warn('Registration attempt with existing user', {
            email,
            username,
            ip: req.ip
        });
        return res.status(400).render('errors/400', { 
            error: 'User already exists' 
        });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    logger.info('New user registered', {
        userId: user._id,
        username,
        email
    });

    // Redirect to login
    res.redirect('/login');
}));

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'Invalid credentials' 
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { 
                error: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        res.render('login', { 
            error: 'An error occurred during login' 
        });
    }
});

// Get current user route
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 