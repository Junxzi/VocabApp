export interface VocabularyWord {
  id: number;
  word: string;
  pronunciation?: string;
  pronunciationUs?: string;
  pronunciationUk?: string;
  pronunciationAu?: string;
  definition: string;
  partOfSpeech?: string;
  exampleSentences?: string;
  tags?: string[];
  difficulty?: number;
  category?: string;
  easeFactor?: number;
  interval?: number;
  nextReview?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

export interface StudySession {
  known: number;
  needReview: number;
  total: number;
}

export interface DailyChallenge {
  id: number;
  date: string;
  totalWords: number;
  correctWords: number;
  accuracy: number;
  completed: boolean;
}

export type AccentType = 'us' | 'uk' | 'au';
export type StudyMode = 'random' | 'tag' | 'daily';
export type SortOption = 'alphabetical' | 'date' | 'difficulty';

export interface Settings {
  language: 'en' | 'ja';
  autoplay: boolean;
  darkMode: boolean;
  pronunciationAccent: AccentType;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}