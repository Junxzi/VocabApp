import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { VocabularyWord } from '../types';
import { VocabularyCard } from './VocabularyCard';

interface Props {
  words: VocabularyWord[];
  onEdit: (word: VocabularyWord) => void;
  onDelete: (id: number) => void;
}

export function VocabularyListView({ words, onEdit, onDelete }: Props) {
  return (
    <FlatList
      data={words}
      keyExtractor={item => `word-${item.id}`}
      renderItem={({ item }) => (
        <VocabularyCard item={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
  },
});