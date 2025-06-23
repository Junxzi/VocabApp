import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { vocabularyService } from '../services/VocabularyService';
import { InsertVocabularyWord } from '../../../shared/schema';

export default function AddWordScreen({ navigation }: any) {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const queryClient = useQueryClient();

  const handleSave = useCallback(async () => {
    if (!word.trim() || !definition.trim()) {
      Alert.alert('入力エラー', '単語と定義は必須です');
      return;
    }

    const newWord: InsertVocabularyWord = {
      word: word.trim(),
      definition: definition.trim(),
      userId: 1,
      pronunciation: '',
      pronunciationUs: '',
      pronunciationUk: '',
      pronunciationAu: '',
      partOfSpeech: '',
      exampleSentences: JSON.stringify([]),
      tags: [], // NotNull, default([]) なので必須
      language: 'en', // NotNull & default 'en'
      difficulty: 1, // 仮で初期値
    };

    console.log('[AddWord] POST payload:', newWord);

    try {
      await vocabularyService.createWord(newWord);
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      navigation.goBack();
    } catch (err: any) {
      console.error('AddWord error:', err);
      Alert.alert('保存失敗', err.message || '単語の保存に失敗しました');
    }
  }, [word, definition, navigation, queryClient]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Word</Text>
      <TextInput
        style={styles.input}
        value={word}
        onChangeText={setWord}
        placeholder="単語"
      />
      <Text style={styles.label}>Definition</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={definition}
        onChangeText={setDefinition}
        placeholder="定義"
        multiline
      />
      <Button title="保存" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  input: {
    marginTop: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  multiline: { height: 100, textAlignVertical: 'top' },
});