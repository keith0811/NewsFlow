import { db } from "../db-mysql";
import { articles, userArticles, userNotes, readingHistory } from "@shared/schema";
import { lt, and, notInArray } from "drizzle-orm";

class HousekeepingService {
  private readonly ARTICLE_RETENTION_DAYS = 2;

  async performDailyCleanup(): Promise<void> {
    console.log('Starting daily database cleanup...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARTICLE_RETENTION_DAYS);
    
    try {
      // Step 1: Get article IDs that are older than retention period
      const oldArticles = await db
        .select({ id: articles.id })
        .from(articles)
        .where(lt(articles.createdAt, cutoffDate));

      if (oldArticles.length === 0) {
        console.log('No old articles to clean up');
        return;
      }

      const oldArticleIds = oldArticles.map(a => a.id);
      console.log(`Found ${oldArticleIds.length} articles older than ${this.ARTICLE_RETENTION_DAYS} days`);

      // Step 2: Get article IDs that users have interacted with (preserve reading history)
      const readArticleIds = await db
        .select({ articleId: userArticles.articleId })
        .from(userArticles);

      const preserveIds = readArticleIds.map(r => r.articleId);

      // Step 3: Filter out articles we want to preserve (keep articles with user interactions)
      const articlesToDelete = oldArticleIds.filter(id => !preserveIds.includes(id));

      if (articlesToDelete.length === 0) {
        console.log('No articles to delete - all old articles have user interactions');
        return;
      }

      // Step 4: Delete related data first (foreign key constraints)
      // Delete user notes for articles being removed
      const deletedNotes = await db
        .delete(userNotes)
        .where(notInArray(userNotes.articleId, articlesToDelete))
        .returning({ id: userNotes.id });

      // Delete reading history for articles being removed
      const deletedHistory = await db
        .delete(readingHistory)
        .where(notInArray(readingHistory.articleId, articlesToDelete))
        .returning({ id: readingHistory.id });

      // Step 5: Delete the articles themselves
      const deletedArticles = await db
        .delete(articles)
        .where(notInArray(articles.id, articlesToDelete))
        .returning({ id: articles.id });

      console.log(`Cleanup completed:
        - Deleted ${deletedArticles.length} articles
        - Deleted ${deletedNotes.length} associated notes
        - Deleted ${deletedHistory.length} reading history entries
        - Preserved ${preserveIds.length} articles with user interactions`);

    } catch (error) {
      console.error('Error during database cleanup:', error);
      throw error;
    }
  }

  async getCleanupStats(): Promise<{
    totalArticles: number;
    oldArticles: number;
    articlesWithUserData: number;
    eligibleForDeletion: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARTICLE_RETENTION_DAYS);

    const totalArticles = await db.$count(articles);
    
    const oldArticles = await db
      .select({ id: articles.id })
      .from(articles)
      .where(lt(articles.createdAt, cutoffDate));

    const articlesWithUserData = await db
      .select({ articleId: userArticles.articleId })
      .from(userArticles);

    const oldArticleIds = oldArticles.map(a => a.id);
    const protectedIds = articlesWithUserData.map(u => u.articleId);
    const eligibleForDeletion = oldArticleIds.filter(id => !protectedIds.includes(id)).length;

    return {
      totalArticles,
      oldArticles: oldArticles.length,
      articlesWithUserData: articlesWithUserData.length,
      eligibleForDeletion
    };
  }

  scheduleCleanup(): void {
    // Run cleanup daily at 1 AM (1 hour after article refresh)
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(1, 0, 0, 0);

    // If it's already past 1 AM today, schedule for tomorrow
    if (now.getHours() >= 1) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilNext = nextRun.getTime() - now.getTime();

    setTimeout(() => {
      this.performDailyCleanup().catch(console.error);
      
      // Schedule to run every 24 hours
      setInterval(() => {
        this.performDailyCleanup().catch(console.error);
      }, 24 * 60 * 60 * 1000);
    }, timeUntilNext);

    console.log(`Database cleanup scheduled for ${nextRun.toLocaleString()}`);
  }
}

export const housekeepingService = new HousekeepingService();