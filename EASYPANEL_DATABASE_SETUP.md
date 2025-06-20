# Database Setup in EasyPanel for NewsFlow

## Overview

This guide covers setting up MySQL database in EasyPanel for NewsFlow deployment. You have two options: use your existing MySQL server or create a new database service in EasyPanel.

## Option 1: Use Existing MySQL Database (Recommended)

### 1.1 Your Current Database Setup
- **Host**: 103.47.29.22
- **Database**: newsmystimatrix_rep
- **User**: newsmystimatrix_rep
- **Password**: [your existing password]

### 1.2 Configure Firewall for DigitalOcean Access

**Allow DigitalOcean IP Range:**
```sql
-- Connect to your MySQL server
mysql -h 103.47.29.22 -u root -p

-- Create user with access from DigitalOcean IP ranges
CREATE USER 'newsmystimatrix_rep'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON newsmystimatrix_rep.* TO 'newsmystimatrix_rep'@'%';
FLUSH PRIVILEGES;
```

### 1.3 Test Connection from EasyPanel
In EasyPanel terminal or app container:
```bash
# Test database connection
telnet 103.47.29.22 3306

# Test with MySQL client (if available)
mysql -h 103.47.29.22 -u newsmystimatrix_rep -p newsmystimatrix_rep
```

### 1.4 Environment Variables for Existing Database
In your EasyPanel app configuration:
```env
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=your_actual_password
MYSQL_DATABASE=newsmystimatrix_rep
```

## Option 2: Create New MySQL Service in EasyPanel

### 2.1 Create MySQL Service

1. **Go to EasyPanel Dashboard**
2. **Click "Services" → "Add Service"**
3. **Select "MySQL"**
4. **Configure MySQL Service:**
   ```
   Service Name: newsflow-mysql
   MySQL Version: 8.0
   Root Password: [generate strong password]
   Database Name: newsflow
   Username: newsflow
   Password: [generate strong password]
   Port: 3306
   ```

### 2.2 MySQL Service Configuration

**Advanced Settings:**
```yaml
# Memory allocation
innodb_buffer_pool_size: 128M
max_connections: 100
query_cache_size: 32M

# Character set
character_set_server: utf8mb4
collation_server: utf8mb4_unicode_ci
```

### 2.3 Persistent Storage
EasyPanel automatically configures:
- Persistent volume for database files
- Automated backups
- Data retention policies

### 2.4 Environment Variables for New Database
```env
MYSQL_HOST=newsflow-mysql
MYSQL_USER=newsflow
MYSQL_PASSWORD=your_generated_password
MYSQL_DATABASE=newsflow
```

## Database Schema Setup

### 3.1 Access Database Console

**Method A: EasyPanel MySQL Console**
1. Go to "Services" → "newsflow-mysql"
2. Click "Console" tab
3. Access MySQL command line

**Method B: External MySQL Client**
```bash
# Connect from your local machine
mysql -h your_droplet_ip -P 3306 -u newsflow -p
```

**Method C: phpMyAdmin (Optional)**
Add phpMyAdmin service in EasyPanel:
1. Services → Add Service → phpMyAdmin
2. Connect to your MySQL service
3. Web-based database management

### 3.2 Create NewsFlow Tables

```sql
-- Use the database
USE newsflow; -- or newsmystimatrix_rep if using existing

-- Create articles table
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
  
  -- Indexes for performance
  INDEX idx_published (published_at),
  INDEX idx_category (category),
  INDEX idx_source (source_id),
  INDEX idx_created (created_at)
);

-- Create news sources table
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

-- Insert default news sources
INSERT IGNORE INTO news_sources (id, name, display_name, url, rss_url, category, is_active) VALUES
(1, 'techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'Technology', true),
(2, 'business-insider', 'Business Insider', 'https://www.businessinsider.com', 'https://feeds.businessinsider.com/custom/all', 'Business', true),
(3, 'ai-news', 'AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'AI', true),
(4, 'cnbc-business', 'CNBC Business', 'https://www.cnbc.com', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', 'Business', true),
(5, 'yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com', 'https://feeds.finance.yahoo.com/rss/2.0/headline', 'Markets', true);

-- Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE();
SELECT COUNT(*) as news_sources_count FROM news_sources;
```

### 3.3 Optional Tables for Enhanced Features

If you want full NewsFlow functionality:

```sql
-- User management tables (for future authentication)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  categories JSON,
  sources JSON,
  daily_reading_goal INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User article interactions
CREATE TABLE IF NOT EXISTS user_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  reading_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_article (user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- User notes
CREATE TABLE IF NOT EXISTS user_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  article_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
```

## Database Configuration Optimization

### 4.1 Performance Tuning

```sql
-- Optimize MySQL settings for NewsFlow
SET GLOBAL innodb_buffer_pool_size = 134217728; -- 128MB
SET GLOBAL max_connections = 100;
SET GLOBAL innodb_log_file_size = 48M;
SET GLOBAL query_cache_size = 33554432; -- 32MB
```

### 4.2 EasyPanel MySQL Configuration

In your MySQL service settings:
```yaml
# my.cnf additions
[mysqld]
innodb_buffer_pool_size = 128M
max_connections = 100
query_cache_size = 32M
query_cache_type = 1
innodb_flush_log_at_trx_commit = 2
innodb_log_buffer_size = 8M
```

### 4.3 Connection Pooling in Application

Update your `newsflow-minimal.js` for EasyPanel:
```javascript
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,        // Adjust based on your plan
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};
```

## Database Backup and Recovery

### 5.1 EasyPanel Automated Backups

1. **Enable Backups in MySQL Service:**
   ```
   Backup Schedule: Daily at 2 AM
   Retention: 7 days
   Compression: Enabled
   ```

2. **Manual Backup:**
   ```bash
   # From EasyPanel console
   mysqldump -h localhost -u newsflow -p newsflow > backup_$(date +%Y%m%d).sql
   ```

### 5.2 Database Restore

```bash
# Restore from backup
mysql -h localhost -u newsflow -p newsflow < backup_20250619.sql
```

## Monitoring and Maintenance

### 6.1 Database Health Monitoring

EasyPanel provides:
- Real-time resource usage graphs
- Connection count monitoring
- Query performance metrics
- Storage usage tracking

### 6.2 Maintenance Tasks

```sql
-- Weekly maintenance queries
ANALYZE TABLE articles;
OPTIMIZE TABLE articles;
ANALYZE TABLE news_sources;

-- Check database size
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;
```

### 6.3 Log Monitoring

Monitor MySQL logs in EasyPanel:
- Error logs for connection issues
- Slow query logs for performance
- General logs for debugging

## Troubleshooting

### Common Database Issues

**Connection Refused:**
```bash
# Check service status in EasyPanel
# Verify environment variables
echo $MYSQL_HOST $MYSQL_USER $MYSQL_DATABASE

# Test connection
telnet $MYSQL_HOST 3306
```

**Permission Denied:**
```sql
-- Check user permissions
SHOW GRANTS FOR 'newsflow'@'%';

-- Grant additional permissions if needed
GRANT ALL PRIVILEGES ON newsflow.* TO 'newsflow'@'%';
FLUSH PRIVILEGES;
```

**Performance Issues:**
```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Monitor table sizes
SELECT COUNT(*) FROM articles;

-- Check indexes
SHOW INDEX FROM articles;
```

Your database will be properly configured for NewsFlow with optimal performance, automated backups, and monitoring through the EasyPanel interface.