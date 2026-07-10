import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView, 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoFilters, VIDEO_FILTER_OPTIONS, PROPERTY_TYPE_OPTIONS } from '../constants';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface VideoFilterDropdownProps {
  filters: VideoFilters;
  onFiltersChange: (filters: VideoFilters) => void;
}

export const VideoFilterDropdown: React.FC<VideoFilterDropdownProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showSortModal, setShowSortModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBedsModal, setShowBedsModal] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getCurrentSortLabel = () => {
    const option = VIDEO_FILTER_OPTIONS.find(opt => opt.key === filters.sort);
    return option?.label || 'Most Recent';
  };

  const getCurrentPropertyTypeLabel = () => {
    const option = PROPERTY_TYPE_OPTIONS.find(opt => opt.key === filters.propertyType);
    return option?.label || t('search.filters.allTypes');
  };

  const getPriceRangeLabel = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `$${filters.minPrice} - $${filters.maxPrice}`;
    } else if (filters.minPrice) {
      return `$${filters.minPrice}+`;
    } else if (filters.maxPrice) {
      return `Under $${filters.maxPrice}`;
    }
    return t('search.filters.anyPrice');
  };

  const getBedsLabel = () => {
    if (filters.minBedrooms && filters.maxBedrooms) {
      return `${filters.minBedrooms}-${filters.maxBedrooms} beds`;
    } else if (filters.minBedrooms) {
      return `${filters.minBedrooms}+ beds`;
    } else if (filters.maxBedrooms) {
      return `Up to ${filters.maxBedrooms} beds`;
    }
    return t('search.filters.anyBeds');
  };

  const handleSortSelect = (sortKey: string) => {
    onFiltersChange({ ...filters, sort: sortKey as any });
    setShowSortModal(false);
  };

  const handlePropertyTypeSelect = (propertyType: string) => {
    onFiltersChange({ 
      ...filters, 
      propertyType: propertyType === 'all' ? undefined : propertyType 
    });
    setShowPropertyModal(false);
  };

  const handlePriceRangeSelect = (minPrice?: number, maxPrice?: number) => {
    onFiltersChange({ 
      ...filters, 
      minPrice, 
      maxPrice 
    });
    setShowPriceModal(false);
  };

  const handleBedsSelect = (minBedrooms?: number, maxBedrooms?: number) => {
    onFiltersChange({ 
      ...filters, 
      minBedrooms, 
      maxBedrooms 
    });
    setShowBedsModal(false);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.sort !== 'recent' || 
    filters.propertyType || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.minBedrooms || 
    filters.maxBedrooms;

    const {t} = useTranslation()

  const renderFilterButton = (
    label: string,
    onPress: () => void,
    isActive: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
        {t(`${label}`)}
      </Text>
      <MaterialIcons 
        name="keyboard-arrow-down"
        size={16} 
        color={isActive ? '#FF385C' : '#717171'}
      />
    </TouchableOpacity>
  );

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    children: React.ReactNode
  ) => {
    if (!visible) return null;
    
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t(`${title}`)}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>
            {children}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
         {renderFilterButton(
           getCurrentSortLabel(),
           () => setShowSortModal(true),
           filters.sort !== 'recent'
         )}
        
        {renderFilterButton(
          getCurrentPropertyTypeLabel(),
          () => setShowPropertyModal(true),
          !!filters.propertyType
        )}
        
        {renderFilterButton(
          getPriceRangeLabel(),
          () => setShowPriceModal(true),
          !!(filters.minPrice || filters.maxPrice)
        )}
        
        {renderFilterButton(
          getBedsLabel(),
          () => setShowBedsModal(true),
          !!(filters.minBedrooms || filters.maxBedrooms)
         )}
      </ScrollView>

       {hasActiveFilters && (
        <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
          <MaterialIcons name="clear" size={16} color="#FF385C" />
          <Text style={styles.clearButtonText}>Clear all</Text>
        </TouchableOpacity>
      )}

      {/* Sort Modal */}
      {renderModal(
        showSortModal,
        () => setShowSortModal(false),
        'Sort by',
        <FlatList
          data={VIDEO_FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.modalItem,
                filters.sort === item.key && styles.selectedModalItem
              ]}
              onPress={() => handleSortSelect(item.key)}
            >
              <MaterialIcons 
                name={item.icon as any} 
                size={20} 
                color={filters.sort === item.key ? '#FF385C' : '#717171'} 
              />
              <Text style={[
                styles.modalItemText,
                filters.sort === item.key && styles.selectedModalItemText
              ]}>
                {item.label}
              </Text>
              {filters.sort === item.key && (
                <MaterialIcons name="check" size={20} color="#FF385C" />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Property Type Modal */}
      {renderModal(
        showPropertyModal,
        () => setShowPropertyModal(false),
        'Property Type',
        <FlatList
          data={[{ key: 'all', label: t('search.filters.allTypes') }, ...PROPERTY_TYPE_OPTIONS]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.modalItem,
                (filters.propertyType === item.key || (!filters.propertyType && item.key === 'all')) && styles.selectedModalItem
              ]}
              onPress={() => handlePropertyTypeSelect(item.key)}
            >
              <Text style={[
                styles.modalItemText,
                (filters.propertyType === item.key || (!filters.propertyType && item.key === 'all')) && styles.selectedModalItemText
              ]}>
                {item.label}
              </Text>
              {(filters.propertyType === item.key || (!filters.propertyType && item.key === 'all')) && (
                <MaterialIcons name="check" size={20} color="#FF385C" />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Price Range Modal */}
      {renderModal(
        showPriceModal,
        () => setShowPriceModal(false),
        'Price Range',
        <View style={styles.priceModalContent}>
          <TouchableOpacity
            style={[styles.priceOption, !filters.minPrice && !filters.maxPrice && styles.selectedPriceOption]}
            onPress={() => handlePriceRangeSelect()}
          >
            <Text style={[styles.priceOptionText, !filters.minPrice && !filters.maxPrice && styles.selectedPriceOptionText]}>
              {t('search.filters.anyPrice')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priceOption, filters.minPrice === 0 && filters.maxPrice === 100 && styles.selectedPriceOption]}
            onPress={() => handlePriceRangeSelect(0, 100)}
          >
            <Text style={[styles.priceOptionText, filters.minPrice === 0 && filters.maxPrice === 100 && styles.selectedPriceOptionText]}>
              Under $100
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priceOption, filters.minPrice === 100 && filters.maxPrice === 300 && styles.selectedPriceOption]}
            onPress={() => handlePriceRangeSelect(100, 300)}
          >
            <Text style={[styles.priceOptionText, filters.minPrice === 100 && filters.maxPrice === 300 && styles.selectedPriceOptionText]}>
              $100 - $300
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priceOption, filters.minPrice === 300 && filters.maxPrice === 500 && styles.selectedPriceOption]}
            onPress={() => handlePriceRangeSelect(300, 500)}
          >
            <Text style={[styles.priceOptionText, filters.minPrice === 300 && filters.maxPrice === 500 && styles.selectedPriceOptionText]}>
              $300 - $500
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priceOption, filters.minPrice === 500 && !filters.maxPrice && styles.selectedPriceOption]}
            onPress={() => handlePriceRangeSelect(500)}
          >
            <Text style={[styles.priceOptionText, filters.minPrice === 500 && !filters.maxPrice && styles.selectedPriceOptionText]}>
              $500+
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Beds Modal */}
      {renderModal(
        showBedsModal,
        () => setShowBedsModal(false),
        'Number of Beds',
        <View style={styles.bedsModalContent}>
          <TouchableOpacity
            style={[styles.bedsOption, !filters.minBedrooms && !filters.maxBedrooms && styles.selectedBedsOption]}
            onPress={() => handleBedsSelect()}
          >
            <Text style={[styles.bedsOptionText, !filters.minBedrooms && !filters.maxBedrooms && styles.selectedBedsOptionText]}>
              {t('search.filters.anyBeds')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bedsOption, filters.minBedrooms === 1 && filters.maxBedrooms === 1 && styles.selectedBedsOption]}
            onPress={() => handleBedsSelect(1, 1)}
          >
            <Text style={[styles.bedsOptionText, filters.minBedrooms === 1 && filters.maxBedrooms === 1 && styles.selectedBedsOptionText]}>
              1 bed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bedsOption, filters.minBedrooms === 2 && filters.maxBedrooms === 2 && styles.selectedBedsOption]}
            onPress={() => handleBedsSelect(2, 2)}
          >
            <Text style={[styles.bedsOptionText, filters.minBedrooms === 2 && filters.maxBedrooms === 2 && styles.selectedBedsOptionText]}>
              2 beds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bedsOption, filters.minBedrooms === 3 && filters.maxBedrooms === 3 && styles.selectedBedsOption]}
            onPress={() => handleBedsSelect(3, 3)}
          >
            <Text style={[styles.bedsOptionText, filters.minBedrooms === 3 && filters.maxBedrooms === 3 && styles.selectedBedsOptionText]}>
              3 beds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bedsOption, filters.minBedrooms === 4 && !filters.maxBedrooms && styles.selectedBedsOption]}
            onPress={() => handleBedsSelect(4)}
          >
            <Text style={[styles.bedsOptionText, filters.minBedrooms === 4 && !filters.maxBedrooms && styles.selectedBedsOptionText]}>
              4+ beds
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 5,
    paddingVertical: 12,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  activeFilterButton: {
    backgroundColor: '#FF385C',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#717171',
    marginRight: 4,
    fontFamily: 'CircularStd-Medium',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FF385C',
    marginLeft: 4,
    fontFamily: 'CircularStd-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.85,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'CircularStd-Medium',
  },
  closeButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  selectedModalItem: {
    backgroundColor: '#FFF5F5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#222222',
    marginLeft: 12,
    flex: 1,
    fontFamily: 'CircularStd-Book',
  },
  selectedModalItemText: {
    color: '#FF385C',
    fontFamily: 'CircularStd-Medium',
  },
  priceModalContent: {
    padding: 20,
  },
  priceOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F7F7F7',
  },
  selectedPriceOption: {
    backgroundColor: '#FF385C',
  },
  priceOptionText: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
    fontFamily: 'CircularStd-Book',
  },
  selectedPriceOptionText: {
    color: '#FFFFFF',
    fontFamily: 'CircularStd-Medium',
  },
  bedsModalContent: {
    padding: 20,
  },
  bedsOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F7F7F7',
  },
  selectedBedsOption: {
    backgroundColor: '#FF385C',
  },
  bedsOptionText: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
    fontFamily: 'CircularStd-Book',
  },
  selectedBedsOptionText: {
    color: '#FFFFFF',
    fontFamily: 'CircularStd-Medium',
  },
});
