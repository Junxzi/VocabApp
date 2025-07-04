# React Native Implementation Guide

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Basic components (Button, Card, etc.)
│   │   ├── forms/          # Form-specific components
│   │   ├── study/          # Study mode components
│   │   └── audio/          # Audio-related components
│   ├── screens/            # Screen components
│   │   ├── VocabularyScreen.tsx
│   │   ├── StudyScreen.tsx
│   │   ├── SwipeStudyScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   ├── MainNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   ├── services/           # API and external services
│   │   ├── VocabularyService.ts
│   │   ├── AudioService.ts
│   │   └── StorageService.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useVocabulary.ts
│   │   ├── useAudio.ts
│   │   └── useSpacedRepetition.ts
│   ├── utils/              # Utility functions
│   │   ├── spacedRepetition.ts
│   │   ├── dateUtils.ts
│   │   └── validation.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── vocabulary.ts
│   │   ├── api.ts
│   │   └── navigation.ts
│   ├── contexts/           # React contexts
│   │   ├── ThemeContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── AudioContext.tsx
│   └── constants/          # App constants
│       ├── colors.ts
│       ├── dimensions.ts
│       └── config.ts
├── assets/                 # Static assets
│   ├── images/
│   ├── fonts/
│   └── sounds/
├── __tests__/              # Test files
├── android/                # Android specific files
├── ios/                    # iOS specific files
└── package.json
```

## Core Components Implementation

### 1. SwipeCard Component

```typescript
// src/components/study/SwipeCard.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { VocabularyWord } from '../../types/vocabulary';
import { AudioButton } from '../audio/AudioButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface SwipeCardProps {
  word: VocabularyWord;
  showAnswer: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  isActive: boolean;
  index: number;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  word,
  showAnswer,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  isActive,
  index,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const tapRef = useRef(null);
  const panRef = useRef(null);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1;
      rotate.value = interpolate(
        event.translationX,
        [-screenWidth, screenWidth],
        [-15, 15],
      );
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      const shouldSwipe =
        Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500;

      if (shouldSwipe) {
        const direction = translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(
          direction === 'right' ? screenWidth : -screenWidth,
        );
        runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
      scale.value = withSpring(1);
    },
  });

  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(onTap)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: isActive ? 1 : 0.7,
    zIndex: isActive ? 10 : index,
  }));

  const cardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.8],
    );
    return { opacity };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const exampleSentences = word.exampleSentences
    ? JSON.parse(word.exampleSentences)
    : [];

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={panGestureHandler}
      simultaneousHandlers={[tapRef]}
      enabled={isActive}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <TapGestureHandler
          ref={tapRef}
          onGestureEvent={tapGestureHandler}
          simultaneousHandlers={[panRef]}
        >
          <Animated.View style={[styles.card, cardStyle]}>
            {/* Swipe Indicators */}
            <Animated.View
              style={[
                styles.indicator,
                styles.leftIndicator,
                leftIndicatorStyle,
              ]}
            >
              <Text style={styles.indicatorText}>復習必要</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.indicator,
                styles.rightIndicator,
                rightIndicatorStyle,
              ]}
            >
              <Text style={styles.indicatorText}>習得済み</Text>
            </Animated.View>

            {/* Card Content */}
            <View style={styles.content}>
              {!showAnswer ? (
                // Front side - English word
                <View style={styles.frontSide}>
                  <Text style={styles.word}>{word.word}</Text>
                  <View style={styles.audioControls}>
                    <AudioButton
                      word={word.word}
                      accent="us"
                      pronunciation={word.pronunciationUs}
                    />
                    <AudioButton
                      word={word.word}
                      accent="uk"
                      pronunciation={word.pronunciationUk}
                    />
                    <AudioButton
                      word={word.word}
                      accent="au"
                      pronunciation={word.pronunciationAu}
                    />
                  </View>
                  <Text style={styles.tapHint}>タップして詳細を表示</Text>
                </View>
              ) : (
                // Back side - Details
                <View style={styles.backSide}>
                  <Text style={styles.wordSmall}>{word.word}</Text>
                  <Text style={styles.definition}>{word.definition}</Text>

                  {word.partOfSpeech && (
                    <Text style={styles.partOfSpeech}>{word.partOfSpeech}</Text>
                  )}

                  <View style={styles.pronunciations}>
                    <Text style={styles.pronunciationLabel}>発音:</Text>
                    <Text style={styles.pronunciation}>
                      US: {word.pronunciationUs}
                    </Text>
                    <Text style={styles.pronunciation}>
                      UK: {word.pronunciationUk}
                    </Text>
                  </View>

                  {exampleSentences.length > 0 && (
                    <View style={styles.examples}>
                      <Text style={styles.exampleLabel}>例文:</Text>
                      {exampleSentences
                        .slice(0, 2)
                        .map((example: any, index: number) => (
                          <View key={index} style={styles.exampleItem}>
                            <Text style={styles.exampleEnglish}>
                              {example.english}
                            </Text>
                            <Text style={styles.exampleJapanese}>
                              {example.japanese}
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}

                  <Text style={styles.tapHint}>タップして単語に戻る</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1,
  },
  leftIndicator: {
    left: 20,
    backgroundColor: '#FF6B6B',
  },
  rightIndicator: {
    right: 20,
    backgroundColor: '#4ECDC4',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frontSide: {
    alignItems: 'center',
  },
  word: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 30,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  backSide: {
    alignItems: 'center',
  },
  wordSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  definition: {
    fontSize: 20,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  partOfSpeech: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  pronunciations: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pronunciationLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  pronunciation: {
    fontSize: 14,
    color: '#34495E',
    fontFamily: 'monospace',
  },
  examples: {
    width: '100%',
    marginBottom: 20,
  },
  exampleLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
    textAlign: 'center',
  },
  exampleItem: {
    marginBottom: 10,
  },
  exampleEnglish: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 3,
  },
  exampleJapanese: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
    marginTop: 20,
  },
});
```

### 2. Audio Service Implementation

```typescript
// src/services/AudioService.ts
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface AudioCacheItem {
  uri: string;
  timestamp: number;
}

interface AudioConfig {
  speechKey: string;
  speechRegion: string;
}

export class AudioService {
  private static instance: AudioService;
  private config: AudioConfig | null = null;
  private audioCache = new Map<string, string>();
  private cacheDirectory = `${FileSystem.documentDirectory}audio_cache/`;
  private readonly CACHE_EXPIRY_DAYS = 30;
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached items

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async initialize() {
    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, {
          intermediates: true,
        });
      }

      // Load configuration
      await this.loadConfiguration();

      // Load existing cache
      await this.loadCache();

      console.log('Audio service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  private async loadConfiguration() {
    try {
      const response = await fetch('http://localhost:5000/api/azure-config');
      this.config = await response.json();
    } catch (error) {
      console.error('Failed to load audio configuration:', error);
    }
  }

  private async loadCache() {
    try {
      const cacheData = await AsyncStorage.getItem('audio_cache_index');
      if (cacheData) {
        const cacheIndex: Record<string, AudioCacheItem> =
          JSON.parse(cacheData);
        const now = Date.now();
        const expiryThreshold =
          now - this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        for (const [key, item] of Object.entries(cacheIndex)) {
          if (item.timestamp > expiryThreshold) {
            const fileExists = await FileSystem.getInfoAsync(item.uri);
            if (fileExists.exists) {
              this.audioCache.set(key, item.uri);
            }
          } else {
            // Clean up expired cache file
            try {
              await FileSystem.deleteAsync(item.uri, { idempotent: true });
            } catch (e) {
              // File might not exist, ignore error
            }
          }
        }

        await this.saveCacheIndex();
      }
    } catch (error) {
      console.error('Failed to load audio cache:', error);
    }
  }

  private async saveCacheIndex() {
    try {
      const cacheIndex: Record<string, AudioCacheItem> = {};
      for (const [key, uri] of this.audioCache.entries()) {
        cacheIndex[key] = {
          uri,
          timestamp: Date.now(),
        };
      }
      await AsyncStorage.setItem(
        'audio_cache_index',
        JSON.stringify(cacheIndex),
      );
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  private getCacheKey(word: string, accent: 'us' | 'uk' | 'au'): string {
    return `${word}_${accent}`;
  }

  async speak(word: string, accent: 'us' | 'uk' | 'au' = 'us'): Promise<void> {
    if (!this.config) {
      throw new Error('Audio service not configured');
    }

    const cacheKey = this.getCacheKey(word, accent);

    try {
      let audioUri = this.audioCache.get(cacheKey);

      if (!audioUri) {
        // Generate and cache audio
        audioUri = await this.generateAndCacheAudio(word, accent, cacheKey);
      }

      // Play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
      );

      // Clean up sound object after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error(`Failed to play audio for "${word}" (${accent}):`, error);
      throw error;
    }
  }

  private async generateAndCacheAudio(
    word: string,
    accent: 'us' | 'uk' | 'au',
    cacheKey: string,
  ): Promise<string> {
    const voiceMap = {
      us: 'en-US-AriaNeural',
      uk: 'en-GB-SoniaNeural',
      au: 'en-AU-NatashaNeural',
    };

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceMap[accent]}">
          <prosody rate="0.9">
            ${word}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(
      `https://${
        this.config!.speechRegion
      }.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config!.speechKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        },
        body: ssml,
      },
    );

    if (!response.ok) {
      throw new Error(`Azure TTS request failed: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioData = await audioBlob.arrayBuffer();

    // Save to file system
    const fileName = `${cacheKey}.mp3`;
    const fileUri = `${this.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      fileUri,
      btoa(String.fromCharCode(...new Uint8Array(audioData))),
      { encoding: FileSystem.EncodingType.Base64 },
    );

    // Update cache
    this.audioCache.set(cacheKey, fileUri);

    // Clean up cache if too large
    if (this.audioCache.size > this.MAX_CACHE_SIZE) {
      await this.cleanupCache();
    }

    await this.saveCacheIndex();

    console.log(`Cached audio for "${word}" (${accent})`);
    return fileUri;
  }

  private async cleanupCache() {
    // Remove oldest 20 items
    const entries = Array.from(this.audioCache.entries());
    const toRemove = entries.slice(0, 20);

    for (const [key, uri] of toRemove) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        this.audioCache.delete(key);
      } catch (error) {
        console.error('Failed to delete cached audio file:', error);
      }
    }

    console.log(`Cleaned up ${toRemove.length} audio cache files`);
  }

  async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      for (const uri of this.audioCache.values()) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      // Clear cache directory
      await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, {
        intermediates: true,
      });

      // Clear in-memory cache
      this.audioCache.clear();

      // Clear AsyncStorage index
      await AsyncStorage.removeItem('audio_cache_index');

      console.log('Audio cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear audio cache:', error);
    }
  }

  getCacheStats(): { cached: number; maxSize: number } {
    return {
      cached: this.audioCache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

export const audioService = AudioService.getInstance();
```

### 3. Vocabulary Service

```typescript
// src/services/VocabularyService.ts
import {
  VocabularyWord,
  CreateVocabularyWord,
  UpdateVocabularyWord,
} from '../types/vocabulary';

const API_BASE_URL = 'http://localhost:5000/api';

class VocabularyService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json();
  }

  // Basic CRUD operations
  async getAll(): Promise<VocabularyWord[]> {
    return this.makeRequest('/vocabulary');
  }

  async getById(id: number): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}`);
  }

  async create(word: CreateVocabularyWord): Promise<VocabularyWord> {
    return this.makeRequest('/vocabulary', {
      method: 'POST',
      body: JSON.stringify(word),
    });
  }

  async update(
    id: number,
    word: UpdateVocabularyWord,
  ): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(word),
    });
  }

  async delete(id: number): Promise<void> {
    await this.makeRequest(`/vocabulary/${id}`, {
      method: 'DELETE',
    });
  }

  // Study modes
  async getRandomWords(count: number = 30): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/random/${count}`);
  }

  async getWordsByTag(tag: string): Promise<VocabularyWord[]> {
    return this.makeRequest(`/vocabulary/tag/${encodeURIComponent(tag)}`);
  }

  async getDailyChallengeWords(): Promise<VocabularyWord[]> {
    return this.makeRequest('/vocabulary/daily-challenge');
  }

  async getDailyChallengeStatus(): Promise<{
    completed: boolean;
    date: string;
    stats?: any;
  }> {
    return this.makeRequest('/vocabulary/daily-challenge/status');
  }

  async completeDailyChallenge(stats: {
    totalWords: number;
    correctWords: number;
    accuracy: number;
  }): Promise<void> {
    await this.makeRequest('/vocabulary/daily-challenge/complete', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
  }

  // Spaced repetition
  async updateSpacedRepetition(
    id: number,
    known: boolean,
  ): Promise<VocabularyWord> {
    return this.makeRequest(`/vocabulary/${id}/spaced-repetition`, {
      method: 'PUT',
      body: JSON.stringify({ known }),
    });
  }

  async getWordsForReview(limit?: number): Promise<VocabularyWord[]> {
    const endpoint = limit
      ? `/vocabulary/review/${limit}`
      : '/vocabulary/review';
    return this.makeRequest(endpoint);
  }

  // Search and filtering
  async searchWords(query: string): Promise<VocabularyWord[]> {
    return this.makeRequest(
      `/vocabulary/search?q=${encodeURIComponent(query)}`,
    );
  }

  async getAvailableTags(): Promise<string[]> {
    return this.makeRequest('/vocabulary/tags');
  }

  async getCategories(): Promise<any[]> {
    return this.makeRequest('/categories');
  }
}

export const vocabularyService = new VocabularyService();
```

