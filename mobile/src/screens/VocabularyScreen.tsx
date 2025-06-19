import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {VocabularyWord, NavigationProps} from '../types';
import {vocabularyService} from '../services/VocabularyService';

export default function VocabularyScreen({navigation}: NavigationProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVocabulary();
  }, []);

  useEffect(() => {
    filterWords();
  }, [searchQuery, words]);

  const loadVocabulary = async () => {
    try {
      const data = await vocabularyService.getAllWords();
      setWords(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      setLoading(false);
    }
  };

  const filterWords = () => {
    if (!searchQuery.trim()) {
      setFilteredWords(words);
    } else {
      const filtered = words.filter(word =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWords(filtered);
    }
  };

  const handleWordPress = (word: VocabularyWord) => {
    navigation.navigate('WordDetail', {word});
  };

  const handleAddWord = () => {
    // Navigate to add word modal or screen
    Alert.alert('Add Word', 'Add word functionality will be implemented');
  };

  const renderWordItem = ({item}: {item: VocabularyWord}) => (
    <TouchableOpacity
      style={[styles.wordItem, {backgroundColor: colors.surface, borderColor: colors.border}]}
      onPress={() => handleWordPress(item)}
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
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, {backgroundColor: colors.primary + '20'}]}>
              <Text style={[styles.tagText, {color: colors.primary}]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return {backgroundColor: '#10b981'};
      case 2: return {backgroundColor: '#f59e0b'};
      case 3: return {backgroundColor: '#f97316'};
      case 4: return {backgroundColor: '#ef4444'};
      default: return {backgroundColor: '#6b7280'};
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      padding: 16,
      backgroundColor: colors.surface,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wordItem: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
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
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
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
    },
    tag: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.vocabulary')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWord}>
          <Icon name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="単語を検索..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {loading ? '読み込み中...' : '単語が見つかりません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
          renderItem={renderWordItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}