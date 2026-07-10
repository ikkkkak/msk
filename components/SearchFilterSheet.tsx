import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { PropertySearchFilters } from '../hooks/queries/usePropertySearchQuery';
import { 
  X, 
  CurrencyDollar, 
  Bed, 
  Bathtub, 
  House, 
  MapPin, 
  Star,
  SortAscending,
  Minus,
  Plus
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialFilters?: PropertySearchFilters;
  onApply: (filters: PropertySearchFilters) => void;
};

export const SearchFilterSheet: React.FC<Props> = ({ visible, onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState<PropertySearchFilters>(initialFilters || {});
  const { t } = useTranslation();

  const set = (patch: Partial<PropertySearchFilters>) => setFilters(prev => ({ ...prev, ...patch }));

  const isDirty = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters || {}), [filters, initialFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.propertyType) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minBeds) count++;
    if (filters.minBedrooms) count++;
    if (filters.minBathrooms) count++;
    if (filters.minRating) count++;
    if (filters.sort) count++;
    return count;
  }, [filters]);

  const formatPrice = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return v.toString();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('search.filterModal.title')}</Text>
            <TouchableOpacity onPress={() => setFilters({})} style={styles.headerBtn}>
              <Text style={styles.clearText}>{t('search.filterModal.clear', 'Reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('search.filterModal.city')}</Text>
              <View style={styles.chipGrid}>
                {["Nouakchott", "Nouadhibou", "Atar", "Kiffa"].map(city => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.chip, filters.city === city && styles.chipActive]}
                    onPress={() => set({ city: filters.city === city ? undefined : city })}
                  >
                    <Text style={[styles.chipText, filters.city === city && styles.chipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('search.filterModal.propertyType')}</Text>
              <View style={styles.chipGrid}>
                {[
                  { value: "entire_home", label: t('propertyTypes.entirePlace') },
                  { value: "private_room", label: t('propertyTypes.privateRoom') },
                  { value: "shared_room", label: t('propertyTypes.sharedRoom') }
                ].map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, filters.propertyType === value && styles.chipActive]}
                    onPress={() => set({ propertyType: filters.propertyType === value ? undefined : value })}
                  >
                    <Text style={[styles.chipText, filters.propertyType === value && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('search.filterModal.priceRange')}</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>{t('search.filterModal.minPrice')}</Text>
                  <View style={styles.counter}>
                    <TouchableOpacity onPress={() => set({ minPrice: Math.max(0, (filters.minPrice || 0) - 500) })} style={styles.counterBtn}>
                      <MaterialIcons name="remove" size={18} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{formatPrice(filters.minPrice || 0)}</Text>
                    <TouchableOpacity onPress={() => set({ minPrice: (filters.minPrice || 0) + 500 })} style={styles.counterBtn}>
                      <MaterialIcons name="add" size={18} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>{t('search.filterModal.maxPrice')}</Text>
                  <View style={styles.counter}>
                    <TouchableOpacity onPress={() => set({ maxPrice: Math.max(0, (filters.maxPrice || 0) - 500) })} style={styles.counterBtn}>
                      <MaterialIcons name="remove" size={18} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{formatPrice(filters.maxPrice || 0)}</Text>
                    <TouchableOpacity onPress={() => set({ maxPrice: (filters.maxPrice || 0) + 500 })} style={styles.counterBtn}>
                      <MaterialIcons name="add" size={18} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Rooms & Beds */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('search.filterModal.bedBath')}</Text>
              <View style={styles.roomRow}>
                <Text style={styles.roomLabel}>{t('search.filterModal.bedrooms')}</Text>
                <View style={styles.counter}>
                  <TouchableOpacity onPress={() => set({ minBedrooms: Math.max(0, (filters.minBedrooms || 0) - 1) })} style={styles.counterBtn}>
                    <MaterialIcons name="remove" size={20} color="#111827" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{filters.minBedrooms || 'Any'}</Text>
                  <TouchableOpacity onPress={() => set({ minBedrooms: (filters.minBedrooms || 0) + 1 })} style={styles.counterBtn}>
                    <MaterialIcons name="add" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.roomRow}>
                <Text style={styles.roomLabel}>{t('search.filterModal.bathrooms')}</Text>
                <View style={styles.counter}>
                  <TouchableOpacity onPress={() => set({ minBathrooms: Math.max(0, (filters.minBathrooms || 0) - 1) })} style={styles.counterBtn}>
                    <MaterialIcons name="remove" size={20} color="#111827" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{filters.minBathrooms || 'Any'}</Text>
                  <TouchableOpacity onPress={() => set({ minBathrooms: (filters.minBathrooms || 0) + 1 })} style={styles.counterBtn}>
                    <MaterialIcons name="add" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('search.minRating', 'Rating')}</Text>
              <View style={styles.chipGrid}>
                {[5, 4, 3, 2].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.chip, filters.minRating === rating && styles.chipActive]}
                    onPress={() => set({ minRating: filters.minRating === rating ? undefined : rating })}
                  >
                    <Star size={14} color={filters.minRating === rating ? "#006AFF" : "#717171"} weight={filters.minRating === rating ? "fill" : "regular"} />
                    <Text style={[styles.chipText, filters.minRating === rating && styles.chipTextActive]}>
                      {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply(filters); onClose(); }}>
              <Text style={styles.applyBtnText}>{t('search.filterModal.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: '#F0F7FF', borderColor: '#006AFF', borderWidth: 2 },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#006AFF', fontWeight: '700' },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceBox: { flex: 1, gap: 8 },
  priceLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  roomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  roomLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  counterBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  counterValue: { minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#111827' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  applyBtn: { backgroundColor: '#006AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default SearchFilterSheet;
