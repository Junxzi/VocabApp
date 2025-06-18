import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(), // User-friendly display name
  description: text("description"),
  color: text("color"), // Hex color code for UI styling
  icon: text("icon"), // Icon name for UI
  isDefault: integer("is_default").default(0), // 1 if default category, 0 if custom
  sortOrder: integer("sort_order").default(0), // For ordering in UI
  notionId: text("notion_id").unique(), // Link to Notion database record
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vocabularyWords = pgTable("vocabulary_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  pronunciation: text("pronunciation").default(""),
  pronunciationUs: text("pronunciation_us"), // IPA for American English
  pronunciationUk: text("pronunciation_uk"), // IPA for British English
  pronunciationAu: text("pronunciation_au"), // IPA for Australian English
  partOfSpeech: text("part_of_speech"), // noun, verb, adjective, etc.
  definition: text("definition").notNull(),
  exampleSentences: text("example_sentences"), // JSON array of example sentences
  categoryId: integer("category_id").references(() => categories.id),
  category: text("category").notNull(), // Keep for backward compatibility
  categories: text("categories").array(), // Multiple categories support
  language: text("language").notNull().default("en"), // 'en' for English, 'ja' for Japanese
  difficulty: integer("difficulty"), // Rank 1-4 (4 = hardest), null = unset
  studyCount: integer("study_count").default(0),
  correctAnswers: integer("correct_answers").default(0),
  easeFactor: numeric("ease_factor", { precision: 3, scale: 2 }).default("2.5"), // SuperMemo algorithm ease factor
  interval: integer("interval").default(1), // Days until next review
  nextReview: timestamp("next_review"), // When to show this word next
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastStudied: timestamp("last_studied"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  displayName: true,
  description: true,
  color: true,
  icon: true,
  isDefault: true,
  sortOrder: true,
  notionId: true,
}).partial({
  description: true,
  color: true,
  icon: true,
  isDefault: true,
  sortOrder: true,
  notionId: true,
});

export const insertVocabularyWordSchema = createInsertSchema(vocabularyWords).pick({
  word: true,
  pronunciation: true,
  pronunciationUs: true,
  pronunciationUk: true,
  pronunciationAu: true,
  partOfSpeech: true,
  definition: true,
  exampleSentences: true,
  categoryId: true,
  category: true,
  categories: true,
  language: true,
  difficulty: true,
}).partial({
  pronunciation: true,
  pronunciationUs: true,
  pronunciationUk: true,
  pronunciationAu: true,
  partOfSpeech: true,
  exampleSentences: true,
  categoryId: true,
  difficulty: true,
});

export const updateVocabularyWordSchema = createInsertSchema(vocabularyWords).pick({
  word: true,
  pronunciation: true,
  pronunciationUs: true,
  pronunciationUk: true,
  pronunciationAu: true,
  partOfSpeech: true,
  definition: true,
  exampleSentences: true,
  categoryId: true,
  category: true,
  language: true,
  difficulty: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = z.infer<typeof insertVocabularyWordSchema>;
export type UpdateVocabularyWord = z.infer<typeof updateVocabularyWordSchema>;
