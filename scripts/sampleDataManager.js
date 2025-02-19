const mongoose = require('mongoose');
const SocialMetrics = require('../models/SocialMetrics');
const logger = require('../utils/logger');
const readline = require('readline');
require('dotenv').config();
const { Types: { ObjectId } } = mongoose;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Sample data generators
const generateDemographics = () => ({
    gender: new Map([
        ['Male', 45],
        ['Female', 48],
        ['Other', 7]
    ]),
    age: new Map([
        ['13-17', 15],
        ['18-24', 35],
        ['25-34', 25],
        ['35-44', 15],
        ['45+', 10]
    ]),
    location: new Map([
        ['United States', 45],
        ['United Kingdom', 15],
        ['Canada', 10],
        ['Australia', 8],
        ['Germany', 7],
        ['France', 6],
        ['Other', 9]
    ]),
    language: new Map([
        ['English', 60],
        ['Spanish', 15],
        ['French', 10],
        ['German', 8],
        ['Other', 7]
    ]),
    interests: ['Travel', 'Food', 'Fashion', 'Technology', 'Sports', 'Music'],
    active_times: new Map([
        ['00-04', 10],
        ['04-08', 15],
        ['08-12', 25],
        ['12-16', 30],
        ['16-20', 35],
        ['20-24', 20]
    ])
});

const generateContentPerformance = () => ({
    best_times: [
        '09:00', '12:00', '15:00', '18:00', '20:00'
    ],
    top_hashtags: Array.from({ length: 10 }, (_, i) => ({
        tag: `#trending${i + 1}`,
        usage: Math.floor(Math.random() * 1000),
        engagement: Math.random() * 100,
        reach: Math.floor(Math.random() * 10000),
        impressions: Math.floor(Math.random() * 15000)
    })),
    media_stats: {
        photos: {
            count: Math.floor(Math.random() * 500),
            avg_engagement: Math.random() * 100,
            total_reach: Math.floor(Math.random() * 100000),
            total_impressions: Math.floor(Math.random() * 150000)
        },
        videos: {
            count: Math.floor(Math.random() * 200),
            avg_engagement: Math.random() * 100,
            avg_watch_time: Math.random() * 60,
            completion_rate: Math.random() * 100,
            total_views: Math.floor(Math.random() * 200000),
            total_reach: Math.floor(Math.random() * 150000)
        },
        stories: {
            count: Math.floor(Math.random() * 300),
            avg_reach: Math.floor(Math.random() * 5000),
            avg_impressions: Math.floor(Math.random() * 7000),
            exit_rate: Math.random() * 30,
            reply_rate: Math.random() * 20
        },
        reels: {
            count: Math.floor(Math.random() * 100),
            avg_plays: Math.floor(Math.random() * 10000),
            avg_engagement: Math.random() * 100,
            completion_rate: Math.random() * 100,
            share_rate: Math.random() * 50
        }
    }
});

