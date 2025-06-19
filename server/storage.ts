import { users, vocabularyWords, categories, dailyChallenges, type User, type InsertUser, type VocabularyWord, type InsertVocabularyWord, type UpdateVocabularyWord, type Category, type InsertCategory, type DailyChallenge, type InsertDailyChallenge } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Vocabulary operations
  getAllVocabularyWords(): Promise<VocabularyWord[]>;
  getVocabularyWord(id: number): Promise<VocabularyWord | undefined>;
  getVocabularyWordByWord(word: string): Promise<VocabularyWord | undefined>;
  createVocabularyWord(word: InsertVocabularyWord): Promise<VocabularyWord>;
  updateVocabularyWord(id: number, word: UpdateVocabularyWord): Promise<VocabularyWord | undefined>;
  deleteVocabularyWord(id: number): Promise<boolean>;
  searchVocabularyWords(query: string): Promise<VocabularyWord[]>;
  getVocabularyWordsByCategory(category: string): Promise<VocabularyWord[]>;
  getVocabularyWordsByTag(tag: string): Promise<VocabularyWord[]>;
  updateWordStudyStats(id: number, difficulty: number): Promise<VocabularyWord | undefined>;
  updateWordSpacedRepetition(id: number, known: boolean): Promise<VocabularyWord | undefined>;
  getWordsForReview(limit: number): Promise<VocabularyWord[]>;
  getRandomWordsForStudy(limit: number): Promise<VocabularyWord[]>;
  
  // Daily challenge operations
  getDailyChallengeWords(): Promise<VocabularyWord[]>;
  getDailyChallengeStatus(): Promise<{ completed: boolean; date: string; stats?: DailyChallenge }>;
  completeDailyChallenge(stats: { totalWords: number; correctWords: number; accuracy: number }): Promise<void>;
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

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.displayName);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...updateCategory, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
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

  async getVocabularyWordByWord(word: string): Promise<VocabularyWord | undefined> {
    const [existingWord] = await db
      .select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.word, word.toLowerCase()));
    return existingWord || undefined;
  }

  async createVocabularyWord(insertWord: InsertVocabularyWord): Promise<VocabularyWord> {
    // Check if word already exists (case-insensitive)
    const existingWord = await this.getVocabularyWordByWord(insertWord.word);
    if (existingWord) {
      throw new Error(`Word "${insertWord.word}" already exists in your vocabulary`);
    }
    
    const wordData = {
      ...insertWord,
      word: insertWord.word.toLowerCase(), // Store in lowercase for consistency
      pronunciation: insertWord.pronunciation || ""
    };
    const [word] = await db
      .insert(vocabularyWords)
      .values(wordData)
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
          like(vocabularyWords.definition, searchPattern)
        )
      )
      .orderBy(desc(vocabularyWords.createdAt));
  }

  async getVocabularyWordsByCategory(category: string): Promise<VocabularyWord[]> {
    // Filter by tags instead of category
    const allWords = await db
      .select()
      .from(vocabularyWords)
      .orderBy(desc(vocabularyWords.createdAt));
    
    return allWords.filter(word => word.tags && word.tags.includes(category));
  }

  async getVocabularyWordsByTag(tag: string): Promise<VocabularyWord[]> {
    // Create a mapping from English to Japanese tags
    const tagMapping: { [key: string]: string } = {
      'Academic': '学術',
      'Business': '経済',
      'Daily Life': '日常',
      'Technical': '技術',
      'TOEFL': 'TOEFL',
      'time': 'time',
      'planning': 'planning'
    };
    
    // Get the Japanese tag name or use the tag as-is if no mapping exists
    const searchTag = tagMapping[tag] || tag;
    
    const allWords = await db
      .select()
      .from(vocabularyWords)
      .orderBy(desc(vocabularyWords.createdAt));
    
    return allWords.filter(word => {
      if (!word.tags || word.tags.length === 0) return false;
      // Check both the original tag and the mapped tag
      return word.tags.includes(tag) || word.tags.includes(searchTag);
    });
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
    // Get all words first
    const allWords = await db
      .select()
      .from(vocabularyWords);
    
    // Shuffle the array to get random order
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    
    // Return unique words up to the limit (no duplicates possible)
    return shuffled.slice(0, Math.min(limit, shuffled.length));
  }

  async updateWordSpacedRepetition(id: number, known: boolean): Promise<VocabularyWord | undefined> {
    const { calculateNextReview, swipeToQuality } = await import("./spaced-repetition");
    
    const [currentWord] = await db.select().from(vocabularyWords).where(eq(vocabularyWords.id, id));
    if (!currentWord) return undefined;

    const quality = swipeToQuality(known);
    const easeFactor = parseFloat(currentWord.easeFactor?.toString() || "2.5");
    const interval = currentWord.interval || 1;
    const studyCount = currentWord.studyCount || 0;

    const result = calculateNextReview(quality, easeFactor, interval, studyCount);

    const [updatedWord] = await db
      .update(vocabularyWords)
      .set({
        easeFactor: result.easeFactor.toString(),
        interval: result.interval,
        nextReview: result.nextReview,
        studyCount: studyCount + 1,
        correctAnswers: known ? (currentWord.correctAnswers || 0) + 1 : currentWord.correctAnswers,
        lastStudied: new Date(),
        difficulty: known ? 1 : 3
      })
      .where(eq(vocabularyWords.id, id))
      .returning();

    return updatedWord;
  }

  async getDailyChallengeWords(): Promise<VocabularyWord[]> {
    const DAILY_CHALLENGE_COUNT = 30; // Fixed number of words per day
    
    try {
      console.log("Fetching all vocabulary words for daily challenge...");
      
      // Get all words from database
      const allWords = await db
        .select()
        .from(vocabularyWords);
      
      console.log(`Found ${allWords.length} total words in database`);
      
      if (allWords.length === 0) {
        console.log("No words available for daily challenge");
        return [];
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`Generating daily challenge for date: ${today}`);
      
      // Use a consistent seed based on today's date for deterministic word selection
      const seed = new Date(today).getTime();
      const deterministicRandom = (index: number) => {
        const x = Math.sin(seed + index) * 10000;
        return x - Math.floor(x);
      };
      
      // Simple selection: shuffle words deterministically based on date
      const shuffledWords = allWords
        .map((word, index) => ({ word, sort: deterministicRandom(index) }))
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.word);
      
      // Take first 30 words (or all available if fewer)
      const selectedWords = shuffledWords.slice(0, Math.min(DAILY_CHALLENGE_COUNT, allWords.length));
      
      console.log(`Selected ${selectedWords.length} words for daily challenge`);
      return selectedWords;
      
    } catch (error) {
      console.error("Error getting daily challenge words:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      throw new Error(`Failed to fetch daily challenge words: ${error.message}`);
    }
  }

  async getDailyChallengeStatus(): Promise<{ completed: boolean; date: string; stats?: DailyChallenge }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [todaysChallenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, today));
    
    return {
      completed: !!todaysChallenge?.completedAt,
      date: today,
      stats: todaysChallenge
    };
  }

  async completeDailyChallenge(stats: { totalWords: number; correctWords: number; accuracy: number }): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert or update today's challenge record
    await db
      .insert(dailyChallenges)
      .values({
        date: today,
        completedAt: new Date(),
        totalWords: stats.totalWords,
        correctWords: stats.correctWords,
        accuracy: stats.accuracy.toString()
      })
      .onConflictDoUpdate({
        target: dailyChallenges.date,
        set: {
          completedAt: new Date(),
          totalWords: stats.totalWords,
          correctWords: stats.correctWords,
          accuracy: stats.accuracy.toString()
        }
      });
  }

  async getWordsForReview(limit: number): Promise<VocabularyWord[]> {
    const { isDueForReview } = await import("./spaced-repetition");
    
    const allWords = await db.select().from(vocabularyWords);
    
    // Filter words that are due for review
    const dueWords = allWords.filter(word => 
      isDueForReview(word.nextReview)
    );

    // Sort by priority: new words first, then by next review date
    const sortedWords = dueWords.sort((a, b) => {
      // New words (never studied) get highest priority
      if (!a.nextReview && b.nextReview) return -1;
      if (a.nextReview && !b.nextReview) return 1;
      if (!a.nextReview && !b.nextReview) return 0;
      
      // For reviewed words, sort by next review date (earliest first)
      return new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime();
    });

    return sortedWords.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
