// mobile/src/screens/SwipeStudyScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Alert,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import Tts from 'react-native-tts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  VocabularyWord,
  NavigationProps,
  StudySession,
  AccentType,
} from '../types';
import { vocabularyService } from '../services/VocabularyService';
import OptimizedSwipeCard from '../components/OptimizedSwipeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type GestureEvent = PanGestureHandlerGestureEvent;

export default function SwipeStudyScreen({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [session, setSession] = useState<StudySession>({ known: 0, needReview: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // shared values for animation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate     = useSharedValue(0);
  const scale      = useSharedValue(1);

  const nextCard = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    rotate.value     = 0;
    scale.value      = 1;
    setShowAnswer(false);
    setCurrentIndex(i => i + 1);
  }, [translateX, translateY, rotate, scale]);

  const showResults = useCallback(() => {
    const { known, total } = session;
    const pct = total ? Math.round((known / total) * 100) : 0;
    Alert.alert(
      t('study.resultsTitle') ?? '学習完了',
      `正解: ${known}/${total}\n正解率: ${pct}%`,
      [
        { text: t('button.back') ?? 'ホームに戻る', onPress: () => navigation.navigate('Main') },
        { text: t('button.retry') ?? 'もう一度', onPress: () => {
            setSession({ known: 0, needReview: 0, total });
            setCurrentIndex(0);
          }
        },
      ]
    );
  }, [navigation, session, t]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const mode = (route.params?.mode as 'random' | 'daily' | 'tag') || 'random';
        let data: VocabularyWord[];
        if (mode === 'daily')         data = await vocabularyService.getDailyChallenge();
        else if (mode === 'tag')      data = await vocabularyService.getByTag(route.params.tag as string);
        else                          data = await vocabularyService.getRandom(30);
        setWords(data);
        setSession({ known: 0, needReview: 0, total: data.length });
      } catch (e) {
        console.error(e);
        Alert.alert('エラー', '単語の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    });
  }, [route.params]);

  useEffect(() => {
    Tts.setDefaultRate(0.8);
    Tts.setDefaultPitch(1.0);
  }, []);

  const languageMap: Record<AccentType, string> = useMemo(
    () => ({ us: 'en-US', uk: 'en-GB', au: 'en-AU' }), []
  );

  const speakWord = useCallback((accent: AccentType = 'us') => {
    const w = words[currentIndex]?.word;
    if (!w) return;
    Tts.setDefaultLanguage(languageMap[accent]);
    Tts.speak(w);
  }, [words, currentIndex, languageMap]);

  const gestureHandler = useAnimatedGestureHandler<GestureEvent>({
    onStart: () => { scale.value = withTiming(1.05, { duration: 100 }); },
    onActive: ({ translationX, translationY }) => {
      translateX.value = translationX;
      translateY.value = translationY * 0.2;
      rotate.value     = interpolate(
        translationX,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-25, 0, 25],
        Extrapolate.CLAMP
      );
    },
    onEnd: ({ translationX }) => {
      scale.value = withSpring(1, { damping: 10, stiffness: 150 });
      const threshold = SCREEN_WIDTH * 0.3;
      if (Math.abs(translationX) < threshold) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value     = withSpring(0);
        return;
      }
      const dir = translationX > 0 ? 'right' : 'left';
      const toX = dir === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      translateX.value = withTiming(toX, { duration: 200 });
      rotate.value     = withTiming(dir === 'right' ? 25 : -25, { duration: 200 });

      runOnJS(() => {
        const known = dir === 'right';
        setSession(s => ({
          known:      s.known + (known ? 1 : 0),
          needReview: s.needReview + (known ? 0 : 1),
          total:      s.total,
        }));
        vocabularyService
          .updateProgress(words[currentIndex].id, known)
          .catch(() => {});
        if (currentIndex + 1 >= words.length) showResults();
        else nextCard();
      })();
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate:      `${rotate.value}deg` },
      { scale:        scale.value },
    ],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH * 0.5],
      [1, 0.8],
      Extrapolate.CLAMP
    ),
  }));

  if (loading) {
    return (
      <SafeAreaView style={{
        flex: 1, backgroundColor: colors.background,
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text>{t('loading') ?? '読み込み中…'}</Text>
      </SafeAreaView>
    );
  }
  if (!words.length) {
    return (
      <SafeAreaView style={{
        flex: 1, backgroundColor: colors.background,
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text>{t('noWords') ?? '単語が見つかりません'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
            cardStyle,
          ]}
        >
          <OptimizedSwipeCard
            word={words[currentIndex]}
            showAnswer={showAnswer}
            colors={{
              surface:       colors.surface,
              text:          colors.text,
              textSecondary: colors.textSecondary,
              border:        colors.border,
              primary:       colors.primary,
            }}
            gestureHandler={gestureHandler}
            cardStyle={cardStyle}
            onShowAnswer={() => setShowAnswer(v => !v)}
            onSpeakWord={speakWord}
            onKnownPress={() => {
              vocabularyService.updateProgress(words[currentIndex].id, true).catch(() => {});
              setSession(s => ({ ...s, known: s.known + 1 }));
              nextCard();
            }}
            onNeedReviewPress={() => {
              vocabularyService.updateProgress(words[currentIndex].id, false).catch(() => {});
              setSession(s => ({ ...s, needReview: s.needReview + 1 }));
              nextCard();
            }}
          />
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
}