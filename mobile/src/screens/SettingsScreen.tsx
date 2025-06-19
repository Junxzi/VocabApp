import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {NavigationProps, AccentType} from '../types';

export default function SettingsScreen({navigation}: NavigationProps) {
  const {colors, isDark, toggleTheme} = useTheme();
  const {language, setLanguage, t} = useLanguage();
  const [autoplay, setAutoplay] = useState(false);
  const [pronunciationAccent, setPronunciationAccent] = useState<AccentType>('us');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedAutoplay = await AsyncStorage.getItem('autoplay');
      const savedAccent = await AsyncStorage.getItem('pronunciationAccent');
      
      if (savedAutoplay) {
        setAutoplay(savedAutoplay === 'true');
      }
      if (savedAccent) {
        setPronunciationAccent(savedAccent as AccentType);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleAutoplayChange = async (value: boolean) => {
    setAutoplay(value);
    try {
      await AsyncStorage.setItem('autoplay', value.toString());
    } catch (error) {
      console.error('Failed to save autoplay setting:', error);
    }
  };

  const handleAccentChange = () => {
    const accents: AccentType[] = ['us', 'uk', 'au'];
    const currentIndex = accents.indexOf(pronunciationAccent);
    const nextIndex = (currentIndex + 1) % accents.length;
    const newAccent = accents[nextIndex];
    
    setPronunciationAccent(newAccent);
    AsyncStorage.setItem('pronunciationAccent', newAccent);
  };

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'ja' : 'en';
    setLanguage(newLanguage);
  };

  const getAccentDisplayName = (accent: AccentType) => {
    switch (accent) {
      case 'us': return 'US (アメリカ英語)';
      case 'uk': return 'UK (イギリス英語)';
      case 'au': return 'AU (オーストラリア英語)';
      default: return 'US';
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      '設定をリセット',
      'すべての設定をデフォルトに戻しますか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['autoplay', 'pronunciationAccent', 'language', 'theme']);
              setAutoplay(false);
              setPronunciationAccent('us');
              setLanguage('ja');
              Alert.alert('完了', '設定がリセットされました');
            } catch (error) {
              console.error('Failed to reset settings:', error);
            }
          },
        },
      ]
    );
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
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionIcon: {
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    resetButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    resetButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.settings')}</Text>
      </View>

      <View style={styles.content}>
        {/* Language Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="language" size={24} color={colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>言語設定</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>表示言語</Text>
              <Text style={styles.settingDescription}>アプリの表示言語を変更</Text>
            </View>
            <Text style={styles.settingValue}>
              {language === 'en' ? 'English' : '日本語'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="volume-up" size={24} color={colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>音声設定</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>自動発音再生</Text>
              <Text style={styles.settingDescription}>新しい単語が表示された時に自動で発音</Text>
            </View>
            <Switch
              value={autoplay}
              onValueChange={handleAutoplayChange}
              trackColor={{false: colors.border, true: colors.primary + '40'}}
              thumbColor={autoplay ? colors.primary : colors.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleAccentChange}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>発音アクセント</Text>
              <Text style={styles.settingDescription}>音声読み上げのアクセントを選択</Text>
            </View>
            <Text style={styles.settingValue}>
              {getAccentDisplayName(pronunciationAccent)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="palette" size={24} color={colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>表示設定</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>ダークモード</Text>
              <Text style={styles.settingDescription}>暗いテーマを使用</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{false: colors.border, true: colors.primary + '40'}}
              thumbColor={isDark ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Reset Settings */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Text style={styles.resetButtonText}>設定をリセット</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}