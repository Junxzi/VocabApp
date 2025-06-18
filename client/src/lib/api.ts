
import { apiRequest } from "./queryClient";
import type { VocabularyWord, InsertVocabularyWord, Category } from "@shared/schema";

export const vocabularyApi = {
  getAll: async (): Promise<VocabularyWord[]> => {
    const response = await apiRequest("GET", "/api/vocabulary");
    return response.json();
  },

  getById: async (id: number): Promise<VocabularyWord> => {
    const response = await apiRequest("GET", `/api/vocabulary/${id}`);
    return response.json();
  },

  create: async (word: InsertVocabularyWord): Promise<VocabularyWord> => {
    const response = await apiRequest("POST", "/api/vocabulary", word);
    return response.json();
  },

  update: async (id: number, word: InsertVocabularyWord): Promise<VocabularyWord> => {
    const response = await apiRequest("PUT", `/api/vocabulary/${id}`, word);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/vocabulary/${id}`);
  },

  getForStudy: async (limit: number = 10): Promise<VocabularyWord[]> => {
    const response = await apiRequest("GET", `/api/vocabulary/study/${limit}`);
    return response.json();
  },

  getForReview: async (limit: number = 10): Promise<VocabularyWord[]> => {
    const response = await apiRequest("GET", `/api/vocabulary/review/${limit}`);
    return response.json();
  },

  updateStudyStats: async (id: number, difficulty: number): Promise<VocabularyWord> => {
    const response = await apiRequest("PUT", `/api/vocabulary/${id}/study`, { difficulty });
    return response.json();
  },

  updateSpacedRepetition: async (id: number, known: boolean): Promise<VocabularyWord> => {
    const response = await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, { known });
    return response.json();
  },

  enrich: async (id: number): Promise<VocabularyWord> => {
    const response = await apiRequest("POST", `/api/vocabulary/${id}/enrich`);
    return response.json();
  }
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiRequest("GET", "/api/categories");
    return response.json();
  },

  create: async (category: any): Promise<Category> => {
    const response = await apiRequest("POST", "/api/categories", category);
    return response.json();
  }
};

export const adminApi = {
  setupCategories: async (): Promise<void> => {
    await apiRequest("POST", "/api/admin/setup-categories");
  },

  cleanupDuplicates: async (): Promise<void> => {
    await apiRequest("POST", "/api/admin/cleanup-duplicates");
  }
};
