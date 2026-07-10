import { useState, useCallback } from 'react';
import { PropertySaleFilters } from '../components/PropertySaleFilterModal';

const DEFAULT_FILTERS: PropertySaleFilters = {
  priceRange: [0, 4000000],
  propertyType: 'all',
  bedrooms: 0,
  bathrooms: 0,
  location: 'all',
  sortBy: 'newest',
};

export const usePropertySaleFilters = (initialFilters?: PropertySaleFilters) => {
  const [filters, setFilters] = useState<PropertySaleFilters>(initialFilters || DEFAULT_FILTERS);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const updateFilters = useCallback((newFilters: Partial<PropertySaleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const showModal = useCallback(() => setIsModalVisible(true), []);
  const hideModal = useCallback(() => setIsModalVisible(false), []);

  const applyFilters = useCallback((newFilters: PropertySaleFilters) => {
    setFilters(newFilters);
    hideModal();
  }, [hideModal]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (filters.location !== 'all') count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  const getFilterChips = useCallback(() => {
    const chips = [];
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) {
      const formatPrice = (price: number) => {
        if (price >= 1000000) {
          return `${(price / 1000000).toFixed(1)}M MRU`;
        } else if (price >= 1000) {
          return `${(price / 1000).toFixed(0)}K MRU`;
        }
        return `${price} MRU`;
      };
      
      chips.push({
        id: 'price',
        label: `${formatPrice(filters.priceRange[0])} - ${formatPrice(filters.priceRange[1])}`,
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
    
    if (filters.location !== 'all') {
      chips.push({
        id: 'location',
        label: filters.location,
        onRemove: () => updateFilters({ location: 'all' }),
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
      case 'location':
        updateFilters({ location: 'all' });
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
