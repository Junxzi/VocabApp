# VocabMaster - React Native iOS App Specification

## プロジェクト概要

英語語彙学習アプリ「VocabMaster」の React Native iOS 版開発仕様書。Web 版の全機能を完全再現し、ネイティブアプリとしての最適化を実現する。

## 技術スタック

### フロントエンド

- **React Native** (最新版)
- **TypeScript** (完全型安全)
- **React Navigation** (ナビゲーション)
- **React Native Reanimated** (アニメーション)
- **React Native Gesture Handler** (スワイプ操作)
- **React Query / TanStack Query** (状態管理・キャッシュ)
- **React Hook Form** (フォーム管理)
- **Zod** (バリデーション)

### バックエンド

- **Express.js** (既存 API を活用)
- **Drizzle ORM** (データベース)
- **PostgreSQL** (データベース)

### 外部サービス

- **Azure Cognitive Services Speech** (音声合成)
- **OpenAI GPT-4o** (語彙データ生成)
- **Notion API** (データ同期 - オプション)

### デザインシステム

- **NativeBase** または **React Native Elements**
- **Styled Components** または **StyleSheet API**
- ダークモード対応
- iOS Human Interface Guidelines 準拠

## 機能要件

### 1. 語彙管理機能

#### 1.1 単語データ構造

```typescript
interface VocabularyWord {
  id: number;
  word: string;
  definition: string; // 日本語定義
  pronunciationUs: string; // 米国英語発音記号
  pronunciationUk: string; // 英国英語発音記号
  pronunciationAu: string; // オーストラリア英語発音記号
  partOfSpeech: string; // 品詞
  exampleSentences: string; // JSON形式の例文配列
  tags: string[]; // タグ配列
  difficulty: number; // 1-4の難易度
  easeFactor: number; // 間隔反復用係数
  interval: number; // 復習間隔（日数）
  nextReview: Date | null; // 次回復習日
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.2 CRUD 操作

- **作成**: 手動入力 + AI 自動生成機能
- **読取**: 一覧表示、検索、フィルタリング
- **更新**: 編集機能、学習データ更新
- **削除**: 個別削除、一括削除

#### 1.3 データソース

- 手動入力
- CSV/Anki ファイルインポート
- AI 語彙生成（カテゴリ別）
- Notion 同期（オプション）

### 2. 学習モード

#### 2.1 スワイプ学習

**操作方法:**

- 右スワイプ: 「知っている」
- 左スワイプ: 「復習が必要」
- タップ: 表示切替（単語 ↔ 定義・詳細）

**学習タイプ:**

- ランダム学習（30 問）
- タグ別学習
- デイリーチャレンジ（30 問固定）

**カード表示:**

- 表面: 英単語
- 裏面: 日本語定義、品詞、例文、発音記号

#### 2.2 間隔反復システム

**アルゴリズム:**

- SM-2 アルゴリズム改良版
- 難易度に応じた復習間隔調整
- 学習履歴に基づく個別最適化

**パラメータ:**

```typescript
interface SpacedRepetitionData {
  easeFactor: number; // 1.3-2.5
  interval: number; // 復習間隔（日数）
  quality: number; // 回答品質（0-5）
  nextReview: Date; // 次回復習日
}
```

#### 2.3 デイリーチャレンジ

- 毎日固定 30 問
- 同一日は同じ問題セット
- セッション継続機能（中断・再開）
- 完了後は当日再挑戦不可
- 進捗統計表示

### 3. 音声機能

#### 3.1 Azure TTS 統合

```typescript
interface AudioConfiguration {
  apiKey: string;
  region: string;
  voice: {
    us: string; // 米国英語音声
    uk: string; // 英国英語音声
    au: string; // オーストラリア英語音声
  };
}
```

#### 3.2 音声キャッシュシステム

- **メモリキャッシュ**: セッション中の高速アクセス
- **永続キャッシュ**: AsyncStorage 使用
- **有効期限**: 30 日間
- **容量制限**: 最大 100MB
- **自動清掃**: 期限切れファイル自動削除

#### 3.3 再生機能

- 単語タップで即座再生
- アクセント選択（US/UK/AU）
- 自動再生モード
- 再生キュー管理
- エラーハンドリング

### 4. ユーザーインターフェース

#### 4.1 画面構成

```
Main Tabs:
├── 語彙一覧 (VocabularyScreen)
├── 学習 (StudyScreen)
├── 進捗 (ProgressScreen)
└── 設定 (SettingsScreen)

Modal Screens:
├── 単語追加/編集 (AddWordModal)
├── スワイプ学習 (SwipeStudyScreen)
├── 単語詳細 (WordDetailScreen)
└── インポート (ImportModal)
```

#### 4.2 デザインパターン

- **色彩**: 黒・白ベースのミニマルデザイン
- **タイポグラフィ**: システムフォント使用
- **レイアウト**: 片手操作最適化
- **アニメーション**: Reanimated による滑らかな動作
- **アクセシビリティ**: VoiceOver 対応

#### 4.3 ナビゲーション

```typescript
type RootStackParamList = {
  MainTabs: undefined;
  SwipeStudy: { mode: 'random' | 'tag' | 'daily'; tag?: string };
  WordDetail: { wordId: number };
  AddWord: { editWord?: VocabularyWord };
  Import: undefined;
};

