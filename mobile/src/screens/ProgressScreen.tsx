// mobile/src/screens/ProgressScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { VocabularyWord } from '../types';
import { vocabularyService } from '../services/VocabularyService';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch all words once on mount
  const loadProgress = useCallback(async () => {
    try {
      const data = await vocabularyService.getAll();
      setWords(data);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // compute stats
  const stats = useMemo(() => {
    const totalWords = words.length;
    const learned = words.filter(w => w.difficulty !== undefined && w.difficulty !== null).length;
    const easy = words.filter(w => w.difficulty === 1).length;
    const medium = words.filter(w => w.difficulty === 2).length;
    const hard = words.filter(w => w.difficulty === 3 || w.difficulty === 4).length;
    const avgDifficulty =
      learned > 0
        ? words.reduce((sum, w) => sum + (w.difficulty || 0), 0) / learned
        : 0;

    return { totalWords, learned, easy, medium, hard, avgDifficulty };
  }, [words]);

  // small progress bar component
  const ProgressBar = ({
    value,
    max,
    color,
  }: {
    value: number;
    max: number;
    color: string;
  }) => (
    <View
      style={[
        styles.barBackground,
        { backgroundColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: max > 0 ? `${(value / max) * 100}%` : '0%',
          },
        ]}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top‐line stats */}
        <View style={styles.grid}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.value,
                { color: colors.text },
              ]}
            >
              {stats.totalWords}
            </Text>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary },
              ]}
            >
              {t('progress.totalWords')}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.value,
                { color: colors.text },
              ]}
            >
              {stats.learned}
            </Text>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary },
              ]}
            >
              {t('progress.reviewed')}
            </Text>
          </View>
        </View>

        {/* Average difficulty */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            {t('progress.averageDifficulty')}
          </Text>
          <View
            style={[
              styles.averageCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.averageValue,
                { color: colors.primary },
              ]}
            >
              {stats.avgDifficulty.toFixed(1)}
            </Text>
            <Text
              style={[
                styles.averageLabel,
                { color: colors.textSecondary },
              ]}
            >
              {stats.avgDifficulty < 2
                ? t('progress.distribution.easy')
                : stats.avgDifficulty < 3
                ? t('progress.distribution.medium')
                : t('progress.distribution.hard')}
            </Text>
          </View>
        </View>

        {/* Difficulty distribution */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            {t('progress.sectionDistribution')}
          </Text>

          {/* Easy */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: '#10b981' },
                ]}
              />
              <Text
                style={[
                  styles.rowText,
                  { color: colors.text },
                ]}
              >
                {t('progress.distribution.easy')}
              </Text>
            </View>
            <Text
              style={[
                styles.rowCount,
                { color: colors.text },
              ]}
            >
              {stats.easy}
            </Text>
            <ProgressBar
              value={stats.easy}
              max={stats.totalWords}
              color="#10b981"
            />
          </View>

          {/* Medium */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: '#f59e0b' },
                ]}
              />
              <Text
                style={[
                  styles.rowText,
                  { color: colors.text },
                ]}
              >
                {t('progress.distribution.medium')}
              </Text>
            </View>
            <Text
              style={[
                styles.rowCount,
                { color: colors.text },
              ]}
            >
              {stats.medium}
            </Text>
            <ProgressBar
              value={stats.medium}
              max={stats.totalWords}
              color="#f59e0b"
            />
          </View>

          {/* Hard */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: '#ef4444' },
                ]}
              />
              <Text
                style={[
                  styles.rowText,
                  { color: colors.text },
                ]}
              >
                {t('progress.distribution.hard')}
              </Text>
            </View>
            <Text
              style={[
                styles.rowCount,
                { color: colors.text },
              ]}
            >
              {stats.hard}
            </Text>
            <ProgressBar
              value={stats.hard}
              max={stats.totalWords}
              color="#ef4444"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  card: {
    width: (screenWidth - 60) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  averageCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  averageValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  averageLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rowText: {
    fontSize: 16,
  },
  rowCount: {
    width: 32,
    textAlign: 'right',
    marginRight: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  barBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
});