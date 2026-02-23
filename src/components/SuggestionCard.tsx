import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuggestionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}

export function SuggestionCard({ icon, text, onPress }: SuggestionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#6C63FF" />
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

interface SuggestionsRowProps {
  onSuggestionPress: (text: string) => void;
}

export function SuggestionsRow({ onSuggestionPress }: SuggestionsRowProps) {
  const suggestions = [
    { icon: 'list-outline' as const, text: 'Moje obaveze' },
    { icon: 'calendar-outline' as const, text: 'Šta imam danas?' },
    { icon: 'bulb-outline' as const, text: 'Daj mi savjet' },
    { icon: 'time-outline' as const, text: 'Organizuj mi dan' },
  ];

  return (
    <View style={styles.row}>
      {suggestions.map((s) => (
        <SuggestionCard
          key={s.text}
          icon={s.icon}
          text={s.text}
          onPress={() => onSuggestionPress(s.text)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E8EF',
  },
  text: {
    fontSize: 13,
    color: '#1A1A2E',
  },
});
