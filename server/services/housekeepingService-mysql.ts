import { db } from "../db-mysql";
import { articles, userArticles, userNotes, readingHistory } from "@shared/schema";
import { lt, and, inArray, count, sql } from "drizzle-orm";

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
        console.log('No old articles found for cleanup.');
        return;
      }

      const oldArticleIds = oldArticles.map(a => a.id);
      console.log(`Found ${oldArticleIds.length} old articles to clean up.`);

      // Step 2: Get user articles that reference these old articles  
      const referencedUserArticles = await db
        .select({ articleId: userArticles.articleId })
        .from(userArticles)
        .where(inArray(userArticles.articleId, oldArticleIds));

      const referencedArticleIds = referencedUserArticles.map(ua => ua.articleId);

      // Step 3: Delete user notes for old articles
      if (oldArticleIds.length > 0) {
        await db
          .delete(userNotes)
          .where(inArray(userNotes.articleId, oldArticleIds));
      }

      // Step 4: Delete reading history for old articles  
      if (oldArticleIds.length > 0) {
        await db
          .delete(readingHistory)
          .where(inArray(readingHistory.articleId, oldArticleIds));
      }

      // Step 5: Delete articles that are not referenced by any user
      const articlesToDelete = oldArticleIds.filter(id => !referencedArticleIds.includes(id));
      if (articlesToDelete.length > 0) {
        await db
          .delete(articles)
          .where(inArray(articles.id, articlesToDelete));
      }

      console.log(`Cleanup completed successfully. Deleted ${articlesToDelete.length} articles.`);
    } catch (error) {
      console.error('Error during daily cleanup:', error);
      throw error;
    }
  }

  async getCleanupStats(): Promise<{
    totalArticles: number;
    oldArticles: number;
    userArticles: number;
    userNotes: number;
    readingHistory: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARTICLE_RETENTION_DAYS);

    try {
      // Count total articles
      const [totalArticlesResult] = await db
        .select({ count: count() })
        .from(articles);

      // Count old articles
      const [oldArticlesResult] = await db
        .select({ count: count() })
        .from(articles)
        .where(lt(articles.createdAt, cutoffDate));

      // Count user articles
      const [userArticlesResult] = await db
        .select({ count: count() })
        .from(userArticles);

      // Count user notes
      const [userNotesResult] = await db
        .select({ count: count() })
        .from(userNotes);

      // Count reading history
      const [readingHistoryResult] = await db
        .select({ count: count() })
        .from(readingHistory);

      return {
        totalArticles: totalArticlesResult?.count || 0,
        oldArticles: oldArticlesResult?.count || 0,
        userArticles: userArticlesResult?.count || 0,
        userNotes: userNotesResult?.count || 0,
        readingHistory: readingHistoryResult?.count || 0,
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        totalArticles: 0,
        oldArticles: 0,
        userArticles: 0,
        userNotes: 0,
        readingHistory: 0,
      };
    }
  }

  scheduleCleanup(): void {
    // Schedule cleanup to run daily at 2 AM
    const scheduleNext = () => {
      const now = new Date();
      const next2AM = new Date();
      next2AM.setHours(2, 0, 0, 0);
      
      // If it's already past 2 AM today, schedule for tomorrow
      if (now > next2AM) {
        next2AM.setDate(next2AM.getDate() + 1);
      }
      
      const timeUntilNext = next2AM.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          await this.performDailyCleanup();
        } catch (error) {
          console.error('Scheduled cleanup failed:', error);
        }
        scheduleNext(); // Schedule the next cleanup
      }, timeUntilNext);
      
      console.log(`Next cleanup scheduled for: ${next2AM.toISOString()}`);
    };
    
    scheduleNext();
  }
}

export const housekeepingService = new HousekeepingService();