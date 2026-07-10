import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PropertySaleFilterModal, PropertySaleFilters } from './PropertySaleFilterModal';
import { FilterButton } from './FilterButton';
import { FilterBar } from './FilterBar';
import { usePropertySaleFilters } from '../hooks/usePropertySaleFilters';

export const PropertySalesScreenWithFilters: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    filters,
    updateFilters,
    resetFilters,
    getActiveFiltersCount,
    getFilterChips,
  } = usePropertySaleFilters();

  const handleApplyFilters = (newFilters: PropertySaleFilters) => {
    updateFilters(newFilters);
    setShowFilters(false);
    // Here you would typically trigger a new search with the filters
    console.log('Searching property sales with filters:', newFilters);
  };

  return (
    <View style={styles.container}>
      {/* Header with Filter Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Property Sales</Text>
        <FilterButton
          onPress={() => setShowFilters(true)}
          activeFiltersCount={getActiveFiltersCount()}
          title="Filters"
        />
      </View>

      {/* Filter Bar */}
      <FilterBar
        chips={getFilterChips()}
        onClearAll={resetFilters}
      />

      {/* Search Results */}
      <ScrollView style={styles.content}>
        <Text style={styles.resultsText}>
          Showing property sales with current filters...
        </Text>
        {/* Your property sales list would go here */}
      </ScrollView>

      {/* Filter Modal */}
      <PropertySaleFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultsText: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    marginTop: 20,
  },
});
