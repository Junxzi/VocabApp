import { users, vocabularyWords, type User, type InsertUser, type VocabularyWord, type InsertVocabularyWord, type UpdateVocabularyWord } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vocabulary operations
  getAllVocabularyWords(): Promise<VocabularyWord[]>;
  getVocabularyWord(id: number): Promise<VocabularyWord | undefined>;
  createVocabularyWord(word: InsertVocabularyWord): Promise<VocabularyWord>;
  updateVocabularyWord(id: number, word: UpdateVocabularyWord): Promise<VocabularyWord | undefined>;
  deleteVocabularyWord(id: number): Promise<boolean>;
  searchVocabularyWords(query: string): Promise<VocabularyWord[]>;
  getVocabularyWordsByCategory(category: string): Promise<VocabularyWord[]>;
  updateWordStudyStats(id: number, difficulty: number): Promise<VocabularyWord | undefined>;
  getRandomWordsForStudy(limit: number): Promise<VocabularyWord[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllVocabularyWords(): Promise<VocabularyWord[]> {
    return await db
      .select()
      .from(vocabularyWords)
      .orderBy(desc(vocabularyWords.createdAt));
  }

  async getVocabularyWord(id: number): Promise<VocabularyWord | undefined> {
    const [word] = await db
      .select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.id, id));
    return word || undefined;
  }

  async createVocabularyWord(insertWord: InsertVocabularyWord): Promise<VocabularyWord> {
    const [word] = await db
      .insert(vocabularyWords)
      .values(insertWord)
      .returning();
    return word;
  }

  async updateVocabularyWord(id: number, updateWord: UpdateVocabularyWord): Promise<VocabularyWord | undefined> {
    const [word] = await db
      .update(vocabularyWords)
      .set(updateWord)
      .where(eq(vocabularyWords.id, id))
      .returning();
    return word || undefined;
  }

  async deleteVocabularyWord(id: number): Promise<boolean> {
    const result = await db
      .delete(vocabularyWords)
      .where(eq(vocabularyWords.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchVocabularyWords(query: string): Promise<VocabularyWord[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(vocabularyWords)
      .where(
        or(
          like(vocabularyWords.word, searchPattern),
          like(vocabularyWords.definition, searchPattern),
          like(vocabularyWords.category, searchPattern)
        )
      )
      .orderBy(desc(vocabularyWords.createdAt));
  }

  async getVocabularyWordsByCategory(category: string): Promise<VocabularyWord[]> {
    return await db
      .select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.category, category))
      .orderBy(desc(vocabularyWords.createdAt));
  }

  async updateWordStudyStats(id: number, difficulty: number): Promise<VocabularyWord | undefined> {
    const [existingWord] = await db
      .select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.id, id));
    
    if (!existingWord) return undefined;

    const [updatedWord] = await db
      .update(vocabularyWords)
      .set({
        difficulty,
        studyCount: (existingWord.studyCount || 0) + 1,
        correctAnswers: difficulty === 1 ? (existingWord.correctAnswers || 0) + 1 : (existingWord.correctAnswers || 0),
        lastStudied: new Date(),
      })
      .where(eq(vocabularyWords.id, id))
      .returning();
    
    return updatedWord || undefined;
  }

  async getRandomWordsForStudy(limit: number): Promise<VocabularyWord[]> {
    // Note: For true randomization in production, you might want to use a more sophisticated approach
    // This uses a simple ORDER BY random() which works for PostgreSQL
    return await db
      .select()
      .from(vocabularyWords)
      .orderBy(desc(vocabularyWords.createdAt)) // Changed from random() for compatibility
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
