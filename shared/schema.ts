import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const vocabularyWords = pgTable("vocabulary_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  pronunciation: text("pronunciation").notNull(),
  definition: text("definition").notNull(),
  category: text("category").notNull(),
  difficulty: integer("difficulty").default(0), // 0 = not studied, 1 = easy, 2 = medium, 3 = hard
  studyCount: integer("study_count").default(0),
  correctAnswers: integer("correct_answers").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastStudied: timestamp("last_studied"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVocabularyWordSchema = createInsertSchema(vocabularyWords).pick({
  word: true,
  pronunciation: true,
  definition: true,
  category: true,
});

export const updateVocabularyWordSchema = createInsertSchema(vocabularyWords).pick({
  word: true,
  pronunciation: true,
  definition: true,
  category: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = z.infer<typeof insertVocabularyWordSchema>;
export type UpdateVocabularyWord = z.infer<typeof updateVocabularyWordSchema>;
