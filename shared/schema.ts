import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  categories: text("categories").array(),
  sources: text("sources").array(),
  dailyReadingGoal: integer("daily_reading_goal").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsSources = pgTable("news_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  rssUrl: varchar("rss_url", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  aiSummary: text("ai_summary"),
  aiEnhancement: text("ai_enhancement"),
  aiKeyPoints: text("ai_key_points").array(),
  aiSentiment: varchar("ai_sentiment", { length: 20 }),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  imageUrl: varchar("image_url", { length: 1000 }),
  sourceId: integer("source_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  publishedAt: timestamp("published_at").notNull(),
  readingTime: integer("reading_time"),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userArticles = pgTable("user_articles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  isRead: boolean("is_read").default(false),
  isBookmarked: boolean("is_bookmarked").default(false),
  readAt: timestamp("read_at"),
  readingTime: integer("reading_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const readingHistory = pgTable("reading_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  date: timestamp("date").defaultNow(),
  readingTime: integer("reading_time"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  userArticles: many(userArticles),
  userNotes: many(userNotes),
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
  userNotes: many(userNotes),
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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Insert schemas
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

// Insert types
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertNewsSource = z.infer<typeof insertNewsSourceSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertUserArticle = z.infer<typeof insertUserArticleSchema>;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;

// Select types
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewsSource = typeof newsSources.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type UserArticle = typeof userArticles.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type ReadingHistory = typeof readingHistory.$inferSelect;