const generatePlatformSpecific = (platform) => {
    switch (platform) {
        case 'tiktok':
            return {
                average_watch_time: Math.random() * 60,
                completion_rate: Math.random() * 100,
                sound_usage: Array.from({ length: 5 }, () => ({
                    title: `Popular Sound ${Math.floor(Math.random() * 100)}`,
                    author: `Creator ${Math.floor(Math.random() * 100)}`,
                    usage_count: Math.floor(Math.random() * 1000),
                    average_views: Math.floor(Math.random() * 100000),
                    average_engagement: Math.random() * 100
                })),
                video_metrics: Array.from({ length: 10 }, () => ({
                    video_id: `vid_${Math.random().toString(36).substr(2, 9)}`,
                    views: Math.floor(Math.random() * 1000000),
                    likes: Math.floor(Math.random() * 100000),
                    comments: Math.floor(Math.random() * 10000),
                    shares: Math.floor(Math.random() * 5000),
                    watch_time: Math.random() * 60,
                    completion_rate: Math.random() * 100
                }))
            };
        case 'facebook':
            return {
                page_impressions: Math.floor(Math.random() * 500000),
                page_engaged_users: Math.floor(Math.random() * 100000),
                negative_feedback: Math.floor(Math.random() * 1000),
                page_views: Math.floor(Math.random() * 200000),
                total_reactions: Math.floor(Math.random() * 300000),
                video_metrics: Array.from({ length: 5 }, () => ({
                    video_id: new ObjectId().toString(),
                    title: `Facebook Video ${Math.floor(Math.random() * 100)}`,
                    views: Math.floor(Math.random() * 50000),
                    duration: Math.floor(Math.random() * 300),
                    avg_watch_time: Math.random() * 120,
                    retention_rate: Math.random() * 100
                })),
                event_metrics: Array.from({ length: 3 }, () => ({
                    event_id: new ObjectId().toString(),
                    name: `Event ${Math.floor(Math.random() * 100)}`,
                    attending: Math.floor(Math.random() * 1000),
                    interested: Math.floor(Math.random() * 2000),
                    declined: Math.floor(Math.random() * 500)
                })),
                ad_metrics: Array.from({ length: 5 }, () => ({
                    ad_id: new ObjectId().toString(),
                    campaign_name: `Campaign ${Math.floor(Math.random() * 100)}`,
                    impressions: Math.floor(Math.random() * 100000),
                    clicks: Math.floor(Math.random() * 5000),
                    spend: Math.random() * 1000,
                    actions: [
                        { action_type: 'link_click', value: Math.floor(Math.random() * 1000) },
                        { action_type: 'page_engagement', value: Math.floor(Math.random() * 2000) },
                        { action_type: 'post_reaction', value: Math.floor(Math.random() * 1500) }
                    ]
                }))
            };
        case 'instagram':
            return {
                story_metrics: Array.from({ length: 10 }, () => ({
                    story_id: new ObjectId().toString(),
                    type: ['photo', 'video'][Math.floor(Math.random() * 2)],
                    impressions: Math.floor(Math.random() * 10000),
                    reach: Math.floor(Math.random() * 8000),
                    exits: Math.floor(Math.random() * 1000),
                    replies: Math.floor(Math.random() * 500),
                    timestamp: new Date(Date.now() - Math.random() * 86400000)
                })),
                reel_metrics: Array.from({ length: 5 }, () => ({
                    reel_id: new ObjectId().toString(),
                    plays: Math.floor(Math.random() * 20000),
                    reach: Math.floor(Math.random() * 15000),
                    likes: Math.floor(Math.random() * 5000),
                    comments: Math.floor(Math.random() * 1000),
                    shares: Math.floor(Math.random() * 800),
                    saves: Math.floor(Math.random() * 600)
                })),
                media_types: {
                    image_count: Math.floor(Math.random() * 500),
                    video_count: Math.floor(Math.random() * 200),
                    carousel_count: Math.floor(Math.random() * 150),
                    reels_count: Math.floor(Math.random() * 100),
                    story_count: Math.floor(Math.random() * 300)
                }
            };
        case 'twitter':
            return {
                verified_status: Math.random() > 0.5,
                mentions_count: Math.floor(Math.random() * 1000),
                tweet_metrics: {
                    average_impressions: Math.floor(Math.random() * 5000),
                    average_engagement: Math.random() * 10,
                    reply_rate: Math.random() * 5,
                    quote_rate: Math.random() * 3,
                    top_topics: Array.from({ length: 5 }, (_, i) => ({
                        topic: `Trending Topic ${i + 1}`,
                        count: Math.floor(Math.random() * 100),
                        engagement_rate: Math.random() * 15
                    })),
                    hashtag_performance: Array.from({ length: 8 }, (_, i) => ({
                        tag: `#viral${i + 1}`,
                        usage: Math.floor(Math.random() * 500),
                        avg_engagement: Math.random() * 8,
                        avg_impressions: Math.floor(Math.random() * 3000)
                    }))
                }
            };
        default:
            return {};
    }
};

// Add helper functions for data trends
const addTrends = (value, day) => {
    // Add some realistic trending patterns
    const trend = Math.sin(day / 7) * 0.2; // Weekly cycle
    const growth = day * 0.01; // Gradual growth
    const noise = (Math.random() - 0.5) * 0.1; // Random variation
    
    return value * (1 + trend + growth + noise);
};

