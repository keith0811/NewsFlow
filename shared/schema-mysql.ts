import {
  mysqlTable,
  text,
  varchar,
  timestamp,
  json,
  int,
  boolean,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for MySQL
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for MySQL
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences table
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categories: json("categories"),
  sources: json("sources"),
  dailyReadingGoal: int("daily_reading_goal").default(15),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News sources table
export const newsSources = mysqlTable("news_sources", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  rssUrl: varchar("rss_url", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  url: varchar("url", { length: 500 }),
});

// Articles table
export const articles = mysqlTable("articles", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  summary: text("summary"),
  url: varchar("url", { length: 500 }).notNull(),
  sourceId: int("source_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  readingTime: int("reading_time"),
  imageUrl: varchar("image_url", { length: 500 }),
  author: varchar("author", { length: 255 }),
  aiSummary: text("ai_summary"),
  aiEnhancement: text("ai_enhancement"),
  isProcessed: boolean("is_processed").default(false),
});

// User articles table (for bookmarks, read status, etc.)
export const userArticles = mysqlTable("user_articles", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  articleId: int("article_id").notNull(),
  isBookmarked: boolean("is_bookmarked").default(false),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  bookmarkedAt: timestamp("bookmarked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notes table
export const userNotes = mysqlTable("user_notes", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  articleId: int("article_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reading history table
export const readingHistory = mysqlTable("reading_history", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  articleId: int("article_id").notNull(),
  readAt: timestamp("read_at").defaultNow(),
  timeSpent: int("time_spent"),
  percentRead: int("percent_read"),
});

// Relations - same as PostgreSQL version
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  userArticles: many(userArticles),
  notes: many(userNotes),
  readingHistory: many(readingHistory),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(newsSources, {
    fields: [articles.sourceId],
    references: [newsSources.id],
  }),
  userArticles: many(userArticles),
  notes: many(userNotes),
  readingHistory: many(readingHistory),
}));

export const newsSourcesRelations = relations(newsSources, ({ many }) => ({
  articles: many(articles),
}));

export const userArticlesRelations = relations(userArticles, ({ one }) => ({
  user: one(users, {
    fields: [userArticles.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [userArticles.articleId],
    references: [articles.id],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [userNotes.articleId],
    references: [articles.id],
  }),
}));

export const readingHistoryRelations = relations(readingHistory, ({ one }) => ({
  user: one(users, {
    fields: [readingHistory.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [readingHistory.articleId],
    references: [articles.id],
  }),
}));

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Insert schemas using drizzle-zod
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsSourceSchema = createInsertSchema(newsSources).omit({
  id: true,
  createdAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertUserArticleSchema = createInsertSchema(userArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNoteSchema = createInsertSchema(userNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReadingHistorySchema = createInsertSchema(readingHistory).omit({
  id: true,
});

// Inferred types
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertNewsSource = z.infer<typeof insertNewsSourceSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertUserArticle = z.infer<typeof insertUserArticleSchema>;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewsSource = typeof newsSources.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type UserArticle = typeof userArticles.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type ReadingHistory = typeof readingHistory.$inferSelect;