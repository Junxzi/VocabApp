
# Capacitor Native App Setup

このプロジェクトはCapacitorを使ってネイティブアプリに変換できます。

## 前提条件

### Android
- Android Studio
- Java 11以上
- Android SDK

### iOS (macOS only)
- Xcode 12以上
- iOS SDK

## セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **Capacitorの初期化**
   ```bash
   npm run cap:init
   ```

3. **プラットフォームの追加**
   ```bash
   # Android
   npm run cap:add:android
   
   # iOS (macOS only)
   npm run cap:add:ios
   ```

4. **ビルドと同期**
   ```bash
   npm run cap:sync
   ```

## ビルド手順

### Android APK
```bash
npm run cap:build:android
```

### iOS App
```bash
npm run cap:build:ios
```

## 開発

### ライブリロード付きで開発
```bash
# Webアプリを起動
npm run dev

# 別ターミナルで
npx cap run android --livereload --external
```

### ネイティブエディタを開く
```bash
# Android Studio
npm run cap:open:android

# Xcode
npm run cap:open:ios
```

## 注意事項

- ビルド前に必ず `npm run build` でWebアプリをビルドしてください
- ネイティブ機能を使用する場合は、対応するCapacitorプラグインをインストールしてください
- iOS用にビルドするにはmacOSが必要です
