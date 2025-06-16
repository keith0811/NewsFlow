import Parser from 'rss-parser';
import { storage } from '../storage-mysql';
import { type InsertNewsSource, type InsertArticle } from '@shared/schema';

interface RSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  creator?: string;
  isoDate?: string;
}

class NewsService {
  private parser: Parser<{}, RSSItem>;

  constructor() {
    this.parser = new Parser();
  }

  async initializeDefaultSources(): Promise<void> {
    const defaultSources: InsertNewsSource[] = [
      {
        name: 'techcrunch',
        displayName: 'TechCrunch',
        url: 'https://techcrunch.com',
        rssUrl: 'https://techcrunch.com/feed/',
        category: 'technology',
        isActive: true,
      },
      {
        name: 'ai_news',
        displayName: 'AI News',
        url: 'https://www.artificialintelligence-news.com',
        rssUrl: 'https://www.artificialintelligence-news.com/feed/',
        category: 'ai',
        isActive: true,
      },
      {
        name: 'business_insider',
        displayName: 'Business Insider',
        url: 'https://www.businessinsider.com',
        rssUrl: 'https://feeds.businessinsider.com/custom/all',
        category: 'business',
        isActive: true,
      },
      {
        name: 'yahoo_finance',
        displayName: 'Yahoo Finance',
        url: 'https://finance.yahoo.com',
        rssUrl: 'https://finance.yahoo.com/rss/topstories',
        category: 'markets',
        isActive: true,
      },
      {
        name: 'cnbc_business',
        displayName: 'CNBC Business',
        url: 'https://www.cnbc.com',
        rssUrl: 'https://www.cnbc.com/id/10001147/device/rss/rss.html',
        category: 'business',
        isActive: true,
      },
    ];

    const existingSources = await storage.getNewsSources();
    const existingNames = new Set(existingSources.map(s => s.name));

    for (const source of defaultSources) {
      if (!existingNames.has(source.name)) {
        try {
          await storage.createNewsSource(source);
          console.log(`Created news source: ${source.displayName}`);
        } catch (error) {
          console.error(`Failed to create source ${source.displayName}:`, error);
        }
      }
    }
  }

  async refreshAllArticles(): Promise<void> {
    const sources = await storage.getNewsSources();
    
    for (const source of sources) {
      try {
        await this.refreshSourceArticles(source);
        console.log(`Refreshed articles from ${source.displayName}`);
      } catch (error) {
        console.error(`Failed to refresh ${source.displayName}:`, error);
      }
    }
  }

  private async refreshSourceArticles(source: any): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.rssUrl);
      
      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        // Check if article already exists
        const existingArticles = await storage.getArticles(1, 0);
        const exists = existingArticles.some(a => a.url === item.link);
        
        if (exists) continue;

        // Get the full content - prioritize content:encoded, then content, then contentSnippet
        const fullContent = (item as any)['content:encoded'] || item.content || item.contentSnippet || (item as any).summary || '';
        
        const article: InsertArticle = {
          title: item.title,
          content: fullContent,
          summary: this.extractSummary(fullContent),
          url: item.link,
          sourceId: source.id,
          category: source.category,
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          readingTime: this.estimateReadingTime(fullContent),
          isProcessed: false,
        };

        try {
          await storage.createArticle(article);
        } catch (error: any) {
          // Skip duplicate articles (constraint violation)
          if (error.code !== '23505') {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to refresh ${source.displayName}:`, error);
      // Don't throw error to prevent server crash
    }
  }

  private extractSummary(content: string): string {
    // Remove HTML tags and extract first 200 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
  }

  private estimateReadingTime(content: string): number {
    // Average reading speed is 200-250 words per minute
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / 225); // minutes
  }

  async scheduleRefresh(): Promise<void> {
    // Schedule daily refresh at 12:00 AM
    const scheduleNextRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Set to 12:00 AM
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          await this.refreshAllArticles();
          console.log('Daily article refresh completed at 12:00 AM');
        } catch (error) {
          console.error('Daily article refresh failed:', error);
        }
        
        // Schedule the next refresh for the following day
        scheduleNextRefresh();
      }, timeUntilMidnight);
    };
    
    // Initial refresh and schedule
    try {
      await this.refreshAllArticles();
      console.log('Initial article refresh completed');
    } catch (error) {
      console.error('Initial article refresh failed:', error);
    }
    
    scheduleNextRefresh();
    console.log('Daily article refresh scheduled for 12:00 AM');
  }
}

export const newsService = new NewsService();
