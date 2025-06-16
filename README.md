# NewsFlow - AI-Powered News Aggregation

NewsFlow is a complete news aggregation web application that automatically fetches articles from major sources and enhances them with AI-powered summaries and insights. Built with React, Express, and MySQL.

## Features

- **Automatic News Aggregation**: Fetches articles from TechCrunch, AI News, Business Insider, Yahoo Finance, and CNBC
- **AI Enhancement**: OpenAI GPT-4o integration for article summaries and key points
- **User Management**: Secure authentication with Replit OAuth
- **Reading Tracking**: Daily reading goals and progress monitoring
- **Bookmarking System**: Save articles for later reading
- **Note Taking**: User notes attached to specific articles
- **Mobile Responsive**: Optimized for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL with Drizzle ORM
- **AI**: OpenAI GPT-4o API
- **Authentication**: Replit OAuth with session management

## Quick Start

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd newsflow
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your actual values:
```bash
# Required: OpenAI API key for article enhancement
OPENAI_API_KEY=your_openai_api_key_here

# Required: Session secret (generate a long random string)
SESSION_SECRET=your_very_long_random_session_secret_here

# Optional: Replit OAuth (if using Replit authentication)
REPL_ID=your_repl_id
REPLIT_DOMAINS=your-domain.com
```

4. Start with Docker Compose:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:5000`

### Option 2: Manual Installation

1. **Prerequisites**:
   - Node.js 18+
   - MySQL 8.0+

2. **Database Setup**:
```bash
mysql -u root -p < init.sql
```

3. **Install Dependencies**:
```bash
npm install
```

4. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

5. **Build and Start**:
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `MYSQL_HOST` | Yes | MySQL host |
| `MYSQL_USER` | Yes | MySQL username |
| `MYSQL_PASSWORD` | Yes | MySQL password |
| `MYSQL_DATABASE` | Yes | MySQL database name |
| `OPENAI_API_KEY` | Yes | OpenAI API key for article enhancement |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `REPL_ID` | No | Replit application ID (if using Replit OAuth) |
| `REPLIT_DOMAINS` | No | Allowed domains for Replit OAuth |
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Application port (default: 5000) |

## Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication
- **articles**: News articles with AI enhancements
- **news_sources**: RSS feed sources
- **user_articles**: Reading status and bookmarks
- **user_notes**: User-generated notes
- **user_preferences**: Reading goals and category preferences
- **reading_history**: Reading analytics and streak tracking

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start OAuth login
- `GET /api/logout` - Logout user

### Articles
- `GET /api/articles` - Get articles with pagination and filtering
- `GET /api/articles/:id` - Get single article
- `POST /api/articles/:id/read` - Mark article as read
- `POST /api/articles/:id/bookmark` - Toggle bookmark

### User Data
- `GET /api/user/bookmarks` - Get bookmarked articles
- `GET /api/user/reading-history` - Get reading history
- `GET /api/user/notes` - Get user notes
- `POST /api/user/notes` - Create note

## Deployment

### Production Deployment

1. **Server Requirements**:
   - Ubuntu 20.04+ or similar Linux distribution
   - Node.js 18+
   - MySQL 8.0+
   - Nginx (recommended for reverse proxy)

2. **Setup Process**:
```bash
# Clone repository
git clone <your-repo-url>
cd newsflow

# Install dependencies
npm ci --production

# Setup environment
cp .env.example .env
# Edit .env with production values

# Build application
npm run build

# Setup MySQL database
mysql -u root -p < init.sql

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name newsflow
pm2 startup
pm2 save
```

3. **Nginx Configuration** (optional):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### MySQL Remote Access

To allow remote connections to MySQL:

1. **Create user with wildcard host**:
```sql
CREATE USER 'newsflow_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON newsflow.* TO 'newsflow_user'@'%';
FLUSH PRIVILEGES;
```

2. **Configure MySQL** (edit `/etc/mysql/mysql.conf.d/mysqld.cnf`):
```ini
bind-address = 0.0.0.0
```

3. **Restart MySQL**:
```bash
sudo systemctl restart mysql
```

## Development

### Local Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Setup environment**:
```bash
cp .env.example .env
# Configure with development database
```

3. **Start development server**:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the README and documentation
2. Review environment variable configuration
3. Verify database connectivity
4. Check application logs

Common issues:
- **MySQL Connection Timeout**: Verify host permissions and firewall settings
- **OpenAI API Errors**: Check API key validity and quota
- **Build Failures**: Ensure Node.js 18+ and clean npm install