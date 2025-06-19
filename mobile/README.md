# VocabMaster Mobile - React Native Application

Complete native iOS/Android mobile application converted from the web version, maintaining all original functionality while providing native mobile experiences.

## Features

### Core Functionality
- **Vocabulary Management**: Browse, search, add, edit, and delete vocabulary words
- **Swipe Study Mode**: Tinder-style card interface with gesture-based learning
- **Spaced Repetition**: SuperMemo algorithm for optimal learning intervals
- **Audio Pronunciation**: Native TTS with US/UK/AU accent support
- **Progress Tracking**: Difficulty-based statistics and learning analytics
- **Daily Challenges**: Personalized daily vocabulary sessions
- **Tag-based Study**: Category and tag-based word organization

### Native Mobile Features
- **Native Navigation**: React Navigation with tab and stack navigators
- **Gesture Handling**: Native swipe gestures with React Native Reanimated
- **Audio Integration**: React Native TTS for pronunciation
- **Local Storage**: AsyncStorage for settings and offline capability
- **Native UI**: Platform-specific design patterns
- **Dark/Light Mode**: System-integrated theme switching
- **Safe Area Support**: iPhone notch and navigation bar handling

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── VocabularyScreen.tsx
│   │   ├── StudyScreen.tsx
│   │   ├── SwipeStudyScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── WordDetailScreen.tsx
│   ├── contexts/          # React contexts
│   │   ├── LanguageContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── QueryContext.tsx
│   ├── services/          # API services
│   │   └── VocabularyService.ts
│   ├── types/             # TypeScript definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
├── android/               # Android-specific code
├── ios/                   # iOS-specific code
├── App.tsx               # Main application component
└── package.json          # Dependencies and scripts
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)

### Backend Setup
The mobile app connects to the existing Express.js backend server:

1. **Start Backend Server**
   ```bash
   # From root directory
   npm run dev
   ```

2. **Configure API Endpoint**
   Update `mobile/src/services/VocabularyService.ts`:
   ```typescript
   // For development
   const API_BASE_URL = 'http://localhost:5000/api';
   
   // For production
   const API_BASE_URL = 'https://your-api-domain.com/api';
   ```

### Mobile App Setup

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **iOS Setup**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup**
   Ensure Android development environment is configured

4. **Run Development Server**
   ```bash
   npm run start
   ```

5. **Run on iOS**
   ```bash
   npm run ios
   ```

6. **Run on Android**
   ```bash
   npm run android
   ```

## Key Dependencies

### Core React Native
- `react-native`: Core framework
- `@react-navigation/native`: Navigation system
- `@react-navigation/bottom-tabs`: Tab navigation
- `@react-navigation/stack`: Stack navigation

### UI & Animations
- `react-native-gesture-handler`: Native gesture handling
- `react-native-reanimated`: Advanced animations
- `react-native-vector-icons`: Icon library
- `react-native-safe-area-context`: Safe area handling

### Functionality
- `react-native-tts`: Text-to-speech
- `@react-native-async-storage/async-storage`: Local storage
- `react-native-device-info`: Device information

## Screen Components

### VocabularyScreen
- Displays all vocabulary words in a scrollable list
- Search functionality with real-time filtering
- Word cards with difficulty indicators and tags
- Navigation to word detail screen

### SwipeStudyScreen
- Tinder-style swipe cards for vocabulary study
- Gesture-based learning (swipe right = known, left = review)
- Audio pronunciation with accent selection
- Progress tracking and session statistics
- Card flip animation to show definitions

### StudyScreen
- Study mode selection interface
- Random study (30 questions)
- Tag-based study with available tag grid
- Daily challenge with completion status

### ProgressScreen
- Learning statistics and analytics
- Difficulty distribution charts
- Total words and progress metrics
- Visual progress indicators

### SettingsScreen
- Language selection (English/Japanese)
- Audio settings (auto-play, accent selection)
- Theme selection (dark/light mode)
- Settings persistence with AsyncStorage

### WordDetailScreen
- Detailed word information display
- Multiple pronunciation variants (US/UK/AU)
- Example sentences with translations
- AI enrichment functionality
- Audio playback for each pronunciation

## Native Features Implementation

### Audio System
```typescript
// Text-to-Speech integration
import Tts from 'react-native-tts';

const speakWord = (word: string, accent: 'us' | 'uk' | 'au') => {
  const languageMap = {
    us: 'en-US',
    uk: 'en-GB',
    au: 'en-AU',
  };
  
  Tts.setDefaultLanguage(languageMap[accent]);
  Tts.speak(word);
};
```

### Gesture Handling
```typescript
// Swipe gesture implementation
import {PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const gestureHandler = useAnimatedGestureHandler({
  onActive: (event) => {
    translateX.value = event.translationX;
  },
  onEnd: (event) => {
    if (Math.abs(event.translationX) > threshold) {
      // Handle swipe completion
    } else {
      translateX.value = withSpring(0);
    }
  },
});
```

### Local Storage
```typescript
// Settings persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

const saveSettings = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

const loadSettings = async (key: string) => {
  return await AsyncStorage.getItem(key);
};
```

## API Integration

The mobile app uses the same REST API as the web version:

### Endpoints Used
- `GET /api/vocabulary` - Fetch all words
- `GET /api/vocabulary/:id` - Fetch specific word
- `GET /api/vocabulary/random/:limit` - Random words for study
- `GET /api/vocabulary/daily-challenge` - Daily challenge words
- `PUT /api/vocabulary/:id/spaced-repetition` - Update learning progress
- `POST /api/vocabulary/:id/enrich` - AI enhancement

### Service Layer
```typescript
class VocabularyService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {'Content-Type': 'application/json', ...options.headers},
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return response.json();
  }
  
  async getAllWords(): Promise<VocabularyWord[]> {
    return this.makeRequest('/vocabulary');
  }
  
  // Additional methods...
}
```

## Build & Deployment

### iOS Build
```bash
# Development build
npm run ios

# Production build
cd ios
xcodebuild -workspace VocabMaster.xcworkspace \
  -scheme VocabMaster \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath VocabMaster.xcarchive archive
```

### Android Build
```bash
# Development build
npm run android

# Production build
cd android
./gradlew assembleRelease
```

### App Store / Play Store
1. Configure app signing certificates
2. Update version numbers in respective platform files
3. Build release versions
4. Upload to distribution platforms

## Development Notes

### State Management
- React Context for global state (theme, language, settings)
- React Query for server state management
- AsyncStorage for persistent local data

### Navigation Structure
- Tab Navigator for main sections
- Stack Navigator for detailed views
- Native navigation animations and gestures

### Performance Optimizations
- FlatList for large vocabulary lists
- Image caching for consistent performance
- Lazy loading of screens
- Optimized re-renders with React.memo

### Error Handling
- Comprehensive error boundaries
- Network error handling with retries
- Graceful fallbacks for missing data
- User-friendly error messages

This React Native application provides a complete native mobile experience while maintaining all the functionality of the original web application.