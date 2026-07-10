import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { 
  X,
  SlidersHorizontal,
  Check,
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState(currentFilters);
  const { t } = useTranslation();

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 1000000,
      propertyType: 'all',
      amenities: [],
      guests: 1,
      bedrooms: 0,
      bathrooms: 0,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <X size={20} color="#222222" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('search.filterModal.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t('search.filterModal.priceRange')}</Text>
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>{t('search.filterModal.minPrice')}</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.priceText}>
                    {filters.minPrice?.toLocaleString()} MRU
                  </Text>
                </View>
              </View>
              <View style={styles.priceSeparator} />
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>{t('search.filterModal.maxPrice')}</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.priceText}>
                    {filters.maxPrice?.toLocaleString()} MRU
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Property Type */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t('search.filterModal.propertyType')}</Text>
            <View style={styles.optionsContainer}>
              {[
                { key: 'all', label: t('common.all', 'الكل') },
                { key: 'entire_place', label: t('propertyTypes.entirePlace') },
                { key: 'private_room', label: t('propertyTypes.privateRoom') },
                { key: 'shared_room', label: t('propertyTypes.sharedRoom') },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    filters.propertyType === option.key && styles.optionItemSelected,
                  ]}
                  onPress={() => setFilters({ ...filters, propertyType: option.key })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filters.propertyType === option.key && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filters.propertyType === option.key && (
                    <Check size={16} color="#222222" weight="bold" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Guests */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t('reservation.guests')}</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, guests: Math.max(1, filters.guests - 1) })}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{filters.guests}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, guests: filters.guests + 1 })}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bedrooms */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t('search.filterModal.bedrooms')}</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, bedrooms: Math.max(0, filters.bedrooms - 1) })}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{filters.bedrooms}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, bedrooms: filters.bedrooms + 1 })}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bathrooms */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t('search.filterModal.bathrooms')}</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, bathrooms: Math.max(0, filters.bathrooms - 1) })}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{filters.bathrooms}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setFilters({ ...filters, bathrooms: filters.bathrooms + 1 })}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>{t('common.clear', 'مسح')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>{t('search.showList')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 16,
  },
  
  // Price Range
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 8,
    fontWeight: '500',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7F7F7',
  },
  priceText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
  },
  priceSeparator: {
    width: 20,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginTop: 20,
  },
  
  // Options
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F7F7',
  },
  optionItemSelected: {
    backgroundColor: '#222222',
    borderColor: '#222222',
  },
  optionText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  
  // Counter
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F7F7',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  
  // Footer
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#222222',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
