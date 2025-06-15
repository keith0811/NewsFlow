import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { newsService } from "./services/newsService";
import { aiService } from "./services/aiService";
import {
  insertUserPreferencesSchema,
  insertUserArticleSchema,
  insertUserNoteSchema,
  insertReadingHistorySchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize news sources and fetch initial articles (non-blocking)
  newsService.initializeDefaultSources().catch(console.error);
  
  // Start background operations after server is ready
  setTimeout(async () => {
    try {
      await newsService.scheduleRefresh();
      newsService.refreshAllArticles().catch(error => {
        console.log('Initial article fetch failed:', error.message);
      });
    } catch (error) {
      console.log('Background initialization failed:', error);
    }
  }, 1000);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User preferences
  app.get('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = insertUserPreferencesSchema.parse({
        ...req.body,
        userId,
      });
      const result = await storage.upsertUserPreferences(preferences);
      res.json(result);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Articles
  app.get('/api/articles', async (req, res) => {
    try {
      const { page = '1', limit = '20', category, sources } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      const sourceIds = sources ? (sources as string).split(',').map(Number) : undefined;
      
      const articles = await storage.getArticles(limitNum, offset, category as string, sourceIds);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get('/api/articles/:id', async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // User articles (bookmarks, read status)
  app.post('/api/user/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userArticle = insertUserArticleSchema.parse({
        ...req.body,
        userId,
      });
      const result = await storage.upsertUserArticle(userArticle);
      res.json(result);
    } catch (error) {
      console.error("Error updating user article:", error);
      res.status(500).json({ message: "Failed to update user article" });
    }
  });

  app.get('/api/user/articles/bookmarked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarked = await storage.getUserBookmarkedArticles(userId);
      res.json(bookmarked);
    } catch (error) {
      console.error("Error fetching bookmarked articles:", error);
      res.status(500).json({ message: "Failed to fetch bookmarked articles" });
    }
  });

  app.get('/api/user/articles/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = '50' } = req.query;
      const readArticles = await storage.getUserReadArticles(userId, parseInt(limit as string));
      res.json(readArticles);
    } catch (error) {
      console.error("Error fetching read articles:", error);
      res.status(500).json({ message: "Failed to fetch read articles" });
    }
  });

  // Notes
  app.get('/api/user/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { articleId } = req.query;
      const notes = await storage.getUserNotes(userId, articleId ? parseInt(articleId as string) : undefined);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post('/api/user/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const note = insertUserNoteSchema.parse({
        ...req.body,
        userId,
      });
      const result = await storage.createUserNote(note);
      res.json(result);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put('/api/user/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const { content } = req.body;
      const result = await storage.updateUserNote(noteId, content);
      res.json(result);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete('/api/user/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      await storage.deleteUserNote(noteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Reading history and stats
  app.post('/api/user/reading-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = insertReadingHistorySchema.parse({
        ...req.body,
        userId,
      });
      const result = await storage.createReadingHistory(history);
      res.json(result);
    } catch (error) {
      console.error("Error creating reading history:", error);
      res.status(500).json({ message: "Failed to create reading history" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = '30' } = req.query;
      const stats = await storage.getUserReadingStats(userId, parseInt(days as string));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reading stats:", error);
      res.status(500).json({ message: "Failed to fetch reading stats" });
    }
  });

  // News sources
  app.get('/api/sources', async (req, res) => {
    try {
      const sources = await storage.getNewsSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  // AI services
  app.post('/api/articles/:id/enhance', isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const enhancement = await aiService.enhanceArticle(article.content, article.title);
      
      await storage.updateArticle(articleId, {
        aiEnhancement: enhancement.enhancement,
        aiSummary: enhancement.summary,
        isProcessed: true,
      });

      res.json(enhancement);
    } catch (error) {
      console.error("Error enhancing article:", error);
      res.status(500).json({ message: "Failed to enhance article" });
    }
  });

  // Refresh articles (manual trigger)
  app.post('/api/articles/refresh', isAuthenticated, async (req, res) => {
    try {
      await newsService.refreshAllArticles();
      res.json({ success: true, message: "Articles refresh initiated" });
    } catch (error) {
      console.error("Error refreshing articles:", error);
      res.status(500).json({ message: "Failed to refresh articles" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
