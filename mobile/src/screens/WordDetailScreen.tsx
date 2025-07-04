// mobile/src/screens/WordDetailScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Tts from 'react-native-tts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { VocabularyWord, NavigationProps, AccentType } from '../types';
import { vocabularyService } from '../services/VocabularyService';
import { azureTTS } from '../services/AzureTTSService';
import { useQueryClient } from '../contexts/QueryContext';

export default function WordDetailScreen({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [word, setWord] = useState<VocabularyWord | null>(
    route.params?.word || null
  );
  const [loading, setLoading] = useState(!word);
  const [tags, setTags] = useState<string[]>(word?.tags ?? []);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!word && route.params?.id) {
      loadWord(route.params.id);
    }
    initializeTTS();
  }, []);

  const loadWord = async (id: number) => {
    try {
      const data = await vocabularyService.getById(id);
      setWord(data);
      setTags(data.tags ?? []);
    } catch (e) {
      console.error('Failed to load word:', e);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const initializeTTS = () => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.8);
    Tts.setDefaultPitch(1.0);
  };

  const speakWord = async (accent: AccentType = 'us') => {
    if (!word) return;
    try {
      await azureTTS.speak(word.word, accent);
    } catch (e) {
      console.warn('Azure TTS failed, fallback:', e);
      const langMap = { us: 'en-US', uk: 'en-GB', au: 'en-AU' } as const;
      Tts.setDefaultLanguage(langMap[accent]);
      Tts.speak(word.word);
      Alert.alert('🗣️ Fallback TTS', `Azure に失敗したので fallback 使用（${accent}）`);
    }
  };

  const handleEnrichWord = useCallback(async () => {
    if (!word) return;
    Alert.alert('AI強化', '発音、例文をAIで生成しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '実行',
        onPress: async () => {
          try {
            const enriched = await vocabularyService.enrich(word.id);
            setWord(enriched);
            Alert.alert('完了', 'AI強化が完了しました');
          } catch (err) {
            console.error('Failed to enrich word:', err);
            Alert.alert('エラー', 'AI強化に失敗しました');
          }
        },
      },
    ]);
  }, [word]);


  const handleAddTag = () => {
    const t0 = newTag.trim();
    if (!t0) return;
    if (tags.includes(t0)) {
      Alert.alert('重複', 'このタグはすでにあります');
      return;
    }
    setTags([...tags, t0]);
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSaveTags = useCallback(async () => {
    if (!word) return;
    try {
      await vocabularyService.update(word.id, { tags });
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      Alert.alert('保存完了', 'タグを更新しました');
    } catch (e) {
      console.error('タグ保存失敗', e);
      Alert.alert('エラー', 'タグの保存に失敗しました');
    }
  }, [tags, word?.id, queryClient]);

  const getDifficultyColor = (d?: number) => {
    if (!d) return colors.textSecondary;
    switch (d) {
      case 1: return '#10b981';
      case 2: return '#f59e0b';
      case 3: return '#f97316';
      case 4: return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const getDifficultyLabel = (d?: number) => {
    if (!d) return '未評価';
    switch (d) {
      case 1: return 'レベル１';
      case 2: return 'レベル２';
      case 3: return 'レベル３';
      case 4: return 'レベル４';
      default: return '未評価';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!word) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>単語が見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exampleSentences = word.exampleSentences
    ? JSON.parse(word.exampleSentences)
    : [];

  const hasEnrichedData =
    word.pronunciationUs ||
    word.pronunciationUk ||
    word.pronunciationAu ||
    exampleSentences.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 単語ヘッダー */}
        <View style={[styles.wordHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.wordText, { color: colors.text }]}>{word.word}</Text>
          {word.pronunciation && (
            <View style={styles.pronunciationContainer}>
              <Text style={[styles.pronunciationText, { color: colors.textSecondary }]}>
                /{word.pronunciation}/
              </Text>
              <TouchableOpacity style={[styles.audioButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => speakWord()}>
                <Icon name="volume-up" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {word.difficulty && (
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(word.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {getDifficultyLabel(word.difficulty)}
              </Text>
            </View>
          )}
        </View>

        {/* 意味 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>意味</Text>
          <View style={[styles.definitionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.definitionText, { color: colors.text }]}>{word.definition}</Text>
          </View>
        </View>

        {/* 発音 */}
        {hasEnrichedData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>発音</Text>
            <View style={[styles.pronunciationGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {word.pronunciationUs && (
                <View style={styles.pronunciationItem}>
                  <Text style={[styles.pronunciationLabel, { color: colors.textSecondary }]}>US</Text>
                  <Text style={[styles.pronunciationValue, { color: colors.text }]}>/{word.pronunciationUs}/</Text>
                  <TouchableOpacity style={styles.pronunciationButton} onPress={() => speakWord('us')}>
                    <Text style={[styles.pronunciationButtonText, { color: colors.primary }]}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}
              {word.pronunciationUk && (
                <View style={styles.pronunciationItem}>
                  <Text style={[styles.pronunciationLabel, { color: colors.textSecondary }]}>UK</Text>
                  <Text style={[styles.pronunciationValue, { color: colors.text }]}>/{word.pronunciationUk}/</Text>
                  <TouchableOpacity style={styles.pronunciationButton} onPress={() => speakWord('uk')}>
                    <Text style={[styles.pronunciationButtonText, { color: colors.primary }]}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}
              {word.pronunciationAu && (
                <View style={styles.pronunciationItem}>
                  <Text style={[styles.pronunciationLabel, { color: colors.textSecondary }]}>AU</Text>
                  <Text style={[styles.pronunciationValue, { color: colors.text }]}>/{word.pronunciationAu}/</Text>
                  <TouchableOpacity style={styles.pronunciationButton} onPress={() => speakWord('au')}>
                    <Text style={[styles.pronunciationButtonText, { color: colors.primary }]}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 例文 */}
        {exampleSentences.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>例文</Text>
            {exampleSentences.map((ex: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.exampleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
            ]}>
                <Text style={[styles.exampleEnglish, { color: colors.text }]}>
                  {typeof ex === 'string' ? ex : ex.english}
                </Text>
                {typeof ex === 'object' && ex.japanese && (
                  <Text style={[styles.exampleJapanese, { color: colors.textSecondary }]}>
                    {ex.japanese}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* タグ編集セクション */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>タグ編集</Text>

          {/* 現在のタグ */}
          <View style={styles.tagsRow}>
            {tags.length > 0 ? tags.map(tag => (
              <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ color: colors.primary }}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Icon name="close" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary }}>タグがありません</Text>
            )}
          </View>

          {/* 新規タグ入力 */}
          <View style={styles.addTagRow}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={newTag}
              placeholder="新しいタグを入力"
              placeholderTextColor={colors.textSecondary}
              onChangeText={setNewTag}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddTag}>
              <Icon name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 保存ボタン */}
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveTags}>
            <Text style={styles.saveButtonText}>タグを保存</Text>
          </TouchableOpacity>
        </View>

        {/* AI 強化ボタン */}
        {!hasEnrichedData && (
          <TouchableOpacity style={[styles.enrichButton, { backgroundColor: colors.primary }]} onPress={handleEnrichWord}>
            <Text style={[styles.enrichButtonText, { color: colors.background }]}>AI で強化</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 16 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  wordText: { fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  pronunciationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pronunciationText: { fontSize: 16, marginRight: 8, fontFamily: 'monospace' },
  audioButton: { padding: 8, borderRadius: 20 },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 8 },
  difficultyText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  definitionCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  definitionText: { fontSize: 16, lineHeight: 22 },
  pronunciationGrid: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, padding: 16, borderWidth: 1 },
  pronunciationItem: { alignItems: 'center' },
  pronunciationLabel: { fontSize: 14, marginBottom: 6 },
  pronunciationValue: { fontSize: 16, marginBottom: 6, fontFamily: 'monospace' },
  pronunciationButton: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  pronunciationButtonText: { fontSize: 12, fontWeight: '600' },
  exampleItem: { marginBottom: 12 },
  exampleCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12, },
  exampleEnglish: { fontSize: 16, fontStyle: 'italic', marginBottom: 6 },
  exampleJapanese: { fontSize: 14, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  addTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  addButton: { marginLeft: 8, padding: 10, borderRadius: 6 },
  saveButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  enrichButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  enrichButtonText: { fontSize: 16, fontWeight: '600' },
});