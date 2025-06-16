import {
  users,
  userPreferences,
  newsSources,
  articles,
  userArticles,
  userNotes,
  readingHistory,
  type User,
  type UpsertUser,
  type UserPreferences,
  type NewsSource,
  type Article,
  type UserArticle,
  type UserNote,
  type ReadingHistory,
  type InsertUserPreferences,
  type InsertNewsSource,
  type InsertArticle,
  type InsertUserArticle,
  type InsertUserNote,
  type InsertReadingHistory,
} from "@shared/schema";
import { db } from "./db-mysql";
import { eq, desc, and, or, inArray, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // News sources
  getNewsSources(): Promise<NewsSource[]>;
  createNewsSource(source: InsertNewsSource): Promise<NewsSource>;
  
  // Articles
  getArticles(limit?: number, offset?: number, category?: string, sourceIds?: number[]): Promise<Article[]>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article>;
  
  // User articles
  getUserArticle(userId: string, articleId: number): Promise<UserArticle | undefined>;
  upsertUserArticle(userArticle: InsertUserArticle): Promise<UserArticle>;
  getUserBookmarkedArticles(userId: string): Promise<(Article & { userArticle: UserArticle })[]>;
  getUserReadArticles(userId: string, limit?: number): Promise<(Article & { userArticle: UserArticle })[]>;
  
  // Notes
  getUserNotes(userId: string, articleId?: number): Promise<UserNote[]>;
  createUserNote(note: InsertUserNote): Promise<UserNote>;
  updateUserNote(id: number, content: string): Promise<UserNote>;
  deleteUserNote(id: number): Promise<void>;
  
  // Reading history and analytics
  createReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory>;
  getUserReadingStats(userId: string, days?: number): Promise<{
    articlesRead: number;
    totalReadingTime: number;
    streak: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // MySQL doesn't have ON CONFLICT DO UPDATE, so we use INSERT ... ON DUPLICATE KEY UPDATE
    try {
      const [user] = await db
        .insert(users)
        .values(userData);
      return await this.getUser(userData.id) as User;
    } catch (error) {
      // If insert fails due to duplicate key, update instead
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id));
      return await this.getUser(userData.id) as User;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    try {
      const [newPrefs] = await db
        .insert(userPreferences)
        .values(preferences);
      return await this.getUserPreferences(preferences.userId) as UserPreferences;
    } catch (error) {
      // Update if insert fails
      await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, preferences.userId));
      return await this.getUserPreferences(preferences.userId) as UserPreferences;
    }
  }

  async getNewsSources(): Promise<NewsSource[]> {
    return await db.select().from(newsSources).where(eq(newsSources.isActive, true));
  }

  async createNewsSource(source: InsertNewsSource): Promise<NewsSource> {
    const [newSource] = await db
      .insert(newsSources)
      .values(source);
    
    // Get the inserted record by querying for it
    const [created] = await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.name, source.name));
    return created;
  }

  async getArticles(limit = 20, offset = 0, category?: string, sourceIds?: number[]): Promise<any[]> {
    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        summary: articles.summary,
        aiSummary: articles.aiSummary,
        aiEnhancement: articles.aiEnhancement,
        aiKeyPoints: articles.aiKeyPoints,
        aiSentiment: articles.aiSentiment,
        url: articles.url,
        imageUrl: articles.imageUrl,
        sourceId: articles.sourceId,
        category: articles.category,
        publishedAt: articles.publishedAt,
        readingTime: articles.readingTime,
        isProcessed: articles.isProcessed,
        createdAt: articles.createdAt,
        source: {
          id: newsSources.id,
          name: newsSources.name,
          displayName: newsSources.displayName,
          url: newsSources.url,
          rssUrl: newsSources.rssUrl,
          category: newsSources.category,
          isActive: newsSources.isActive,
          createdAt: newsSources.createdAt,
        },
      })
      .from(articles)
      .leftJoin(newsSources, eq(articles.sourceId, newsSources.id));

    if (category) {
      query = query.where(eq(articles.category, category));
    }

    if (sourceIds && sourceIds.length > 0) {
      query = query.where(inArray(articles.sourceId, sourceIds));
    }

    return await query
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db
      .insert(articles)
      .values(article);
    
    // Get the inserted record
    const [created] = await db
      .select()
      .from(articles)
      .where(eq(articles.url, article.url));
    return created;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    await db
      .update(articles)
      .set(updates)
      .where(eq(articles.id, id));
    
    return await this.getArticleById(id) as Article;
  }

  async getUserArticle(userId: string, articleId: number): Promise<UserArticle | undefined> {
    const [userArticle] = await db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));
    return userArticle;
  }

  async upsertUserArticle(userArticle: InsertUserArticle): Promise<UserArticle> {
    try {
      const [newUserArticle] = await db
        .insert(userArticles)
        .values(userArticle);
      return await this.getUserArticle(userArticle.userId, userArticle.articleId) as UserArticle;
    } catch (error) {
      // Update if insert fails
      await db
        .update(userArticles)
        .set({
          ...userArticle,
          updatedAt: new Date(),
        })
        .where(and(
          eq(userArticles.userId, userArticle.userId),
          eq(userArticles.articleId, userArticle.articleId)
        ));
      return await this.getUserArticle(userArticle.userId, userArticle.articleId) as UserArticle;
    }
  }

  async getUserBookmarkedArticles(userId: string): Promise<(Article & { userArticle: UserArticle })[]> {
    return await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        summary: articles.summary,
        aiSummary: articles.aiSummary,
        aiEnhancement: articles.aiEnhancement,
        aiKeyPoints: articles.aiKeyPoints,
        aiSentiment: articles.aiSentiment,
        url: articles.url,
        imageUrl: articles.imageUrl,
        sourceId: articles.sourceId,
        category: articles.category,
        publishedAt: articles.publishedAt,
        readingTime: articles.readingTime,
        isProcessed: articles.isProcessed,
        createdAt: articles.createdAt,
        userArticle: userArticles,
      })
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(eq(userArticles.userId, userId), eq(userArticles.isBookmarked, true)))
      .orderBy(desc(userArticles.createdAt));
  }

  async getUserReadArticles(userId: string, limit = 50): Promise<(Article & { userArticle: UserArticle })[]> {
    return await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        summary: articles.summary,
        aiSummary: articles.aiSummary,
        aiEnhancement: articles.aiEnhancement,
        aiKeyPoints: articles.aiKeyPoints,
        aiSentiment: articles.aiSentiment,
        url: articles.url,
        imageUrl: articles.imageUrl,
        sourceId: articles.sourceId,
        category: articles.category,
        publishedAt: articles.publishedAt,
        readingTime: articles.readingTime,
        isProcessed: articles.isProcessed,
        createdAt: articles.createdAt,
        userArticle: userArticles,
      })
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(eq(userArticles.userId, userId), eq(userArticles.isRead, true)))
      .orderBy(desc(userArticles.readAt))
      .limit(limit);
  }

  async getUserNotes(userId: string, articleId?: number): Promise<UserNote[]> {
    let query = db.select().from(userNotes).where(eq(userNotes.userId, userId));
    
    if (articleId) {
      query = query.where(and(eq(userNotes.userId, userId), eq(userNotes.articleId, articleId)));
    }
    
    return await query.orderBy(desc(userNotes.createdAt));
  }

  async createUserNote(note: InsertUserNote): Promise<UserNote> {
    const [newNote] = await db
      .insert(userNotes)
      .values(note);
    
    // Get the inserted record
    const [created] = await db
      .select()
      .from(userNotes)
      .where(and(
        eq(userNotes.userId, note.userId),
        eq(userNotes.articleId, note.articleId),
        eq(userNotes.content, note.content)
      ))
      .orderBy(desc(userNotes.createdAt))
      .limit(1);
    return created;
  }

  async updateUserNote(id: number, content: string): Promise<UserNote> {
    await db
      .update(userNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(userNotes.id, id));
    
    const [updated] = await db.select().from(userNotes).where(eq(userNotes.id, id));
    return updated;
  }

  async deleteUserNote(id: number): Promise<void> {
    await db.delete(userNotes).where(eq(userNotes.id, id));
  }

  async createReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    const [newHistory] = await db
      .insert(readingHistory)
      .values(history);
    
    // Get the inserted record
    const [created] = await db
      .select()
      .from(readingHistory)
      .where(and(
        eq(readingHistory.userId, history.userId),
        eq(readingHistory.articleId, history.articleId)
      ))
      .orderBy(desc(readingHistory.date))
      .limit(1);
    return created;
  }

  async getUserReadingStats(userId: string, days = 30): Promise<{
    articlesRead: number;
    totalReadingTime: number;
    streak: number;
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get articles read count
    const [readCountResult] = await db
      .select({ count: count() })
      .from(readingHistory)
      .where(and(
        eq(readingHistory.userId, userId),
        sql`${readingHistory.date} >= ${sinceDate}`
      ));

    // Get total reading time
    const [readingTimeResult] = await db
      .select({ 
        totalTime: sql<number>`SUM(${readingHistory.readingTime})` 
      })
      .from(readingHistory)
      .where(and(
        eq(readingHistory.userId, userId),
        sql`${readingHistory.date} >= ${sinceDate}`
      ));

    // Calculate streak (simplified - consecutive days with reading activity)
    const recentActivity = await db
      .select({ 
        date: sql<string>`DATE(${readingHistory.date})` 
      })
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .groupBy(sql`DATE(${readingHistory.date})`)
      .orderBy(sql`DATE(${readingHistory.date}) DESC`)
      .limit(30);

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = today;

    for (const activity of recentActivity) {
      if (activity.date === currentDate) {
        streak++;
        const date = new Date(currentDate);
        date.setDate(date.getDate() - 1);
        currentDate = date.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    return {
      articlesRead: readCountResult?.count || 0,
      totalReadingTime: readingTimeResult?.totalTime || 0,
      streak,
    };
  }
}

export const storage = new DatabaseStorage();