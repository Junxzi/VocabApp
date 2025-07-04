import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.vocabulary': 'Words',
    'nav.study': 'Study',
    'nav.progress': 'Progress',
    'nav.settings': 'Settings',
    'study.random': 'Random Study',
    'study.tag': 'Tag Study',
    'study.daily': 'Daily Challenge',
    'settings.language': 'Language',
    'settings.autoplay': 'Auto-play pronunciation',
    'settings.accent': 'Pronunciation Accent',
    'settings.darkMode': 'Dark Mode',
    'word.difficulty': 'Difficulty',
    'word.pronunciation': 'Pronunciation',
    'word.examples': 'Example Sentences',
    'button.add': 'Add',
    'button.edit': 'Edit',
    'button.delete': 'Delete',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'progress.totalWords': 'Total words',
    'progress.reviewed': 'Learned',
    'progress.averageDifficulty': 'Average Difficulty',
    'progress.distribution.easy': 'Easy (Rank 1)',
    'progress.distribution.medium': 'Medium (Rank 2)',
    'progress.distribution.hard': 'Hard (Rank 3-4)',
    'progress.sectionDistribution': 'Difficulty Distribution',
  },
  ja: {
    'nav.vocabulary': '単語',
    'nav.study': '学習',
    'nav.progress': '進捗',
    'nav.settings': '設定',
    'study.random': 'ランダム学習',
    'study.tag': 'タグ別学習',
    'study.daily': '今日のチャレンジ',
    'settings.language': '言語',
    'settings.autoplay': '自動発音再生',
    'settings.accent': '発音アクセント',
    'settings.darkMode': 'ダークモード',
    'word.difficulty': '難易度',
    'word.pronunciation': '発音',
    'word.examples': '例文',
    'button.add': '追加',
    'button.edit': '編集',
    'button.delete': '削除',
    'button.save': '保存',
    'button.cancel': 'キャンセル',
    'progress.totalWords': '総単語数',
    'progress.reviewed': '学習済み',
    'progress.averageDifficulty': '平均難易度',
    'progress.distribution.easy': '簡単 (ランク 1)',
    'progress.distribution.medium': '普通 (ランク 2)',
    'progress.distribution.hard': '難しい (ランク 3-4)',
    'progress.sectionDistribution': '難易度別分布',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<Language>('ja');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage === 'en' || savedLanguage === 'ja') {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('[LanguageContext] Failed to load language:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('[LanguageContext] Failed to save language:', error);
    }
  }, []);

  const t = useCallback(
    (key: string): string => translations[language][key] || key,
    [language]
  );

  const contextValue = useMemo(
    () => ({language, setLanguage, t, loading}),
    [language, setLanguage, t, loading]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}