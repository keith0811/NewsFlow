const express = require('express');
const mysql = require('mysql2/promise');
const Parser = require('rss-parser');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// cPanel hosting compatibility
app.set('trust proxy', true);

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 5,
  acquireTimeout: 30000,
  timeout: 30000
};

let db;
const parser = new Parser();

async function connectDB() {
  try {
    db = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

const sources = [
  { id: 1, name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
  { id: 2, name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/all', category: 'Business' },
  { id: 3, name: 'AI News', url: 'https://artificialintelligence-news.com/feed/', category: 'AI' }
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
        console.log(`Fetching ${source.name}...`);
        const feed = await parser.parseURL(source.url);
        
        for (const item of feed.items.slice(0, 5)) {
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

// Main HTML page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewsFlow - Latest Technology News</title>
    <meta name="description" content="Stay updated with the latest technology, AI, and business news from trusted sources like TechCrunch and Business Insider.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px; 
            border-radius: 15px; 
            margin-bottom: 25px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .header h1 { 
            color: #2c3e50; 
            font-size: 2.5rem; 
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            color: #6c757d;
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        .refresh-btn { 
            background: linear-gradient(45deg, #007bff, #0056b3);
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,123,255,0.3);
        }
        .refresh-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,123,255,0.4);
        }
        .refresh-btn:disabled { 
            background: #ccc; 
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .article { 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 25px; 
            margin-bottom: 20px; 
            border-radius: 12px; 
            box-shadow: 0 6px 25px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .article:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 35px rgba(0,0,0,0.15);
        }
        .article h2 { 
            color: #2c3e50; 
            margin-bottom: 12px; 
            font-size: 1.4rem;
            line-height: 1.4;
        }
        .article h2 a { 
            color: #2c3e50; 
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .article h2 a:hover { 
            color: #007bff;
        }
        .article p { 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 15px;
            font-size: 1rem;
        }
        .article-meta { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            color: #999; 
            font-size: 0.9rem;
            flex-wrap: wrap;
            gap: 10px;
        }
        .category { 
            background: linear-gradient(45deg, #e3f2fd, #bbdefb);
            color: #1976d2; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .loading { 
            text-align: center; 
            padding: 60px 20px; 
            color: rgba(255,255,255,0.8);
            font-size: 1.2rem;
        }
        .loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-left: 10px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .empty-state { 
            text-align: center; 
            padding: 60px 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.1);
        }
        .empty-state h2 { 
            margin-bottom: 15px;
            color: #2c3e50;
        }
        .empty-state p { 
            margin-bottom: 25px;
            color: #666;
        }
        .read-more {
            color: #007bff;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        .read-more:hover {
            color: #0056b3;
        }
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .header h1 { font-size: 2rem; }
            .article { padding: 20px; }
            .article-meta { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NewsFlow</h1>
            <p>Latest technology, AI, and business news from trusted sources</p>
            <button class="refresh-btn" onclick="refreshNews()">Refresh News</button>
        </div>
        
        <div id="articles">
            <div class="loading">Loading latest articles</div>
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
                            <p>Click "Refresh News" to load the latest articles from TechCrunch, AI News, and Business Insider</p>
                            <button class="refresh-btn" onclick="refreshNews()">Load Articles</button>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = articles.map(article => \`
                    <div class="article">
                        <h2><a href="\${article.url}" target="_blank" rel="noopener noreferrer">\${article.title}</a></h2>
                        <p>\${article.summary}</p>
                        <div class="article-meta">
                            <span>\${new Date(article.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                            <div>
                                <span class="category">\${article.category}</span>
                                <a href="\${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Article →</a>
                            </div>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading articles:', error);
                document.getElementById('articles').innerHTML = '<div class="empty-state"><h2>Error loading articles</h2><p>Please try refreshing the page or clicking "Refresh News"</p></div>';
            }
        }
        
        async function refreshNews() {
            const btn = document.querySelector('.refresh-btn');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Refreshing...';
            
            try {
                const response = await fetch('/api/refresh');
                const result = await response.json();
                console.log(result.message);
                await loadArticles();
            } catch (error) {
                console.error('Refresh failed:', error);
                alert('Failed to refresh news. Please try again.');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
        
        // Load articles on page load
        loadArticles();
        
        // Auto-refresh every 30 minutes
        setInterval(loadArticles, 30 * 60 * 1000);
    </script>
</body>
</html>`);
});

app.get('*', (req, res) => {
  res.redirect('/');
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`NewsFlow running on port ${PORT}`);
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