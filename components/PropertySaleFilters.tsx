import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PropertySaleFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PropertySaleFiltersState) => void;
  initialFilters?: PropertySaleFiltersState;
}

export interface PropertySaleFiltersState {
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
  yearBuilt: string;
  city: string;
  features: string[];
  amenities: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Property types with translation keys
const PROPERTY_TYPES = [
  { key: 'house', value: 'house' },
  { key: 'condo', value: 'condo' },
  { key: 'townhouse', value: 'townhouse' },
  { key: 'apartment', value: 'apartment' },
  { key: 'land', value: 'land' },
  { key: 'commercial', value: 'commercial' },
  { key: 'multiFamily', value: 'multi-family' },
];

// Features with translation keys
const FEATURES = [
  { key: 'pool', value: 'Pool' },
  { key: 'garage', value: 'Garage' },
  { key: 'garden', value: 'Garden' },
  { key: 'balcony', value: 'Balcony' },
  { key: 'fireplace', value: 'Fireplace' },
  { key: 'hardwoodFloors', value: 'Hardwood Floors' },
  { key: 'graniteCountertops', value: 'Granite Countertops' },
  { key: 'stainlessSteelAppliances', value: 'Stainless Steel Appliances' },
  { key: 'walkInCloset', value: 'Walk-in Closet' },
  { key: 'highCeilings', value: 'High Ceilings' },
];

// Amenities with translation keys
const AMENITIES = [
  { key: 'gym', value: 'Gym' },
  { key: 'security', value: 'Security' },
  { key: 'parking', value: 'Parking' },
  { key: 'elevator', value: 'Elevator' },
  { key: 'concierge', value: 'Concierge' },
  { key: 'rooftop', value: 'Rooftop' },
  { key: 'laundry', value: 'Laundry' },
  { key: 'storage', value: 'Storage' },
  { key: 'petFriendly', value: 'Pet Friendly' },
  { key: 'airConditioning', value: 'Air Conditioning' },
];

// Sort options with translation keys
const SORT_OPTIONS = [
  { value: 'price', key: 'price' },
  { value: 'area', key: 'area' },
  { value: 'bedrooms', key: 'bedrooms' },
  { value: 'bathrooms', key: 'bathrooms' },
  { value: 'year_built', key: 'yearBuilt' },
  { value: 'created_at', key: 'dateListed' },
];

export const PropertySaleFilters: React.FC<PropertySaleFiltersProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    yearBuilt: '',
    city: '',
    features: [],
    amenities: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PropertySaleFiltersState>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      yearBuilt: '',
      city: '',
      features: [],
      amenities: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const toggleFeature = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.propertyType) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.minArea || filters.maxArea) count++;
    if (filters.yearBuilt) count++;
    if (filters.city) count++;
    if (filters.features.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('propertySaleFilters.title')}</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>{t('propertySaleFilters.reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.propertyType')}</Text>
              <View style={styles.chipContainer}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      filters.propertyType === type.value && styles.chipActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        propertyType: prev.propertyType === type.value ? '' : type.value,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.propertyType === type.value && styles.chipTextActive,
                      ]}
                    >
                      {t(`propertySaleFilters.propertyTypes.${type.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.priceRange')}</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('propertySaleFilters.minPrice')}
                  value={filters.minPrice}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, minPrice: text }))
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>{t('propertySaleFilters.to')}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('propertySaleFilters.maxPrice')}
                  value={filters.maxPrice}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, maxPrice: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Bedrooms & Bathrooms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.bedroomsBathrooms')}</Text>
              <View style={styles.bedBathContainer}>
                <View style={styles.bedBathInput}>
                  <Text style={styles.inputLabel}>{t('propertySaleFilters.bedrooms')}</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder={t('propertySaleFilters.any')}
                    value={filters.bedrooms}
                    onChangeText={(text) =>
                      setFilters(prev => ({ ...prev, bedrooms: text }))
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.bedBathInput}>
                  <Text style={styles.inputLabel}>{t('propertySaleFilters.bathrooms')}</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder={t('propertySaleFilters.any')}
                    value={filters.bathrooms}
                    onChangeText={(text) =>
                      setFilters(prev => ({ ...prev, bathrooms: text }))
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Area Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.squareFootage')}</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('propertySaleFilters.minSqft')}
                  value={filters.minArea}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, minArea: text }))
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>{t('propertySaleFilters.to')}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('propertySaleFilters.maxSqft')}
                  value={filters.maxArea}
                  onChangeText={(text) =>
                    setFilters(prev => ({ ...prev, maxArea: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Year Built */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.yearBuilt')}</Text>
              <TextInput
                style={styles.singleInput}
                placeholder={t('propertySaleFilters.yearBuiltPlaceholder')}
                value={filters.yearBuilt}
                onChangeText={(text) =>
                  setFilters(prev => ({ ...prev, yearBuilt: text }))
                }
                keyboardType="numeric"
              />
            </View>

            {/* City */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.city')}</Text>
              <TextInput
                style={styles.singleInput}
                placeholder={t('propertySaleFilters.cityPlaceholder')}
                value={filters.city}
                onChangeText={(text) =>
                  setFilters(prev => ({ ...prev, city: text }))
                }
              />
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.features')}</Text>
              <View style={styles.chipContainer}>
                {FEATURES.map((feature) => (
                  <TouchableOpacity
                    key={feature.value}
                    style={[
                      styles.chip,
                      filters.features.includes(feature.value) && styles.chipActive,
                    ]}
                    onPress={() => toggleFeature(feature.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.features.includes(feature.value) && styles.chipTextActive,
                      ]}
                    >
                      {t(`propertySaleFilters.features.${feature.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.amenities')}</Text>
              <View style={styles.chipContainer}>
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.value}
                    style={[
                      styles.chip,
                      filters.amenities.includes(amenity.value) && styles.chipActive,
                    ]}
                    onPress={() => toggleAmenity(amenity.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.amenities.includes(amenity.value) && styles.chipTextActive,
                      ]}
                    >
                      {t(`propertySaleFilters.amenities.${amenity.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('propertySaleFilters.sortBy')}</Text>
              <View style={styles.sortContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortChip,
                        filters.sortBy === option.value && styles.sortChipActive,
                      ]}
                      onPress={() =>
                        setFilters(prev => ({ ...prev, sortBy: option.value }))
                      }
                    >
                      <Text
                        style={[
                          styles.sortChipText,
                          filters.sortBy === option.value && styles.sortChipTextActive,
                        ]}
                      >
                        {t(`propertySaleFilters.sortOptions.${option.key}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.sortOrderButton}
                  onPress={() =>
                    setFilters(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                >
                  <MaterialIcons
                    name={filters.sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                    size={20}
                    color="#0066CC"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                {getActiveFiltersCount()} {getActiveFiltersCount() !== 1 ? t('propertySaleFilters.filtersAppliedPlural') : t('propertySaleFilters.filtersApplied')}
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('propertySaleFilters.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>{t('propertySaleFilters.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  priceSeparator: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  bedBathContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bedBathInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  singleInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  sortChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  sortOrderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerInfo: {
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
