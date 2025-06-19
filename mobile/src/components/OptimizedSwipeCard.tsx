import React, {memo, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {VocabularyWord} from '../types';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = screenHeight * 0.6;

interface OptimizedSwipeCardProps {
  word: VocabularyWord;
  showAnswer: boolean;
  gestureHandler: any;
  cardStyle: any;
  colors: any;
  onShowAnswer: () => void;
  onSpeakWord: (accent: 'us' | 'uk' | 'au') => void;
  onKnownPress: () => void;
  onNeedReviewPress: () => void;
}

// Optimized SwipeCard component with React.memo
const OptimizedSwipeCard = memo(({
  word,
  showAnswer,
  gestureHandler,
  cardStyle,
  colors,
  onShowAnswer,
  onSpeakWord,
  onKnownPress,
  onNeedReviewPress,
}: OptimizedSwipeCardProps) => {
  
  // Memoized accent handlers
  const handleSpeakUS = useCallback(() => onSpeakWord('us'), [onSpeakWord]);
  const handleSpeakUK = useCallback(() => onSpeakWord('uk'), [onSpeakWord]);
  const handleSpeakAU = useCallback(() => onSpeakWord('au'), [onSpeakWord]);

  // Memoized difficulty color
  const difficultyColor = useMemo(() => {
    switch (word.difficulty) {
      case 1: return '#10b981';
      case 2: return '#f59e0b';
      case 3: return '#f97316';
      case 4: return '#ef4444';
      default: return '#6b7280';
    }
  }, [word.difficulty]);

  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 20,
      padding: 24,
      margin: 20,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      justifyContent: 'space-between',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    wordText: {
      fontSize: 32,
      fontWeight: 'bold',
      flex: 1,
      color: colors.text,
    },
    difficultyBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: difficultyColor,
    },
    difficultyText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    pronunciationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    pronunciationButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pronunciationText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    showAnswerButton: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      backgroundColor: colors.primary,
      marginBottom: 20,
    },
    showAnswerText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    definitionText: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 28,
    },
    exampleText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 20,
    },
    actionButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      minWidth: 100,
      alignItems: 'center',
    },
    knownButton: {
      backgroundColor: '#10b981',
    },
    reviewButton: {
      backgroundColor: '#ef4444',
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    swipeHint: {
      position: 'absolute',
      bottom: 8,
      alignSelf: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.7,
    },
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, {backgroundColor: colors.surface}, cardStyle]}>
        <View style={styles.cardHeader}>
          <Text style={styles.wordText}>{word.word}</Text>
          {word.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{word.difficulty}</Text>
            </View>
          )}
        </View>

        <View style={styles.pronunciationContainer}>
          <TouchableOpacity style={styles.pronunciationButton} onPress={handleSpeakUS}>
            <Icon name="volume-up" size={20} color={colors.primary} />
            <Text style={styles.pronunciationText}>US</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pronunciationButton} onPress={handleSpeakUK}>
            <Icon name="volume-up" size={20} color={colors.primary} />
            <Text style={styles.pronunciationText}>UK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pronunciationButton} onPress={handleSpeakAU}>
            <Icon name="volume-up" size={20} color={colors.primary} />
            <Text style={styles.pronunciationText}>AU</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {!showAnswer ? (
            <TouchableOpacity style={styles.showAnswerButton} onPress={onShowAnswer}>
              <Text style={styles.showAnswerText}>答えを見る</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.definitionText}>{word.definition}</Text>
              {word.exampleSentences && (
                <Text style={styles.exampleText}>
                  {typeof word.exampleSentences === 'string' 
                    ? word.exampleSentences.split('\n')[0]
                    : word.exampleSentences[0]?.english || ''
                  }
                </Text>
              )}
            </>
          )}
        </View>

        {showAnswer && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.reviewButton]} 
              onPress={onNeedReviewPress}
            >
              <Text style={styles.buttonText}>復習</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.knownButton]} 
              onPress={onKnownPress}
            >
              <Text style={styles.buttonText}>知っている</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.swipeHint}>スワイプして次へ</Text>
      </Animated.View>
    </PanGestureHandler>
  );
});

OptimizedSwipeCard.displayName = 'OptimizedSwipeCard';

export default OptimizedSwipeCard;