type MainTabParamList = {
  Vocabulary: undefined;
  Study: undefined;
  Progress: undefined;
  Settings: undefined;
};
```

### 5. データ管理

#### 5.1 状態管理

```typescript
// React Query
const useVocabularyWords = () =>
  useQuery({
    queryKey: ['vocabulary'],
    queryFn: () => vocabularyService.getAll(),
    staleTime: 5 * 60 * 1000, // 5分
  });

const useAddWord = () =>
  useMutation({
    mutationFn: vocabularyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
```

#### 5.2 永続化

- **AsyncStorage**: 設定、キャッシュ
- **Secure Storage**: API キー
- **File System**: 音声キャッシュ
- **Remote API**: 語彙データ同期

#### 5.3 API 仕様

```typescript
interface VocabularyService {
  // 基本CRUD
  getAll(): Promise<VocabularyWord[]>;
  getById(id: number): Promise<VocabularyWord>;
  create(word: CreateVocabularyWord): Promise<VocabularyWord>;
  update(id: number, word: UpdateVocabularyWord): Promise<VocabularyWord>;
  delete(id: number): Promise<void>;

  // 学習機能
  getRandomWords(count: number): Promise<VocabularyWord[]>;
  getWordsByTag(tag: string): Promise<VocabularyWord[]>;
  getDailyChallengeWords(): Promise<VocabularyWord[]>;
  updateSpacedRepetition(id: number, known: boolean): Promise<VocabularyWord>;

  // デイリーチャレンジ
  getDailyChallengeStatus(): Promise<DailyChallengeStatus>;
  completeDailyChallenge(stats: ChallengeStats): Promise<void>;

  // 統計
  getStudyProgress(): Promise<ProgressData>;
  getCategories(): Promise<Category[]>;
}
```

### 6. パフォーマンス要件

#### 6.1 応答性能

- アプリ起動: 3 秒以内
- 画面遷移: 0.3 秒以内
- スワイプ応答: 16ms 以内（60fps）
- 音声再生開始: 1 秒以内

#### 6.2 メモリ使用量

- 通常使用: 100MB 以下
- 音声キャッシュ込み: 200MB 以下
- バックグラウンド: 50MB 以下

#### 6.3 バッテリー効率

- 音声再生最適化
- 不要な API 呼び出し削減
- バックグラウンド処理最小化

### 7. 実装優先順位

#### Phase 1: 基本機能 (Week 1-2)

1. プロジェクトセットアップ
2. API 接続・認証
3. 語彙データ表示
4. 基本ナビゲーション

#### Phase 2: 学習機能 (Week 3-4)

1. スワイプ学習画面
2. カードアニメーション
3. 間隔反復システム
4. 学習統計

#### Phase 3: 音声機能 (Week 5)

1. Azure TTS 統合
2. 音声キャッシュシステム
3. 再生コントロール

#### Phase 4: 高度な機能 (Week 6-7)

1. デイリーチャレンジ
2. セッション継続
3. データインポート
4. 設定画面

#### Phase 5: 最適化・リリース (Week 8)

1. パフォーマンス最適化
2. バグ修正
3. App Store 準備

## コンポーネント設計

### 共通コンポーネント

```typescript
// カードコンポーネント
interface SwipeCardProps {
  word: VocabularyWord;
  showAnswer: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
}

// 音声ボタン
interface AudioButtonProps {
  word: string;
  accent: 'us' | 'uk' | 'au';
  size?: 'small' | 'medium' | 'large';
}

// 進捗バー
interface ProgressBarProps {
  current: number;
  total: number;
  showNumbers?: boolean;
}

// 統計カード
interface StatsCardProps {
  title: string;
  value: number;
  color: string;
  icon: string;
}
```

## テスト要件

### 単体テスト

- カスタムフック
- ユーティリティ関数
- API 呼び出し
- カバレッジ: 80%以上

### 統合テスト

- 画面遷移
- データフロー
- API 統合

### E2E テスト

- 学習フロー完走
- デイリーチャレンジ
- 音声再生

## セキュリティ要件

### データ保護

- API キー暗号化保存
- 通信 HTTPS 必須
- 個人データ匿名化

### プライバシー

- 位置情報使用なし
- 第三者データ共有なし
- ユーザー同意取得

## 配布・運用

### App Store 対応

- iOS 14.0 以上サポート
- iPhone/iPad 対応
- アクセシビリティ準拠

### アップデート戦略

- CodePush 対応
- 段階的ロールアウト
- A/B テスト対応

## 開発環境セットアップ

### 必要ツール

```bash
# React Native CLI
npm install -g @react-native-community/cli

# iOS開発
# Xcode 14.0以上
# CocoaPods

# 依存関係インストール
npm install
cd ios && pod install

# 開発サーバー起動
npm run ios
```

### 環境変数

```bash
# .env
API_BASE_URL=http://localhost:5000
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=japaneast
OPENAI_API_KEY=your_key_here
```

## パフォーマンス指標

### 計測項目

- アプリ起動時間
- 画面描画時間
- メモリ使用量
- API 応答時間
- 音声再生遅延

### 目標値

- 起動時間: < 3 秒
- 画面遷移: < 300ms
- メモリ: < 100MB
- API 応答: < 1 秒
- 音声遅延: < 500ms

この仕様書に基づいて、Web 版の全機能を完全再現した React Native iOS アプリを開発することが可能です。
