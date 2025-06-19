import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {NavigationProps} from '../types';
import {vocabularyService} from '../services/VocabularyService';

export default function StudyScreen({navigation}: NavigationProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [dailyStatus, setDailyStatus] = useState<{completed: boolean; date: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    try {
      const [tags, status] = await Promise.all([
        vocabularyService.getAvailableTags(),
        vocabularyService.getDailyChallengeStatus(),
      ]);
      setAvailableTags(tags);
      setDailyStatus(status);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load study data:', error);
      setLoading(false);
    }
  };

  const handleRandomStudy = () => {
    navigation.navigate('SwipeStudy', {mode: 'random'});
  };

  const handleTagStudy = (tag: string) => {
    navigation.navigate('SwipeStudy', {mode: 'tag', tag});
  };

  const handleDailyChallenge = () => {
    navigation.navigate('SwipeStudy', {mode: 'daily'});
  };

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
    studyOption: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    studyOptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    studyOptionIcon: {
      marginRight: 12,
    },
    studyOptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    studyOptionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    studyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    studyButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    tagSection: {
      marginTop: 8,
    },
    tagSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    tagGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    tagItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      margin: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    dailyBadge: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    dailyBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    completedBadge: {
      backgroundColor: colors.textSecondary,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.study')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Random Study */}
        <View style={styles.studyOption}>
          <View style={styles.studyOptionHeader}>
            <Icon name="shuffle" size={24} color={colors.primary} style={styles.studyOptionIcon} />
            <Text style={styles.studyOptionTitle}>ランダム学習</Text>
          </View>
          <Text style={styles.studyOptionDescription}>
            全ての単語からランダムに30問出題します。バランス良く学習できます。
          </Text>
          <TouchableOpacity style={styles.studyButton} onPress={handleRandomStudy}>
            <Text style={styles.studyButtonText}>開始</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge */}
        <View style={styles.studyOption}>
          <View style={styles.studyOptionHeader}>
            <Icon name="today" size={24} color={colors.warning} style={styles.studyOptionIcon} />
            <Text style={styles.studyOptionTitle}>今日のチャレンジ</Text>
            {dailyStatus && (
              <View style={[styles.dailyBadge, dailyStatus.completed && styles.completedBadge]}>
                <Text style={styles.dailyBadgeText}>
                  {dailyStatus.completed ? '完了' : '未完了'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.studyOptionDescription}>
            復習が必要な単語を中心に出題します。継続的な学習に最適です。
          </Text>
          <TouchableOpacity style={styles.studyButton} onPress={handleDailyChallenge}>
            <Text style={styles.studyButtonText}>チャレンジ</Text>
          </TouchableOpacity>
        </View>

        {/* Tag-based Study */}
        <View style={styles.studyOption}>
          <View style={styles.studyOptionHeader}>
            <Icon name="label" size={24} color={colors.error} style={styles.studyOptionIcon} />
            <Text style={styles.studyOptionTitle}>タグ別学習</Text>
          </View>
          <Text style={styles.studyOptionDescription}>
            特定のタグの単語のみを学習します。苦手分野の集中学習に効果的です。
          </Text>
          
          {availableTags.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagSectionTitle}>利用可能なタグ:</Text>
              <View style={styles.tagGrid}>
                {availableTags.slice(0, 12).map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tagItem}
                    onPress={() => handleTagStudy(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}