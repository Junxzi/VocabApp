import { users, vocabularyWords, type User, type InsertUser, type VocabularyWord, type InsertVocabularyWord, type UpdateVocabularyWord } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vocabularyWords: Map<number, VocabularyWord>;
  private currentUserId: number;
  private currentVocabularyId: number;

  constructor() {
    this.users = new Map();
    this.vocabularyWords = new Map();
    this.currentUserId = 1;
    this.currentVocabularyId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllVocabularyWords(): Promise<VocabularyWord[]> {
    return Array.from(this.vocabularyWords.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getVocabularyWord(id: number): Promise<VocabularyWord | undefined> {
    return this.vocabularyWords.get(id);
  }

  async createVocabularyWord(insertWord: InsertVocabularyWord): Promise<VocabularyWord> {
    const id = this.currentVocabularyId++;
    const word: VocabularyWord = {
      ...insertWord,
      id,
      difficulty: 0,
      studyCount: 0,
      correctAnswers: 0,
      createdAt: new Date(),
      lastStudied: null,
    };
    this.vocabularyWords.set(id, word);
    return word;
  }

  async updateVocabularyWord(id: number, updateWord: UpdateVocabularyWord): Promise<VocabularyWord | undefined> {
    const existingWord = this.vocabularyWords.get(id);
    if (!existingWord) return undefined;

    const updatedWord: VocabularyWord = {
      ...existingWord,
      ...updateWord,
    };
    this.vocabularyWords.set(id, updatedWord);
    return updatedWord;
  }

  async deleteVocabularyWord(id: number): Promise<boolean> {
    return this.vocabularyWords.delete(id);
  }

  async searchVocabularyWords(query: string): Promise<VocabularyWord[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.vocabularyWords.values()).filter(word =>
      word.word.toLowerCase().includes(lowerQuery) ||
      word.definition.toLowerCase().includes(lowerQuery) ||
      word.category.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getVocabularyWordsByCategory(category: string): Promise<VocabularyWord[]> {
    return Array.from(this.vocabularyWords.values()).filter(word =>
      word.category === category
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateWordStudyStats(id: number, difficulty: number): Promise<VocabularyWord | undefined> {
    const word = this.vocabularyWords.get(id);
    if (!word) return undefined;

    const updatedWord: VocabularyWord = {
      ...word,
      difficulty,
      studyCount: (word.studyCount || 0) + 1,
      correctAnswers: difficulty === 1 ? (word.correctAnswers || 0) + 1 : (word.correctAnswers || 0),
      lastStudied: new Date(),
    };
    this.vocabularyWords.set(id, updatedWord);
    return updatedWord;
  }

  async getRandomWordsForStudy(limit: number): Promise<VocabularyWord[]> {
    const allWords = Array.from(this.vocabularyWords.values());
    const shuffled = allWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}

export const storage = new MemStorage();
