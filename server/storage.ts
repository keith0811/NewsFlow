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
  type InsertUserPreferences,
  type NewsSource,
  type InsertNewsSource,
  type Article,
  type InsertArticle,
  type UserArticle,
  type InsertUserArticle,
  type UserNote,
  type InsertUserNote,
  type ReadingHistory,
  type InsertReadingHistory,
} from "@shared/schema";
import { db } from "./db";
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
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    const [result] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
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
    const [result] = await db
      .insert(newsSources)
      .values(source)
      .returning();
    return result;
  }

  // Articles
  async getArticles(limit = 20, offset = 0, category?: string, sourceIds?: number[]): Promise<Article[]> {
    let query = db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    const conditions = [];
    
    if (category && category !== 'all') {
      conditions.push(eq(articles.category, category));
    }
    
    if (sourceIds && sourceIds.length > 0) {
      conditions.push(inArray(articles.sourceId, sourceIds));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [result] = await db
      .insert(articles)
      .values(article)
      .returning();
    return result;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    const [result] = await db
      .update(articles)
      .set(updates)
      .where(eq(articles.id, id))
      .returning();
    return result;
  }

  // User articles
  async getUserArticle(userId: string, articleId: number): Promise<UserArticle | undefined> {
    const [result] = await db
      .select()
      .from(userArticles)
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.articleId, articleId)
      ));
    return result;
  }

  async upsertUserArticle(userArticle: InsertUserArticle): Promise<UserArticle> {
    const [result] = await db
      .insert(userArticles)
      .values(userArticle)
      .onConflictDoUpdate({
        target: [userArticles.userId, userArticles.articleId],
        set: {
          ...userArticle,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getUserBookmarkedArticles(userId: string): Promise<(Article & { userArticle: UserArticle })[]> {
    const results = await db
      .select()
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.isBookmarked, true)
      ))
      .orderBy(desc(userArticles.updatedAt));

    return results.map(result => ({
      ...result.articles,
      userArticle: result.user_articles,
    }));
  }

  async getUserReadArticles(userId: string, limit = 50): Promise<(Article & { userArticle: UserArticle })[]> {
    const results = await db
      .select()
      .from(articles)
      .innerJoin(userArticles, eq(articles.id, userArticles.articleId))
      .where(and(
        eq(userArticles.userId, userId),
        eq(userArticles.isRead, true)
      ))
      .orderBy(desc(userArticles.readAt))
      .limit(limit);

    return results.map(result => ({
      ...result.articles,
      userArticle: result.user_articles,
    }));
  }

  // Notes
  async getUserNotes(userId: string, articleId?: number): Promise<UserNote[]> {
    let query = db
      .select()
      .from(userNotes)
      .where(eq(userNotes.userId, userId))
      .orderBy(desc(userNotes.createdAt));

    if (articleId) {
      query = query.where(and(
        eq(userNotes.userId, userId),
        eq(userNotes.articleId, articleId)
      ));
    }

    return await query;
  }

  async createUserNote(note: InsertUserNote): Promise<UserNote> {
    const [result] = await db
      .insert(userNotes)
      .values(note)
      .returning();
    return result;
  }

  async updateUserNote(id: number, content: string): Promise<UserNote> {
    const [result] = await db
      .update(userNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(userNotes.id, id))
      .returning();
    return result;
  }

  async deleteUserNote(id: number): Promise<void> {
    await db
      .delete(userNotes)
      .where(eq(userNotes.id, id));
  }

  // Reading history and analytics
  async createReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    const [result] = await db
      .insert(readingHistory)
      .values(history)
      .returning();
    return result;
  }

  async getUserReadingStats(userId: string, days = 30): Promise<{
    articlesRead: number;
    totalReadingTime: number;
    streak: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get articles read and total reading time
    const [stats] = await db
      .select({
        articlesRead: count(readingHistory.id),
        totalReadingTime: sql<number>`COALESCE(SUM(${readingHistory.readingTime}), 0)`,
      })
      .from(readingHistory)
      .where(and(
        eq(readingHistory.userId, userId),
        sql`${readingHistory.date} >= ${startDate}`
      ));

    // Calculate reading streak (simplified)
    const recentDays = await db
      .select({
        date: sql<string>`DATE(${readingHistory.date})`,
      })
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .groupBy(sql`DATE(${readingHistory.date})`)
      .orderBy(desc(sql`DATE(${readingHistory.date})`))
      .limit(30);

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date();

    for (const day of recentDays) {
      const dayStr = currentDate.toISOString().split('T')[0];
      if (recentDays.some(d => d.date === dayStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      articlesRead: stats.articlesRead,
      totalReadingTime: stats.totalReadingTime,
      streak,
    };
  }
}

export const storage = new DatabaseStorage();
