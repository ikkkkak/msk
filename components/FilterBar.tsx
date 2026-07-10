import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'phosphor-react-native';

interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  chips: FilterChip[];
  onClearAll: () => void;
  visible?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  chips,
  onClearAll,
  visible = true,
}) => {
  if (!visible || chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip) => (
          <View key={chip.id} style={styles.chip}>
            <Text style={styles.chipText}>{chip.label}</Text>
            <TouchableOpacity
              style={styles.chipRemove}
              onPress={chip.onRemove}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <X size={12} color="#717171" weight="bold" />
            </TouchableOpacity>
          </View>
        ))}
        {chips.length > 1 && (
          <TouchableOpacity style={styles.clearAll} onPress={onClearAll}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222222',
  },
  chipRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF385C',
  },
});