const generateSampleMetrics = (platform, date, day) => {
    const baseMetrics = {
        platform,
        metrics: {
            followers: Math.floor(addTrends(Math.random() * 1000000, day)),
            following: Math.floor(addTrends(Math.random() * 5000, day)),
            likes: Math.floor(Math.random() * 2000000),
            comments: Math.floor(Math.random() * 500000),
            shares: Math.floor(Math.random() * 300000),
            views: Math.floor(Math.random() * 5000000),
            engagement_rate: Math.random() * 15,
            profile_views: Math.floor(Math.random() * 200000),
            reach: Math.floor(Math.random() * 1000000),
            impressions: Math.floor(Math.random() * 2000000),
            audience_demographics: generateDemographics(),
            content_performance: generateContentPerformance(),
            platform_specific: generatePlatformSpecific(platform)
        },
        post_frequency: {
            daily: Math.floor(Math.random() * 10),
            weekly: Math.floor(Math.random() * 50),
            monthly: Math.floor(Math.random() * 200),
            by_type: {
                photos: Math.floor(Math.random() * 100),
                videos: Math.floor(Math.random() * 50),
                stories: Math.floor(Math.random() * 150),
                reels: Math.floor(Math.random() * 30),
                carousels: Math.floor(Math.random() * 20)
            }
        },
        api_metrics: {
            rate_limits: {
                remaining: Math.floor(Math.random() * 1000),
                reset_time: new Date(Date.now() + Math.random() * 3600000)
            },
            response_time: Math.random() * 1000,
            error_count: Math.floor(Math.random() * 10),
            retry_count: Math.floor(Math.random() * 5)
        },
        timestamp: date
    };

    // Add platform-specific growth patterns
    switch (platform) {
        case 'tiktok':
            baseMetrics.metrics.followers *= 1.2; // Faster growth on TikTok
            break;
        case 'instagram':
            baseMetrics.metrics.engagement_rate *= 1.1; // Higher engagement on Instagram
            break;
        // ... other platform-specific adjustments
    }

    return baseMetrics;
};

const generateSampleData = async (days = 30) => {
    const platforms = ['tiktok', 'facebook', 'instagram', 'twitter'];
    const sampleData = [];

    // Generate data for each platform for the specified number of days
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        platforms.forEach(platform => {
            sampleData.push(generateSampleMetrics(platform, date, i));
        });
    }

    return sampleData;
};

// Add data validation before saving
const validateSampleData = (data) => {
    // Basic validation
    if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format');
    }

    // Validate each metric
    data.forEach(metric => {
        if (!metric.platform || !metric.metrics) {
            throw new Error('Missing required fields');
        }
        if (metric.metrics.followers < 0 || metric.metrics.engagement_rate > 100) {
            throw new Error('Invalid metric values');
        }
    });

    return true;
};

// Modify main function to include validation and progress tracking
const main = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');

        rl.question('Choose an option:\n1. Generate sample data\n2. Remove sample data\n3. View current data\n4. Exit\n', async (answer) => {
            switch (answer.trim()) {
                case '1':
                    rl.question('Enter number of days to generate data for (default: 30): ', async (days) => {
                        const numDays = parseInt(days) || 30;
                        logger.info('Generating sample data...');
                        
                        const sampleData = await generateSampleData(numDays);
                        validateSampleData(sampleData);
                        
                        const total = sampleData.length;
                        let processed = 0;
                        
                        // Insert in batches for better performance
                        const batchSize = 100;
                        for (let i = 0; i < total; i += batchSize) {
                            const batch = sampleData.slice(i, i + batchSize);
                            await SocialMetrics.insertMany(batch);
                            processed += batch.length;
                            logger.info(`Progress: ${processed}/${total} records inserted`);
                        }

                        logger.info(`Successfully generated ${total} sample metrics`);
                        rl.close();
                        process.exit(0);
                    });
                    break;

                case '2':
                    rl.question('Are you sure you want to remove all sample data? (y/n): ', async (confirm) => {
                        if (confirm.toLowerCase() === 'y') {
                            const result = await SocialMetrics.deleteMany({});
                            logger.info(`Removed ${result.deletedCount} records`);
                        }
                        rl.close();
                        process.exit(0);
                    });
                    break;

                case '3':
                    const count = await SocialMetrics.countDocuments();
                    const platforms = await SocialMetrics.distinct('platform');
                    const dateRange = await SocialMetrics.aggregate([
                        {
                            $group: {
                                _id: null,
                                minDate: { $min: '$timestamp' },
                                maxDate: { $max: '$timestamp' }
                            }
                        }
                    ]);

                    logger.info('Current Data Status:', {
                        totalRecords: count,
                        platforms,
                        dateRange: dateRange[0] ? {
                            from: dateRange[0].minDate,
                            to: dateRange[0].maxDate
                        } : 'No data'
                    });
                    rl.close();
                    process.exit(0);
                    break;

                case '4':
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    logger.error('Invalid option');
                    rl.close();
                    process.exit(1);
            }
        });
    } catch (error) {
        logger.error('Error:', error);
        process.exit(1);
    }
};

main(); 