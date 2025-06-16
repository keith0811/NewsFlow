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
    const existing = await this.getUser(userData.id);
    
    if (existing) {
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id));
      return await this.getUser(userData.id) || existing;
    } else {
      await db.insert(users).values(userData);
      return await this.getUser(userData.id) || userData as User;
    }
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(preferences.userId);
    
    if (existing) {
      await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, preferences.userId));
      return await this.getUserPreferences(preferences.userId) || existing;
    } else {
      await db.insert(userPreferences).values(preferences);
      return await this.getUserPreferences(preferences.userId) || preferences as UserPreferences;
    }
  }

  // News sources
  async getNewsSources(): Promise<NewsSource[]> {
    return await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.isActive, true))
      .orderBy(newsSources.displayName);
  }

  async createNewsSource(source: InsertNewsSource): Promise<NewsSource> {
    const result = await db.insert(newsSources).values(source);
    const insertId = result.insertId;
    const [created] = await db.select().from(newsSources).where(eq(newsSources.id, insertId));
    return created;
  }

  // Articles
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
          category: newsSources.category,
        }
      })
      .from(articles)
      .leftJoin(newsSources, eq(articles.sourceId, newsSources.id));

    let whereConditions = [];
    
    if (category) {
      whereConditions.push(eq(articles.category, category));
    }

    if (sourceIds && sourceIds.length > 0) {
      whereConditions.push(inArray(articles.sourceId, sourceIds));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    return query
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const result = await db.insert(articles).values(article);
    const insertId = result.insertId;
    const [created] = await db.select().from(articles).where(eq(articles.id, insertId));
    return created;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    await db.update(articles).set(updates).where(eq(articles.id, id));
    const [updated] = await db.select().from(articles).where(eq(articles.id, id));
    return updated;
  }

  // User articles
  async getUserArticle(userId: string, articleId: number): Promise<UserArticle | undefined> {
    const [userArticle] = await db
      .select()
      .from(userArticles)
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.articleId, articleId)
      ));
    return userArticle;
  }

  async upsertUserArticle(userArticle: InsertUserArticle): Promise<UserArticle> {
    const existing = await this.getUserArticle(userArticle.userId, userArticle.articleId);
    
    if (existing) {
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
      return await this.getUserArticle(userArticle.userId, userArticle.articleId) || existing;
    } else {
      await db.insert(userArticles).values(userArticle);
      return await this.getUserArticle(userArticle.userId, userArticle.articleId) || userArticle as UserArticle;
    }
  }

  async getUserBookmarkedArticles(userId: string): Promise<(Article & { userArticle: UserArticle })[]> {
    return await db
      .select({
        // Article fields
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
        // UserArticle fields
        userArticle: {
          id: userArticles.id,
          userId: userArticles.userId,
          articleId: userArticles.articleId,
          isRead: userArticles.isRead,
          isBookmarked: userArticles.isBookmarked,
          readAt: userArticles.readAt,
          readingTime: userArticles.readingTime,
          createdAt: userArticles.createdAt,
          updatedAt: userArticles.updatedAt,
        }
      })
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.isBookmarked, true)
      ))
      .orderBy(desc(userArticles.updatedAt));
  }

  async getUserReadArticles(userId: string, limit = 50): Promise<(Article & { userArticle: UserArticle })[]> {
    return await db
      .select({
        // Article fields
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
        // UserArticle fields
        userArticle: {
          id: userArticles.id,
          userId: userArticles.userId,
          articleId: userArticles.articleId,
          isRead: userArticles.isRead,
          isBookmarked: userArticles.isBookmarked,
          readAt: userArticles.readAt,
          readingTime: userArticles.readingTime,
          createdAt: userArticles.createdAt,
          updatedAt: userArticles.updatedAt,
        }
      })
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.isRead, true)
      ))
      .orderBy(desc(userArticles.readAt))
      .limit(limit);
  }

  // Notes
  async getUserNotes(userId: string, articleId?: number): Promise<UserNote[]> {
    let query = db
      .select()
      .from(userNotes)
      .where(eq(userNotes.userId, userId));

    if (articleId) {
      query = query.where(and(
        eq(userNotes.userId, userId),
        eq(userNotes.articleId, articleId)
      ));
    }

    return query.orderBy(desc(userNotes.createdAt));
  }

  async createUserNote(note: InsertUserNote): Promise<UserNote> {
    const result = await db.insert(userNotes).values(note);
    const insertId = result.insertId;
    const [created] = await db.select().from(userNotes).where(eq(userNotes.id, insertId));
    return created;
  }

  async updateUserNote(id: number, content: string): Promise<UserNote> {
    await db
      .update(userNotes)
      .set({ 
        content,
        updatedAt: new Date()
      })
      .where(eq(userNotes.id, id));
    const [updated] = await db.select().from(userNotes).where(eq(userNotes.id, id));
    return updated;
  }

  async deleteUserNote(id: number): Promise<void> {
    await db.delete(userNotes).where(eq(userNotes.id, id));
  }

  // Reading history and analytics
  async createReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    const result = await db.insert(readingHistory).values(history);
    const insertId = result.insertId;
    const [created] = await db.select().from(readingHistory).where(eq(readingHistory.id, insertId));
    return created;
  }

  async getUserReadingStats(userId: string, days = 30): Promise<{
    articlesRead: number;
    totalReadingTime: number;
    streak: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get articles read in the period
    const readArticles = await db
      .select({
        count: count(),
        totalTime: sql<number>`COALESCE(SUM(${readingHistory.readingTime}), 0)`
      })
      .from(readingHistory)
      .where(and(
        eq(readingHistory.userId, userId),
        sql`${readingHistory.date} >= ${startDate}`
      ));

    // Calculate streak (simplified - consecutive days with reading)
    const recentDays = await db
      .select({
        date: sql<string>`DATE(${readingHistory.date})`,
        count: count()
      })
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .groupBy(sql`DATE(${readingHistory.date})`)
      .orderBy(sql`DATE(${readingHistory.date}) DESC`)
      .limit(30);

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date();
    
    for (const day of recentDays) {
      const dayStr = currentDate.toISOString().split('T')[0];
      if (day.date === dayStr && day.count > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      articlesRead: readArticles[0]?.count || 0,
      totalReadingTime: readArticles[0]?.totalTime || 0,
      streak
    };
  }
}

export const storage = new DatabaseStorage();