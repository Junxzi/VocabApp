# Deployment and Testing Guide

## Pre-Development Setup

### Environment Requirements

```bash
# Required versions
Node.js: >= 18.0.0
React Native CLI: >= 12.0.0
Xcode: >= 14.0
iOS Simulator: >= 16.0
CocoaPods: >= 1.12.0

# Check current versions
node --version
npx react-native --version
xcodebuild -version
pod --version
```

### Initial Project Setup

```bash
# Create new React Native project
npx react-native@latest init VocabMasterApp --template react-native-template-typescript

cd VocabMasterApp

# Install essential dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install @tanstack/react-query
npm install react-native-vector-icons
npm install @react-native-async-storage/async-storage
npm install expo-av expo-file-system
npm install react-hook-form @hookform/resolvers zod

# iOS specific setup
cd ios && pod install && cd ..

# Configure react-native-reanimated
# Add to babel.config.js:
plugins: ['react-native-reanimated/plugin']
```

### Backend Server Configuration

```bash
# Start the existing Express server
cd path/to/existing/server
npm run dev

# Verify endpoints are accessible
curl http://localhost:5000/api/vocabulary
curl http://localhost:5000/api/azure-config
```

## Development Phase Testing

### Phase 1: Basic Setup (Week 1)

**Testing Checklist:**

- [ ] App launches without crashes
- [ ] Navigation between tabs works
- [ ] API connection established
- [ ] Basic UI components render correctly

**Test Commands:**

```bash
# Start Metro bundler
npx react-native start

# Run on iOS simulator
npx react-native run-ios

# Run tests
npm test
```

### Phase 2: Core Functionality (Week 2-3)

**Testing Checklist:**

- [ ] Vocabulary list displays correctly
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] Search and filtering functional
- [ ] Data persistence works

**Manual Test Cases:**

1. **Vocabulary List Loading**

   - Open app → Navigate to vocabulary tab
   - Expected: List of words displays
   - Verify: No loading errors, proper formatting

2. **Add New Word**

   - Tap add button → Fill form → Submit
   - Expected: Word appears in list
   - Verify: All fields saved correctly

3. **Search Functionality**
   - Type in search box
   - Expected: Filtered results appear
   - Verify: Search works for word and definition

### Phase 3: Study Mode (Week 3-4)

**Testing Checklist:**

- [ ] Swipe gestures work smoothly
- [ ] Card animations are fluid (60fps)
- [ ] Progress tracking accurate
- [ ] Spaced repetition calculations correct

**Performance Tests:**

```typescript
// Memory usage test
const memoryUsage = () => {
  if (__DEV__) {
    console.log('Memory usage:', performance.memory?.usedJSHeapSize || 'N/A');
  }
};

// Animation performance test
const measureAnimationFrame = () => {
  const start = performance.now();
  requestAnimationFrame(() => {
    const end = performance.now();
    console.log('Frame time:', end - start, 'ms');
  });
};
```

**Swipe Testing Script:**

1. Navigate to study mode
2. Perform 50 left/right swipes rapidly
3. Verify: No animation lag, accurate progress counting
4. Check: Memory usage remains stable

### Phase 4: Audio Integration (Week 5)

**Testing Checklist:**

- [ ] Audio plays on button tap
- [ ] Multiple accents work correctly
- [ ] Caching system functions
- [ ] Offline playback works for cached audio

**Audio Test Protocol:**

```typescript
// Test audio caching
const testAudioCache = async () => {
  const word = 'example';
  const accent = 'us';

  // First play - should download and cache
  console.time('First play');
  await audioService.speak(word, accent);
  console.timeEnd('First play');

  // Second play - should use cache
  console.time('Cached play');
  await audioService.speak(word, accent);
  console.timeEnd('Cached play');

  // Verify cache stats
  console.log('Cache stats:', audioService.getCacheStats());
};
```

### Phase 5: Daily Challenge (Week 6)

**Testing Checklist:**

- [ ] Daily challenge generates 30 words
- [ ] Session persistence works correctly
- [ ] Completion tracking accurate
- [ ] Cannot retake on same day

**Session Persistence Test:**

1. Start daily challenge
2. Complete 10 questions
3. Force close app
4. Reopen app
5. Resume daily challenge
6. Verify: Continues from question 11

## Quality Assurance Testing

### Automated Testing Setup

```typescript
// __tests__/VocabularyService.test.ts
import { vocabularyService } from '../src/services/VocabularyService';

describe('VocabularyService', () => {
  test('fetches vocabulary words', async () => {
    const words = await vocabularyService.getAll();
    expect(Array.isArray(words)).toBe(true);
    expect(words.length).toBeGreaterThan(0);
  });

  test('creates new word', async () => {
    const newWord = {
      word: 'test',
      definition: 'テスト',
      pronunciationUs: '/test/',
      pronunciationUk: '/test/',
      pronunciationAu: '/test/',
      partOfSpeech: 'noun',
      exampleSentences: JSON.stringify([
        { english: 'Test', japanese: 'テスト' },
      ]),
      tags: ['test'],
      difficulty: 1,
    };

    const created = await vocabularyService.create(newWord);
    expect(created.word).toBe('test');
    expect(created.id).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// __tests__/SwipeStudy.integration.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SwipeStudyScreen from '../src/screens/SwipeStudyScreen';

describe('SwipeStudyScreen Integration', () => {
  test('completes full study session', async () => {
    const { getByTestId } = render(<SwipeStudyScreen />);

    // Wait for words to load
    await waitFor(() => {
      expect(getByTestId('swipe-card')).toBeTruthy();
    });

    // Simulate swiping through all cards
    for (let i = 0; i < 30; i++) {
      fireEvent(getByTestId('swipe-card'), 'onSwipeRight');
    }

    // Verify completion screen appears
    await waitFor(() => {
      expect(getByTestId('completion-screen')).toBeTruthy();
    });
  });
});
```

