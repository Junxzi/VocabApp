// mobile/src/screens/VocabularyScreen.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  InteractionManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { VocabularyWord, NavigationProps } from '../types';
import { vocabularyService } from '../services/VocabularyService';
import { VocabularyCard } from '../components/VocabularyCard';

interface Tag {
  name: string;
  color: string;
}

export default function VocabularyScreen({ navigation }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // タグ一覧取得 & テーマ色マッピング
  useEffect(() => {
    vocabularyService.getTags()
      .then((names: string[]) =>
        setTags(names.map(name => ({ name, color: colors.border })))
      )
      .catch(console.error);
  }, [colors.border]);

  // 単語取得ロジック
  const loadVocabulary = useCallback(async () => {
    setLoading(true);
    try {
      let data: VocabularyWord[];
      const q = searchQuery.trim();
      if (q) data = await vocabularyService.search(q);
      else if (selectedTag) data = await vocabularyService.getByTag(selectedTag);
      else data = await vocabularyService.getAll();
      setWords(data);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
      Alert.alert('エラー', '単語の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag]);

  // 初回・フォーカス時にロード
  useEffect(() => {
    InteractionManager.runAfterInteractions(loadVocabulary);
    const unsub = navigation.addListener('focus', loadVocabulary);
    return unsub;
  }, [navigation, loadVocabulary]);

  // フィルタ済みリスト
  const filtered = useMemo(() => {
    if (!searchQuery.trim() && !selectedTag) return words;
    const q = searchQuery.trim().toLowerCase();
    return words.filter(w =>
      (!q || w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q)) &&
      (!selectedTag || w.tags?.includes(selectedTag))
    );
  }, [words, searchQuery, selectedTag]);

  const onEdit = useCallback(
    (w: VocabularyWord) => navigation.navigate('WordDetail', { word: w }),
    [navigation]
  );

  const onDelete = useCallback((id: number) => {
    Alert.alert('確認', 'この単語を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await vocabularyService.delete(id);
            setWords(ws => ws.filter(w => w.id !== id));
          } catch {
            Alert.alert('エラー', '削除に失敗しました');
          }
        },
      },
    ]);
  }, []);

  // タグリスト用データ（All を先頭に）
  const tagItems = useMemo<Tag[]>(() => [
    { name: 'All', color: colors.border },
    ...tags,
  ], [tags, colors.border]);

  // タグレンダラー
  const renderTag = ({ item }: { item: Tag }) => {
    const isAll = item.name === 'All';
    const active = isAll ? selectedTag === null : selectedTag === item.name;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedTag(isAll ? null : item.name);
          if (!isAll) setSearchQuery('');
        }}
        style={[
          styles.tagChip,
          { backgroundColor: active ? colors.primary : item.color },
        ]}
      >
        <Text style={{ color: active ? '#fff' : colors.textSecondary }}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
          placeholder={`${t('nav.vocabulary')} を検索...`}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            if (text) setSelectedTag(null);
          }}
        />
      </View>

      {/* タグフィルター */}
      <FlatList
        style={styles.tagList}
        horizontal
        data={tagItems}
        keyExtractor={item => item.name}
        showsHorizontalScrollIndicator={false}
        renderItem={renderTag}
      />

      {/* 単語リスト */}
      {loading || filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {loading ? '読み込み中...' : '単語が見つかりません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => `word-${item.id}`}
          renderItem={({ item }) => (
            <VocabularyCard item={item} onEdit={onEdit} onDelete={onDelete} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddWord')}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  searchContainer: { paddingTop: 2, marginBottom: 16, paddingHorizontal: 16 },
  searchInput:  {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  tagList:      {
    paddingHorizontal: 16,
    marginBottom: 8,
    maxHeight: 40,
  },
  tagChip:      {
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 32,
    height: 28,
    justifyContent: 'center',
    marginTop: 4,
  },
  listContent:  {
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 4,
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  emptyText:    { fontSize: 16, textAlign: 'center' },
  fab:          {
    position: 'absolute', bottom: 30, right: 24,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
});