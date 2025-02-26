const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const auth = require('../middleware/auth');
const SocialMetrics = require('../models/SocialMetrics');
const logger = require('../utils/logger');
const catchAsync = require('../utils/catchAsync');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow CSV and Excel files
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV and Excel files are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Route to handle file uploads
router.post('/upload', auth, upload.single('dataFile'), catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const platform = req.body.platform;
    
    if (!['facebook', 'instagram', 'twitter', 'tiktok'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform specified' });
    }

    try {
        let data = [];
        
        // Parse the file based on its extension
        if (fileExt === '.csv') {
            // Parse CSV file
            data = await parseCSV(filePath);
        } else {
            // Parse Excel file
            data = parseExcel(filePath);
        }
        
        // Process and save the data
        const savedEntries = await processAndSaveData(data, platform, req.user._id);
        
        // Log the activity
        logger.info('Data uploaded successfully', {
            userId: req.user._id,
            username: req.user.username,
            platform: platform,
            filename: req.file.originalname,
            entriesCount: savedEntries.length,
            action: 'data_upload'
        });
        
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
        
        res.status(200).json({ 
            message: 'Data uploaded successfully', 
            entriesCount: savedEntries.length 
        });
    } catch (error) {
        // Log the error
        logger.error('Error processing uploaded file', {
            userId: req.user._id,
            username: req.user.username,
            platform: platform,
            filename: req.file.originalname,
            error: error.message,
            action: 'data_upload_error'
        });
        
        // Clean up the uploaded file if it exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.status(500).json({ error: 'Error processing file: ' + error.message });
    }
}));

// Route to download example template
router.get('/download-template', auth, (req, res) => {
    const platform = req.query.platform;
    
    if (!['facebook', 'instagram', 'twitter', 'tiktok'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform specified' });
    }
    
    const templatePath = path.join(__dirname, `../templates/${platform}_template.xlsx`);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: 'Template not found' });
    }
    
    // Log the activity
    logger.info('Template downloaded', {
        userId: req.user._id,
        username: req.user.username,
        platform: platform,
        action: 'template_download'
    });
    
    res.download(templatePath, `${platform}_data_template.xlsx`);
});

// Route to get historical data for charts
router.get('/historical/:platform', auth, catchAsync(async (req, res) => {
    const { platform } = req.params;
    const { startDate, endDate, metric } = req.query;
    
    if (!['facebook', 'instagram', 'twitter', 'tiktok'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform specified' });
    }
    
    // Build query
    const query = { platform };
    
    if (startDate && endDate) {
        query.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    // Get historical data
    const data = await SocialMetrics.find(query)
        .sort({ timestamp: 1 })
        .select('timestamp metrics')
        .lean();
    
    // Log the activity
    logger.info('Historical data retrieved', {
        userId: req.user._id,
        username: req.user.username,
        platform: platform,
        startDate: startDate,
        endDate: endDate,
        metric: metric,
        recordsCount: data.length,
        action: 'historical_data_retrieval'
    });
    
    res.json(data);
}));

// Helper function to parse CSV files
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Helper function to parse Excel files
function parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
}

// Helper function to process and save data
async function processAndSaveData(data, platform, userId) {
    const savedEntries = [];
    
    for (const entry of data) {
        // Convert date string to Date object if it exists
        if (entry.date) {
            entry.timestamp = new Date(entry.date);
        } else {
            entry.timestamp = new Date();
        }
        
        // Create metrics object based on platform
        const metrics = {
            followers: entry.followers || 0,
            following: entry.following || 0,
            likes: entry.likes || 0,
            comments: entry.comments || 0,
            shares: entry.shares || 0,
            views: entry.views || 0,
            engagement_rate: entry.engagement_rate || 0,
            profile_views: entry.profile_views || 0,
            reach: entry.reach || 0,
            impressions: entry.impressions || 0
        };
        
        // Create new SocialMetrics document
        const socialMetrics = new SocialMetrics({
            platform,
            metrics,
            timestamp: entry.timestamp
        });
        
        // Save to database
        const savedEntry = await socialMetrics.save();
        savedEntries.push(savedEntry);
    }
    
    return savedEntries;
}

module.exports = router; 