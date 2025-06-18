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

// Map English part of speech to Japanese
const partOfSpeechMap: Record<string, string> = {
  "noun": "名詞",
  "verb": "動詞", 
  "adjective": "形容詞",
  "adverb": "副詞",
  "preposition": "前置詞",
  "conjunction": "接続詞",
  "pronoun": "代名詞",
  "interjection": "感嘆詞",
  "article": "冠詞",
  "determiner": "限定詞",
  "modal": "助動詞",
  "auxiliary": "助動詞",
  "particle": "助詞",
  "名詞": "名詞",
  "動詞": "動詞",
  "形容詞": "形容詞", 
  "副詞": "副詞",
  "前置詞": "前置詞",
  "接続詞": "接続詞",
  "代名詞": "代名詞",
  "感嘆詞": "感嘆詞",
  "冠詞": "冠詞",
  "限定詞": "限定詞",
  "助動詞": "助動詞",
  "助詞": "助詞"
};

export function getLocalizedPartOfSpeech(partOfSpeech: string | null, language: SupportedLanguage): string {
  if (!partOfSpeech) return "";
  
  const normalized = partOfSpeech.toLowerCase().trim();
  
  if (language === "ja") {
    // If already in Japanese, return as is
    if (partOfSpeechMap[partOfSpeech]) {
      return partOfSpeechMap[partOfSpeech];
    }
    // Try to map from English to Japanese
    return partOfSpeechMap[normalized] || partOfSpeech;
  } else {
    // For English, convert Japanese to English or return English as is
    const reverseMap: Record<string, string> = {
      "名詞": "noun",
      "動詞": "verb",
      "形容詞": "adjective",
      "副詞": "adverb",
      "前置詞": "preposition",
      "接続詞": "conjunction", 
      "代名詞": "pronoun",
      "感嘆詞": "interjection",
      "冠詞": "article",
      "限定詞": "determiner",
      "助動詞": "modal",
      "助詞": "particle"
    };
    
    return reverseMap[partOfSpeech] || partOfSpeech;
  }
}
