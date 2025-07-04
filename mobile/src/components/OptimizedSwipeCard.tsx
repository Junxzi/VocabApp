// mobile/src/components/OptimizedSwipeCard.tsx

import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { PanGestureHandlerGestureEvent, PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VocabularyWord, AccentType } from '../types';
import { getDifficultyColor } from '../lib/difficulty';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;
const CARD_H = SCREEN_H * 0.6;

export interface OptimizedSwipeCardProps {
  word: VocabularyWord;
  showAnswer: boolean;
  colors: {
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
  gestureHandler: (e: PanGestureHandlerGestureEvent) => void;
  cardStyle: any;
  onShowAnswer: () => void;
  onSpeakWord: (accent: AccentType) => void;
  onKnownPress: () => void;
  onNeedReviewPress: () => void;
}

const OptimizedSwipeCard = memo(({ 
  word,
  showAnswer,
  colors,
  gestureHandler,
  cardStyle,
  onShowAnswer,
  onSpeakWord,
  onKnownPress,
  onNeedReviewPress,
}: OptimizedSwipeCardProps) => {
  const handleSpeak = useCallback((acc: AccentType) => onSpeakWord(acc), [onSpeakWord]);
  const difficultyColor = useMemo(
    () => getDifficultyColor(word.difficulty),
    [word.difficulty]
  );

  const styles = useMemo(() =>
    StyleSheet.create({
      card: {
        width: CARD_W, height: CARD_H,
        borderRadius: 20, padding: 24, margin: 20,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
      justifyContent: 'space-between',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    word: { fontSize: 32, fontWeight: 'bold', flex: 1, color: colors.text },
    badge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: difficultyColor },
    badgeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    pron: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
    pronBtn: { padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    pronText: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    showBtn: { padding: 16, borderRadius: 12, backgroundColor: colors.primary },
    showText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    def: { fontSize: 18, color: colors.text, textAlign: 'center', marginVertical: 20, lineHeight: 28 },
    example: { fontSize: 14, fontStyle: 'italic', color: colors.textSecondary, textAlign: 'center' },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
    actionBtn: { padding: 12, borderRadius: 12, minWidth: 100, alignItems: 'center' },
    known: { backgroundColor: '#10b981' },
    review: { backgroundColor: '#ef4444' },
    actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    hint: { position: 'absolute', bottom: 8, alignSelf: 'center', fontSize: 12, color: colors.textSecondary, opacity: 0.7 },
  }), [colors, difficultyColor]);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.header}>
          <Text style={styles.word}>{word.word}</Text>
          {word.difficulty != null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{word.difficulty}</Text>
            </View>
          )}
        </View>
        <View style={styles.pron}>
          {(['us','uk','au'] as AccentType[]).map(acc => (
            <TouchableOpacity key={acc} style={styles.pronBtn} onPress={() => handleSpeak(acc)}>
              <Icon name="volume-up" size={20} color={colors.primary} />
              <Text style={styles.pronText}>{acc.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.center}>
          {!showAnswer ? (
            <TouchableOpacity style={styles.showBtn} onPress={onShowAnswer}>
              <Text style={styles.showText}>答えを見る</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.def}>{word.definition}</Text>
              {word.exampleSentences && (
                <Text style={styles.example}>
                  {typeof word.exampleSentences === 'string'
                    ? JSON.parse(word.exampleSentences)[0]?.english || ''
                    : ''}
                </Text>
              )}
            </>
          )}
        </View>
        {showAnswer && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.review]} onPress={onNeedReviewPress}>
              <Text style={styles.actionText}>復習</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.known]} onPress={onKnownPress}>
              <Text style={styles.actionText}>知っている</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.hint}>スワイプして次へ</Text>
      </Animated.View>
    </PanGestureHandler>
  );
});

OptimizedSwipeCard.displayName = 'OptimizedSwipeCard';
export default OptimizedSwipeCard;