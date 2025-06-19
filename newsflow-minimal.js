const express = require('express');
const mysql = require('mysql2/promise');
const Parser = require('rss-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Database connection
const dbConfig = {
  host: process.env.MYSQL_HOST || '103.47.29.22',
  user: process.env.MYSQL_USER || 'newsmystimatrix_rep',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'newsmystimatrix_rep',
  connectionLimit: 2,
  acquireTimeout: 30000,
  timeout: 30000
};

let db;

async function connectDB() {
  try {
    db = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// RSS Parser
const parser = new Parser();

// News sources
const sources = [
  { id: 1, name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
  { id: 2, name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/all', category: 'Business' }
];

// Simple HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewsFlow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #333; font-size: 2rem; margin-bottom: 10px; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
        .refresh-btn:disabled { background: #ccc; cursor: not-allowed; }
        .article { background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .article h2 { color: #333; margin-bottom: 8px; }
        .article h2 a { color: #333; text-decoration: none; }
        .article h2 a:hover { color: #007bff; }
        .article p { color: #666; line-height: 1.6; margin-bottom: 10px; }
        .article-meta { display: flex; justify-content: space-between; align-items: center; color: #999; font-size: 0.9rem; }
        .category { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
        .loading { text-align: center; padding: 40px; color: #666; }
        .empty-state { text-align: center; padding: 60px 20px; color: #666; }
        .empty-state h2 { margin-bottom: 10px; }
        .empty-state p { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NewsFlow</h1>
            <button class="refresh-btn" onclick="refreshNews()">Refresh News</button>
        </div>
        
        <div id="articles">
            <div class="loading">Loading articles...</div>
        </div>
    </div>

    <script>
        async function loadArticles() {
            try {
                const response = await fetch('/api/articles');
                const articles = await response.json();
                
                const container = document.getElementById('articles');
                
                if (articles.length === 0) {
                    container.innerHTML = \`
                        <div class="empty-state">
                            <h2>No articles yet</h2>
                            <p>Click "Refresh News" to load the latest articles</p>
                            <button class="refresh-btn" onclick="refreshNews()">Load Articles</button>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = articles.map(article => \`
                    <div class="article">
                        <h2><a href="\${article.url}" target="_blank">\${article.title}</a></h2>
                        <p>\${article.summary}</p>
                        <div class="article-meta">
                            <span>\${new Date(article.published_at).toLocaleDateString()}</span>
                            <span class="category">\${article.category}</span>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading articles:', error);
                document.getElementById('articles').innerHTML = '<div class="loading">Error loading articles</div>';
            }
        }
        
        async function refreshNews() {
            const btn = document.querySelector('.refresh-btn');
            btn.disabled = true;
            btn.textContent = 'Refreshing...';
            
            try {
                const response = await fetch('/api/refresh');
                const result = await response.json();
                console.log(result.message);
                await loadArticles();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Refresh News';
            }
        }
        
        // Load articles on page load
        loadArticles();
    </script>
</body>
</html>
`;

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
        console.log(`Fetching ${source.name}...`);
        const feed = await parser.parseURL(source.url);
        
        for (const item of feed.items.slice(0, 3)) {
          if (!item.title || !item.link) continue;
          
          try {
            const [result] = await db.execute(
              'INSERT IGNORE INTO articles (title, content, summary, url, category, published_at, source_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                item.title.substring(0, 500),
                (item.content || item.contentSnippet || item.title).substring(0, 1000),
                (item.contentSnippet || item.title).substring(0, 200),
                item.link,
                source.category,
                new Date(item.pubDate || Date.now()),
                source.id
              ]
            );
            if (result.affectedRows > 0) totalAdded++;
          } catch (insertError) {
            // Skip duplicates
            if (!insertError.message.includes('Duplicate')) {
              console.error('Insert error:', insertError.message);
            }
          }
        }
      } catch (feedError) {
        console.error(`Error parsing ${source.name}:`, feedError.message);
      }
    }
    
    res.json({ message: `Added ${totalAdded} new articles` });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Refresh failed' });
  }
});

// Serve the HTML page
app.get('/', (req, res) => {
  res.send(htmlTemplate);
});

app.get('*', (req, res) => {
  res.send(htmlTemplate);
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NewsFlow Minimal running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the application`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully');
  if (db) db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  if (db) db.end();
  process.exit(0);
});

startServer();