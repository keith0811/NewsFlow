# NewsFlow Deployment on EasyPanel (DigitalOcean)

## Overview

EasyPanel is a modern server control panel that simplifies application deployment using Docker containers. This guide covers deploying NewsFlow on a DigitalOcean droplet with EasyPanel.

## Prerequisites

- DigitalOcean account
- Domain name (news.mystimatrix.com)
- MySQL database (existing or new)
- OpenAI API key

## Step 1: Create DigitalOcean Droplet

### 1.1 Droplet Configuration
```
OS: Ubuntu 22.04 LTS
Size: Basic Droplet
CPU: 1 vCPU
RAM: 1GB (minimum), 2GB (recommended)
SSD: 25GB
Region: Choose closest to your users
```

### 1.2 Create Droplet
1. Login to DigitalOcean
2. Click "Create" → "Droplets"
3. Configure as above
4. Add your SSH key
5. Choose hostname (e.g., "newsflow-server")
6. Click "Create Droplet"

## Step 2: Install EasyPanel

### 2.1 SSH to Your Droplet
```bash
ssh root@your_droplet_ip
```

### 2.2 Install EasyPanel
```bash
# Update system
apt update && apt upgrade -y

# Install EasyPanel
curl -sSL https://get.easypanel.io | sh
```

### 2.3 Access EasyPanel
1. Open browser to `http://your_droplet_ip:3000`
2. Create admin account
3. Complete setup wizard

## Step 3: Configure Domain and SSL

### 3.1 Point Domain to Server
Update your DNS records:
```
Type: A
Name: news
Value: your_droplet_ip
TTL: 300
```

### 3.2 Setup SSL in EasyPanel
1. Go to "Settings" → "Domains"
2. Add domain: `news.mystimatrix.com`
3. Enable "Auto SSL" (Let's Encrypt)
4. Wait for SSL certificate generation

## Step 4: Setup MySQL Database

### 4.1 Option A: Use Existing Database
If using your existing MySQL server at `103.47.29.22`:
- Keep existing credentials
- Ensure firewall allows connection from DigitalOcean IP

### 4.2 Option B: Create New Database in EasyPanel
1. Go to "Services" → "Add Service"
2. Choose "MySQL"
3. Configure:
   ```
   Service Name: newsflow-mysql
   MySQL Version: 8.0
   Root Password: [secure_password]
   Database: newsflow
   User: newsflow
   User Password: [secure_password]
   ```

## Step 5: Deploy NewsFlow Application

### 5.1 Create Dockerfile for EasyPanel

Create `Dockerfile.easypanel`:
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY newsflow-minimal.js .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S newsflow -u 1001

# Change ownership
RUN chown -R newsflow:nodejs /app
USER newsflow

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "newsflow-minimal.js"]
```

### 5.2 Create EasyPanel Application

1. **Go to "Apps" → "Create App"**
2. **Configure App:**
   ```
   App Name: newsflow
   Source: Upload/Git Repository
   Domain: news.mystimatrix.com
   ```

### 5.3 Upload Application Files

**Method A: Direct Upload**
1. Zip your application files:
   - `newsflow-minimal.js`
   - `package.json`
   - `Dockerfile.easypanel`
2. Upload via EasyPanel interface

**Method B: Git Repository**
1. Push code to GitHub repository
2. Connect repository in EasyPanel
3. Set build context and Dockerfile path

## Step 6: Configure Environment Variables

In EasyPanel App settings, add environment variables:

```env
# Database Configuration
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=your_actual_password
MYSQL_DATABASE=newsmystimatrix_rep

# Application Configuration
PORT=3000
NODE_ENV=production

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key

# Domain Configuration
DOMAIN=https://news.mystimatrix.com
```

## Step 7: Setup Database Tables

### 7.1 Access MySQL
Connect to your MySQL database via:
- phpMyAdmin (if available)
- MySQL client from EasyPanel terminal
- External MySQL client

### 7.2 Create Tables
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_published (published_at),
  INDEX idx_category (category),
  INDEX idx_source (source_id)
);

-- Insert news sources
INSERT IGNORE INTO news_sources (id, name, display_name, url, rss_url, category, is_active) VALUES
(1, 'techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'Technology', true),
(2, 'business-insider', 'Business Insider', 'https://www.businessinsider.com', 'https://feeds.businessinsider.com/custom/all', 'Business', true),
(3, 'ai-news', 'AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'AI', true);
```

## Step 8: Configure Networking and Security

### 8.1 Firewall Rules
EasyPanel automatically configures:
- Port 80 (HTTP) → Redirects to HTTPS
- Port 443 (HTTPS) → Your application
- Port 3000 (Internal) → Application container

### 8.2 Security Headers
EasyPanel automatically adds:
- SSL/TLS encryption
- Security headers
- DDoS protection

## Step 9: Deploy and Test

### 9.1 Build and Deploy
1. Click "Deploy" in EasyPanel
2. Monitor build logs
3. Wait for deployment completion

### 9.2 Test Application
1. Visit `https://news.mystimatrix.com`
2. Verify SSL certificate
3. Test article loading
4. Test news refresh functionality

## Step 10: Monitoring and Maintenance

### 10.1 EasyPanel Monitoring
- View application logs in real-time
- Monitor resource usage (CPU, RAM, Disk)
- Set up alerts for downtime
- View deployment history

### 10.2 Application Health
```bash
# Check application status
curl -I https://news.mystimatrix.com/

# Test API endpoints
curl https://news.mystimatrix.com/api/articles
```

## Step 11: Backup and Recovery

### 11.1 Database Backups
Configure automated MySQL backups:
1. Go to MySQL service in EasyPanel
2. Enable automated backups
3. Set backup schedule (daily recommended)

### 11.2 Application Backups
- EasyPanel automatically backs up application files
- Keep source code in version control (Git)
- Document environment variables securely

## Advanced Configuration

### Auto-Scaling (Optional)
```yaml
# docker-compose.yml for advanced setup
version: '3.8'
services:
  newsflow:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### CDN Integration
1. Set up DigitalOcean Spaces CDN
2. Configure static asset caching
3. Optimize image delivery

### Load Balancing
For high traffic:
1. Create multiple app instances
2. Use EasyPanel's built-in load balancer
3. Configure health checks

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in EasyPanel
# Verify Dockerfile syntax
# Ensure all dependencies are listed
```

**Database Connection:**
```bash
# Test from container terminal
telnet 103.47.29.22 3306

# Check environment variables
env | grep MYSQL
```

**SSL Issues:**
```bash
# Verify domain DNS
nslookup news.mystimatrix.com

# Check SSL certificate
openssl s_client -connect news.mystimatrix.com:443
```

**Memory Issues:**
```bash
# Monitor resource usage in EasyPanel
# Increase droplet size if needed
# Optimize application memory usage
```

## Cost Optimization

### DigitalOcean Costs
- **Basic Droplet (1GB)**: $6/month
- **Standard Droplet (2GB)**: $12/month
- **Bandwidth**: 1TB included
- **Backups**: +20% of droplet cost

### Resource Optimization
- Use alpine-based Docker images
- Implement proper caching
- Monitor and optimize database queries
- Set appropriate resource limits

## Scaling Strategy

### Vertical Scaling
1. Upgrade droplet size in DigitalOcean
2. Restart application in EasyPanel
3. Monitor performance improvements

### Horizontal Scaling
1. Create multiple app instances
2. Use database connection pooling
3. Implement session clustering
4. Consider load balancer upgrade

Your NewsFlow application will be fully operational at `https://news.mystimatrix.com` with professional hosting, automatic SSL, monitoring, and easy maintenance through the EasyPanel interface.