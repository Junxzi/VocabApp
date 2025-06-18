import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const weeks = Math.floor(diffInHours / 168);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export const CATEGORIES = ["Academic", "Business", "Daily Life", "Technical", "TOEFL"] as const;
export type Category = typeof CATEGORIES[number];

// Language detection and support
export const SUPPORTED_LANGUAGES = ["en", "ja"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function detectLanguage(text: string): SupportedLanguage {
  // Simple Japanese detection (hiragana, katakana, kanji)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text) ? "ja" : "en";
}

export function getLanguageLabel(lang: SupportedLanguage): string {
  switch (lang) {
    case "ja": return "日本語";
    case "en": return "English";
    default: return "English";
  }
}