### 4. Custom Hooks

```typescript
// src/hooks/useVocabulary.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyService } from '../services/VocabularyService';
import {
  VocabularyWord,
  CreateVocabularyWord,
  UpdateVocabularyWord,
} from '../types/vocabulary';

export const useVocabularyWords = () => {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: () => vocabularyService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVocabularyWord = (id: number) => {
  return useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => vocabularyService.getById(id),
    enabled: !!id,
  });
};

export const useCreateWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (word: CreateVocabularyWord) => vocabularyService.create(word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};

export const useUpdateWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, word }: { id: number; word: UpdateVocabularyWord }) =>
      vocabularyService.update(id, word),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.setQueryData(['vocabulary', data.id], data);
    },
  });
};

export const useDeleteWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => vocabularyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};

export const useRandomWords = (count: number = 30) => {
  return useQuery({
    queryKey: ['vocabulary', 'random', count],
    queryFn: () => vocabularyService.getRandomWords(count),
    enabled: false, // Manual trigger
  });
};

export const useWordsByTag = (tag: string) => {
  return useQuery({
    queryKey: ['vocabulary', 'tag', tag],
    queryFn: () => vocabularyService.getWordsByTag(tag),
    enabled: !!tag,
  });
};

export const useDailyChallengeWords = () => {
  return useQuery({
    queryKey: ['vocabulary', 'daily-challenge'],
    queryFn: () => vocabularyService.getDailyChallengeWords(),
    enabled: false, // Manual trigger
  });
};

export const useDailyChallengeStatus = () => {
  return useQuery({
    queryKey: ['vocabulary', 'daily-challenge', 'status'],
    queryFn: () => vocabularyService.getDailyChallengeStatus(),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useCompleteDailyChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stats: {
      totalWords: number;
      correctWords: number;
      accuracy: number;
    }) => vocabularyService.completeDailyChallenge(stats),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vocabulary', 'daily-challenge', 'status'],
      });
    },
  });
};

export const useUpdateSpacedRepetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, known }: { id: number; known: boolean }) =>
      vocabularyService.updateSpacedRepetition(id, known),
    onSuccess: (data) => {
      queryClient.setQueryData(['vocabulary', data.id], data);
      // Optionally invalidate vocabulary list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};
```

## Navigation Setup

```typescript
// src/navigation/MainNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import VocabularyScreen from '../screens/VocabularyScreen';
import StudyScreen from '../screens/StudyScreen';
import SwipeStudyScreen from '../screens/SwipeStudyScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import AddWordScreen from '../screens/AddWordScreen';

import { RootStackParamList, MainTabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Vocabulary':
              iconName = 'book';
              break;
            case 'Study':
              iconName = 'school';
              break;
            case 'Progress':
              iconName = 'analytics';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{ title: '語彙' }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{ title: '学習' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: '進捗' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '設定' }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SwipeStudy"
          component={SwipeStudyScreen}
          options={{
            title: '学習',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="WordDetail"
          component={WordDetailScreen}
          options={{ title: '単語詳細' }}
        />
        <Stack.Screen
          name="AddWord"
          component={AddWordScreen}
          options={{
            title: '単語追加',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
```

このガイドにより、React Native 開発者は Web 版と同等の機能を持つ iOS アプリを構築できます。特に重要なのは、スワイプアニメーション、音声機能、間隔反復システムの実装です。
