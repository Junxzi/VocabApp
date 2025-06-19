import {VocabularyWord, Category} from '../types';

// Base API URL - in production this would come from environment config
const API_BASE_URL = 'http://localhost:5000/api';

class VocabularyService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  async getAllWords(): Promise<VocabularyWord[]> {
    return this.makeRequest('/vocabulary');
  }

  async getWordById(id: number): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}`);
  }

  async createWord(word: Partial<VocabularyWord>): Promise<VocabularyWord> {
    return this.makeRequest('/vocabulary', {
      method: 'POST',
      body: JSON.stringify(word),
    });
  }

  async updateWord(id: number, word: Partial<VocabularyWord>): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(word),
    });
  }

  async deleteWord(id: number): Promise<void> {
    return this.makeRequest(`/vocabulary/${id}`, {
      method: 'DELETE',
    });
  }

  async searchWords(query: string): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/search?q=${encodeURIComponent(query)}`);
  }

  async getRandomWords(limit: number = 30): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/random/${limit}`);
  }

  async getWordsByCategory(category: string): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/category/${encodeURIComponent(category)}`);
  }

  async getWordsByTag(tag: string): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/tag/${encodeURIComponent(tag)}`);
  }

  async getDailyChallengeWords(): Promise<VocabularyWord[]> {
    return this.makeRequest('/vocabulary/daily-challenge');
  }

  async getDailyChallengeStatus(): Promise<{completed: boolean; date: string}> {
    return this.makeRequest('/vocabulary/daily-challenge/status');
  }

  async completeDailyChallenge(stats: {totalWords: number; correctWords: number; accuracy: number}): Promise<void> {
    return this.makeRequest('/vocabulary/daily-challenge/complete', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
  }

  async updateWordProgress(id: number, known: boolean): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}/spaced-repetition`, {
      method: 'PUT',
      body: JSON.stringify({known}),
    });
  }

  async enrichWord(id: number): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}/enrich`, {
      method: 'POST',
    });
  }

  async getAllCategories(): Promise<Category[]> {
    return this.makeRequest('/categories');
  }

  async getAvailableTags(): Promise<string[]> {
    const words = await this.getAllWords();
    const tags = new Set<string>();
    
    words.forEach(word => {
      if (word.tags) {
        word.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags).sort();
  }
}

export const vocabularyService = new VocabularyService();