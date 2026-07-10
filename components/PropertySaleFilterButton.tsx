import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PropertySaleFilters } from '../screens/PropertySaleFilterScreen';

interface PropertySaleFilterButtonProps {
  onFiltersChange?: (filters: PropertySaleFilters) => void;
  initialFilters?: PropertySaleFilters;
}

export const PropertySaleFilterButton: React.FC<PropertySaleFilterButtonProps> = ({
  onFiltersChange,
  initialFilters,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleFilterPress = () => {
    (navigation as any).navigate('PropertySaleFilter', {
      initialFilters,
      onApply: (filters: PropertySaleFilters) => {
        // Calculate active filters count
        let count = 0;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) count++;
        if (filters.propertyType !== 'all') count++;
        if (filters.bedrooms > 0) count++;
        if (filters.bathrooms > 0) count++;
        if (filters.location !== 'all') count++;
        if (filters.sortBy !== 'newest') count++;
        if (filters.features.length > 0) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.minArea > 0 || filters.maxArea > 0) count++;
        if (filters.yearBuilt) count++;
        
        setActiveFiltersCount(count);
        
        if (onFiltersChange) {
          onFiltersChange(filters);
        }
      },
    });
  };

  return (
    <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
      <MaterialIcons name="tune" size={20} color="#222" />
      <Text style={styles.filterText}>{t('filters.filters', 'Filters')}</Text>
      {activeFiltersCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeFiltersCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
