import React, {useState, useEffect, useMemo, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  InteractionManager,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {VocabularyWord, NavigationProps} from '../types';
import {vocabularyService} from '../services/VocabularyService';

const WordItem = memo(({item, colors, onPress}: {
  item: VocabularyWord;
  colors: any;
  onPress: (word: VocabularyWord) => void;
}) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  const getDifficultyColor = useCallback((difficulty: number) => {
    switch (difficulty) {
      case 1: return {backgroundColor: '#10b981'};
      case 2: return {backgroundColor: '#f59e0b'};
      case 3: return {backgroundColor: '#f97316'};
      case 4: return {backgroundColor: '#ef4444'};
      default: return {backgroundColor: '#6b7280'};
    }
  }, []);

  return (
    <TouchableOpacity
      style={[styles.wordItem, {backgroundColor: colors.surface, borderColor: colors.border}]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.wordHeader}>
        <Text style={[styles.wordText, {color: colors.text}]}>{item.word}</Text>
        {item.difficulty && (
          <View style={[styles.difficultyBadge, getDifficultyColor(item.difficulty)]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.definitionText, {color: colors.textSecondary}]} numberOfLines={2}>
        {item.definition}
      </Text>
      {Array.isArray(item.tags) && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={`${item.id}-${tag}-${index}`} style={[styles.tag, {backgroundColor: colors.primary + '20'}]}>
              <Text style={[styles.tagText, {color: colors.primary}]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function VocabularyScreen({navigation}: NavigationProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadVocabulary = useCallback(async () => {
    try {
      const data = await vocabularyService.getAllWords();
      setWords(data);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadVocabulary();
    });
  }, [loadVocabulary]);

  // 👇 追加：戻ってきたときに再読み込み
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVocabulary();
    });
    return unsubscribe;
  }, [navigation, loadVocabulary]);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const query = searchQuery.toLowerCase();
    return words.filter(word =>
      word.word.toLowerCase().includes(query) ||
      word.definition.toLowerCase().includes(query)
    );
  }, [searchQuery, words]);

  const handleWordPress = useCallback((word: VocabularyWord) => {
    navigation.navigate('WordDetail', {word});
  }, [navigation]);

  const handleAddWord = useCallback(() => {
    navigation.navigate('AddWord');
  }, [navigation]);

  const keyExtractor = useCallback((item: VocabularyWord) => `word-${item.id}`, []);

  const renderWordItem = useCallback(({item}: {item: VocabularyWord}) => (
    <WordItem item={item} colors={colors} onPress={handleWordPress} />
  ), [colors, handleWordPress]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, {color: colors.text, borderColor: colors.border}]}
          placeholder="単語を検索..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
            {loading ? '読み込み中...' : '単語が見つかりません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
          renderItem={renderWordItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={[styles.fab, {backgroundColor: colors.primary}]} onPress={handleAddWord}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  wordItem: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  definitionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
});