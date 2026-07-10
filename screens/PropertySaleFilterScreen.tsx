import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { getIconFromDatabase } from "../utils/iconInterpreter";
import { PriceRangeSlider } from "../components/PriceRangeSlider";

type RouteParams = {
  initialFilters?: PropertySaleFilters;
  onApply?: (filters: PropertySaleFilters) => void;
  focusSection?: "bedrooms" | "bathrooms" | "yearBuilt";
};

export interface PropertySaleFilters {
  priceRange: [number, number];
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  sortBy: string;
  features: string[];
  amenities: string[];
  minArea: number;
  maxArea: number;
  yearBuilt: string;
}

const DEFAULT_FILTERS: PropertySaleFilters = {
  priceRange: [0, 4000000],
  propertyType: "all",
  bedrooms: 0,
  bathrooms: 0,
  location: "all",
  sortBy: "newest",
  features: [],
  amenities: [],
  minArea: 0,
  maxArea: 0,
  yearBuilt: ""
};

const PropertySaleFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation();
  const params = (route.params || {}) as RouteParams;

  const [filters, setFilters] = useState<PropertySaleFilters>(
    params.initialFilters || DEFAULT_FILTERS
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["sale-categories"],
    queryFn: () => api.get("/categories?type=property").then((res) => res.data),
  });
  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["sale-amenities"],
    queryFn: () => api.get("/categories/amenities").then((res) => res.data),
  });
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["sale-locations"],
    queryFn: () => api.get("/locations").then((res) => res.data),
  });

  const categoriesList = useMemo(() => {
    const d: any = categoriesData;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.categories)) return d.categories;
    return [];
  }, [categoriesData]);

  const amenitiesList = useMemo(() => {
    const d: any = amenitiesData;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.amenities)) return d.amenities;
    return [];
  }, [amenitiesData]);

  const locationsList = useMemo(() => {
    const d: any = locationsData;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.locations)) return d.locations;
    return [];
  }, [locationsData]);

  useEffect(() => {
    if (params.initialFilters) {
      setFilters(params.initialFilters);
    }
  }, [params.initialFilters]);

  const handleApply = () => {
    params.onApply?.(filters);
    navigation.goBack();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const toggleAmenity = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const formatPrice = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return v.toString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("filters.title", "Filters")}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
          <Text style={styles.clearText}>{t("filters.reset", "Reset")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("filters.priceRange", "Price Range")}
          </Text>
          <View style={styles.priceDisplay}>
            <Text style={styles.priceValue}>
              {formatPrice(filters.priceRange[0])} MRU -{" "}
              {formatPrice(filters.priceRange[1])} MRU
            </Text>
          </View>
          <PriceRangeSlider
            min={0}
            max={4000000}
            step={100000}
            value={filters.priceRange}
            onChange={(value: [number, number]) =>
              setFilters((prev) => ({ ...prev, priceRange: value }))
            }
          />
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("filters.propertyType", "Property Type")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                filters.propertyType === "all" && styles.chipActive
              ]}
              onPress={() =>
                setFilters((prev) => ({ ...prev, propertyType: "all" }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  filters.propertyType === "all" && styles.chipTextActive
                ]}
              >
                Any
              </Text>
            </TouchableOpacity>
            {categoriesList.map((cat: any) => {
              const id = cat.id.toString();
              const active = filters.propertyType === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, propertyType: id }))
                  }
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {cat.name[i18n.language] || cat.name.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Rooms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <View style={styles.roomRow}>
            <Text style={styles.roomLabel}>Bedrooms</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    bedrooms: Math.max(0, f.bedrooms - 1)
                  }))
                }
                style={styles.counterBtn}
              >
                <MaterialIcons name="remove" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>
                {filters.bedrooms === 0 ? "Any" : filters.bedrooms}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setFilters((f) => ({ ...f, bedrooms: f.bedrooms + 1 }))
                }
                style={styles.counterBtn}
              >
                <MaterialIcons name="add" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.roomRow}>
            <Text style={styles.roomLabel}>Bathrooms</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    bathrooms: Math.max(0, f.bathrooms - 1)
                  }))
                }
                style={styles.counterBtn}
              >
                <MaterialIcons name="remove" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>
                {filters.bathrooms === 0 ? "Any" : filters.bathrooms}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setFilters((f) => ({ ...f, bathrooms: f.bathrooms + 1 }))
                }
                style={styles.counterBtn}
              >
                <MaterialIcons name="add" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("filters.amenities", "Amenities")}
          </Text>
          {amenitiesLoading ? (
            <ActivityIndicator size="small" color="#006AFF" />
          ) : (
            <View style={styles.amenityGrid}>
              {amenitiesList.map((a: any) => {
                const id = a.id.toString();
                const active = filters.amenities.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.amenityItem,
                      active && styles.amenityItemActive
                    ]}
                    onPress={() => toggleAmenity(id)}
                  >
                    <Text
                      style={[
                        styles.amenityText,
                        active && styles.amenityTextActive
                      ]}
                    >
                      {a.name[i18n.language] || a.name.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>{t("filters.apply", "Apply")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  clearText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16
  },
  priceDisplay: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 16
  },
  priceValue: { fontSize: 16, fontWeight: "600", color: "#111827" },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 8
  },
  chipActive: {
    backgroundColor: "#F0F7FF",
    borderColor: "#006AFF",
    borderWidth: 2
  },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#006AFF", fontWeight: "700" },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  roomLabel: { fontSize: 15, color: "#374151", fontWeight: "500" },
  counter: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center"
  },
  counterValue: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB"
  },
  amenityItemActive: {
    backgroundColor: "#F0F7FF",
    borderColor: "#006AFF",
    borderWidth: 1.5
  },
  amenityText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  amenityTextActive: { color: "#006AFF", fontWeight: "600" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF"
  },
  applyBtn: {
    backgroundColor: "#006AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  applyBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" }
});

export default PropertySaleFilterScreen;
