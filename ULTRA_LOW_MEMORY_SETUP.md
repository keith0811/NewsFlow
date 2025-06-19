# NewsFlow Ultra Low Memory Setup

## The Problem
Your server is hitting WebAssembly memory limits due to heavy dependencies and build processes. This lightweight version eliminates those issues.

## Quick Setup (3 Steps)

### 1. Install Minimal Dependencies
```bash
# Create a new directory for the minimal version
mkdir newsflow-minimal
cd newsflow-minimal

# Copy the minimal files
cp ../newsflow-minimal.js .
cp ../package-minimal-deps.json package.json

# Install only 3 dependencies (no build process)
npm install
```

### 2. Setup Database
Run this SQL in phpMyAdmin for your `newsmystimatrix_rep` database:

```sql
USE newsmystimatrix_rep;

CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  url VARCHAR(500) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  source_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure and Run
Create `.env` file:
```env
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=your_actual_password
MYSQL_DATABASE=newsmystimatrix_rep
PORT=5000
```

Start the application:
```bash
node newsflow-minimal.js
```

## What This Version Includes

✓ **Ultra Low Memory Usage** - Only 3 dependencies
✓ **No Build Process** - Plain JavaScript, no compilation
✓ **RSS News Fetching** - TechCrunch and Business Insider
✓ **Clean Web Interface** - Built-in HTML with modern styling
✓ **MySQL Integration** - Direct connection to your database
✓ **Refresh Button** - Manual news updates
✓ **Mobile Responsive** - Works on all devices

## Features Available
- View latest 20 articles
- Refresh news from RSS feeds
- Clean, fast interface
- Click articles to read full content
- Categorized news display
- Timestamps and metadata

## Memory Usage
- **RAM Usage**: ~50MB (vs 500MB+ for full version)
- **Dependencies**: 3 packages (vs 100+ packages)
- **No WebAssembly**: Uses only native Node.js
- **No Build Step**: Direct execution

## Access Your Application
After starting, visit: `http://localhost:5000`

## Troubleshooting

**If you still get memory errors:**
1. Check system memory: `free -h`
2. Close other applications
3. Add swap space if needed

**If database connection fails:**
1. Verify your `.env` password
2. Test connection: `mysql -h 103.47.29.22 -u newsmystimatrix_rep -p`

**If news refresh fails:**
1. Check internet connection
2. RSS feeds may be temporarily unavailable

This minimal version gives you a fully functional news aggregation app that runs on extremely limited memory servers.