# NewsFlow Application

## Overview

NewsFlow is a complete news aggregation web application that automatically fetches articles from major sources like TechCrunch, AI News, and Reuters. Users can read articles, save bookmarks, take notes, and track their reading progress with AI-enhanced summaries and insights. The app features secure authentication, mobile-friendly design, and personalized content recommendations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Authentication**: Replit OAuth integration with session-based auth
- **Database ORM**: Drizzle ORM for type-safe database operations

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migration Tool**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Key Components

### Authentication System
- **Provider**: Replit OAuth integration
- **Session Management**: PostgreSQL-backed sessions with 7-day expiration
- **User Storage**: Comprehensive user profiles with preferences
- **Security**: HTTP-only cookies with secure settings

### News Aggregation Service
- **RSS Parser**: Multiple news sources including TechCrunch, Reuters, AI News
- **Content Enhancement**: OpenAI GPT-4o integration for article summaries and analysis
- **Source Management**: Configurable news sources with category filtering
- **Content Processing**: Automatic article enrichment with key points and sentiment analysis

### User Experience Features
- **Reading Tracking**: Daily reading goals and progress monitoring
- **Bookmarking System**: Save articles for later reading
- **Note Taking**: User notes attached to specific articles
- **Personalization**: Category preferences and source filtering
- **Responsive Design**: Mobile-first design with adaptive layouts

### Data Models
- **Users**: Authentication and profile information
- **Articles**: News content with metadata and AI enhancements
- **User Preferences**: Reading goals, category filters, source preferences
- **User Articles**: Bookmarks and reading status tracking
- **Notes**: User-generated notes linked to articles
- **Reading History**: Comprehensive reading analytics

## Data Flow

### News Ingestion
1. RSS feeds are parsed from configured sources
2. Articles are processed and stored in the database
3. AI service enhances articles with summaries and analysis
4. Content is categorized and made available through API

### User Interaction
1. Users authenticate via Replit OAuth
2. Personalized article feeds are generated based on preferences
3. Reading actions (bookmarks, notes) are tracked and stored
4. Progress analytics are calculated and displayed

### Real-time Features
- Live reading progress tracking
- Instant bookmark and note synchronization
- Dynamic content filtering based on user preferences

## External Dependencies

### Core Dependencies
- **Authentication**: Replit OAuth with openid-client
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API for content enhancement
- **RSS Processing**: rss-parser for news feed ingestion
- **UI Components**: Radix UI primitives with shadcn/ui

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implied by shadcn/ui setup)
- **Development Server**: Express with Vite middleware in development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles Node.js server to `dist/index.js`
- **Assets**: Static files served from built frontend directory

### Environment Configuration
- **Development**: Hot module replacement with Vite dev server
- **Production**: Node.js server serves built assets and API routes
- **Database**: Environment-based PostgreSQL connection strings
- **Secrets**: OpenAI API keys and session secrets via environment variables

### Replit Integration
- **Modules**: Node.js 20, web server, and PostgreSQL 16
- **Port Configuration**: Internal port 5000 mapped to external port 80
- **Auto-scaling**: Configured for Replit's autoscale deployment target

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 19, 2025: cPanel deployment version created
  - Built NewsFlow cPanel-compatible version with enhanced UI
  - Created automated setup guides for cPanel hosting environment
  - Developed ultra-lightweight version to resolve WebAssembly memory errors
  - Added support for Apache and Nginx proxy configurations
  - Created HTTPS setup scripts for domain news.mystimatrix.com
  - Application ready for one-click deployment in cPanel with Node.js support

- June 16, 2025: MySQL deployment version completed
  - Converted entire application to MySQL-compatible format for deployment
  - Created MySQL schema with proper data types (VARCHAR, JSON, TIMESTAMP, INT)
  - Implemented MySQL-specific storage layer without RETURNING clauses
  - Added complete deployment configuration with Docker and docker-compose
  - Created production-ready MySQL database initialization script
  - Added comprehensive documentation for server deployment
  - Application ready for Git deployment to user's own server with MySQL database

- June 16, 2025: Complete MySQL conversion implemented
  - Converted PostgreSQL schema to MySQL-compatible format using mysqlTable and MySQL data types
  - Created MySQL-specific database connection with mysql2 driver
  - Updated all table definitions: sessions, users, userPreferences, newsSources, articles, userArticles, userNotes, readingHistory
  - Adapted storage layer for MySQL syntax (removed PostgreSQL-specific features like RETURNING, onConflictDoUpdate)
  - Created MySQL-compatible storage implementation with proper upsert patterns
  - Updated housekeeping service for MySQL compatibility
  - Maintained all NewsFlow features while adapting to MySQL constraints

- June 15, 2025: NewsFlow application completed and ready for production deployment
  - Replaced failing Reuters feeds with working Business Insider, CNBC Business, and Yahoo Finance sources
  - Fixed Business and Markets categories - now populated with real articles
  - Removed search functionality per user request for cleaner interface
  - Fixed notification icon with working dropdown panel
  - Verified all article categories working: Technology, AI, Business, Markets
  - Successfully built production assets with Vite and esbuild
  - Application ready for Replit deployment with all features functional

## Changelog

- June 15, 2025: Initial NewsFlow setup and full implementation completed