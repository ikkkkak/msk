import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { X, FunnelSimple, Check } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

interface PropertySaleFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PropertySaleFilters) => void;
  initialFilters?: PropertySaleFilters;
}

export interface PropertySaleFilters {
  priceRange: [number, number];
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  sortBy: string;
}

interface Category {
  id: number;
  type: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string;
}

const DEFAULT_FILTERS: PropertySaleFilters = {
  priceRange: [0, 4000000],
  propertyType: "all",
  bedrooms: 0,
  bathrooms: 0,
  location: "all",
  sortBy: "newest"
};

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "penthouse", label: "Penthouse" }
];

const LOCATIONS = [
  { value: "all", label: "All Locations" },
  { value: "nouakchott", label: "Nouakchott" },
  { value: "nouadhibou", label: "Nouadhibou" },
  { value: "atar", label: "Atar" },
  { value: "kiffa", label: "Kiffa" },
  { value: "kaedi", label: "Kaédi" }
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "size_large", label: "Largest First" },
  { value: "size_small", label: "Smallest First" }
];

export const PropertySaleFilterModal: React.FC<
  PropertySaleFilterModalProps
> = ({ visible, onClose, onApply, initialFilters = DEFAULT_FILTERS }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PropertySaleFilters>(initialFilters);

  // Fetch categories for property types
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["sale-categories", "modal"],
    queryFn: () => api.get("/categories?type=property").then((res) => res.data),
    enabled: visible,
  });

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 4000000) count++;
    if (filters.propertyType !== "all") count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (filters.location !== "all") count++;
    if (filters.sortBy !== "newest") count++;
    return count;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M MRU`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K MRU`;
    }
    return `${price} MRU`;
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
              <X size={24} color="#222222" weight="bold" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <FunnelSimple size={20} color="#222222" weight="bold" />
              <Text style={styles.headerTitle}>Filters</Text>
              {getActiveFiltersCount() > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {getActiveFiltersCount()}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price range</Text>
              <Text style={styles.sectionSubtitle}>
                {formatPrice(filters.priceRange[0])} -{" "}
                {formatPrice(filters.priceRange[1])}
              </Text>
              <View style={styles.priceContainer}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <Text style={styles.priceValue}>
                    {formatPrice(filters.priceRange[0])}
                  </Text>
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <Text style={styles.priceValue}>
                    {formatPrice(filters.priceRange[1])}
                  </Text>
                </View>
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property type</Text>
              <View style={styles.chipsContainer}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      filters.propertyType === type.value && styles.chipSelected
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        propertyType: type.value
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.propertyType === type.value &&
                          styles.chipTextSelected
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.chipsContainer}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location.value}
                    style={[
                      styles.chip,
                      filters.location === location.value && styles.chipSelected
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        location: location.value
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.location === location.value &&
                          styles.chipTextSelected
                      ]}
                    >
                      {location.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bedrooms & Bathrooms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rooms and bathrooms</Text>
              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Bedrooms</Text>
                <View style={styles.counterControls}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        bedrooms: Math.max(0, prev.bedrooms - 1)
                      }))
                    }
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{filters.bedrooms}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        bedrooms: prev.bedrooms + 1
                      }))
                    }
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Bathrooms</Text>
                <View style={styles.counterControls}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        bathrooms: Math.max(0, prev.bathrooms - 1)
                      }))
                    }
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{filters.bathrooms}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        bathrooms: prev.bathrooms + 1
                      }))
                    }
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <View style={styles.sortContainer}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.value &&
                        styles.sortOptionSelected
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, sortBy: option.value }))
                    }
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === option.value &&
                          styles.sortOptionTextSelected
                      ]}
                    >
                      {option.label}
                    </Text>
                    {filters.sortBy === option.value && (
                      <Check size={16} color="#222222" weight="bold" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleReset}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Show results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "70%"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginLeft: 8
  },
  badge: {
    backgroundColor: "#FF385C",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  resetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222"
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 16
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  priceInput: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    alignItems: "center"
  },
  priceLabel: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 4
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  chipSelected: {
    backgroundColor: "#222222",
    borderColor: "#222222"
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222"
  },
  chipTextSelected: {
    color: "#FFFFFF"
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  counterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222"
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    minWidth: 24,
    textAlign: "center"
  },
  sortContainer: {
    gap: 8
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  sortOptionSelected: {
    backgroundColor: "#222222",
    borderColor: "#222222"
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222222"
  },
  sortOptionTextSelected: {
    color: "#FFFFFF"
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0"
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  applyButton: {
    backgroundColor: "#FF385C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    alignItems: "center"
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
