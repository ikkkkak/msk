import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoFilters } from '../constants';

interface VideoFiltersProps {
  filters: VideoFilters;
  onFiltersChange: (filters: VideoFilters) => void;
}

const PROPERTY_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'condo', label: 'Condominium' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Plus récent', order: 'DESC' },
  { value: 'price', label: 'Prix croissant', order: 'ASC' },
  { value: 'price', label: 'Prix décroissant', order: 'DESC' },
  { value: 'rating', label: 'Mieux noté', order: 'DESC' },
  { value: 'bedrooms', label: 'Plus de chambres', order: 'DESC' },
  { value: 'bathrooms', label: 'Plus de salles de bain', order: 'DESC' },
];

export const VideoFiltersComponent: React.FC<VideoFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInput, setCityInput] = useState(filters.city || '');

  const handlePropertyTypeSelect = (type: string) => {
    onFiltersChange({ ...filters, propertyType: type });
    setShowPropertyTypeModal(false);
  };

  const handleSortSelect = (sortBy: string, sortOrder: string) => {
    onFiltersChange({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
    setShowSortModal(false);
  };

  const handleCitySubmit = () => {
    onFiltersChange({ ...filters, city: cityInput.trim() || undefined });
    setShowCityInput(false);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getPropertyTypeLabel = () => {
    const type = PROPERTY_TYPES.find(t => t.value === filters.propertyType);
    return type ? type.label : 'Type de propriété';
  };

  const getSortLabel = () => {
    const sort = SORT_OPTIONS.find(s => s.value === filters.sortBy && s.order === filters.sortOrder);
    return sort ? sort.label : 'Trier par';
  };

  const hasActiveFilters = filters.city || filters.propertyType || filters.sortBy;

  return (
    <View style={styles.container}>
      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* City Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.city && styles.activeFilter]}
          onPress={() => setShowCityInput(true)}
        >
          <MaterialIcons 
            name="location-on" 
            size={16} 
            color={filters.city ? "#FF385C" : "#717171"} 
          />
          <Text style={[styles.filterText, filters.city && styles.activeFilterText]}>
            {filters.city || 'Ville'}
          </Text>
        </TouchableOpacity>

        {/* Property Type Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.propertyType && styles.activeFilter]}
          onPress={() => setShowPropertyTypeModal(true)}
        >
          <MaterialIcons 
            name="home" 
            size={16} 
            color={filters.propertyType ? "#FF385C" : "#717171"} 
          />
          <Text style={[styles.filterText, filters.propertyType && styles.activeFilterText]}>
            {getPropertyTypeLabel()}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color="#717171" />
        </TouchableOpacity>

        {/* Sort Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.sortBy && styles.activeFilter]}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialIcons 
            name="sort" 
            size={16} 
            color={filters.sortBy ? "#FF385C" : "#717171"} 
          />
          <Text style={[styles.filterText, filters.sortBy && styles.activeFilterText]}>
            {getSortLabel()}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color="#717171" />
        </TouchableOpacity>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <MaterialIcons name="clear" size={16} color="#FF385C" />
          </TouchableOpacity>
        )}
      </View>

      {/* City Input Modal */}
      <Modal visible={showCityInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer par ville</Text>
              <TouchableOpacity onPress={() => setShowCityInput(false)}>
                <MaterialIcons name="close" size={24} color="#717171" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.cityInput}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="Entrez le nom de la ville..."
              placeholderTextColor="#717171"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCityInput(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCitySubmit}
              >
                <Text style={styles.confirmButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Property Type Modal */}
      <Modal visible={showPropertyTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Type de propriété</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <MaterialIcons name="close" size={24} color="#717171" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PROPERTY_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    filters.propertyType === item.value && styles.selectedOption
                  ]}
                  onPress={() => handlePropertyTypeSelect(item.value)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.propertyType === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {filters.propertyType === item.value && (
                    <MaterialIcons name="check" size={20} color="#FF385C" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trier par</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <MaterialIcons name="close" size={24} color="#717171" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SORT_OPTIONS}
              keyExtractor={(item, index) => `${item.value}-${item.order}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    filters.sortBy === item.value && filters.sortOrder === item.order && styles.selectedOption
                  ]}
                  onPress={() => handleSortSelect(item.value, item.order)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.sortBy === item.value && filters.sortOrder === item.order && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {filters.sortBy === item.value && filters.sortOrder === item.order && (
                    <MaterialIcons name="check" size={20} color="#FF385C" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    gap: 4,
    flex: 1,
  },
  activeFilter: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF385C',
  },
  filterText: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
    flex: 1,
  },
  activeFilterText: {
    color: '#FF385C',
  },
  clearButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  cityInput: {
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    fontSize: 16,
    color: '#222222',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#717171',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FF385C',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#FFF5F5',
  },
  optionText: {
    fontSize: 16,
    color: '#222222',
  },
  selectedOptionText: {
    color: '#FF385C',
    fontWeight: '600',
  },
});
