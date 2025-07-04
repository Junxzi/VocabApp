// mobile/src/screens/StudyScreen.tsx

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
  const [tags, setTags] = useState<string[]>([]);
  const [daily, setDaily] = useState<{ completed: boolean; date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [avail, status] = await Promise.all([
          vocabularyService.getTags(),
          vocabularyService.getDailyChallengeStatus(),
        ]);
        setTags(avail);
        setDaily(status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const start = useCallback((mode: 'random' | 'daily' | 'tag', tag?: string) => {
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

  const Card = ({ icon, title, desc, onPress, badge }: any) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Icon name={icon} size={24} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, badge.completed && styles.badgeDone]}>
            <Text style={styles.badgeText}>{badge.completed ? '完了' : '未完了'}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>{desc}</Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onPress}>
        <Text style={[styles.btnText, { color: colors.background }]}>開始</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card
          icon="shuffle"
          title="ランダム学習"
          desc="全単語からランダムに30問出題"
          onPress={() => start('random')}
        />

        <Card
          icon="today"
          title="今日のチャレンジ"
          desc="復習が必要な単語を出題"
          onPress={() => start('daily')}
          badge={daily}
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Icon name="label" size={24} color={colors.error} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>タグ別学習</Text>
          </View>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            特定のタグの単語のみ学習
          </Text>
          <View style={styles.tagGrid}>
            {tags.slice(0, 12).map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, { borderColor: colors.border }]}
                onPress={() => start('tag', tag)}
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', flex: 1 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
  badge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDone: { backgroundColor: '#9ca3af' },
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