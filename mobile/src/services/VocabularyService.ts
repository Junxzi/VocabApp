// mobile/src/services/VocabularyService.ts

import { VocabularyWord, Category } from '../types';
import { InsertVocabularyWord } from '../../../shared/schema';

const API_BASE = 'http://localhost:5002/api';

class VocabularyService {
  private async makeRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      ...init,
    });

    let body: any
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      // サーバーが { message, error } を返しているならそれを優先
      const serverMsg = body?.error ?? body?.message;
      throw new Error(
        typeof serverMsg === 'string'
          ? serverMsg
          : `API request failed: ${res.status} ${res.statusText}`
      );
    }

    return body as T;
  }

  /** 全単語取得 */
  async getAll(): Promise<VocabularyWord[]> {
    return this.makeRequest<VocabularyWord[]>('/vocabulary');
  }

  /** IDで単語取得 */
  async getById(id: number): Promise<VocabularyWord> {
    return this.makeRequest<VocabularyWord>(`/vocabulary/${id}`);
  }

  /** 単語作成 */
  async create(payload: InsertVocabularyWord): Promise<VocabularyWord> {
    return this.makeRequest<VocabularyWord>('/vocabulary', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** 単語更新 */
  async update(id: number, updates: Partial<VocabularyWord>): Promise<VocabularyWord> {
    return this.makeRequest<VocabularyWord>(`/vocabulary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /** 単語削除 */
  async delete(id: number): Promise<void> {
    await this.makeRequest<void>(`/vocabulary/${id}`, { method: 'DELETE' });
  }

  /** 検索（空文字なら即時に空配列返し） */
  async search(query: string): Promise<VocabularyWord[]> {
    const q = query.trim();
    if (!q) return [];
    return this.makeRequest<VocabularyWord[]>(
      `/vocabulary/search?q=${encodeURIComponent(q)}`
    );
  }

  /** ランダム学習用 */
  async getRandom(limit = 30): Promise<VocabularyWord[]> {
    return this.makeRequest<VocabularyWord[]>(`/vocabulary/random/${limit}`);
  }

  /** タグ別学習用 */
  async getByTag(tag: string): Promise<VocabularyWord[]> {
    return this.makeRequest<VocabularyWord[]>(
      `/vocabulary/tag/${encodeURIComponent(tag)}`
    );
  }

  /** デイリーチャレンジ用単語取得 */
  async getDailyChallenge(): Promise<VocabularyWord[]> {
    return this.makeRequest<VocabularyWord[]>('/vocabulary/daily-challenge');
  }

  /** デイリーチャレンジステータス取得 */
  async getDailyChallengeStatus(): Promise<{ completed: boolean; date: string }> {
    return this.makeRequest<{ completed: boolean; date: string }>(
      '/vocabulary/daily-challenge/status'
    );
  }

  /** デイリーチャレンジ完了通知 */
  async completeDailyChallenge(stats: {
    totalWords: number;
    correctWords: number;
    accuracy: number;
  }): Promise<void> {
    await this.makeRequest<void>(
      '/vocabulary/daily-challenge/complete',
      { method: 'POST', body: JSON.stringify(stats) }
    );
  }

  /** 間隔反復データ更新 */
  async updateProgress(id: number, known: boolean): Promise<VocabularyWord> {
    return this.makeRequest<VocabularyWord>(
      `/vocabulary/${id}/spaced-repetition`,
      { method: 'PUT', body: JSON.stringify({ known }) }
    );
  }

  /** AI強化 */
  async enrich(id: number): Promise<VocabularyWord> {
    return this.makeRequest<VocabularyWord>(
      `/vocabulary/${id}/enrich`,
      { method: 'POST' }
    );
  }

  /** カテゴリ一覧取得 */
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categories');
  }

  /** タグ一覧取得 */
  async getTags(): Promise<string[]> {
    const list = await this.getAll();
    const tags = new Set<string>();
    list.forEach(w => w.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }
}

export const vocabularyService = new VocabularyService();