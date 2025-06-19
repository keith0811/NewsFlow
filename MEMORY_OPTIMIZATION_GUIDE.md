# NewsFlow Memory Optimization Guide

## The WebAssembly Memory Error

This error occurs when Node.js runs out of memory, typically on servers with limited RAM. Here are several solutions:

## Solution 1: Increase Node.js Memory Limit

### For npm commands:
```bash
# Development
NODE_OPTIONS="--max-old-space-size=1024" npm run dev

# Build
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Production
NODE_OPTIONS="--max-old-space-size=512" npm start
```

### For direct node execution:
```bash
node --max-old-space-size=1024 dist/index.js
```

## Solution 2: Optimize Dependencies

Replace your current package.json with the minimal version:

```json
{
  "name": "newsflow-minimal",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=1024' tsx server/index.ts",
    "build": "NODE_OPTIONS='--max-old-space-size=2048' vite build && NODE_OPTIONS='--max-old-space-size=1024' esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_OPTIONS='--max-old-space-size=512' node dist/index.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mysql2": "^3.14.1",
    "drizzle-orm": "^0.39.3",
    "openai": "^5.3.0",
    "rss-parser": "^3.13.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wouter": "^3.3.5",
    "zod": "^3.24.2"
  }
}
```

## Solution 3: Server Configuration

### For systemd service:
```ini
[Unit]
Description=NewsFlow Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/newsflow
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### For PM2:
```bash
pm2 start dist/index.js --name newsflow --node-args="--max-old-space-size=512"
```

## Solution 4: Docker Optimization

Update your Dockerfile:

```dockerfile
FROM node:18-alpine

# Set memory limits
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with --production flag
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Build application
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/index.js"]
```

## Solution 5: Database Connection Optimization

Update your MySQL connection in `server/db-mysql.ts`:

```typescript
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'newsmystimatrix_rep',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'newsmystimatrix_rep',
  acquireTimeout: 30000,
  timeout: 30000,
  connectionLimit: 5, // Reduce connection pool
  queueLimit: 0,
  reconnect: true,
  multipleStatements: false
};
```

## Solution 6: Disable AI Features Temporarily

If memory issues persist, you can disable AI processing:

```env
# Add to your .env file
DISABLE_AI=true
```

Then modify your news service to skip AI processing when this flag is set.

## Solution 7: Garbage Collection Optimization

Add these Node.js flags:

```bash
NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size --gc-interval=100" node dist/index.js
```

## Recommended Deployment Steps

1. **Start with Solution 1** - Increase memory limits
2. **If still failing** - Use Solution 2 (minimal dependencies)
3. **For production** - Use Solution 4 (Docker with limits)
4. **If very limited RAM** - Use Solution 6 (disable AI temporarily)

## Server Requirements

- **Minimum RAM**: 512MB (with AI disabled)
- **Recommended RAM**: 1GB (with AI enabled)
- **Optimal RAM**: 2GB (for smooth operation)

## Testing Memory Usage

Monitor your application:

```bash
# Check memory usage
node --inspect dist/index.js

# Monitor with top
top -p $(pgrep node)

# Check Docker memory usage
docker stats newsflow
```

Choose the solution that best fits your server's capabilities.