### Performance Testing

```bash
# Install performance testing tools
npm install --save-dev @react-native-community/cli-plugin-metro
npm install --save-dev flipper-plugin-react-query

# Memory leak detection
npm install --save-dev leakage

# Bundle size analysis
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output bundle.js --assets-dest assets/
ls -la bundle.js  # Check bundle size
```

### Device Testing Matrix

```
Required Test Devices:
├── iPhone SE (3rd gen) - Small screen
├── iPhone 14 Pro - Standard screen
├── iPhone 14 Pro Max - Large screen
└── iPad Pro 12.9" - Tablet layout

iOS Versions:
├── iOS 15.0 (minimum supported)
├── iOS 16.0 (stable)
└── iOS 17.0 (latest)
```

## Pre-Production Checklist

### Security Audit

- [ ] API keys stored securely (Keychain)
- [ ] Network requests use HTTPS
- [ ] No sensitive data in logs
- [ ] User data properly anonymized

### Accessibility Testing

```typescript
// Accessibility test example
const accessibilityTest = () => {
  // Ensure all interactive elements have accessibility labels
  <TouchableOpacity
    accessibilityLabel="Play pronunciation for example"
    accessibilityRole="button"
    onPress={() => audioService.speak('example')}
  >
    <Icon name="volume-up" />
  </TouchableOpacity>;
};
```

**Accessibility Checklist:**

- [ ] VoiceOver support for all interactive elements
- [ ] Proper contrast ratios (4.5:1 minimum)
- [ ] Text scales with system font size
- [ ] Touch targets minimum 44x44 points

### Performance Benchmarks

```typescript
// Performance monitoring
const performanceMetrics = {
  appLaunchTime: '< 3 seconds',
  screenTransition: '< 300ms',
  swipeResponse: '< 16ms (60fps)',
  memoryUsage: '< 100MB typical',
  audioPlayback: '< 500ms delay',
};

// Automated performance test
const runPerformanceTest = async () => {
  const metrics = {};

  // Measure app launch
  const launchStart = Date.now();
  // ... app initialization
  metrics.launchTime = Date.now() - launchStart;

  // Measure screen transition
  const transitionStart = Date.now();
  // ... navigate to screen
  metrics.transitionTime = Date.now() - transitionStart;

  console.log('Performance metrics:', metrics);

  // Assert against benchmarks
  expect(metrics.launchTime).toBeLessThan(3000);
  expect(metrics.transitionTime).toBeLessThan(300);
};
```

## Production Deployment

### App Store Preparation

```xml
<!-- ios/VocabMasterApp/Info.plist -->
<key>CFBundleDisplayName</key>
<string>VocabMaster</string>
<key>CFBundleVersion</key>
<string>1</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>

<!-- Privacy permissions -->
<key>NSMicrophoneUsageDescription</key>
<string>This app uses microphone for pronunciation practice.</string>
<key>NSCameraUsageDescription</key>
<string>This app uses camera for importing vocabulary from images.</string>
```

### Build Configuration

```bash
# Production build
npx react-native run-ios --configuration Release

# Archive for App Store
# Open Xcode → Product → Archive
# Upload to App Store Connect
```

### App Store Assets

```
Required Assets:
├── App Icon (1024x1024)
├── Launch Screen
├── Screenshots (6.5", 6.1", 5.5", 12.9")
├── App Store Description
└── Keywords for ASO

App Store Description Template:
"Master English vocabulary with an innovative swipe-based learning system.
Features spaced repetition, pronunciation guides, and daily challenges."
```

### Production Monitoring

```typescript
// Crash reporting setup
import crashlytics from '@react-native-firebase/crashlytics';

// Log non-fatal errors
crashlytics().recordError(new Error('Custom error'));

// Log user properties
crashlytics().setUserId(userId);

// Analytics tracking
import analytics from '@react-native-firebase/analytics';

analytics().logEvent('study_session_completed', {
  mode: 'daily_challenge',
  words_correct: 25,
  total_words: 30,
});
```

## Post-Launch Monitoring

### Key Metrics to Track

```typescript
interface AppMetrics {
  // User engagement
  dailyActiveUsers: number;
  sessionDuration: number;
  retentionRate: number;

  // Learning metrics
  wordsLearned: number;
  studySessionsCompleted: number;
  dailyChallengeCompletion: number;

  // Technical metrics
  crashRate: number;
  loadTime: number;
  audioPlaybackSuccess: number;
}
```

### A/B Testing Framework

```typescript
// Feature flag system
const useFeatureFlag = (flagName: string) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Fetch feature flag status
    fetchFeatureFlag(flagName).then(setIsEnabled);
  }, [flagName]);

  return isEnabled;
};

// Usage example
const SwipeStudyScreen = () => {
  const enableNewAnimation = useFeatureFlag('new_swipe_animation');

  return (
    <SwipeCard
      animationStyle={enableNewAnimation ? 'bounce' : 'slide'}
      // ... other props
    />
  );
};
```

### Update Strategy

```javascript
// CodePush configuration for hot updates
import codePush from 'react-native-code-push';

const App = () => {
  useEffect(() => {
    codePush.sync({
      checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
      mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
    });
  }, []);

  return <MainNavigator />;
};

export default codePush(App);
```

This comprehensive guide provides everything needed to successfully develop, test, and deploy a React Native version of the vocabulary learning app with full feature parity to the web version.
