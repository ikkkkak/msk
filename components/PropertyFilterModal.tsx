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
import {
  X,
  FunnelSimple,
  Check,
  WifiHigh,
  Car,
  Waves,
  Barbell,
  Shield,
  Snowflake,
  Coffee,
  House,
  Building,
  HouseLine,
  Key,
  MapPin,
  Bed,
  Bathtub
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { PriceRangeSlider } from "./PriceRangeSlider";

const { width } = Dimensions.get("window");

interface PropertyFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PropertyFilters) => void;
  initialFilters?: PropertyFilters;
}

export interface PropertyFilters {
  priceRange: [number, number];
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
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

interface Amenity {
  id: number;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string;
  category: string;
}

const DEFAULT_FILTERS: PropertyFilters = {
  priceRange: [0, 10000],
  propertyType: "all",
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  location: "all",
  sortBy: "relevance"
};

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "entire_home", label: "Entire Home" },
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" }
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" }
];

export const PropertyFilterModal: React.FC<PropertyFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = DEFAULT_FILTERS
}) => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    filters.amenities
  );

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", "property"],
    queryFn: () => api.get("/categories?type=property").then((res) => res.data),
    enabled: visible,
  });

  // Fetch amenities
  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => api.get("/categories/amenities").then((res) => res.data),
    enabled: visible,
  });

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", "property-filter"],
    queryFn: () => api.get("/location/locations").then((res) => res.data),
    enabled: visible,
  });

  // Extract arrays from API responses
  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  const amenitiesList = Array.isArray(amenitiesData)
    ? amenitiesData
    : Array.isArray(amenitiesData?.data)
    ? amenitiesData.data
    : Array.isArray(amenitiesData?.amenities)
    ? amenitiesData.amenities
    : [];

  const locationsList = Array.isArray(locationsData)
    ? locationsData
    : Array.isArray(locationsData?.data)
    ? locationsData.data
    : Array.isArray(locationsData?.locations)
    ? locationsData.locations
    : [];

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      setSelectedAmenities(initialFilters.amenities);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    const updatedFilters = {
      ...filters,
      amenities: selectedAmenities
    };
    onApply(updatedFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedAmenities([]);
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.propertyType !== "all") count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (selectedAmenities.length > 0) count++;
    if (filters.sortBy !== "relevance") count++;
    return count;
  };

  const categories: Category[] = categoriesData?.data || [];
  const amenities: Amenity[] = amenitiesData?.data || [];

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
              <Text style={styles.sectionTitle}>Price range (MRU)</Text>
              <PriceRangeSlider
                min={0}
                max={4000000}
                value={filters.priceRange}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, priceRange: value }))
                }
                step={25000}
                formatValue={(val) => {
                  if (val >= 1000000) {
                    return `${(val / 1000000).toFixed(1).replace(".0", "")}M`;
                  } else if (val >= 1000) {
                    return `${(val / 1000).toFixed(0)}K`;
                  }
                  return `${val.toLocaleString()}`;
                }}
              />
            </View>

            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property type</Text>
              <View style={styles.chipsContainer}>
                {categoriesList.map((category: any) => {
                  const getCategoryIcon = (iconName: string) => {
                    const iconMap: { [key: string]: any } = {
                      apartment: Building,
                      house: House,
                      villa: House,
                      studio: Key,
                      default: House
                    };
                    const IconComponent = iconMap[iconName] || iconMap.default;
                    return (
                      <IconComponent
                        size={20}
                        color="#222222"
                        weight="regular"
                      />
                    );
                  };

                  const getCategoryName = (category: any) => {
                    const currentLang = i18n.language || "en";
                    return (
                      category.name[currentLang] ||
                      category.name.en ||
                      category.name
                    );
                  };

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.chip,
                        filters.propertyType === category.id.toString() &&
                          styles.chipSelected
                      ]}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          propertyType: category.id.toString()
                        }))
                      }
                    >
                      <View style={styles.chipContent}>
                        {getCategoryIcon(category.icon)}
                        <Text
                          style={[
                            styles.chipText,
                            filters.propertyType === category.id.toString() &&
                              styles.chipTextSelected
                          ]}
                        >
                          {getCategoryName(category)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              {locationsLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#222222"
                  style={styles.loading}
                />
              ) : (
                <View style={styles.chipsContainer}>
                  {locationsList.map((location: any) => {
                    const getLocationName = (location: any) => {
                      const currentLang = i18n.language || "en";
                      return (
                        location.name[currentLang] ||
                        location.name.en ||
                        location.name
                      );
                    };

                    return (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.chip,
                          filters.location === location.id.toString() &&
                            styles.chipSelected
                        ]}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            location: location.id.toString()
                          }))
                        }
                      >
                        <View style={styles.chipContent}>
                          <MapPin size={20} color="#222222" weight="regular" />
                          <Text
                            style={[
                              styles.chipText,
                              filters.location === location.id.toString() &&
                                styles.chipTextSelected
                            ]}
                          >
                            {getLocationName(location)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Bedrooms & Bathrooms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rooms and bathrooms</Text>
              <View style={styles.counterRow}>
                <View style={styles.counterLabelContainer}>
                  <Bed size={20} color="#222222" weight="regular" />
                  <Text style={styles.counterLabel}>Bedrooms</Text>
                </View>
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
                <View style={styles.counterLabelContainer}>
                  <Bathtub size={20} color="#222222" weight="regular" />
                  <Text style={styles.counterLabel}>Bathrooms</Text>
                </View>
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

            {/* Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              {amenitiesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#222222"
                  style={styles.loading}
                />
              ) : (
                <View style={styles.amenitiesContainer}>
                  {amenitiesList.map((amenity: any) => {
                    const getAmenityIcon = (iconName: string) => {
                      const iconMap: { [key: string]: any } = {
                        wifi: WifiHigh,
                        parking: Car,
                        pool: Waves,
                        gym: Barbell,
                        security: Shield,
                        air_conditioning: Snowflake,
                        kitchen: Coffee,
                        default: House
                      };
                      const IconComponent =
                        iconMap[iconName] || iconMap.default;
                      return (
                        <IconComponent
                          size={20}
                          color="#222222"
                          weight="regular"
                        />
                      );
                    };

                    const getAmenityName = (amenity: any) => {
                      const currentLang = i18n.language || "en";
                      return (
                        amenity.name[currentLang] ||
                        amenity.name.en ||
                        amenity.name
                      );
                    };

                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[
                          styles.amenityItem,
                          selectedAmenities.includes(amenity.id.toString()) &&
                            styles.amenityItemSelected
                        ]}
                        onPress={() => toggleAmenity(amenity.id.toString())}
                      >
                        <View style={styles.amenityContent}>
                          {getAmenityIcon(amenity.icon)}
                          <Text
                            style={[
                              styles.amenityText,
                              selectedAmenities.includes(
                                amenity.id.toString()
                              ) && styles.amenityTextSelected
                            ]}
                          >
                            {getAmenityName(amenity)}
                          </Text>
                        </View>
                        {selectedAmenities.includes(amenity.id.toString()) && (
                          <Check size={16} color="#FFFFFF" weight="bold" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
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
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 6
  },
  amenityItemSelected: {
    backgroundColor: "#222222",
    borderColor: "#222222"
  },
  amenityContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  amenityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222"
  },
  amenityTextSelected: {
    color: "#FFFFFF"
  },
  counterLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loading: {
    paddingVertical: 20
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
