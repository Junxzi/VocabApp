import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  InteractionManager,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Tts from 'react-native-tts';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {VocabularyWord, NavigationProps, StudySession} from '../types';
import {vocabularyService} from '../services/VocabularyService';
import OptimizedSwipeCard from '../components/OptimizedSwipeCard';

// ...[imports は変更なし]

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = screenHeight * 0.6;

export default function SwipeStudyScreen({navigation, route}: NavigationProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [session, setSession] = useState<StudySession>({known: 0, needReview: 0, total: 0});
  const [loading, setLoading] = useState(true);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    loadStudyWords();
    initializeTTS();
  }, []);

  const loadStudyWords = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(async () => {
        const studyMode = route.params?.mode || 'random';
        let data: VocabularyWord[];

        if (studyMode === 'random') {
          data = await vocabularyService.getRandomWords(30);
        } else if (studyMode === 'daily') {
          data = await vocabularyService.getDailyChallengeWords();
        } else {
          data = await vocabularyService.getWordsByTag(route.params?.tag);
        }

        setWords(data);
        setSession(prev => ({...prev, total: data.length}));
        setLoading(false);
      });
    } catch (error) {
      console.error('Failed to load study words:', error);
      setLoading(false);
    }
  }, [route.params]);

  const initializeTTS = useCallback(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.8);
    Tts.setDefaultPitch(1.0);
  }, []);

  const languageMap = useMemo(() => ({
    us: 'en-US',
    uk: 'en-GB',
    au: 'en-AU',
  }), []);

  const speakWord = useCallback((accent: 'us' | 'uk' | 'au' = 'us') => {
    const word = words[currentIndex]?.word;
    if (!word) return;
    Tts.setDefaultLanguage(languageMap[accent]);
    Tts.speak(word);
  }, [words, currentIndex, languageMap]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withTiming(1.05, { duration: 100 });
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      rotate.value = interpolate(
        event.translationX,
        [-screenWidth, 0, screenWidth],
        [-30, 0, 30],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      scale.value = withTiming(1, { duration: 200 });
      const threshold = screenWidth * 0.3;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 1000) {
        const direction = event.translationX > 0 || velocity > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? screenWidth * 1.2 : -screenWidth * 1.2;

        translateX.value = withTiming(targetX, { duration: 300 });
        rotate.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
        runOnJS(handleSwipe)(direction);
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        rotate.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    },
  });

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const known = direction === 'right';
    setSession(prev => ({
      ...prev,
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
    }));
    InteractionManager.runAfterInteractions(() => {
      vocabularyService.updateWordProgress(words[currentIndex].id, known);
    });
    setTimeout(() => {
      if (currentIndex >= words.length - 1) {
        showResults();
      } else {
        nextCard();
      }
    }, 300);
  }, [currentIndex, words.length, words]);

  const nextCard = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    setShowAnswer(false);
    translateX.value = 0;
    translateY.value = 0;
    rotate.value = 0;
    scale.value = 1;
  }, [translateX, translateY, rotate, scale]);

  const showResults = useCallback(() => {
    const accuracy = Math.round((session.known / words.length) * 100);
    Alert.alert(
      '学習完了',
      `正解: ${session.known}/${words.length}\n正解率: ${accuracy}%`,
      [
        {text: 'ホームに戻る', onPress: () => navigation.navigate('Main')},
        {text: 'もう一度', onPress: () => restartStudy()},
      ]
    );
  }, [session.known, words.length, navigation]);

  const restartStudy = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSession({known: 0, needReview: 0, total: words.length});
    translateX.value = 0;
    translateY.value = 0;
    rotate.value = 0;
    scale.value = 1;
  }, [words.length, translateX, translateY, rotate, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {rotate: `${rotate.value}deg`},
      {scale: scale.value},
    ],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.5],
      [1, 0.8],
      Extrapolate.CLAMP
    ),
  }), [translateX, translateY, rotate, scale]);

  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);
  const handleShowAnswer = useCallback(() => setShowAnswer(!showAnswer), [showAnswer]);
  const handleKnownPress = useCallback(() => handleSwipe('right'), [handleSwipe]);
  const handleNeedReviewPress = useCallback(() => handleSwipe('left'), [handleSwipe]);

  const styles = StyleSheet.create({
    container: {flex: 1},
    cardContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    // 必要に応じてここにスタイル定義を続けてね
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <Text>読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <Text>単語が見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.cardContainer}>
        <OptimizedSwipeCard
          word={currentWord}
          showAnswer={showAnswer}
          gestureHandler={gestureHandler}
          cardStyle={cardStyle}
          colors={colors}
          onShowAnswer={handleShowAnswer}
          onSpeakWord={speakWord}
          onKnownPress={handleKnownPress}
          onNeedReviewPress={handleNeedReviewPress}
        />
      </View>
    </SafeAreaView>
  );
}