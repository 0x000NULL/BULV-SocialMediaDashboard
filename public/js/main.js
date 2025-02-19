// Add at the top of the file
let charts = {};

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupDateRangePicker();
    setupRealTimeUpdates();
});

// Chart initialization
function initializeCharts() {
    // Initialize main charts
    safeChartInit('followerGrowthChart', initializeFollowerGrowthChart);
    safeChartInit('engagementChart', initializeEngagementChart);
    
    // Initialize demographics charts
    ['gender', 'age', 'location', 'language'].forEach(demographic => {
        safeChartInit(`${demographic}Chart`, ctx => initializeDemographicChart(ctx, demographic));
    });
    
    // Initialize content performance charts
    safeChartInit('mediaStatsChart', initializeMediaStatsChart);
    safeChartInit('hashtagsChart', initializeHashtagsChart);
    safeChartInit('postTimingChart', initializePostTimingChart);
    
    // Initialize platform-specific charts
    initializePlatformCharts();
    
    // Initialize frequency and API charts
    safeChartInit('postFrequencyChart', initializePostFrequencyChart);
    safeChartInit('apiPerformanceChart', initializeApiPerformanceChart);
}

async function initializeFollowerGrowthChart(ctx) {
    const response = await fetch('/api/social/metrics');
    const data = await response.json();
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'TikTok',
                data: data.filter(d => d.platform === 'tiktok').map(d => d.metrics.followers),
                borderColor: '#FF0050',
                tension: 0.1
            }, {
                label: 'Facebook',
                data: data.filter(d => d.platform === 'facebook').map(d => d.metrics.followers),
                borderColor: '#4267B2',
                tension: 0.1
            }, {
                label: 'Instagram',
                data: data.filter(d => d.platform === 'instagram').map(d => d.metrics.followers),
                borderColor: '#E1306C',
                tension: 0.1
            }, {
                label: 'Twitter',
                data: data.filter(d => d.platform === 'twitter').map(d => d.metrics.followers),
                borderColor: '#1DA1F2',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Follower Growth Across Platforms'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

async function initializeEngagementChart(ctx) {
    const response = await fetch('/api/social/metrics');
    const data = await response.json();
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TikTok', 'Facebook', 'Instagram', 'Twitter'],
            datasets: [{
                label: 'Engagement Rate (%)',
                data: ['tiktok', 'facebook', 'instagram', 'twitter'].map(platform => {
                    const platformData = data.find(d => d.platform === platform);
                    return platformData?.metrics.engagement_rate || 0;
                }),
                backgroundColor: [
                    '#FF0050',
                    '#4267B2',
                    '#E1306C',
                    '#1DA1F2'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Platform Engagement Rates'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Engagement Rate (%)'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Date range picker setup
function setupDateRangePicker() {
    const dateRangeForm = document.getElementById('dateRangeForm');
    if (dateRangeForm) {
        dateRangeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            await updateChartsWithDateRange(startDate, endDate);
        });
    }
}

// Real-time updates
function setupRealTimeUpdates() {
    setInterval(async () => {
        try {
            const response = await fetch('/api/social/metrics');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            
            Object.keys(charts).forEach(chartId => {
                const chart = charts[chartId];
                if (chart) {
                    updateChart(chartId, data);
                }
            });
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }, 5 * 60 * 1000);
}

async function updateChartsWithDateRange(startDate, endDate) {
    try {
        const response = await fetch(`/api/social/metrics/range?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error('Failed to fetch metrics');
        }
        
        const data = await response.json();
        if (!data || !data.length) {
            throw new Error('No data available for selected date range');
        }
        
        // Update all charts with new data
        Object.keys(charts).forEach(chartId => {
            const chart = charts[chartId];
            if (chart) {
                switch(chartId) {
                    case 'followerGrowthChart':
                        updateFollowerGrowthChart(data);
                        break;
                    case 'engagementChart':
                        updateEngagementChart(data);
                        break;
                    case 'genderChart':
                    case 'ageChart':
                    case 'locationChart':
                    case 'languageChart':
                        updateDemographicsCharts(data);
                        break;
                    case 'mediaStatsChart':
                    case 'hashtagsChart':
                    case 'postTimingChart':
                        updateContentPerformanceCharts(data);
                        break;
                    case 'tiktokVideoMetricsChart':
                    case 'tiktokSoundUsageChart':
                    case 'facebookPageMetricsChart':
                    case 'facebookVideoMetricsChart':
                    case 'facebookEventMetricsChart':
                    case 'instagramStoryMetricsChart':
                    case 'instagramReelMetricsChart':
                    case 'instagramMediaTypesChart':
                    case 'twitterTweetMetricsChart':
                    case 'twitterTopicsChart':
                        updatePlatformSpecificCharts(data);
                        break;
                    case 'postFrequencyChart':
                        updatePostFrequencyChart(data);
                        break;
                    case 'apiPerformanceChart':
                        updateApiPerformanceChart(data);
                        break;
                }
            }
        });
    } catch (error) {
        console.error('Error updating charts:', error);
        showErrorToast(error.message);
    }
}

function updateFollowerGrowthChart(data) {
    const chart = charts['followerGrowthChart'];
    if (chart) {
        chart.data.labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
        chart.data.datasets.forEach(dataset => {
            const platform = dataset.label.toLowerCase();
            dataset.data = data
                .filter(d => d.platform === platform)
                .map(d => d.metrics.followers);
        });
        chart.update();
    }
}

function updateEngagementChart(data) {
    const chart = charts['engagementChart'];
    if (chart) {
        chart.data.datasets[0].data = ['tiktok', 'facebook', 'instagram', 'twitter']
            .map(platform => {
                const platformData = data.find(d => d.platform === platform);
                return platformData?.metrics.engagement_rate || 0;
            });
        chart.update();
    }
}

function updateDemographicsCharts(data) {
    ['gender', 'age', 'location', 'language'].forEach(demographic => {
        const chart = charts[`${demographic}Chart`];
        if (chart) {
            const latestData = data.reduce((acc, curr) => {
                if (!acc[curr.platform] || curr.timestamp > acc[curr.platform].timestamp) {
                    acc[curr.platform] = curr;
                }
                return acc;
            }, {});

            const datasets = Object.entries(latestData).map(([platform, data]) => ({
                label: platform.charAt(0).toUpperCase() + platform.slice(1),
                data: Array.from(data.metrics.audience_demographics[demographic] || new Map()),
                backgroundColor: getPlatformColor(platform)
            }));

            chart.data.datasets = datasets;
            chart.update();
        }
    });
}

function getPlatformColor(platform) {
    const colors = {
        tiktok: '#FF0050',
        facebook: '#4267B2',
        instagram: '#E1306C',
        twitter: '#1DA1F2'
    };
    return colors[platform] || '#666666';
}

// Error handling wrapper for chart initialization
function safeChartInit(chartId, initFunction) {
    try {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            // Destroy existing chart if it exists
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
            
            const chart = initFunction(canvas.getContext('2d'));
            if (chart) {
                charts[chartId] = chart;
            }
        }
    } catch (error) {
        console.error(`Error initializing ${chartId}:`, error);
    }
}

function updateContentPerformanceCharts(data) {
    // Update Media Stats Chart
    const mediaStatsChart = charts['mediaStatsChart'];
    if (mediaStatsChart) {
        const latestData = getLatestMetricsPerPlatform(data);
        const mediaTypes = ['photos', 'videos', 'stories', 'reels'];
        
        mediaStatsChart.data = {
            labels: mediaTypes,
            datasets: Object.entries(latestData).map(([platform, data]) => ({
                label: platform.charAt(0).toUpperCase() + platform.slice(1),
                data: mediaTypes.map(type => data.metrics.content_performance.media_stats[type]?.count || 0),
                backgroundColor: getPlatformColor(platform)
            }))
        };
        mediaStatsChart.update();
    }

    // Update Hashtags Chart
    const hashtagsChart = charts['hashtagsChart'];
    if (hashtagsChart) {
        const allHashtags = data.flatMap(d => 
            d.metrics.content_performance.top_hashtags
            .slice(0, 5) // Top 5 hashtags per platform
            .map(h => ({
                platform: d.platform,
                ...h
            }))
        );

        hashtagsChart.data = {
            labels: [...new Set(allHashtags.map(h => h.tag))],
            datasets: [{
                label: 'Usage Count',
                data: allHashtags.map(h => h.usage),
                backgroundColor: allHashtags.map(h => getPlatformColor(h.platform))
            }]
        };
        hashtagsChart.update();
    }

    // Update Post Timing Chart
    const postTimingChart = charts['postTimingChart'];
    if (postTimingChart) {
        const latestData = getLatestMetricsPerPlatform(data);
        const bestTimes = Object.entries(latestData).map(([platform, data]) => ({
            platform,
            times: data.metrics.content_performance.best_times || []
        }));

        postTimingChart.data = {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: bestTimes.map(({ platform, times }) => ({
                label: platform.charAt(0).toUpperCase() + platform.slice(1),
                data: Array.from({ length: 24 }, (_, i) => 
                    times.filter(t => parseInt(t) === i).length
                ),
                borderColor: getPlatformColor(platform),
                fill: false
            }))
        };
        postTimingChart.update();
    }
}

function updatePlatformSpecificCharts(data) {
    const platforms = ['tiktok', 'facebook', 'instagram', 'twitter'];
    platforms.forEach(platform => {
        const latestData = data.find(d => d.platform === platform);
        if (!latestData) return;

        switch (platform) {
            case 'tiktok':
                updateTikTokCharts(latestData);
                break;
            case 'facebook':
                updateFacebookCharts(latestData);
                break;
            case 'instagram':
                updateInstagramCharts(latestData);
                break;
            case 'twitter':
                updateTwitterCharts(latestData);
                break;
        }
    });
}

function updatePostFrequencyChart(data) {
    const chart = charts['postFrequencyChart'];
    if (chart) {
        const latestData = getLatestMetricsPerPlatform(data);
        
        chart.data = {
            labels: ['Daily', 'Weekly', 'Monthly'],
            datasets: Object.entries(latestData).map(([platform, data]) => ({
                label: platform.charAt(0).toUpperCase() + platform.slice(1),
                data: [
                    data.post_frequency.daily,
                    data.post_frequency.weekly,
                    data.post_frequency.monthly
                ],
                backgroundColor: getPlatformColor(platform)
            }))
        };
        chart.update();
    }
}

function updateApiPerformanceChart(data) {
    const chart = charts['apiPerformanceChart'];
    if (chart) {
        const latestData = getLatestMetricsPerPlatform(data);
        
        chart.data = {
            labels: ['TikTok', 'Facebook', 'Instagram', 'Twitter'],
            datasets: [{
                label: 'Response Time (ms)',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#FF0050',
                    '#4267B2',
                    '#E1306C',
                    '#1DA1F2'
                ]
            }, {
                label: 'Error Count',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    adjustColor('#FF0050', -20),
                    adjustColor('#4267B2', -20),
                    adjustColor('#E1306C', -20),
                    adjustColor('#1DA1F2', -20)
                ]
            }]
        };
        chart.update();
    }
}

// Helper Functions
function getLatestMetricsPerPlatform(data) {
    return data.reduce((acc, curr) => {
        if (!acc[curr.platform] || curr.timestamp > acc[curr.platform].timestamp) {
            acc[curr.platform] = curr;
        }
        return acc;
    }, {});
}

function adjustColor(hex, amount) {
    const color = hex.replace('#', '');
    const num = parseInt(color, 16);
    const r = Math.clamp((num >> 16) + amount, 0, 255);
    const g = Math.clamp(((num >> 8) & 0x00FF) + amount, 0, 255);
    const b = Math.clamp((num & 0x0000FF) + amount, 0, 255);
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}

// Platform-specific chart updates
function updateTikTokCharts(data) {
    // Update video metrics chart
    const videoChart = charts['tiktokVideoMetricsChart'];
    if (videoChart) {
        const metrics = data.metrics.platform_specific.tiktok.video_metrics.slice(0, 10); // Last 10 videos
        
        videoChart.data = {
            labels: metrics.map((_, index) => `Video ${index + 1}`),
            datasets: [{
                label: 'Views',
                data: metrics.map(m => m.views),
                backgroundColor: '#FF0050',
                yAxisID: 'y'
            }, {
                label: 'Completion Rate (%)',
                data: metrics.map(m => m.completion_rate),
                borderColor: '#00f2ea',
                type: 'line',
                yAxisID: 'y1'
            }]
        };
        videoChart.options = {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Views' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Completion Rate (%)' },
                    grid: { drawOnChartArea: false }
                }
            }
        };
        videoChart.update();
    }

    // Update sound usage chart
    const soundChart = charts['tiktokSoundUsageChart'];
    if (soundChart) {
        const soundData = data.metrics.platform_specific.tiktok.sound_usage
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, 5); // Top 5 sounds

        soundChart.data = {
            labels: soundData.map(s => s.title),
            datasets: [{
                label: 'Usage Count',
                data: soundData.map(s => s.usage_count),
                backgroundColor: '#FF0050'
            }, {
                label: 'Avg. Views',
                data: soundData.map(s => s.average_views),
                backgroundColor: '#00f2ea'
            }]
        };
        soundChart.update();
    }
}

function updateFacebookCharts(data) {
    // Page Performance Chart
    const pageChart = charts['facebookPageMetricsChart'];
    if (pageChart) {
        const metrics = data.metrics.platform_specific.facebook;
        
        pageChart.data = {
            labels: ['Impressions', 'Engaged Users', 'Total Reactions'],
            datasets: [{
                data: [
                    metrics.page_impressions,
                    metrics.page_engaged_users,
                    metrics.total_reactions
                ],
                backgroundColor: ['#4267B2', '#898F9C', '#2D88FF']
            }]
        };
        pageChart.update();
    }

    // Video Performance Chart
    const videoChart = charts['facebookVideoMetricsChart'];
    if (videoChart) {
        const videoMetrics = data.metrics.platform_specific.facebook.video_metrics
            .slice(0, 5); // Last 5 videos

        videoChart.data = {
            labels: videoMetrics.map(v => v.title || 'Untitled'),
            datasets: [{
                label: 'Views',
                data: videoMetrics.map(v => v.views),
                backgroundColor: '#4267B2'
            }, {
                label: 'Retention Rate (%)',
                data: videoMetrics.map(v => v.retention_rate),
                borderColor: '#2D88FF',
                type: 'line'
            }]
        };
        videoChart.update();
    }

    // Event Performance Chart
    const eventChart = charts['facebookEventMetricsChart'];
    if (eventChart) {
        const eventMetrics = data.metrics.platform_specific.facebook.event_metrics
            .slice(0, 3); // Last 3 events

        eventChart.data = {
            labels: eventMetrics.map(e => e.name),
            datasets: [{
                label: 'Attending',
                data: eventMetrics.map(e => e.attending),
                backgroundColor: '#4267B2'
            }, {
                label: 'Interested',
                data: eventMetrics.map(e => e.interested),
                backgroundColor: '#898F9C'
            }]
        };
        eventChart.update();
    }
}

function updateInstagramCharts(data) {
    // Story Performance Chart
    const storyChart = charts['instagramStoryMetricsChart'];
    if (storyChart) {
        const storyMetrics = data.metrics.platform_specific.instagram.story_metrics
            .slice(0, 5); // Last 5 stories

        storyChart.data = {
            labels: storyMetrics.map(s => new Date(s.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'Impressions',
                data: storyMetrics.map(s => s.impressions),
                backgroundColor: '#E1306C'
            }, {
                label: 'Replies',
                data: storyMetrics.map(s => s.replies),
                backgroundColor: '#F77737'
            }]
        };
        storyChart.update();
    }

    // Reel Performance Chart
    const reelChart = charts['instagramReelMetricsChart'];
    if (reelChart) {
        const reelMetrics = data.metrics.platform_specific.instagram.reel_metrics
            .slice(0, 5); // Last 5 reels

        reelChart.data = {
            labels: reelMetrics.map((_, index) => `Reel ${index + 1}`),
            datasets: [{
                label: 'Plays',
                data: reelMetrics.map(r => r.plays),
                backgroundColor: '#E1306C'
            }, {
                label: 'Saves',
                data: reelMetrics.map(r => r.saves),
                backgroundColor: '#F77737'
            }]
        };
        reelChart.update();
    }

    // Media Types Distribution Chart
    const mediaChart = charts['instagramMediaTypesChart'];
    if (mediaChart) {
        const mediaTypes = data.metrics.platform_specific.instagram.media_types;

        mediaChart.data = {
            labels: ['Images', 'Videos', 'Carousels', 'Reels', 'Stories'],
            datasets: [{
                data: [
                    mediaTypes.image_count,
                    mediaTypes.video_count,
                    mediaTypes.carousel_count,
                    mediaTypes.reels_count,
                    mediaTypes.story_count
                ],
                backgroundColor: ['#E1306C', '#F77737', '#FCAF45', '#FFDC80', '#C13584']
            }]
        };
        mediaChart.update();
    }
}

function updateTwitterCharts(data) {
    // Tweet Performance Chart
    const tweetChart = charts['twitterTweetMetricsChart'];
    if (tweetChart) {
        const metrics = data.metrics.platform_specific.twitter.tweet_metrics;

        tweetChart.data = {
            labels: ['Impressions', 'Engagement', 'Replies', 'Quotes'],
            datasets: [{
                data: [
                    metrics.average_impressions,
                    metrics.average_engagement,
                    metrics.reply_rate * 100,
                    metrics.quote_rate * 100
                ],
                backgroundColor: ['#1DA1F2', '#14171A', '#657786', '#AAB8C2']
            }]
        };
        tweetChart.update();
    }

    // Topics Chart
    const topicsChart = charts['twitterTopicsChart'];
    if (topicsChart) {
        const topics = data.metrics.platform_specific.twitter.tweet_metrics.top_topics
            .sort((a, b) => b.engagement_rate - a.engagement_rate)
            .slice(0, 5); // Top 5 topics

        topicsChart.data = {
            labels: topics.map(t => t.topic),
            datasets: [{
                label: 'Tweet Count',
                data: topics.map(t => t.count),
                backgroundColor: '#1DA1F2'
            }, {
                label: 'Engagement Rate (%)',
                data: topics.map(t => t.engagement_rate),
                borderColor: '#14171A',
                type: 'line'
            }]
        };
        topicsChart.update();
    }
}

// Add a helper function for showing error messages
function showErrorToast(message) {
    const existingToast = document.querySelector('.alert');
    if (existingToast) {
        existingToast.remove();
    }
    
    const errorToast = document.createElement('div');
    errorToast.className = 'alert alert-danger alert-dismissible fade show';
    errorToast.innerHTML = `
        Error updating charts: ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container-fluid').prepend(errorToast);
}

// Add initialization functions for each chart type
function initializeDemographicChart(ctx, demographic) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Distribution',
                data: [],
                backgroundColor: '#4267B2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${demographic.charAt(0).toUpperCase() + demographic.slice(1)} Distribution`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeMediaStatsChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Photos', 'Videos', 'Stories', 'Reels'],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Media Type Distribution'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeHashtagsChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top Hashtags Performance'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializePostTimingChart(ctx) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Best Posting Times'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializePlatformCharts() {
    const platformCharts = {
        tiktok: ['tiktokVideoMetricsChart', 'tiktokSoundUsageChart'],
        facebook: ['facebookPageMetricsChart', 'facebookVideoMetricsChart', 'facebookEventMetricsChart'],
        instagram: ['instagramStoryMetricsChart', 'instagramReelMetricsChart', 'instagramMediaTypesChart'],
        twitter: ['twitterTweetMetricsChart', 'twitterTopicsChart']
    };

    Object.entries(platformCharts).forEach(([platform, chartIds]) => {
        chartIds.forEach(chartId => {
            const initFunction = getChartInitFunction(chartId);
            if (initFunction) {
                safeChartInit(chartId, initFunction);
            }
        });
    });
}

function getChartInitFunction(chartId) {
    const initFunctions = {
        'tiktokVideoMetricsChart': initializeTikTokVideoChart,
        'tiktokSoundUsageChart': initializeTikTokSoundChart,
        'facebookPageMetricsChart': initializeFacebookPageChart,
        'facebookVideoMetricsChart': initializeFacebookVideoChart,
        'facebookEventMetricsChart': initializeFacebookEventChart,
        'instagramStoryMetricsChart': initializeInstagramStoryChart,
        'instagramReelMetricsChart': initializeInstagramReelChart,
        'instagramMediaTypesChart': initializeInstagramMediaChart,
        'twitterTweetMetricsChart': initializeTwitterTweetChart,
        'twitterTopicsChart': initializeTwitterTopicsChart
    };
    return initFunctions[chartId];
}

// TikTok Chart Initializations
function initializeTikTokVideoChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Views',
                data: [],
                backgroundColor: '#FF0050',
                yAxisID: 'y'
            }, {
                label: 'Completion Rate (%)',
                data: [],
                borderColor: '#00f2ea',
                type: 'line',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Video Performance'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Views' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Completion Rate (%)' },
                    grid: { drawOnChartArea: false }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeTikTokSoundChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Usage Count',
                data: [],
                backgroundColor: '#FF0050'
            }, {
                label: 'Avg. Views',
                data: [],
                backgroundColor: '#00f2ea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sound Usage Analytics'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Facebook Chart Initializations
function initializeFacebookPageChart(ctx) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Impressions', 'Engaged Users', 'Total Reactions'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4267B2', '#898F9C', '#2D88FF']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Page Performance Overview'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeFacebookVideoChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Views',
                data: [],
                backgroundColor: '#4267B2'
            }, {
                label: 'Retention Rate (%)',
                data: [],
                borderColor: '#2D88FF',
                type: 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Video Performance Metrics'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeFacebookEventChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Attending',
                data: [],
                backgroundColor: '#4267B2'
            }, {
                label: 'Interested',
                data: [],
                backgroundColor: '#898F9C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Event Performance'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Instagram Chart Initializations
function initializeInstagramStoryChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Impressions',
                data: [],
                backgroundColor: '#E1306C'
            }, {
                label: 'Replies',
                data: [],
                backgroundColor: '#F77737'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Story Performance'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeInstagramReelChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Plays',
                data: [],
                backgroundColor: '#E1306C'
            }, {
                label: 'Saves',
                data: [],
                backgroundColor: '#F77737'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Reel Performance'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeInstagramMediaChart(ctx) {
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Images', 'Videos', 'Carousels', 'Reels', 'Stories'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: ['#E1306C', '#F77737', '#FCAF45', '#FFDC80', '#C13584']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Media Type Distribution'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Twitter Chart Initializations
function initializeTwitterTweetChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Impressions', 'Engagement', 'Replies', 'Quotes'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#1DA1F2', '#14171A', '#657786', '#AAB8C2']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Tweet Performance Overview'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeTwitterTopicsChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Tweet Count',
                data: [],
                backgroundColor: '#1DA1F2'
            }, {
                label: 'Engagement Rate (%)',
                data: [],
                borderColor: '#14171A',
                type: 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top Topics Performance'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Add these functions after the other initialization functions

function initializePostFrequencyChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Daily', 'Weekly', 'Monthly'],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Post Frequency Analysis'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Posts'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function initializeApiPerformanceChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TikTok', 'Facebook', 'Instagram', 'Twitter'],
            datasets: [{
                label: 'Response Time (ms)',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#FF0050',
                    '#4267B2',
                    '#E1306C',
                    '#1DA1F2'
                ]
            }, {
                label: 'Error Count',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    adjustColor('#FF0050', -20),
                    adjustColor('#4267B2', -20),
                    adjustColor('#E1306C', -20),
                    adjustColor('#1DA1F2', -20)
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'API Performance Metrics'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Add Math.clamp helper function if not already present
if (!Math.clamp) {
    Math.clamp = function(num, min, max) {
        return Math.min(Math.max(num, min), max);
    };
}

// Helper function to update a specific chart
function updateChart(chartId, data) {
    switch(chartId) {
        case 'followerGrowthChart':
            updateFollowerGrowthChart(data);
            break;
        case 'engagementChart':
            updateEngagementChart(data);
            break;
        case 'genderChart':
        case 'ageChart':
        case 'locationChart':
        case 'languageChart':
            updateDemographicsCharts(data);
            break;
        case 'mediaStatsChart':
        case 'hashtagsChart':
        case 'postTimingChart':
            updateContentPerformanceCharts(data);
            break;
        case 'tiktokVideoMetricsChart':
        case 'tiktokSoundUsageChart':
        case 'facebookPageMetricsChart':
        case 'facebookVideoMetricsChart':
        case 'facebookEventMetricsChart':
        case 'instagramStoryMetricsChart':
        case 'instagramReelMetricsChart':
        case 'instagramMediaTypesChart':
        case 'twitterTweetMetricsChart':
        case 'twitterTopicsChart':
            updatePlatformSpecificCharts(data);
            break;
        case 'postFrequencyChart':
            updatePostFrequencyChart(data);
            break;
        case 'apiPerformanceChart':
            updateApiPerformanceChart(data);
            break;
    }
}

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
    Object.keys(charts).forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const chart = Chart.getChart(canvas);
            if (chart) {
                chart.destroy();
            }
        }
    });
    charts = {};
}); 