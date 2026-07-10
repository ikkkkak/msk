import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PropertyFilterModal, PropertyFilters } from './PropertyFilterModal';
import { PropertySaleFilterModal, PropertySaleFilters } from './PropertySaleFilterModal';
import { FilterButton } from './FilterButton';
import { FilterBar } from './FilterBar';

export const FilterDemo: React.FC = () => {
  const [showPropertyFilters, setShowPropertyFilters] = useState(false);
  const [showSaleFilters, setShowSaleFilters] = useState(false);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({
    priceRange: [0, 4000000],
    propertyType: 'all',
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
    sortBy: 'relevance',
  });
  const [saleFilters, setSaleFilters] = useState<PropertySaleFilters>({
    priceRange: [0, 4000000],
    propertyType: 'all',
    bedrooms: 0,
    bathrooms: 0,
    location: 'all',
    sortBy: 'newest',
  });

  const getActiveFiltersCount = (filters: PropertyFilters | PropertySaleFilters) => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < (filters as PropertyFilters).amenities ? 10000 : 4000000) count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if ('amenities' in filters && filters.amenities.length > 0) count++;
    if ('location' in filters && filters.location !== 'all') count++;
    if (filters.sortBy !== ('amenities' in filters ? 'relevance' : 'newest')) count++;
    return count;
  };

  const getFilterChips = (filters: PropertyFilters | PropertySaleFilters) => {
    const chips = [];
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < (filters as PropertyFilters).amenities ? 10000 : 4000000) {
      chips.push({
        id: 'price',
        label: `${filters.priceRange[0]} - ${filters.priceRange[1]} MRU`,
        onRemove: () => {
          if ('amenities' in filters) {
            setPropertyFilters(prev => ({ ...prev, priceRange: [0, 4000000] }));
          } else {
            setSaleFilters(prev => ({ ...prev, priceRange: [0, 4000000] }));
          }
        },
      });
    }
    
    if (filters.propertyType !== 'all') {
      chips.push({
        id: 'type',
        label: filters.propertyType,
        onRemove: () => {
          if ('amenities' in filters) {
            setPropertyFilters(prev => ({ ...prev, propertyType: 'all' }));
          } else {
            setSaleFilters(prev => ({ ...prev, propertyType: 'all' }));
          }
        },
      });
    }
    
    if (filters.bedrooms > 0) {
      chips.push({
        id: 'bedrooms',
        label: `${filters.bedrooms} bedrooms`,
        onRemove: () => {
          if ('amenities' in filters) {
            setPropertyFilters(prev => ({ ...prev, bedrooms: 0 }));
          } else {
            setSaleFilters(prev => ({ ...prev, bedrooms: 0 }));
          }
        },
      });
    }
    
    if (filters.bathrooms > 0) {
      chips.push({
        id: 'bathrooms',
        label: `${filters.bathrooms} bathrooms`,
        onRemove: () => {
          if ('amenities' in filters) {
            setPropertyFilters(prev => ({ ...prev, bathrooms: 0 }));
          } else {
            setSaleFilters(prev => ({ ...prev, bathrooms: 0 }));
          }
        },
      });
    }
    
    return chips;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Filter Components Demo</Text>
        
        {/* Property Filters Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Filters</Text>
          <FilterButton
            onPress={() => setShowPropertyFilters(true)}
            activeFiltersCount={getActiveFiltersCount(propertyFilters)}
            title="Property Filters"
          />
          <FilterBar
            chips={getFilterChips(propertyFilters)}
            onClearAll={() => setPropertyFilters({
              priceRange: [0, 4000000],
              propertyType: 'all',
              bedrooms: 0,
              bathrooms: 0,
              amenities: [],
              sortBy: 'relevance',
            })}
          />
        </View>

        {/* Sale Filters Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Sale Filters</Text>
          <FilterButton
            onPress={() => setShowSaleFilters(true)}
            activeFiltersCount={getActiveFiltersCount(saleFilters)}
            title="Sale Filters"
          />
          <FilterBar
            chips={getFilterChips(saleFilters)}
            onClearAll={() => setSaleFilters({
              priceRange: [0, 4000000],
              propertyType: 'all',
              bedrooms: 0,
              bathrooms: 0,
              location: 'all',
              sortBy: 'newest',
            })}
          />
        </View>
      </ScrollView>

      {/* Property Filter Modal */}
      <PropertyFilterModal
        visible={showPropertyFilters}
        onClose={() => setShowPropertyFilters(false)}
        onApply={(filters) => {
          setPropertyFilters(filters);
          setShowPropertyFilters(false);
        }}
        initialFilters={propertyFilters}
      />

      {/* Sale Filter Modal */}
      <PropertySaleFilterModal
        visible={showSaleFilters}
        onClose={() => setShowSaleFilters(false)}
        onApply={(filters) => {
          setSaleFilters(filters);
          setShowSaleFilters(false);
        }}
        initialFilters={saleFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
  },
});
