import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavigationProps } from '../types';
import { vocabularyService } from '../services/VocabularyService';

export default function StudyScreen({ navigation }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [dailyStatus, setDailyStatus] = useState<{ completed: boolean; date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tags, status] = await Promise.all([
          vocabularyService.getAvailableTags(),
          vocabularyService.getDailyChallengeStatus(),
        ]);
        setAvailableTags(tags);
        setDailyStatus(status);
      } catch (error) {
        console.error('StudyScreen load error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const startStudy = useCallback((mode: string, tag?: string) => {
    navigation.navigate('SwipeStudy', tag ? { mode, tag } : { mode });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const StudyCard = ({ icon, title, description, onPress, badge }: any) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={colors.primary} style={styles.cardIcon} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, badge.completed && styles.badgeCompleted]}>
            <Text style={styles.badgeText}>{badge.completed ? '完了' : '未完了'}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{description}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>開始</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('nav.study')}</Text>

        <StudyCard
          icon="shuffle"
          title="ランダム学習"
          description="全ての単語からランダムに30問出題します。バランス良く学習できます。"
          onPress={() => startStudy('random')}
        />

        <StudyCard
          icon="today"
          title="今日のチャレンジ"
          description="復習が必要な単語を中心に出題します。継続的な学習に最適です。"
          onPress={() => startStudy('daily')}
          badge={dailyStatus}
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Icon name="label" size={24} color={colors.error} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>タグ別学習</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>特定のタグの単語のみを学習します。苦手分野の集中学習に効果的です。</Text>
          <View style={styles.tagGrid}>
            {availableTags.slice(0, 12).map((tag, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.tag, { borderColor: colors.border }]}
                onPress={() => startStudy('tag', tag)}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { marginRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  badge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeCompleted: { backgroundColor: '#9ca3af' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: { fontSize: 14, fontWeight: '500' },
});