import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {VocabularyWord} from '../types';
import {vocabularyService} from '../services/VocabularyService';

const {width: screenWidth} = Dimensions.get('window');

export default function ProgressScreen() {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await vocabularyService.getAllWords();
      setWords(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setLoading(false);
    }
  };

  const getProgressStats = () => {
    const totalWords = words.length;
    const wordsWithDifficulty = words.filter(w => w.difficulty).length;
    const easyWords = words.filter(w => w.difficulty === 1).length;
    const mediumWords = words.filter(w => w.difficulty === 2).length;
    const hardWords = words.filter(w => w.difficulty === 3 || w.difficulty === 4).length;
    const averageDifficulty = wordsWithDifficulty > 0 
      ? words.reduce((sum, w) => sum + (w.difficulty || 0), 0) / wordsWithDifficulty 
      : 0;

    return {
      totalWords,
      wordsWithDifficulty,
      easyWords,
      mediumWords,
      hardWords,
      averageDifficulty,
    };
  };

  const stats = getProgressStats();

  const ProgressBar = ({value, max, color}: {value: number; max: number; color: string}) => (
    <View style={[styles.progressBarContainer, {backgroundColor: colors.border}]}>
      <View 
        style={[
          styles.progressBarFill, 
          {backgroundColor: color, width: `${max > 0 ? (value / max) * 100 : 0}%`}
        ]} 
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
      marginBottom: 24,
    },
    statCard: {
      width: (screenWidth - 56) / 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    difficultyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    difficultyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    difficultyDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    difficultyLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    difficultyCount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 12,
    },
    progressBarContainer: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      width: 80,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    averageCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    averageValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    averageLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.progress')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWords}</Text>
            <Text style={styles.statLabel}>総単語数</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.wordsWithDifficulty}</Text>
            <Text style={styles.statLabel}>学習済み</Text>
          </View>
        </View>

        {/* Average Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>平均難易度</Text>
          <View style={styles.averageCard}>
            <Text style={styles.averageValue}>
              {stats.averageDifficulty.toFixed(1)}
            </Text>
            <Text style={styles.averageLabel}>
              {stats.averageDifficulty < 2 ? '簡単' : 
               stats.averageDifficulty < 3 ? '普通' : '難しい'}
            </Text>
          </View>
        </View>

        {/* Difficulty Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>難易度別分布</Text>
          
          <View style={styles.difficultyItem}>
            <View style={styles.difficultyLeft}>
              <View style={[styles.difficultyDot, {backgroundColor: '#10b981'}]} />
              <Text style={styles.difficultyLabel}>簡単 (Rank 1)</Text>
            </View>
            <Text style={styles.difficultyCount}>{stats.easyWords}</Text>
            <ProgressBar value={stats.easyWords} max={stats.totalWords} color="#10b981" />
          </View>

          <View style={styles.difficultyItem}>
            <View style={styles.difficultyLeft}>
              <View style={[styles.difficultyDot, {backgroundColor: '#f59e0b'}]} />
              <Text style={styles.difficultyLabel}>普通 (Rank 2)</Text>
            </View>
            <Text style={styles.difficultyCount}>{stats.mediumWords}</Text>
            <ProgressBar value={stats.mediumWords} max={stats.totalWords} color="#f59e0b" />
          </View>

          <View style={styles.difficultyItem}>
            <View style={styles.difficultyLeft}>
              <View style={[styles.difficultyDot, {backgroundColor: '#ef4444'}]} />
              <Text style={styles.difficultyLabel}>難しい (Rank 3-4)</Text>
            </View>
            <Text style={styles.difficultyCount}>{stats.hardWords}</Text>
            <ProgressBar value={stats.hardWords} max={stats.totalWords} color="#ef4444" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}