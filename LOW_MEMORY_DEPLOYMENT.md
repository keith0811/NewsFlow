# NewsFlow Low Memory Deployment Guide

## Quick Solution for WebAssembly Memory Error

Your server is running out of memory during startup. Here are immediate fixes:

### Option 1: Use the Startup Script (Recommended)

Make the script executable and run:
```bash
chmod +x run-newsflow.sh
./run-newsflow.sh
```

### Option 2: Manual Commands

```bash
# Build with memory limit
NODE_OPTIONS="--max-old-space-size=1024" npm run build

# Run with reduced memory
NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" NODE_ENV=production node dist/index.js
```

### Option 3: Docker (Most Reliable)

If you have Docker installed:
```bash
docker-compose up -d --build
```

## Server Requirements

- **Minimum RAM**: 1GB total system memory
- **Available for Node.js**: 512MB
- **Swap space**: 1GB recommended

## If Still Getting Memory Errors

1. **Check available memory**:
   ```bash
   free -h
   ```

2. **Add swap space** (if needed):
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Disable AI features temporarily**:
   Add to your `.env` file:
   ```env
   DISABLE_AI=true
   ```

## Environment Setup

Your `.env` file should contain:
```env
# Database
DATABASE_URL=mysql://newsmystimatrix_rep:your_password@103.47.29.22:3306/newsmystimatrix_rep
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=newsmystimatrix_rep

# OpenAI (optional - can disable if memory is tight)
OPENAI_API_KEY=your_key_here

# Session
SESSION_SECRET=31976d41193a27bfd27901afd2d92bc8434ef11e64993fab9772d90ae604b244

# Memory optimization
NODE_ENV=production
DISABLE_AI=true
```

## Database Setup

Run this in phpMyAdmin first:
```sql
USE newsmystimatrix_rep;

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
  url VARCHAR(500) NOT NULL UNIQUE,
  source_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  reading_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables as needed from the complete script
```

## Testing the Setup

1. Run the database setup
2. Configure your `.env` file
3. Use the startup script: `./run-newsflow.sh`
4. Check if it starts without memory errors
5. Access your application at `http://localhost:5000`

The application will work with basic functionality even if AI features are disabled due to memory constraints.