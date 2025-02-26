const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure templates directory exists
const templatesDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

// Common columns for all platforms
const commonColumns = [
    { header: 'date', key: 'date', width: 15 },
    { header: 'followers', key: 'followers', width: 12 },
    { header: 'following', key: 'following', width: 12 },
    { header: 'likes', key: 'likes', width: 12 },
    { header: 'comments', key: 'comments', width: 12 },
    { header: 'shares', key: 'shares', width: 12 },
    { header: 'views', key: 'views', width: 12 },
    { header: 'engagement_rate', key: 'engagement_rate', width: 18 },
    { header: 'profile_views', key: 'profile_views', width: 15 },
    { header: 'reach', key: 'reach', width: 12 },
    { header: 'impressions', key: 'impressions', width: 15 }
];

// Platform-specific columns
const platformSpecificColumns = {
    facebook: [
        { header: 'page_likes', key: 'page_likes', width: 12 },
        { header: 'page_views', key: 'page_views', width: 12 },
        { header: 'post_reach', key: 'post_reach', width: 12 }
    ],
    instagram: [
        { header: 'story_views', key: 'story_views', width: 12 },
        { header: 'saved_posts', key: 'saved_posts', width: 12 },
        { header: 'hashtag_reach', key: 'hashtag_reach', width: 15 }
    ],
    twitter: [
        { header: 'retweets', key: 'retweets', width: 12 },
        { header: 'mentions', key: 'mentions', width: 12 },
        { header: 'tweet_impressions', key: 'tweet_impressions', width: 18 }
    ],
    tiktok: [
        { header: 'video_views', key: 'video_views', width: 12 },
        { header: 'video_shares', key: 'video_shares', width: 12 },
        { header: 'profile_visits', key: 'profile_visits', width: 15 }
    ]
};

// Sample data (one row with empty values)
const sampleData = [
    {
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        followers: 0,
        following: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        engagement_rate: 0,
        profile_views: 0,
        reach: 0,
        impressions: 0
    }
];

// Generate template for each platform
Object.keys(platformSpecificColumns).forEach(platform => {
    // Create workbook
    const workbook = xlsx.utils.book_new();
    
    // Combine common columns with platform-specific columns
    const columns = [...commonColumns, ...platformSpecificColumns[platform]];
    
    // Add platform-specific fields to sample data
    const platformData = sampleData.map(row => {
        const newRow = { ...row };
        platformSpecificColumns[platform].forEach(col => {
            newRow[col.key] = 0;
        });
        return newRow;
    });
    
    // Create worksheet
    const worksheet = xlsx.utils.json_to_sheet(platformData);
    
    // Set column widths
    worksheet['!cols'] = columns.map(col => ({ wch: col.width }));
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, platform);
    
    // Write to file
    const filePath = path.join(templatesDir, `${platform}_template.xlsx`);
    xlsx.writeFile(workbook, filePath);
    
    console.log(`Generated template for ${platform} at ${filePath}`);
});

console.log('All templates generated successfully!'); 