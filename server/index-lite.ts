import express from "express";
import { createServer } from "http";
import mysql from "mysql2/promise";
import Parser from "rss-parser";

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Simple MySQL connection
const dbConfig = {
  host: process.env.MYSQL_HOST || '103.47.29.22',
  user: process.env.MYSQL_USER || 'newsmystimatrix_rep',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'newsmystimatrix_rep',
  connectionLimit: 3
};

let db: mysql.Pool;

try {
  db = mysql.createPool(dbConfig);
  console.log('Connected to MySQL database');
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1);
}

// RSS Parser
const parser = new Parser();

// Basic news sources
const sources = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
  { name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/all', category: 'Business' }
];

// API Routes
app.get('/api/articles', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, title, summary, url, category, published_at FROM articles ORDER BY published_at DESC LIMIT 20'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Failed to fetch articles' });
  }
});

app.get('/api/refresh', async (req, res) => {
  try {
    let totalAdded = 0;
    
    for (const source of sources) {
      try {
        const feed = await parser.parseURL(source.url);
        
        for (const item of feed.items.slice(0, 5)) { // Limit to 5 articles per source
          if (!item.title || !item.link) continue;
          
          try {
            await db.execute(
              'INSERT IGNORE INTO articles (title, content, summary, url, category, published_at, source_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                item.title,
                item.content || item.contentSnippet || item.title,
                (item.contentSnippet || item.title).substring(0, 200),
                item.link,
                source.category,
                new Date(item.pubDate || Date.now()),
                1
              ]
            );
            totalAdded++;
          } catch (insertError) {
            // Skip duplicate entries
            if (!insertError.message.includes('Duplicate')) {
              console.error('Insert error:', insertError);
            }
          }
        }
      } catch (feedError) {
        console.error(`Error parsing ${source.name}:`, feedError);
      }
    }
    
    res.json({ message: `Added ${totalAdded} new articles` });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Refresh failed' });
  }
});

// Serve static files
app.use(express.static('dist/public'));

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist/public' });
});

const server = createServer(app);
const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NewsFlow Lite running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully');
  server.close(() => {
    db.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  server.close(() => {
    db.end();
    process.exit(0);
  });
});