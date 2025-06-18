
export const DEFAULT_SETTINGS = {
  autoplay: false,
  darkMode: false,
  studyMode: 'swipe' as const,
  pronunciationAccent: 'us' as const,
  notificationsEnabled: false,
  notificationTime: '09:00',
  language: 'en' as const,
} as const;

export type StudyMode = 'swipe' | 'list' | 'flashcard';
export type PronunciationAccent = 'us' | 'uk' | 'au';
export type Language = 'en' | 'ja';

export interface AppSettings {
  autoplay: boolean;
  darkMode: boolean;
  studyMode: StudyMode;
  pronunciationAccent: PronunciationAccent;
  notificationsEnabled: boolean;
  notificationTime: string;
  language: Language;
}

// Utility functions for settings
export const getStoredSetting = <K extends keyof AppSettings>(
  key: K,
  defaultValue: AppSettings[K]
): AppSettings[K] => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  if (typeof defaultValue === 'boolean') {
    return (stored === 'true') as AppSettings[K];
  }
  
  return stored as AppSettings[K];
};

export const setStoredSetting = <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void => {
  localStorage.setItem(key, String(value));
};
