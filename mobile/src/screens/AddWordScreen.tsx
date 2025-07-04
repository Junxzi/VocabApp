// mobile/src/screens/AddWordScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQueryClient } from '@tanstack/react-query';
import { vocabularyService } from '../services/VocabularyService';
import { InsertVocabularyWord } from '../../../shared/schema';
import { useTheme } from '../contexts/ThemeContext';

// タグ用の型を定義
type TagInput = { name: string; color: string };

export default function AddWordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');

  // TagInput 型で状態管理
  const [tags, setTags] = useState<TagInput[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981'); // デフォルトカラー

  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name) {
      return Alert.alert('入力エラー', 'タグ名を入力してください');
    }
    if (tags.some(t => t.name === name)) {
      return Alert.alert('重複エラー', '同じタグが既にあります');
    }
    setTags(prev => [...prev, { name, color: newTagColor }]);
    setNewTagName('');
  };

  const handleRemoveTag = (tag: TagInput) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = useCallback(async () => {
    if (!word.trim() || !definition.trim()) {
      return Alert.alert('入力エラー', '単語と定義は必須です');
    }

    const payload: InsertVocabularyWord = {
      word: word.trim(),
      definition: definition.trim(),
      userId: 1,
      pronunciation: '',
      pronunciationUs: '',
      pronunciationUk: '',
      pronunciationAu: '',
      partOfSpeech: [],
      exampleSentences: JSON.stringify([]),
      tags,             // TagInput[] のまま渡す
      language: 'en',
      difficulty: 1,
    };

    try {
      await vocabularyService.create(payload);
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      navigation.goBack();
    } catch (err: any) {
      console.error('AddWord error:', err);
      const msg =
        typeof err.message === 'string' && err.message.toLowerCase().includes('already exists')
          ? 'この単語は既に登録されています'
          : err.message || '単語の保存に失敗しました';
      Alert.alert('保存失敗', msg);
    }
  }, [word, definition, tags, navigation, queryClient]);

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={s.flex}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Word */}
          <Section title="Word" colors={colors}>
            <TextInput
              style={[s.input, { borderColor: colors.border, color: colors.text }]}
              value={word}
              onChangeText={setWord}
              placeholder="単語を入力"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </Section>

          {/* Definition */}
          <Section title="Definition" colors={colors}>
            <TextInput
              style={[
                s.input,
                s.multiline,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={definition}
              onChangeText={setDefinition}
              placeholder="定義を入力"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </Section>

          {/* Tags */}
          <Section title="Tags" colors={colors}>
            <View style={s.tagsRow}>
              {tags.map(tag => (
                <TagBadge
                  key={tag.name}
                  tag={tag}
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
              {tags.length === 0 && (
                <Text style={[s.noTagText, { color: colors.textSecondary }]}>
                  タグがありません
                </Text>
              )}
            </View>

            {/* 新規タグ入力＋カラープレビュー＋追加ボタン */}
            <View style={s.tagInputRow}>
              <TextInput
                style={[s.input, s.containerFlex, { borderColor: colors.border, color: colors.text }]}
                value={newTagName}
                onChangeText={setNewTagName}
                placeholder="新しいタグ名"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[s.colorPreview, { backgroundColor: newTagColor }]}
                onPress={() => {
                  // 簡易なカラーチェンジ例
                  setNewTagColor(prev => (prev === '#10b981' ? '#f59e0b' : '#10b981'));
                }}
              />
              <TouchableOpacity
                style={[s.addBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddTag}
              >
                <Icon name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </Section>

          {/* Save */}
          <View style={s.saveRow}>
            <Button title="保存" onPress={handleSave} color={colors.primary} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ————— 共通コンポーネント —————

const Section: React.FC<{
  title: string;
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}> = ({ title, colors, children }) => (
  <View style={s.section}>
    <Text style={[s.label, { color: colors.text }]}>{title}</Text>
    {children}
  </View>
);

const TagBadge: React.FC<{
  tag: TagInput;
  onRemove: () => void;
}> = ({ tag, onRemove }) => (
  <View style={[s.tagBadge, { backgroundColor: tag.color + '30' }]}>
    <Text style={[s.tagText, { color: tag.color }]}>{tag.name}</Text>
    <TouchableOpacity onPress={onRemove}>
      <Icon name="close" size={16} color={tag.color} />
    </TouchableOpacity>
  </View>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  input: { padding: 8, borderWidth: 1, borderRadius: 4 },
  multiline: { height: 100, textAlignVertical: 'top' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  noTagText: { fontSize: 14 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 14, fontWeight: '500', marginRight: 4 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center' },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  addBtn: { padding: 8, borderRadius: 4 },
  saveRow: { marginTop: 20 },
  containerFlex: { flex: 1 },
  containerFlexRow: { flex: 1 },
});