import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocationCriteria } from "../hooks/queries/useLocationDiscovery";
import { useRentPropertyCategoryOptions } from "../hooks/useRentPropertyCategoryOptions";
import { PhosphorIcon } from "../components/PhosphorIcon";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { getIconFromDatabase } from "../utils/iconInterpreter";
import { theme } from "../theme";
import * as Haptics from "expo-haptics";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

type RouteParams = {
  initialFilters: any;
  onApply?: (filters: any) => void;
};

// --- Range Slider Component ---
const RangeSlider = ({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: any) => {
  const SLIDER_WIDTH = SCREEN_WIDTH - 48;
  const startMinPos = useSharedValue(0);
  const startMaxPos = useSharedValue(0);

  const minPos = useSharedValue(
    ((minValue - min) / (max - min)) * SLIDER_WIDTH,
  );
  const maxPos = useSharedValue(
    ((maxValue - min) / (max - min)) * SLIDER_WIDTH,
  );

  // Histogram simulation
  const histogramData = useMemo(() => {
    const bars = 40;
    const data = [];
    for (let i = 0; i < bars; i++) {
      const x = (i / bars - 0.5) * 4;
      data.push(Math.exp(-(x * x)) * 0.8 + Math.random() * 0.2);
    }
    return data;
  }, []);

  const maxBarHeight = Math.max(...histogramData);

  useEffect(() => {
    minPos.value = ((minValue - min) / (max - min)) * SLIDER_WIDTH;
    maxPos.value = ((maxValue - min) / (max - min)) * SLIDER_WIDTH;
  }, [minValue, maxValue, SLIDER_WIDTH]);

  const minGesture = Gesture.Pan()
    .onBegin(() => {
      startMinPos.value = minPos.value;
    })
    .onChange((event) => {
      const newPos = Math.max(
        0,
        Math.min(startMinPos.value + event.translationX, maxPos.value - 30),
      );
      minPos.value = newPos;
      const value = Math.round(min + (newPos / SLIDER_WIDTH) * (max - min));
      runOnJS(onMinChange)(value);
    });

  const maxGesture = Gesture.Pan()
    .onBegin(() => {
      startMaxPos.value = maxPos.value;
    })
    .onChange((event) => {
      const newPos = Math.max(
        minPos.value + 30,
        Math.min(startMaxPos.value + event.translationX, SLIDER_WIDTH),
      );
      maxPos.value = newPos;
      const value = Math.round(min + (newPos / SLIDER_WIDTH) * (max - min));
      runOnJS(onMaxChange)(value);
    });

  const minStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minPos.value - 14 }],
  }));
  const maxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxPos.value - 14 }],
  }));
  const rangeStyle = useAnimatedStyle(() => ({
    left: minPos.value,
    width: maxPos.value - minPos.value,
  }));

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.histogram}>
        {histogramData.map((h, i) => {
          const barPercent = (i / histogramData.length) * 100;
          const minP = ((minValue - min) / (max - min)) * 100;
          const maxP = ((maxValue - min) / (max - min)) * 100;
          const inRange = barPercent >= minP && barPercent <= maxP;
          return (
            <View
              key={i}
              style={[
                sliderStyles.bar,
                {
                  height: h * 60,
                  backgroundColor: inRange
                    ? theme["color-temporary-primary"]
                    : "#E5E7EB",
                },
              ]}
            />
          );
        })}
      </View>
      <View style={sliderStyles.trackContainer}>
        <View style={sliderStyles.track} />
        <Animated.View style={[sliderStyles.activeTrack, rangeStyle]} />
        <GestureDetector gesture={minGesture}>
          <Animated.View style={[sliderStyles.thumb, minStyle]} />
        </GestureDetector>
        <GestureDetector gesture={maxGesture}>
          <Animated.View style={[sliderStyles.thumb, maxStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
};

const MAX_PRICE = 4000000;

const FilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation();
  const params = (route.params || {}) as RouteParams;

  const { data: locationCriteria } = useLocationCriteria();
  const {
    options: rentCategoryOptions,
    sectionTitle: rentPropertyTypeTitle,
    isLoading: categoriesLoading,
  } = useRentPropertyCategoryOptions();
  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => api.get("/categories/amenities").then((res) => res.data),
  });

  const amenitiesList = useMemo(() => {
    const d: any = amenitiesData;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.amenities)) return d.amenities;
    return [];
  }, [amenitiesData]);

  const [filters, setFilters] = useState({
    propertyType: params?.initialFilters?.propertyType ?? "all",
    priceRange: params?.initialFilters?.priceRange ?? [0, MAX_PRICE],
    bedrooms: params?.initialFilters?.bedrooms ?? 0,
    bathrooms: params?.initialFilters?.bathrooms ?? 0,
    amenities: params?.initialFilters?.amenities ?? [],
    locationCriteria: params?.initialFilters?.locationCriteria ?? [],
  });

  const handleApply = () => {
    params.onApply?.(filters);
    navigation.goBack();
  };

  const handleClear = () => {
    setFilters({
      propertyType: "all",
      priceRange: [0, MAX_PRICE],
      bedrooms: 0,
      bathrooms: 0,
      amenities: [],
      locationCriteria: [],
    });
  };

  // Format price in the style "4 000 000" or "400 000" etc.
  function formatPrice(v: number) {
    if (!Number.isFinite(v)) return "";
    return v.toLocaleString("en-US").replace(/,/g, " ");
  }

  const toggleAmenity = (id: string) => {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter((a: string) => a !== id)
        : [...f.amenities, id],
    }));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
          >
            <MaterialIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("search.filterModal.title", "Filters")}
          </Text>
          <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
            <Text style={styles.clearText}>
              {t("search.filterModal.clear", "Reset")}
            </Text>
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
              {t("search.filterModal.priceRange", "Price Range")}
            </Text>
            <View style={styles.priceRow}>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t("filters.min", "Min")}</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(filters.priceRange[0])} MRU
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t("filters.max", "Max")}</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(filters.priceRange[1])} MRU
                </Text>
              </View>
            </View>
            <RangeSlider
              min={0}
              max={MAX_PRICE}
              minValue={filters.priceRange[0]}
              maxValue={filters.priceRange[1]}
              onMinChange={(v: number) =>
                setFilters((f) => ({ ...f, priceRange: [v, f.priceRange[1]] }))
              }
              onMaxChange={(v: number) =>
                setFilters((f) => ({ ...f, priceRange: [f.priceRange[0], v] }))
              }
            />
          </View>

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{rentPropertyTypeTitle}</Text>
            {categoriesLoading ? (
              <ActivityIndicator
                size="small"
                color={theme["color-temporary-primary"]}
                style={{ marginTop: 8 }}
              />
            ) : (
              <View style={styles.propertyTypeGrid}>
                {rentCategoryOptions.map((cat) => {
                  const id = cat.value;
                  const active = filters.propertyType === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.propertyTypeGridItem,
                        active && styles.propertyTypeGridItemActive,
                      ]}
                      onPress={() =>
                        setFilters((f) => ({
                          ...f,
                          propertyType:
                            f.propertyType === id ? "all" : id,
                        }))
                      }
                    >
                      {cat.icon ? (
                        <PhosphorIcon
                          name={cat.icon as never}
                          size={22}
                          color={
                            active
                              ? theme["color-temporary-primary"]
                              : "#717171"
                          }
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.propertyTypeGridText,
                          active && styles.propertyTypeGridTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Rooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("search.filterModal.rooms", "Rooms")}
            </Text>
            <View style={styles.roomRow}>
              <Text style={styles.roomLabel}>
                {t("filters.bedrooms", "Bedrooms")}
              </Text>
              <View style={styles.counter}>
                <TouchableOpacity
                  onPress={() =>
                    setFilters((f) => ({
                      ...f,
                      bedrooms: Math.max(0, f.bedrooms - 1),
                    }))
                  }
                  style={styles.counterBtn}
                >
                  <MaterialIcons name="remove" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {filters.bedrooms === 0
                    ? t("filters.any", "Any")
                    : filters.bedrooms}
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
              <Text style={styles.roomLabel}>
                {t("filters.bathrooms", "Bathrooms")}
              </Text>
              <View style={styles.counter}>
                <TouchableOpacity
                  onPress={() =>
                    setFilters((f) => ({
                      ...f,
                      bathrooms: Math.max(0, f.bathrooms - 1),
                    }))
                  }
                  style={styles.counterBtn}
                >
                  <MaterialIcons name="remove" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {filters.bathrooms === 0
                    ? t("filters.any", "Any")
                    : filters.bathrooms}
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
              {t("search.filterModal.amenities", "Amenities")}
            </Text>
            {amenitiesLoading ? (
              <ActivityIndicator
                size="small"
                color={theme["color-temporary-primary"]}
              />
            ) : (
              <View style={styles.amenityGrid}>
                {amenitiesList.map((a: any) => {
                  const id = String(a.id || a.ID);
                  const active = filters.amenities.includes(id);
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.amenityItem,
                        active && styles.amenityItemActive,
                      ]}
                      onPress={() => toggleAmenity(id)}
                    >
                      <Text
                        style={[
                          styles.amenityText,
                          active && styles.amenityTextActive,
                        ]}
                      >
                        {a.name?.[i18n.language] || a.name?.en || a.name}
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
            <Text style={styles.applyBtnText}>
              {t("search.filterModal.apply", "Apply")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const sliderStyles = StyleSheet.create({
  container: { marginTop: 12, marginBottom: 20 },
  histogram: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 60,
    marginBottom: 8,
  },
  bar: { flex: 1, borderRadius: 1 },
  trackContainer: {
    height: 30,
    justifyContent: "center",
    position: "relative",
  },
  track: { height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  activeTrack: {
    position: "absolute",
    height: 4,
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  clearText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  priceRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  priceBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  priceLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  priceValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  propertyTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  propertyTypeGridItem: {
    width: "48%",
    minHeight: 88,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  propertyTypeGridItemActive: {
    backgroundColor: "#F0F7FF",
    borderColor: theme["color-temporary-primary"],
    borderWidth: 1.5,
  },
  propertyTypeGridText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  propertyTypeGridTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "600",
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#FFF",
    borderColor: theme["color-temporary-primary"],
    borderWidth: 2,
  },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  chipTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "700",
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roomLabel: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  counter: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  amenityItemActive: {
    backgroundColor: "#F0F7FF",
    borderColor: theme["color-temporary-primary"],
    borderWidth: 1.5,
  },
  amenityText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  amenityTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  applyBtn: {
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

export default FilterScreen;
