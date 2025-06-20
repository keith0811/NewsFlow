-- NewsFlow Complete Database Setup for EasyPanel
-- Copy and paste this entire script into your MySQL console

-- Step 1: Select your database
-- UNCOMMENT ONE OF THESE LINES:
-- USE newsmystimatrix_rep;  -- For existing database
-- USE newsflow;             -- For new EasyPanel database

-- Step 2: Create core tables
CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  url VARCHAR(500) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  source_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_published (published_at),
  INDEX idx_category (category),
  INDEX idx_source (source_id),
  INDEX idx_created (created_at),
  INDEX idx_url (url)
);

CREATE TABLE IF NOT EXISTS news_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  rss_url VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_active (is_active),
  INDEX idx_category (category)
);

-- Step 3: Insert news sources
INSERT IGNORE INTO news_sources (id, name, display_name, url, rss_url, category, is_active) VALUES
(1, 'techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'Technology', true),
(2, 'business-insider', 'Business Insider', 'https://www.businessinsider.com', 'https://feeds.businessinsider.com/custom/all', 'Business', true),
(3, 'ai-news', 'AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'AI', true),
(4, 'cnbc-business', 'CNBC Business', 'https://www.cnbc.com', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', 'Business', true),
(5, 'yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com', 'https://feeds.finance.yahoo.com/rss/2.0/headline', 'Markets', true);

-- Step 4: Verify setup
SELECT 'Setup Status: SUCCESS' as result;
SELECT COUNT(*) as news_sources_added FROM news_sources;
SELECT display_name, category FROM news_sources ORDER BY id;

-- Step 5: Test article insertion (sample data)
INSERT IGNORE INTO articles (title, content, summary, url, category, published_at, source_id) VALUES
('NewsFlow Setup Complete', 'Your NewsFlow database has been successfully configured with all required tables and news sources.', 'Database setup completed successfully', 'https://news.mystimatrix.com/setup-complete', 'Technology', NOW(), 1);

-- Final verification
SELECT COUNT(*) as total_articles FROM articles;
SELECT 'NewsFlow database is ready for deployment!' as final_status;