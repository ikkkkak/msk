import { useState, useCallback } from 'react';
import { PropertyFilters } from '../components/EnhancedPropertyFilterModal';

const DEFAULT_FILTERS: PropertyFilters = {
  priceRange: [0, 4000000],
  propertyType: 'all',
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  location: 'all',
  locationCriteria: [],
  sortBy: 'relevance',
};

export const usePropertyFilters = (initialFilters?: PropertyFilters) => {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters || DEFAULT_FILTERS);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const updateFilters = useCallback((newFilters: Partial<PropertyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const showModal = useCallback(() => setIsModalVisible(true), []);
  const hideModal = useCallback(() => setIsModalVisible(false), []);

  const applyFilters = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
    hideModal();
  }, [hideModal]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.location !== 'all') count++;
    if (filters.locationCriteria.length > 0) count++;
    if (filters.sortBy !== 'relevance') count++;
    return count;
  }, [filters]);

  const getFilterChips = useCallback(() => {
    const chips = [];
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) {
      chips.push({
        id: 'price',
        label: `${filters.priceRange[0]} - ${filters.priceRange[1]} MRU`,
        onRemove: () => updateFilters({ priceRange: [0, 4000000] }),
      });
    }
    
    if (filters.propertyType !== 'all') {
      chips.push({
        id: 'type',
        label: filters.propertyType,
        onRemove: () => updateFilters({ propertyType: 'all' }),
      });
    }
    
    if (filters.bedrooms > 0) {
      chips.push({
        id: 'bedrooms',
        label: `${filters.bedrooms} bedrooms`,
        onRemove: () => updateFilters({ bedrooms: 0 }),
      });
    }
    
    if (filters.bathrooms > 0) {
      chips.push({
        id: 'bathrooms',
        label: `${filters.bathrooms} bathrooms`,
        onRemove: () => updateFilters({ bathrooms: 0 }),
      });
    }
    
    if (filters.amenities.length > 0) {
      chips.push({
        id: 'amenities',
        label: `${filters.amenities.length} amenities`,
        onRemove: () => updateFilters({ amenities: [] }),
      });
    }
    
    if (filters.location !== 'all') {
      chips.push({
        id: 'location',
        label: filters.location,
        onRemove: () => updateFilters({ location: 'all' }),
      });
    }
    
    if (filters.locationCriteria.length > 0) {
      chips.push({
        id: 'locationCriteria',
        label: `${filters.locationCriteria.length} areas`,
        onRemove: () => updateFilters({ locationCriteria: [] }),
      });
    }
    
    return chips;
  }, [filters, updateFilters]);

  const removeFilter = useCallback((filterId: string) => {
    switch (filterId) {
      case 'price':
        updateFilters({ priceRange: [0, 4000000] });
        break;
      case 'type':
        updateFilters({ propertyType: 'all' });
        break;
      case 'bedrooms':
        updateFilters({ bedrooms: 0 });
        break;
      case 'bathrooms':
        updateFilters({ bathrooms: 0 });
        break;
      case 'amenities':
        updateFilters({ amenities: [] });
        break;
      case 'location':
        updateFilters({ location: 'all' });
        break;
      case 'locationCriteria':
        updateFilters({ locationCriteria: [] });
        break;
    }
  }, [updateFilters]);

  const clearAllFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return {
    filters,
    isModalVisible,
    updateFilters,
    resetFilters,
    showModal,
    hideModal,
    applyFilters,
    getActiveFiltersCount,
    getFilterChips,
    removeFilter,
    clearAllFilters,
  };
};
