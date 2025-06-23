import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VocabularyWord } from '../types';
import { Badge } from './Badge';

interface Props {
  item: VocabularyWord;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (id: number) => void;
}

export function VocabularyCard({ item, onEdit, onDelete }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onEdit(item)}>
      <View style={styles.header}>
        <Text style={styles.word}>{item.word}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
            <Icon name="edit" size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
            <Icon name="delete" size={20} color="#e00" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.definition} numberOfLines={2}>{item.definition}</Text>
      {item.tags?.length ? (
        <View style={styles.tagsRow}>
          {item.tags.map(tag => <Badge key={tag} label={tag} />)}
        </View>
      ) : null}
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
  definition: {
    marginTop: 6,
    color: '#333',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});