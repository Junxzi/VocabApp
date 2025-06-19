import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Tts from 'react-native-tts';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {VocabularyWord, NavigationProps, AccentType} from '../types';
import {vocabularyService} from '../services/VocabularyService';

export default function WordDetailScreen({navigation, route}: NavigationProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [word, setWord] = useState<VocabularyWord | null>(route.params?.word || null);
  const [loading, setLoading] = useState(!word);

  useEffect(() => {
    if (!word && route.params?.id) {
      loadWord(route.params.id);
    }
    initializeTTS();
  }, []);

  const loadWord = async (id: number) => {
    try {
      const data = await vocabularyService.getWordById(id);
      setWord(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load word:', error);
      setLoading(false);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    }
  };

  const initializeTTS = () => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.8);
    Tts.setDefaultPitch(1.0);
  };

  const speakWord = (accent: AccentType = 'us') => {
    if (!word) return;
    
    const languageMap = {
      us: 'en-US',
      uk: 'en-GB',
      au: 'en-AU',
    };
    
    Tts.setDefaultLanguage(languageMap[accent]);
    Tts.speak(word.word);
  };

  const handleEnrichWord = async () => {
    if (!word) return;
    
    Alert.alert(
      'AI強化',
      '発音、品詞、例文をAIで生成しますか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: '実行',
          onPress: async () => {
            try {
              const enrichedWord = await vocabularyService.enrichWord(word.id);
              setWord(enrichedWord);
              Alert.alert('完了', 'AI強化が完了しました');
            } catch (error) {
              console.error('Failed to enrich word:', error);
              Alert.alert('エラー', 'AI強化に失敗しました');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: number | undefined) => {
    if (!difficulty) return colors.textSecondary;
    switch (difficulty) {
      case 1: return '#10b981';
      case 2: return '#f59e0b';
      case 3: return '#f97316';
      case 4: return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const getDifficultyLabel = (difficulty: number | undefined) => {
    if (!difficulty) return '未評価';
    switch (difficulty) {
      case 1: return '簡単';
      case 2: return '普通';
      case 3: return '難しい';
      case 4: return 'とても難しい';
      default: return '未評価';
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    wordHeader: {
      alignItems: 'center',
      marginBottom: 32,
      padding: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wordText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    pronunciationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    pronunciationText: {
      fontSize: 18,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginRight: 12,
    },
    audioButton: {
      backgroundColor: colors.primary + '20',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    difficultyText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    definitionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    definitionText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    pronunciationGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pronunciationItem: {
      alignItems: 'center',
    },
    pronunciationLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    pronunciationValue: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'monospace',
      marginBottom: 8,
    },
    pronunciationButton: {
      backgroundColor: colors.primary + '20',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    pronunciationButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    exampleItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exampleEnglish: {
      fontSize: 16,
      color: colors.text,
      fontStyle: 'italic',
      marginBottom: 8,
      lineHeight: 22,
    },
    exampleJapanese: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    tag: {
      backgroundColor: colors.primary + '20',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      margin: 4,
    },
    tagText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    enrichButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    enrichButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
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

  if (!word) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>単語が見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exampleSentences = word.exampleSentences 
    ? JSON.parse(word.exampleSentences) 
    : [];

  const hasEnrichedData = word.pronunciationUs || word.pronunciationUk || word.pronunciationAu || exampleSentences.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>単語詳細</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Word Header */}
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{word.word}</Text>
          
          {word.pronunciation && (
            <View style={styles.pronunciationContainer}>
              <Text style={styles.pronunciationText}>/{word.pronunciation}/</Text>
              <TouchableOpacity style={styles.audioButton} onPress={() => speakWord()}>
                <Icon name="volume-up" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {word.difficulty && (
            <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(word.difficulty)}]}>
              <Text style={styles.difficultyText}>
                Rank {word.difficulty} - {getDifficultyLabel(word.difficulty)}
              </Text>
            </View>
          )}
        </View>

        {/* Definition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>意味</Text>
          <View style={styles.definitionCard}>
            <Text style={styles.definitionText}>{word.definition}</Text>
          </View>
        </View>

        {/* Pronunciations */}
        {hasEnrichedData && (word.pronunciationUs || word.pronunciationUk || word.pronunciationAu) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>発音</Text>
            <View style={styles.pronunciationGrid}>
              {word.pronunciationUs && (
                <View style={styles.pronunciationItem}>
                  <Text style={styles.pronunciationLabel}>US</Text>
                  <Text style={styles.pronunciationValue}>/{word.pronunciationUs}/</Text>
                  <TouchableOpacity 
                    style={styles.pronunciationButton}
                    onPress={() => speakWord('us')}
                  >
                    <Text style={styles.pronunciationButtonText}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}

              {word.pronunciationUk && (
                <View style={styles.pronunciationItem}>
                  <Text style={styles.pronunciationLabel}>UK</Text>
                  <Text style={styles.pronunciationValue}>/{word.pronunciationUk}/</Text>
                  <TouchableOpacity 
                    style={styles.pronunciationButton}
                    onPress={() => speakWord('uk')}
                  >
                    <Text style={styles.pronunciationButtonText}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}

              {word.pronunciationAu && (
                <View style={styles.pronunciationItem}>
                  <Text style={styles.pronunciationLabel}>AU</Text>
                  <Text style={styles.pronunciationValue}>/{word.pronunciationAu}/</Text>
                  <TouchableOpacity 
                    style={styles.pronunciationButton}
                    onPress={() => speakWord('au')}
                  >
                    <Text style={styles.pronunciationButtonText}>再生</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Example Sentences */}
        {exampleSentences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>例文</Text>
            {exampleSentences.map((example: any, index: number) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleEnglish}>
                  {typeof example === 'string' ? example : example.english}
                </Text>
                {typeof example === 'object' && example.japanese && (
                  <Text style={styles.exampleJapanese}>{example.japanese}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {word.tags && word.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>タグ</Text>
            <View style={styles.tagsContainer}>
              {word.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Enrichment Button */}
        {!hasEnrichedData && (
          <TouchableOpacity style={styles.enrichButton} onPress={handleEnrichWord}>
            <Text style={styles.enrichButtonText}>AI で強化</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}