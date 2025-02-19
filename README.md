# Budget Vegas Social Dashboard

A comprehensive social media analytics dashboard built for Budget Las Vegas, providing real-time metrics and insights across multiple social media platforms including TikTok, Facebook, Instagram, and Twitter.

## Features

### Platform Integration
- **TikTok Analytics**
  - Video performance metrics and completion rates
  - Average watch time tracking
  - Sound usage analytics and trends
  - Trending hashtag effectiveness
  - Audience demographics and engagement
  - Best posting time analysis

- **Instagram Insights**
  - Story and Reel performance tracking
  - Media engagement and save rates
  - Hashtag effectiveness analysis
  - Audience reach and impression metrics
  - Peak activity time monitoring
  - Geographic and demographic insights

- **Facebook Analytics**
  - Page performance and impression tracking
  - Event metrics and response rates
  - Ad campaign ROI analysis
  - Video completion rates
  - Audience retention metrics
  - Geographic reach analysis
  - Negative feedback monitoring

- **Twitter Analytics**
  - Tweet performance metrics
  - Engagement rate calculations
  - Hashtag tracking and analysis
  - Mention monitoring
  - Profile view tracking
  - Media engagement statistics
  - Reply and quote rates

### Core Features
- Real-time metrics collection (5-minute intervals)
- Cross-platform analytics comparison
- Automated hourly data collection
- Daily performance summaries at midnight
- Historical trend analysis
- Custom metric calculations
- Rate limit monitoring and prevention
- Performance optimization with caching
- Comprehensive error tracking

### Security & Authentication
- JWT-based authentication system
- Role-based access control (admin/user)
- Secure password hashing with bcrypt
- HTTP-only cookies for security
- Rate limiting protection
- API security measures
- Request tracking with IP and user agent
- Unauthorized access monitoring

### Technical Implementation
- Node.js & Express backend
- MongoDB with optimized schemas
- Winston logging system with rotation
- EJS templating engine
- Bootstrap UI framework
- Chart.js data visualization
- Automated metric calculations
- Caching system (5-minute TTL)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Social media API credentials
- Development environment variables

### API Credentials Setup

#### TikTok
1. Visit the [TikTok for Developers](https://developers.tiktok.com/) portal
2. Create a new app in the Developer Console
3. Enable the TikTok API
4. Get your Access Token from the App Settings page
5. Required permissions:
   - user.info.basic
   - video.list
   - video.stats

#### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add Facebook Login product
4. Enable the Graph API
5. Required permissions:
   - pages_read_engagement
   - pages_show_list
   - ads_read
   - business_management

#### Instagram
1. Use the [Facebook Developer Console](https://developers.facebook.com/)
2. Enable Instagram Graph API
3. Connect your Instagram Business Account
4. Required permissions:
   - instagram_basic
   - instagram_manage_insights
   - pages_show_list
   - instagram_content_publish

#### Twitter
1. Visit [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new Project and App
3. Apply for Elevated access
4. Required permissions:
   - Tweet.read
   - Users.read
   - Tweet.write
   - Offline.access

### Rate Limits
- TikTok: 2000 requests/day
- Facebook: 200 requests/hour/user
- Instagram: 240 requests/hour
- Twitter: 500,000 tweets/month

### Installation
1. Clone the repository
2. Install dependencies with npm install
3. Configure environment variables
4. Start the server

### Environment Variables
Required in .env file:
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: Secret for JWT tokens
- PORT: Server port (default: 5000)
- NODE_ENV: Environment (development/production)
- TIKTOK_ACCESS_TOKEN
- FACEBOOK_API_KEY
- INSTAGRAM_API_KEY
- TWITTER_API_KEY

### Available Scripts
- start: Launch production server
- dev: Run development server with nodemon
- users: Manage user accounts
- sample-data: Generate sample metrics

## Documentation

### API Endpoints
- /api/metrics - Get aggregated platform metrics
- /api/metrics/:platform - Platform-specific metrics
- /api/metrics/range - Historical data range
- /auth/* - Authentication endpoints

### Logging System
- Access logs with user tracking
- API request logs with duration
- Error tracking with context
- Security event monitoring
- Rate limit tracking
- Log rotation and compression
- Method-level logging
- Performance monitoring

### Error Handling
- Structured error responses
- Detailed error logging with context
- Platform-specific error handling
- Rate limit management
- Retry mechanism (max 3 attempts)
- Stack trace handling in development
- Error categorization
- Error inheritance chain

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Submit a pull request

## License
MIT License

## Version History
See changelog.md for detailed version history

## Support
For support, please open an issue in the repository 