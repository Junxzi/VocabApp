import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BadgeProps {
  /** 表示するテキスト */
  label?: string;
  /** 表示する数値 */
  count?: number;
  /** 閉じるボタンが押されたときのコールバック */
  onClose?: () => void;
}

export function Badge({ label, count, onClose }: BadgeProps) {
  const text = label ?? (count !== undefined ? String(count) : '');
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{text}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    color: '#333',
  },
  close: {
    marginLeft: 4,
    padding: 2,
  },
  closeText: {
    fontSize: 12,
    color: '#666',
  },
});