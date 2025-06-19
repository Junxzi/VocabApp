import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
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
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<Language>('ja');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ja')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
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