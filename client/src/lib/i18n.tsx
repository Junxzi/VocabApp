import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'ja';

const translations = {
  en: {
    // Navigation
    'nav.vocabulary': 'Vocabulary',
    'nav.study': 'Study Mode',
    'nav.progress': 'Progress',
    'nav.add': 'Add',
    'nav.import': 'Import',
    'nav.settings': 'Settings',
    'nav.title': 'VocabMaster',
    
    // Vocabulary Page
    'vocab.title': 'Your Vocabulary',
    'vocab.count': 'word',
    'vocab.count_plural': 'words',
    'vocab.empty': 'No vocabulary words yet. Start by adding your first word!',
    'vocab.no_results': 'No words match your search criteria.',
    'vocab.add_first': 'Add Your First Word',
    'vocab.search_placeholder': 'Search words...',
    'vocab.all_categories': 'All Categories',
    'vocab.added': 'Added',
    
    // Add Word Modal
    'add.title': 'Add New Word',
    'add.edit_title': 'Edit Word',
    'add.word': 'Word',
    'add.pronunciation': 'Pronunciation',
    'add.definition': 'Definition',
    'add.category': 'Category',
    'add.language': 'Language',
    'add.save': 'Save Word',
    'add.cancel': 'Cancel',
    'add.phonetic_keyboard': 'Phonetic Keyboard',
    
    // Study Mode
    'study.title': 'Study Mode',
    'study.swipe_title': 'Swipe Study',
    'study.description': 'Test your vocabulary knowledge with flashcards',
    'study.ready_title': 'Ready to Study?',
    'study.ready_description': "We'll show you random words from your vocabulary. Try to recall their meanings!",
    'study.start_session': 'Start Study Session',
    'study.question': 'Question',
    'study.of': 'of',
    'study.recall': 'What does this word mean?',
    'study.show_answer': 'Show Answer',
    'study.easy': 'Easy - I knew it well',
    'study.medium': 'Medium - Took some thought', 
    'study.hard': 'Hard - I struggled',
    'study.complete_title': 'Study Session Complete!',
    'study.complete_description': "Great job! You've completed your study session.",
    'study.words_studied': 'Words studied',
    'study.session_completed': 'Session completed',
    'study.new_session': 'Start New Session',
    'study.empty': 'Add some vocabulary words to start studying!',
    
    // Progress Page
    'progress.title': 'Your Progress',
    'progress.description': 'Track your vocabulary learning journey',
    'progress.total_words': 'Total Words',
    'progress.study_sessions': 'Study Sessions',
    'progress.accuracy': 'Overall Accuracy',
    'progress.recent_activity': 'Recent Activity',
    'progress.no_activity': 'No study activity yet. Start learning to see your progress!',
    
    // Import
    'import.title': 'Import APKG File',
    'import.description': 'Import vocabulary from Anki deck files (.apkg)',
    
    // Sort Options
    'sort.alphabetical': 'Alphabetical',
    'sort.date': 'Date Added',
    'sort.category': 'Category',
    'sort.difficulty': 'Difficulty',
    
    // Pagination
    'pagination.items': 'items',
    'pagination.per_page': 'Items per page',
    
    // Study Mode - Swipe Study
    'swipeStudy': 'Swipe Study',
    'loadingStudySession': 'Loading study session...',
    'allCaughtUp': 'All Caught Up!',
    'noWordsForReview': 'No words are due for review right now. Come back later or add new words to study.',
    'addNewWords': 'Add New Words',
    'sessionComplete': 'Session Complete!',
    'sessionCompleteMessage': 'Great job! You\'ve completed your swipe study session.',
    'knownWords': 'Known Words',
    'needReview': 'Need Review',
    'accuracy': 'Accuracy',
    'startNewSession': 'Start New Session',
    'tapCardToSeeMeaning': 'Tap the card to see meaning',
    'swipeInstructions': 'Swipe right if you know it, left if you need to review',
    'tapToSeeMeaning': 'Tap to see meaning...',
    'meaning': 'Meaning',
    'tapAgainToFlipBack': 'Tap again to flip back',
    'rank': 'Rank',
    'review': 'REVIEW',
    'know': 'KNOW',
    
    // Progress Page
    'learningProgress': 'Learning Progress',
    'totalWords': 'Total Words',
    'studiedToday': 'Studied Today',
    'averageAccuracy': 'Average Accuracy',
    'dayStreak': 'Day Streak',
    'wordsByCategory': 'Words by Category',
    'studyStatistics': 'Study Statistics',
    'wordsStudied': 'Words Studied',
    'totalStudySessions': 'Total Study Sessions',
    'correctAnswers': 'Correct Answers',
    'successRate': 'Success Rate',
    'recentActivity': 'Recent Activity',
    'noRecentActivity': 'No recent study activity. Start studying to see your progress here!',
    'studiedWord': 'Studied "{{word}}"',
    'accuracyLabel': 'accuracy',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
  },
  ja: {
    // Navigation
    'nav.vocabulary': '単語帳',
    'nav.study': '学習モード',
    'nav.progress': '進捗',
    'nav.add': '追加',
    'nav.import': 'インポート',
    'nav.settings': '設定',
    'nav.title': 'VocabMaster',
    
    // Vocabulary Page
    'vocab.title': 'あなたの単語帳',
    'vocab.count': '語',
    'vocab.count_plural': '語',
    'vocab.empty': 'まだ単語がありません。最初の単語を追加しましょう！',
    'vocab.no_results': '検索条件に一致する単語がありません。',
    'vocab.add_first': '最初の単語を追加',
    'vocab.search_placeholder': '単語を検索...',
    'vocab.all_categories': 'すべてのカテゴリ',
    'vocab.added': '追加日',
    
    // Add Word Modal
    'add.title': '新しい単語を追加',
    'add.edit_title': '単語を編集',
    'add.word': '単語',
    'add.pronunciation': '発音',
    'add.definition': '意味',
    'add.category': 'カテゴリ',
    'add.language': '言語',
    'add.save': '単語を保存',
    'add.cancel': 'キャンセル',
    'add.phonetic_keyboard': '発音記号キーボード',
    
    // Study Mode
    'study.title': '学習モード',
    'study.description': 'フラッシュカードで語彙力をテストしましょう',
    'study.ready_title': '学習の準備はできましたか？',
    'study.ready_description': 'あなたの単語帳からランダムに単語を表示します。意味を思い出してみてください！',
    'study.start_session': '学習セッションを開始',
    'study.question': '問題',
    'study.of': '/',
    'study.recall': 'この単語の意味は何ですか？',
    'study.show_answer': '答えを表示',
    'study.easy': '簡単 - よく知っていた',
    'study.medium': '普通 - 少し考えた',
    'study.hard': '難しい - 苦戦した',
    'study.complete_title': '学習セッション完了！',
    'study.complete_description': 'お疲れさまでした！学習セッションが完了しました。',
    'study.words_studied': '学習した単語数',
    'study.session_completed': 'セッション完了時刻',
    'study.new_session': '新しいセッションを開始',
    'study.empty': '学習を始めるために単語を追加してください！',
    
    // Progress Page
    'progress.title': 'あなたの進捗',
    'progress.description': '語彙学習の進捗を追跡しましょう',
    'progress.total_words': '総単語数',
    'progress.study_sessions': '学習セッション数',
    'progress.accuracy': '全体の正答率',
    'progress.recent_activity': '最近のアクティビティ',
    'progress.no_activity': 'まだ学習履歴がありません。学習を始めて進捗を確認しましょう！',
    
    // Import
    'import.title': 'APKGファイルをインポート',
    'import.description': 'Ankiデッキファイル（.apkg）から単語をインポート',
    
    // Sort Options
    'sort.alphabetical': 'アルファベット順',
    'sort.date': '追加日順',
    'sort.category': 'カテゴリ順',
    'sort.difficulty': '難易度順',
    
    // Pagination
    'pagination.items': '件',
    'pagination.per_page': '表示件数',
    
    // Study Mode - Swipe Study
    'swipeStudy': 'スワイプ学習',
    'loadingStudySession': '学習セッションを読み込み中...',
    'allCaughtUp': '全て完了！',
    'noWordsForReview': '現在復習が必要な単語はありません。後でもう一度確認するか、新しい単語を追加してください。',
    'addNewWords': '新しい単語を追加',
    'sessionComplete': 'セッション完了！',
    'sessionCompleteMessage': 'お疲れ様でした！スワイプ学習セッションが完了しました。',
    'knownWords': '覚えた単語',
    'needReview': '復習が必要',
    'accuracy': '正答率',
    'startNewSession': '新しいセッションを開始',
    'tapCardToSeeMeaning': 'カードをタップして意味を確認',
    'swipeInstructions': '知っている場合は右、復習が必要な場合は左にスワイプ',
    'tapToSeeMeaning': 'タップして意味を確認...',
    'meaning': '意味',
    'tapAgainToFlipBack': 'もう一度タップして表に戻る',
    'rank': 'ランク',
    'review': '復習',
    'know': '習得済み',
    
    // Progress Page
    'learningProgress': '学習進捗',
    'totalWords': '総単語数',
    'studiedToday': '今日の学習',
    'averageAccuracy': '平均正答率',
    'dayStreak': '連続日数',
    'wordsByCategory': 'カテゴリ別単語数',
    'studyStatistics': '学習統計',
    'wordsStudied': '学習済み単語',
    'totalStudySessions': '総学習回数',
    'correctAnswers': '正答数',
    'successRate': '成功率',
    'recentActivity': '最近の活動',
    'noRecentActivity': '最近の学習活動がありません。学習を開始して進捗を確認しましょう！',
    'studiedWord': '「{{word}}」を学習',
    'accuracyLabel': '正答率',
    
    // Common
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.close': '閉じる',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('vocabmaster-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('vocabmaster-language', language);
  }, [language]);

  const t = (key: string): string => {
    const languageTranslations = translations[language];
    return (languageTranslations as any)[key] || key;
  };

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}