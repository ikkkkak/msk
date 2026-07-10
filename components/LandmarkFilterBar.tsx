/**
 * Landmark Filter Bar — dropdown style like PropertySaleFilterBar
 * Filters: Price, City, Zone, Quartier
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
  TextInput
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { CaretDown, XCircle, Check, Ruler, TrendUp } from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { theme } from "../theme";
import {
  formatMruPriceRangeLabel,
  formatPriceThousands,
  parsePriceThousandsInput,
  SALE_PRICE_FILTER_MAX,
} from "../utils/formatMruPrice";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_DROPDOWN_HEIGHT = SCREEN_HEIGHT * 0.5;

interface City {
  id: number;
  name: string;
  name_ar: string;
}

interface Zone {
  id: number;
  name: string;
  name_ar: string;
  city_id: number;
}

interface Quartier {
  id: number;
  name: string;
  name_ar: string;
  zone_id: number;
}

export interface LandmarkFilters {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  city?: string;
  city_id?: number;
  zone_id?: number;
  quartier_id?: number;
  investmentOnly?: boolean;
}

const LAND_AREA_RANGES = [
  { value: undefined, min: undefined, max: undefined },
  { value: 100, min: 100, max: undefined },
  { value: 250, min: 250, max: undefined },
  { value: 500, min: 500, max: undefined },
  { value: 1000, min: 1000, max: undefined },
  { value: 2000, min: 2000, max: undefined },
  { value: 5000, min: 5000, max: undefined },
  { value: 10000, min: 10000, max: undefined },
];

interface LandmarkFilterBarProps {
  filters: LandmarkFilters;
  onFiltersChange: (f: LandmarkFilters) => void;
}

export const LandmarkFilterBar: React.FC<LandmarkFilterBarProps> = ({
  filters,
  onFiltersChange
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");

  const dropdownHeight = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);

  useEffect(() => {
    if (activeDropdown) {
      dropdownHeight.value = withTiming(MAX_DROPDOWN_HEIGHT, { duration: 250 });
      dropdownOpacity.value = withTiming(1, { duration: 200 });
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    } else {
      dropdownHeight.value = withTiming(0, { duration: 200 });
      dropdownOpacity.value = withTiming(0, { duration: 150 });
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    }
  }, [activeDropdown]);

  useEffect(() => {
    setPriceMinInput(formatPriceThousands(filters.minPrice));
    setPriceMaxInput(formatPriceThousands(filters.maxPrice));
  }, [activeDropdown, filters.minPrice, filters.maxPrice]);

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", currentLanguage || "en"],
    queryFn: async () => {
      try {
        if (!endpoints?.baseURL) return [];
        const r = await axios.get(`${endpoints.baseURL}/cities`, {
          timeout: 10000
        });
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !!endpoints?.baseURL,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ["zones", filters.city_id, currentLanguage || "en"],
    queryFn: async () => {
      if (!filters.city_id || !endpoints?.baseURL) return [];
      try {
        const r = await axios.get(
          `${endpoints.baseURL}/cities/${filters.city_id}/zones`,
          { timeout: 10000 }
        );
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!filters.city_id && !!endpoints?.baseURL,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: quartiersData, isLoading: quartiersLoading } = useQuery({
    queryKey: ["quartiers", filters.zone_id, currentLanguage || "en"],
    queryFn: async () => {
      if (!filters.zone_id || !endpoints?.baseURL) return [];
      try {
        const r = await axios.get(
          `${endpoints.baseURL}/cities/zones/${filters.zone_id}/quartiers`,
          { timeout: 10000 }
        );
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!filters.zone_id && !!endpoints?.baseURL,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (filters.city_id && citiesData) {
      setSelectedCity(
        citiesData.find((c: City) => c.id === filters.city_id) || null
      );
    } else {
      setSelectedCity(null);
    }
  }, [filters.city_id, citiesData]);

  const getCityLabel = () => {
    if (selectedCity) {
      const lang = currentLanguage || "en";
      return lang === "ar"
        ? selectedCity.name_ar || selectedCity.name
        : selectedCity.name || selectedCity.name_ar;
    }
    if (!filters.city_id || !citiesData) return t("filters.city", "City");
    const city = citiesData.find((c: City) => c.id === filters.city_id);
    const lang = currentLanguage || "en";
    return city
      ? lang === "ar"
        ? city.name_ar || city.name
        : city.name || city.name_ar
      : t("filters.city", "City");
  };

  const getZoneLabel = () => {
    if (!filters.zone_id || !zonesData) return t("filters.zone", "Zone");
    const zone = zonesData.find((z: Zone) => z.id === filters.zone_id);
    const lang = currentLanguage || "en";
    return zone
      ? lang === "ar"
        ? zone.name_ar || zone.name
        : zone.name || zone.name_ar
      : t("filters.zone", "Zone");
  };

  const getQuartierLabel = () => {
    if (!filters.quartier_id || !quartiersData) return t("filters.quartier", "Quartier");
    const quartier = quartiersData.find(
      (q: Quartier) => q.id === filters.quartier_id
    );
    const lang = currentLanguage || "en";
    return quartier
      ? lang === "ar"
        ? quartier.name_ar || quartier.name
        : quartier.name || quartier.name_ar
      : t("filters.quartier", "Quartier");
  };

  const getPriceLabel = () => {
    const hasPrice =
      (filters.minPrice != null && filters.minPrice > 0) ||
      (filters.maxPrice != null && filters.maxPrice > 0);
    if (!hasPrice) return t("filters.price", "Price");
    const min = formatPriceThousands(filters.minPrice) || "0";
    const max = filters.maxPrice
      ? formatPriceThousands(filters.maxPrice)
      : "∞";
    return max === "∞" ? `${min}+ MRU` : formatMruPriceRangeLabel(
      filters.minPrice ?? 0,
      filters.maxPrice ?? 0,
    );
  };

  const getAreaLabel = () => {
    const hasArea =
      (filters.minArea != null && filters.minArea > 0) ||
      (filters.maxArea != null && filters.maxArea > 0);
    if (!hasArea) return t("filters.area", "Area");
    const unit = currentLanguage === "ar" ? "م²" : "m²";
    if (filters.minArea && !filters.maxArea) return `${filters.minArea}+ ${unit}`;
    return `${filters.minArea ?? 0}–${filters.maxArea ?? "∞"} ${unit}`;
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.minPrice != null && filters.minPrice > 0) ||
      (filters.maxPrice != null && filters.maxPrice > 0) ||
      (filters.minArea != null && filters.minArea > 0) ||
      (filters.maxArea != null && filters.maxArea > 0) ||
      filters.city_id ||
      filters.zone_id ||
      filters.quartier_id ||
      filters.investmentOnly
    );
  }, [filters]);

  const handleClearAll = () => {
    setActiveDropdown(null);
    onFiltersChange({
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      city: undefined,
      city_id: undefined,
      zone_id: undefined,
      quartier_id: undefined,
      investmentOnly: false,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePriceMinChange = (text: string) => {
    setPriceMinInput(text.replace(/[^\d,]/g, ""));
  };

  const handlePriceMaxChange = (text: string) => {
    setPriceMaxInput(text.replace(/[^\d,]/g, ""));
  };

  const handlePriceMinBlur = () => {
    const num = parsePriceThousandsInput(priceMinInput);
    setPriceMinInput(formatPriceThousands(num));
  };

  const handlePriceMaxBlur = () => {
    let num = parsePriceThousandsInput(priceMaxInput);
    if (num != null && num > SALE_PRICE_FILTER_MAX) {
      num = SALE_PRICE_FILTER_MAX;
    }
    setPriceMaxInput(formatPriceThousands(num));
  };

  const handlePriceApply = () => {
    const min = parsePriceThousandsInput(priceMinInput);
    let max = parsePriceThousandsInput(priceMaxInput);
    if (max != null && max > SALE_PRICE_FILTER_MAX) {
      max = SALE_PRICE_FILTER_MAX;
    }
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCitySelect = (city: City) => {
    const lang = currentLanguage || "en";
    const cityName =
      lang === "ar" ? city.name_ar || city.name : city.name || city.name_ar;
    setSelectedCity(city);
    onFiltersChange({
      ...filters,
      city: cityName,
      city_id: city.id,
      zone_id: undefined,
      quartier_id: undefined
    });
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleZoneSelect = (zone: Zone) => {
    const lang = currentLanguage || "en";
    const zoneName =
      lang === "ar" ? zone.name_ar || zone.name : zone.name || zone.name_ar;
    onFiltersChange({
      ...filters,
      zone_id: zone.id,
      quartier_id: undefined
    });
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAreaSelect = (item: (typeof LAND_AREA_RANGES)[0]) => {
    onFiltersChange({
      ...filters,
      minArea: item.min,
      maxArea: item.max,
    });
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQuartierSelect = (quartier: Quartier) => {
    const lang = currentLanguage || "en";
    const quartierName =
      lang === "ar"
        ? quartier.name_ar || quartier.name
        : quartier.name || quartier.name_ar;
    onFiltersChange({
      ...filters,
      quartier_id: quartier.id
    });
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    opacity: dropdownOpacity.value
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value * 0.4
  }));

  const ICON_SIZE = 16;

  function renderDropdown() {
    if (!activeDropdown) return null;
    return (
      <>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setActiveDropdown(null)}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#000" },
              backdropAnimatedStyle
            ]}
          />
        </TouchableOpacity>
        <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
          <View style={styles.dropdownContent}>
            {activeDropdown === "area" && (
              <FlatList
                data={LAND_AREA_RANGES.map((item) => {
                  const unit = currentLanguage === "ar" ? "م²" : "m²";
                  const anyLabel =
                    currentLanguage === "ar"
                      ? "الكل"
                      : currentLanguage === "fr"
                        ? "Tout"
                        : "Any";
                  return {
                    ...item,
                    label:
                      item.value === undefined
                        ? anyLabel
                        : `${item.value}+ ${unit}`,
                  };
                })}
                keyExtractor={(_, i) => `land-area-${i}`}
                renderItem={({ item }) => {
                  const isSelected =
                    filters.minArea === item.min && filters.maxArea === item.max;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleAreaSelect(item)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Check
                          color={theme["color-temporary-primary"]}
                          size={ICON_SIZE}
                          weight="bold"
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            {activeDropdown === "price" && (
              <ScrollView
                style={styles.priceScrollView}
                contentContainerStyle={styles.priceDropdownContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.dropdownSectionTitle}>
                  {t("filters.priceRange", "Price range")}
                </Text>
                <View style={styles.priceInputRow}>
                  <View style={styles.priceInputBox}>
                    <Text style={styles.priceLabel}>{t("filters.min", "Min")}</Text>
                    <View style={styles.priceInputWrapperRow}>
                      <TextInput
                        style={styles.priceInputLarge}
                        value={priceMinInput}
                        onChangeText={handlePriceMinChange}
                        onBlur={handlePriceMinBlur}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#B0B0B0"
                      />
                      <Text style={styles.priceCurrencySuffix}>MRU</Text>
                    </View>
                  </View>
                  <View style={styles.priceInputBox}>
                    <Text style={styles.priceLabel}>{t("filters.max", "Max")}</Text>
                    <View style={styles.priceInputWrapperRow}>
                      <TextInput
                        style={styles.priceInputLarge}
                        value={priceMaxInput}
                        onChangeText={handlePriceMaxChange}
                        onBlur={handlePriceMaxBlur}
                        keyboardType="number-pad"
                        placeholder="Any"
                        placeholderTextColor="#B0B0B0"
                      />
                      <Text style={styles.priceCurrencySuffix}>MRU</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handlePriceApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyButtonText}>
                    {t("filters.apply", "Apply")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {activeDropdown === "city" &&
              (citiesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme["color-temporary-primary"]}
                  />
                </View>
              ) : (
                <FlatList
                  data={citiesData || []}
                  keyExtractor={(item: City) => `city-${item.id}`}
                  renderItem={({ item }: { item: City }) => {
                    const lang = currentLanguage || "en";
                    const name =
                      lang === "ar"
                        ? item.name_ar || item.name
                        : item.name || item.name_ar;
                    const isSelected = filters.city_id === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected
                        ]}
                        onPress={() => handleCitySelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected
                          ]}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        {isSelected && (
                          <Check
                            color={theme["color-temporary-primary"]}
                            size={ICON_SIZE}
                            weight="bold"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ))}

            {activeDropdown === "zone" &&
              (!filters.city_id ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.selectCityFirst", "Select a city first")}
                  </Text>
                </View>
              ) : zonesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme["color-temporary-primary"]}
                  />
                </View>
              ) : !zonesData || zonesData.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.noZonesAvailable", "No zones available")}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={zonesData || []}
                  keyExtractor={(item: Zone) => `zone-${item.id}`}
                  renderItem={({ item }: { item: Zone }) => {
                    const lang = currentLanguage || "en";
                    const name =
                      lang === "ar"
                        ? item.name_ar || item.name
                        : item.name || item.name_ar;
                    const isSelected = filters.zone_id === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected
                        ]}
                        onPress={() => handleZoneSelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected
                          ]}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        {isSelected && (
                          <Check
                            color={theme["color-temporary-primary"]}
                            size={ICON_SIZE}
                            weight="bold"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ))}

            {activeDropdown === "quartier" &&
              (!filters.zone_id ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.selectZoneFirst", "Select a zone first")}
                  </Text>
                </View>
              ) : quartiersLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme["color-temporary-primary"]}
                  />
                </View>
              ) : !quartiersData || quartiersData.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.noQuartiersAvailable", "No quartiers available")}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={quartiersData || []}
                  keyExtractor={(item: Quartier) => `quartier-${item.id}`}
                  renderItem={({ item }: { item: Quartier }) => {
                    const lang = currentLanguage || "en";
                    const name =
                      lang === "ar"
                        ? item.name_ar || item.name
                        : item.name || item.name_ar;
                    const isSelected = filters.quartier_id === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected
                        ]}
                        onPress={() => handleQuartierSelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected
                          ]}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        {isSelected && (
                          <Check
                            color={theme["color-temporary-primary"]}
                            size={ICON_SIZE}
                            weight="bold"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ))}
          </View>
        </Animated.View>
      </>
    );
  }

  const hasPrice =
    (filters.minPrice != null && filters.minPrice > 0) ||
    (filters.maxPrice != null && filters.maxPrice > 0);
  const hasArea =
    (filters.minArea != null && filters.minArea > 0) ||
    (filters.maxArea != null && filters.maxArea > 0);
  const hasCity = !!filters.city_id;
  const hasZone = !!filters.zone_id;
  const hasQuartier = !!filters.quartier_id;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
        scrollEnabled={!activeDropdown}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <TouchableOpacity
            style={[styles.filterBtn, hasArea && styles.filterBtnActive]}
            onPress={() =>
              setActiveDropdown(activeDropdown === "area" ? null : "area")
            }
            activeOpacity={0.7}
          >
            <Ruler size={14} color={hasArea ? "#222" : "#717171"} />
            <Text
              style={[styles.filterBtnText, hasArea && styles.filterBtnTextActive]}
            >
              {getAreaLabel()}
            </Text>
            <CaretDown
              size={12}
              color={hasArea ? "#222" : "#717171"}
              weight="bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, hasPrice && styles.filterBtnActive]}
            onPress={() =>
              setActiveDropdown(activeDropdown === "price" ? null : "price")
            }
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterBtnText, hasPrice && styles.filterBtnTextActive]}
            >
              {getPriceLabel()}
            </Text>
            <CaretDown
              size={12}
              color={hasPrice ? "#222" : "#717171"}
              weight="bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, hasCity && styles.filterBtnActive]}
            onPress={() =>
              setActiveDropdown(activeDropdown === "city" ? null : "city")
            }
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterBtnText, hasCity && styles.filterBtnTextActive]}
            >
              {getCityLabel()}
            </Text>
            <CaretDown
              size={12}
              color={hasCity ? "#222" : "#717171"}
              weight="bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              hasZone && styles.filterBtnActive,
              !filters.city_id && styles.filterBtnDisabled
            ]}
            onPress={() =>
              setActiveDropdown(
                !filters.city_id
                  ? null
                  : activeDropdown === "zone"
                  ? null
                  : "zone"
              )
            }
            disabled={!filters.city_id}
            activeOpacity={!filters.city_id ? 1 : 0.7}
          >
            <Text
              style={[
                styles.filterBtnText,
                hasZone && styles.filterBtnTextActive,
                !filters.city_id && styles.filterBtnTextDisabled
              ]}
            >
              {getZoneLabel()}
            </Text>
            <CaretDown
              size={12}
              color={
                hasZone ? "#222" : !filters.city_id ? "#CCC" : "#717171"
              }
              weight="bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              hasQuartier && styles.filterBtnActive,
              !filters.zone_id && styles.filterBtnDisabled
            ]}
            onPress={() =>
              setActiveDropdown(
                !filters.zone_id
                  ? null
                  : activeDropdown === "quartier"
                  ? null
                  : "quartier"
              )
            }
            disabled={!filters.zone_id}
            activeOpacity={!filters.zone_id ? 1 : 0.7}
          >
            <Text
              style={[
                styles.filterBtnText,
                hasQuartier && styles.filterBtnTextActive,
                !filters.zone_id && styles.filterBtnTextDisabled
              ]}
            >
              {getQuartierLabel()}
            </Text>
            <CaretDown
              size={12}
              color={
                hasQuartier
                  ? "#222"
                  : !filters.zone_id
                  ? "#CCC"
                  : "#717171"
              }
              weight="bold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              filters.investmentOnly && styles.filterBtnActive,
            ]}
            onPress={() => {
              onFiltersChange({
                ...filters,
                investmentOnly: !filters.investmentOnly,
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <TrendUp
              size={14}
              color={filters.investmentOnly ? "#222" : "#717171"}
              weight={filters.investmentOnly ? "fill" : "regular"}
            />
            <Text
              style={[
                styles.filterBtnText,
                filters.investmentOnly && styles.filterBtnTextActive,
              ]}
            >
              {t("filters.investment", "Investment")}
            </Text>
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <XCircle
                size={ICON_SIZE}
                color={theme["color-temporary-primary"]}
                weight="bold"
              />
              <Text style={styles.clearBtnText}>
                {t("filters.clearAll", "Clear")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {renderDropdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 101,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD"
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 3
  },
  container: {
    flexDirection: "row",
    gap: 8
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 34,
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: theme["color-temporary-primary"],
    borderBottomWidth: 2
  },
  filterBtnDisabled: {
    opacity: 0.5
  },
  filterBtnText: {
    fontSize: 13,
    color: "#717171",
    fontWeight: "500",
    flexShrink: 1,
    letterSpacing: -0.2
  },
  filterBtnTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "600"
  },
  filterBtnTextDisabled: {
    color: "#B0B0B0"
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"],
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 34,
    justifyContent: "center",
    gap: 5
  },
  clearBtnText: {
    fontSize: 13,
    color: theme["color-temporary-primary"],
    fontWeight: "600",
    letterSpacing: -0.2
  },
  backdrop: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    bottom: -SCREEN_HEIGHT * 2,
    zIndex: 1200
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E7E7E7",
    overflow: "hidden",
    zIndex: 1201,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12
      },
      android: {
        elevation: 4
      }
    })
  },
  dropdownContent: {
    flex: 1
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 11,
    minHeight: 44,
    backgroundColor: "transparent"
  },
  dropdownItemSelected: {
    backgroundColor: "#F7F7F7"
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#222222",
    fontWeight: "400",
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2
  },
  dropdownItemTextSelected: {
    color: theme["color-temporary-primary"],
    fontWeight: "600"
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF"
  },
  emptyText: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "400"
  },
  priceScrollView: {
    flex: 1
  },
  priceDropdownContent: {
    padding: 24,
    paddingBottom: 32
  },
  dropdownSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12
  },
  priceInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  priceInputBox: {
    flex: 1
  },
  priceLabel: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 8,
    fontWeight: "500"
  },
  priceInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: "#E7E7E7"
  },
  priceInputWrapperRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#E7E7E7",
  },
  priceInputLarge: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#222",
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 48,
  },
  priceCurrencySuffix: {
    fontSize: 16,
    fontWeight: "500",
    color: "#717171",
    marginLeft: 6,
    paddingBottom: 4,
  },
  applyButton: {
    backgroundColor: "#222222",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2
  }
});
