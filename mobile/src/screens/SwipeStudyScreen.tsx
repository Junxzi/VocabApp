import React, {useState, useEffect, useCallback, useMemo, memo} from 'react';
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
      // Use InteractionManager to defer heavy operations after interactions
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

  // Memoize language map to avoid recreation on each call
  const languageMap = useMemo(() => ({
    us: 'en-US',
    uk: 'en-GB',
    au: 'en-AU',
  }), []);

  const speakWord = useCallback((accent: 'us' | 'uk' | 'au' = 'us') => {
    if (!words[currentIndex]) return;
    
    const word = words[currentIndex].word;
    Tts.setDefaultLanguage(languageMap[accent]);
    Tts.speak(word);
  }, [words, currentIndex, languageMap]);

  // Optimized gesture handler with better performance
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withTiming(1.05, { duration: 100 });
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3; // Reduced vertical movement
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

    // Update word progress asynchronously
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

  // Optimized animated styles with better performance
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

  // Memoized current word to prevent unnecessary re-renders
  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  // Memoized handlers for better performance
  const handleShowAnswer = useCallback(() => {
    setShowAnswer(!showAnswer);
  }, [showAnswer]);

  const handleKnownPress = useCallback(() => {
    handleSwipe('right');
  }, [handleSwipe]);

  const handleNeedReviewPress = useCallback(() => {
    handleSwipe('left');
  }, [handleSwipe]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: colors.text}]}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: colors.text}]}>学習する単語がありません</Text>
          <TouchableOpacity 
            style={[styles.backButton, {backgroundColor: colors.primary}]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, {color: colors.background}]}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = words[currentIndex];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    progress: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    cardContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    audioButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: colors.primary + '20',
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wordText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },
    pronunciation: {
      fontSize: 18,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginBottom: 16,
    },
    partOfSpeech: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 24,
    },
    partOfSpeechText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    definition: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 24,
    },
    examples: {
      width: '100%',
    },
    exampleItem: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    exampleEnglish: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    exampleJapanese: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    instructions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 40,
      paddingVertical: 20,
    },
    instructionItem: {
      alignItems: 'center',
    },
    instructionText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 24,
    },
  });

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, {backgroundColor: colors.primary}]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, {color: colors.background}]}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>

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

      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Icon name="arrow-back" size={32} color={colors.error} />
          <Text style={styles.instructionText}>復習が必要</Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="touch-app" size={32} color={colors.textSecondary} />
          <Text style={styles.instructionText}>タップで答え表示</Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="arrow-forward" size={32} color={colors.success} />
          <Text style={styles.instructionText}>覚えた</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}