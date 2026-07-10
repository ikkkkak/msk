import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FunnelSimple } from 'phosphor-react-native';

interface FilterButtonProps {
  onPress: () => void;
  activeFiltersCount?: number;
  title?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  onPress,
  activeFiltersCount = 0,
  title = 'Filters',
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <FunnelSimple size={16} color="#222222" weight="bold" />
        <Text style={styles.title}>{title}</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  badge: {
    backgroundColor: '#FF385C',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
