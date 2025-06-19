# NewsFlow Deployment Guide

## Overview
NewsFlow is ready for deployment on your server with MySQL database. All code has been converted to MySQL-compatible format.

## Prerequisites
- Your MySQL server at 103.47.29.22
- Database: `newsmystimatrix_rep`
- User: `newsmystimatrix_rep` with password
- Docker and Docker Compose installed on your server

## Quick Deployment Steps

### 1. Database Setup
Run this SQL in phpMyAdmin for `newsmystimatrix_rep` database:

```sql
USE newsmystimatrix_rep;

-- Create NewsFlow tables
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  INDEX IDX_session_expire (expire)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  categories JSON,
  sources JSON,
  daily_reading_goal INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  rss_url VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  ai_enhancement TEXT,
  ai_key_points JSON,
  ai_sentiment VARCHAR(50),
  url VARCHAR(500) NOT NULL UNIQUE,
  image_url VARCHAR(500),
  source_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  reading_time INT,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  reading_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reading_time INT
);

-- Add news sources
INSERT IGNORE INTO news_sources (name, display_name, url, rss_url, category) VALUES
('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'Technology'),
('ai-news', 'AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'AI'),
('business-insider', 'Business Insider', 'https://www.businessinsider.com', 'https://feeds.businessinsider.com/custom/all', 'Business'),
('yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com', 'https://feeds.finance.yahoo.com/rss/2.0/headline', 'Markets'),
('cnbc-business', 'CNBC Business', 'https://www.cnbc.com', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', 'Business');
```

### 2. Environment Configuration
Create `.env` file:

```env
# Database Configuration
DATABASE_URL=mysql://newsmystimatrix_rep:YOUR_PASSWORD@103.47.29.22:3306/newsmystimatrix_rep
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=YOUR_PASSWORD
MYSQL_DATABASE=newsmystimatrix_rep

# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Session Secret (use this generated one)
SESSION_SECRET=31976d41193a27bfd27901afd2d92bc8434ef11e64993fab9772d90ae604b244

# Replit OAuth (for production deployment)
REPL_ID=your_repl_id
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc

# Node Environment
NODE_ENV=production
PORT=5000
```

### 3. Docker Deployment
Use the provided `docker-compose.yml`:

```bash
# Build and start the application
docker-compose up -d --build

# Check logs
docker-compose logs -f newsflow

# Stop the application
docker-compose down
```

### 4. Manual Deployment (Alternative)
If you prefer running without Docker:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

## Application Features

### News Aggregation
- Automatic RSS feed parsing from 5 major sources
- Daily refresh at midnight
- AI-enhanced article summaries and key points
- Sentiment analysis for articles

### User Features
- Secure authentication via Replit OAuth
- Personal reading preferences and goals
- Bookmark articles for later reading
- Take notes on articles
- Reading progress tracking
- Mobile-responsive design

### Categories
- Technology (TechCrunch)
- AI (AI News)
- Business (Business Insider, CNBC)
- Markets (Yahoo Finance)

## Database Management
- Automatic cleanup of articles older than 2 days
- Session management with PostgreSQL store
- User preferences and reading history tracking
- Full MySQL compatibility

## Production Considerations
- Uses connection pooling for database efficiency
- Implements proper error handling and logging
- Includes session-based authentication
- Mobile-first responsive design
- AI integration for content enhancement

## Support
The application includes comprehensive error handling and logging. Check the Docker logs for any issues during deployment.

Session Secret: `31976d41193a27bfd27901afd2d92bc8434ef11e64993fab9772d90ae604b244`