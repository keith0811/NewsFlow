-- NewsFlow Tables Setup for newsmystimatrix_rep
-- Copy and paste this into phpMyAdmin SQL tab (without user creation)

-- Use your existing database
USE newsmystimatrix_rep;

-- Session storage table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  INDEX IDX_session_expire (expire)
);

-- User storage table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  categories JSON,
  sources JSON,
  daily_reading_goal INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- News sources table
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

-- Articles table
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

-- User articles table (for bookmarks and reading status)
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

-- User notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reading history table
CREATE TABLE IF NOT EXISTS reading_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reading_time INT
);

-- Insert default news sources
INSERT IGNORE INTO news_sources (name, display_name, url, rss_url, category) VALUES
('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'Technology'),
('ai-news', 'AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'AI'),
('business-insider', 'Business Insider', 'https://www.businessinsider.com', 'https://feeds.businessinsider.com/custom/all', 'Business'),
('yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com', 'https://feeds.finance.yahoo.com/rss/2.0/headline', 'Markets'),
('cnbc-business', 'CNBC Business', 'https://www.cnbc.com', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', 'Business');

-- Verify the setup
SELECT 'NewsFlow tables created successfully!' as status;
SELECT COUNT(*) as newsflow_tables FROM information_schema.tables 
WHERE table_schema = 'newsmystimatrix_rep' 
AND table_name IN ('sessions', 'users', 'news_sources', 'articles', 'user_articles', 'user_notes', 'reading_history', 'user_preferences');
SELECT COUNT(*) as news_sources_added FROM news_sources;