// mobile/src/components/VocabularyCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VocabularyWord } from '../types';
import { Badge } from './Badge';
import { useLanguage } from '../contexts/LanguageContext';
import { getLocalizedPartOfSpeech } from '../lib/utils';

interface Props {
  item: VocabularyWord;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (id: number) => void;
}

export function VocabularyCard({ item, onEdit, onDelete }: Props) {
  const { language } = useLanguage();

  // 品詞とタグのフォールバック
  const parts = item.partOfSpeech ?? [];
  const tags  = item.tags ?? [];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit(item)}
      activeOpacity={0.7}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.word}>{item.word}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
            <Icon name="delete" size={20} color="#e00" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 品詞バッジ */}
      {parts.length > 0 && (
        <View style={styles.partOfSpeechContainer}>
          {parts.map((pos) => (
            <Badge
              key={pos}
              label={getLocalizedPartOfSpeech(pos, language)}
            />
          ))}
        </View>
      )}

      {/* 定義 */}
      <Text style={styles.definition} numberOfLines={2}>
        {item.definition}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  word: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 4,
    marginLeft: 8,
  },
  partOfSpeechContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  definition: {
    marginTop: 6,
    color: '#333',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
});