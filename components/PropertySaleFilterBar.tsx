import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  TextInput,
} from "react-native";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  Ruler,
  Buildings,
  MapTrifold,
  MapPin,
  CaretDown,
  X,
  Check,
  CurrencyCircleDollar,
  XCircle,
  CalendarBlank,
  TrendUp,
} from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { theme } from "../theme";
import Toast from "./CustomToast";
import { useRentPropertyCategoryOptions } from "../hooks/useRentPropertyCategoryOptions";
import { PhosphorIcon } from "./PhosphorIcon";
import {
  formatMruPriceRangeLabel,
  formatPriceThousands,
  parsePriceThousandsInput,
  RENT_PRICE_FILTER_MAX,
  SALE_PRICE_FILTER_MAX,
} from "../utils/formatMruPrice";

const SLIDER_THUMB_GAP_PX = 4;

function priceSliderStep(cap: number): number {
  return cap <= RENT_PRICE_FILTER_MAX ? 1_000 : 10_000;
}

function snapSliderPrice(raw: number, step: number, cap: number): number {
  if (raw <= 0) return 0;
  const snapped = Math.round(raw / step) * step;
  return Math.min(Math.max(snapped, 0), cap);
}

function posToPrice(
  pos: number,
  sliderWidth: number,
  rangeMin: number,
  rangeMax: number,
  step: number,
): number {
  if (sliderWidth <= 0) return rangeMin;
  const raw = rangeMin + (pos / sliderWidth) * (rangeMax - rangeMin);
  return snapSliderPrice(raw, step, rangeMax);
}

function priceToPos(
  value: number,
  sliderWidth: number,
  rangeMin: number,
  rangeMax: number,
): number {
  if (sliderWidth <= 0 || rangeMax <= rangeMin) return 0;
  const t = (value - rangeMin) / (rangeMax - rangeMin);
  return Math.max(0, Math.min(sliderWidth, t * sliderWidth));
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_DROPDOWN_HEIGHT = SCREEN_HEIGHT * 0.5;
const FILTER_GRID_PADDING = 16;
const FILTER_GRID_GAP = 10;
const PROPERTY_TYPE_CELL_WIDTH =
  (SCREEN_WIDTH - FILTER_GRID_PADDING * 2 - FILTER_GRID_GAP) / 2;
const LISTING_TYPE_CELL_WIDTH =
  (SCREEN_WIDTH - FILTER_GRID_PADDING * 2 - FILTER_GRID_GAP * 2) / 3;

/** Temporarily hide country — cities/zones/quartiers are reachable directly */
const COUNTRY_FILTER_ENABLED = false;

interface City {
  id: number;
  name: string;
  name_ar: string;
  zones?: Zone[];
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
  parent_quartier_id?: number;
}

interface PropertySaleFilterBarProps {
  /** Sale listings vs rent/nightly filters on home discovery */
  variant?: "sale" | "rent";
  /** Rent: entire_place | private_room | shared_room | all */
  selectedListingType?: string;
  onListingTypeChange?: (value: string | undefined) => void;
  /** Category id from /categories?type=property (same as Add Property step) */
  selectedPropertyType?: string;
  onPropertyTypeChange?: (value: string | undefined) => void;
  onAreaChange?: (
    minArea: number | undefined,
    maxArea: number | undefined,
  ) => void;
  onCountryChange?: (
    countryId: number | undefined,
    countryName: string | undefined,
  ) => void;
  onCityChange?: (
    cityId: number | undefined,
    cityName: string | undefined,
  ) => void;
  onZoneChange?: (
    zoneId: number | undefined,
    zoneName: string | undefined,
  ) => void;
  onQuartierChange?: (
    quartierId: number | undefined,
    quartierName: string | undefined,
  ) => void;
  onPriceChange?: (
    minPrice: number | undefined,
    maxPrice: number | undefined,
  ) => void;
  onClearAll?: () => void; // Optional callback for parent to handle complete reset
  selectedArea?: { min?: number; max?: number };
  selectedCountryId?: number;
  selectedCityId?: number;
  selectedZoneId?: number;
  selectedQuartierId?: number;
  selectedPriceRange?: { min?: number; max?: number };
  /** Sale only: minimum year built */
  selectedYearBuilt?: number | string;
  onYearBuiltChange?: (year: number | undefined) => void;
  investmentOnly?: boolean;
  onInvestmentChange?: (enabled: boolean) => void;
}

const AREA_RANGES_BASE = [
  { value: undefined, min: undefined, max: undefined },
  { value: 100, min: 100, max: undefined },
  { value: 200, min: 200, max: undefined },
  { value: 300, min: 300, max: undefined },
  { value: 400, min: 400, max: undefined },
  { value: 500, min: 500, max: undefined },
  { value: 600, min: 600, max: undefined },
  { value: 700, min: 700, max: undefined },
  { value: 800, min: 800, max: undefined },
  { value: 900, min: 900, max: undefined },
  { value: 1000, min: 1000, max: undefined },
  { value: 1250, min: 1250, max: undefined },
  { value: 1500, min: 1500, max: undefined },
  { value: 1750, min: 1750, max: undefined },
  { value: 2000, min: 2000, max: undefined },
  { value: 2500, min: 2500, max: undefined },
  { value: 3000, min: 3000, max: undefined },
  { value: 3500, min: 3500, max: undefined },
  { value: 4000, min: 4000, max: undefined },
  { value: 4500, min: 4500, max: undefined },
  { value: 5000, min: 5000, max: undefined },
  { value: 5500, min: 5500, max: undefined },
  { value: 6000, min: 6000, max: undefined },
  { value: 6500, min: 6500, max: undefined },
  { value: 7000, min: 7000, max: undefined },
  { value: 7500, min: 7500, max: undefined },
];

const PriceRangeSlider = ({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: any) => {
  const SLIDER_WIDTH = Math.max(SCREEN_WIDTH - 80, 200);
  const BAR_COUNT = 60;
  const step = priceSliderStep(max);

  const startMinPos = useSharedValue(0);
  const startMaxPos = useSharedValue(0);
  const minPos = useSharedValue(priceToPos(minValue, SLIDER_WIDTH, min, max));
  const maxPos = useSharedValue(priceToPos(maxValue, SLIDER_WIDTH, min, max));
  const isDragging = useRef(false);
  const lastMinParentSyncRef = useRef(0);
  const lastMaxParentSyncRef = useRef(0);
  const PARENT_SYNC_MS = 48;

  const onMinChangeRef = useRef(onMinChange);
  const onMaxChangeRef = useRef(onMaxChange);
  onMinChangeRef.current = onMinChange;
  onMaxChangeRef.current = onMaxChange;

  const sliderConfigRef = useRef({
    min,
    max,
    step,
    sliderWidth: SLIDER_WIDTH,
    maxValue,
    minValue,
  });
  sliderConfigRef.current = {
    min,
    max,
    step,
    sliderWidth: SLIDER_WIDTH,
    maxValue,
    minValue,
  };

  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [isMinFocused, setIsMinFocused] = useState(false);
  const [isMaxFocused, setIsMaxFocused] = useState(false);

  const histogramData = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = (i / BAR_COUNT - 0.5) * 6;
      bars.push(Math.exp(-(x * x) / 2) * 0.9 + 0.05);
    }
    return bars;
  }, []);

  const setDragging = useCallback((v: boolean) => {
    isDragging.current = v;
  }, []);

  const priceFromPos = useCallback((pos: number, which: "min" | "max") => {
    const cfg = sliderConfigRef.current;
    const snapped = posToPrice(
      pos,
      cfg.sliderWidth,
      cfg.min,
      cfg.max,
      cfg.step,
    );
    if (which === "min") {
      return Math.max(cfg.min, Math.min(snapped, cfg.maxValue));
    }
    return Math.max(cfg.minValue, Math.min(snapped, cfg.max));
  }, []);

  const syncMinWhileDragging = useCallback(
    (pos: number) => {
      const clamped = priceFromPos(pos, "min");
      if (!isMinFocused) {
        setMinInput(clamped > 0 ? formatPriceThousands(clamped) : "");
      }
      const now = Date.now();
      if (now - lastMinParentSyncRef.current >= PARENT_SYNC_MS) {
        lastMinParentSyncRef.current = now;
        onMinChangeRef.current?.(clamped);
      }
    },
    [isMinFocused, priceFromPos],
  );

  const syncMaxWhileDragging = useCallback(
    (pos: number) => {
      const clamped = priceFromPos(pos, "max");
      const cfg = sliderConfigRef.current;
      if (!isMaxFocused) {
        setMaxInput(clamped < cfg.max ? formatPriceThousands(clamped) : "");
      }
      const now = Date.now();
      if (now - lastMaxParentSyncRef.current >= PARENT_SYNC_MS) {
        lastMaxParentSyncRef.current = now;
        onMaxChangeRef.current?.(clamped);
      }
    },
    [isMaxFocused, priceFromPos],
  );

  const commitMinThumb = useCallback(
    (pos: number) => {
      const clamped = priceFromPos(pos, "min");
      lastMinParentSyncRef.current = 0;
      onMinChangeRef.current?.(clamped);
      if (!isMinFocused) {
        setMinInput(clamped > 0 ? formatPriceThousands(clamped) : "");
      }
    },
    [isMinFocused, priceFromPos],
  );

  const commitMaxThumb = useCallback(
    (pos: number) => {
      const clamped = priceFromPos(pos, "max");
      const cfg = sliderConfigRef.current;
      lastMaxParentSyncRef.current = 0;
      onMaxChangeRef.current?.(clamped);
      if (!isMaxFocused) {
        setMaxInput(clamped < cfg.max ? formatPriceThousands(clamped) : "");
      }
    },
    [isMaxFocused, priceFromPos],
  );

  const hapticLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  useEffect(() => {
    if (isDragging.current) return;
    const minP = priceToPos(minValue, SLIDER_WIDTH, min, max);
    const maxP = priceToPos(maxValue, SLIDER_WIDTH, min, max);
    minPos.value = withTiming(minP, { duration: 120 });
    maxPos.value = withTiming(maxP, { duration: 120 });

    if (!isMinFocused) {
      setMinInput(minValue > 0 ? formatPriceThousands(minValue) : "");
    }
    if (!isMaxFocused) {
      setMaxInput(maxValue < max ? formatPriceThousands(maxValue) : "");
    }
  }, [
    minValue,
    maxValue,
    min,
    max,
    SLIDER_WIDTH,
    isMinFocused,
    isMaxFocused,
    minPos,
    maxPos,
  ]);

  const minGesture = Gesture.Pan()
    .onBegin(() => {
      startMinPos.value = minPos.value;
      runOnJS(setDragging)(true);
      runOnJS(hapticLight)();
    })
    .onChange((event) => {
      const newPos = Math.max(
        0,
        Math.min(
          startMinPos.value + event.translationX,
          maxPos.value - SLIDER_THUMB_GAP_PX,
        ),
      );
      minPos.value = newPos;
      runOnJS(syncMinWhileDragging)(newPos);
    })
    .onEnd(() => {
      runOnJS(commitMinThumb)(minPos.value);
      runOnJS(setDragging)(false);
      runOnJS(hapticLight)();
    });

  const maxGesture = Gesture.Pan()
    .onBegin(() => {
      startMaxPos.value = maxPos.value;
      runOnJS(setDragging)(true);
      runOnJS(hapticLight)();
    })
    .onChange((event) => {
      const newPos = Math.max(
        minPos.value + SLIDER_THUMB_GAP_PX,
        Math.min(startMaxPos.value + event.translationX, SLIDER_WIDTH),
      );
      maxPos.value = newPos;
      runOnJS(syncMaxWhileDragging)(newPos);
    })
    .onEnd(() => {
      runOnJS(commitMaxThumb)(maxPos.value);
      runOnJS(setDragging)(false);
      runOnJS(hapticLight)();
    });

  const minStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minPos.value }],
  }));

  const maxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxPos.value }],
  }));

  const rangeStyle = useAnimatedStyle(() => ({
    left: minPos.value,
    width: Math.max(0, maxPos.value - minPos.value),
  }));

  const handleMinInputChange = (text: string) => {
    const cleaned = text.replace(/[^\d,]/g, "");
    setMinInput(cleaned);
    if (cleaned === "") {
      onMinChange(0);
      return;
    }
    const value = parsePriceThousandsInput(cleaned);
    if (value != null && value >= min && value <= maxValue) {
      onMinChange(value);
    }
  };

  const handleMaxInputChange = (text: string) => {
    const cleaned = text.replace(/[^\d,]/g, "");
    setMaxInput(cleaned);
    if (cleaned === "") {
      onMaxChange(max);
      return;
    }
    const value = parsePriceThousandsInput(cleaned);
    if (value != null && value <= max && value >= minValue) {
      onMaxChange(value);
    }
  };

  const handleMinInputBlur = () => {
    setIsMinFocused(false);
    if (minInput === "" || minInput === "0") {
      onMinChange(0);
      setMinInput("");
    } else {
      const value = parsePriceThousandsInput(minInput) ?? 0;
      const clampedValue = Math.max(min, Math.min(value, maxValue));
      onMinChange(clampedValue);
      setMinInput(clampedValue > 0 ? formatPriceThousands(clampedValue) : "");
    }
  };

  const handleMaxInputBlur = () => {
    setIsMaxFocused(false);
    if (maxInput === "") {
      onMaxChange(max);
      setMaxInput("");
    } else {
      const value = parsePriceThousandsInput(maxInput) ?? max;
      const clampedValue = Math.max(minValue, Math.min(value, max));
      onMaxChange(clampedValue);
      setMaxInput(clampedValue < max ? formatPriceThousands(clampedValue) : "");
    }
  };

  const handleMinInputFocus = () => {
    setIsMinFocused(true);
    const raw = minValue > 0 ? String(minValue).replace(/,/g, "") : "";
    setMinInput(raw);
  };

  const handleMaxInputFocus = () => {
    setIsMaxFocused(true);
    const raw = maxValue < max ? String(maxValue).replace(/,/g, "") : "";
    setMaxInput(raw);
  };

  return (
    <View style={priceSliderStyles.container}>
      <Text style={priceSliderStyles.title}>Price range</Text>

      <View style={priceSliderStyles.histogramContainer}>
        {histogramData.map((height, i) => (
          <View
            key={`hist-${i}`}
            style={[
              priceSliderStyles.histogramBar,
              { height: height * 60, backgroundColor: "#E7E7E7" },
            ]}
          />
        ))}
      </View>

      <View style={priceSliderStyles.trackWrapper}>
        <View style={priceSliderStyles.trackContainer}>
          <View style={priceSliderStyles.track} />
          <Animated.View style={[priceSliderStyles.activeTrack, rangeStyle]} />
        </View>
        <View style={priceSliderStyles.thumbsContainer}>
          <GestureDetector gesture={minGesture}>
            <Animated.View style={[priceSliderStyles.thumb, minStyle]} />
          </GestureDetector>
          <GestureDetector gesture={maxGesture}>
            <Animated.View style={[priceSliderStyles.thumb, maxStyle]} />
          </GestureDetector>
        </View>
      </View>

      <View style={priceSliderStyles.priceRow}>
        <View style={priceSliderStyles.priceBox}>
          <Text style={priceSliderStyles.priceLabel}>Minimum</Text>
          <View style={priceSliderStyles.inputWrapper}>
            <TextInput
              style={priceSliderStyles.priceInput}
              value={minInput}
              onChangeText={handleMinInputChange}
              onFocus={handleMinInputFocus}
              onBlur={handleMinInputBlur}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#B0B0B0"
              selectTextOnFocus
            />
            <Text style={priceSliderStyles.currencySuffix}>MRU</Text>
          </View>
        </View>
        <View style={priceSliderStyles.separator} />
        <View style={priceSliderStyles.priceBox}>
          <Text style={priceSliderStyles.priceLabel}>Maximum</Text>
          <View style={priceSliderStyles.inputWrapper}>
            <TextInput
              style={priceSliderStyles.priceInput}
              value={maxInput}
              onChangeText={handleMaxInputChange}
              onFocus={handleMaxInputFocus}
              onBlur={handleMaxInputBlur}
              keyboardType="number-pad"
              placeholder="Any"
              placeholderTextColor="#B0B0B0"
              selectTextOnFocus
            />
            <Text style={priceSliderStyles.currencySuffix}>MRU</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const PropertySaleFilterBar: React.FC<PropertySaleFilterBarProps> = ({
  variant = "sale",
  selectedListingType = "all",
  onListingTypeChange,
  selectedPropertyType,
  onPropertyTypeChange,
  onAreaChange,
  onCityChange,
  onZoneChange,
  onQuartierChange,
  onPriceChange,
  onClearAll,
  onCountryChange,
  selectedArea,
  selectedCountryId,
  selectedCityId,
  selectedZoneId,
  selectedQuartierId,
  selectedPriceRange,
  selectedYearBuilt,
  onYearBuiltChange,
  investmentOnly = false,
  onInvestmentChange,
}) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const {
    filterBarOptions: propertyTypeOptions,
    sectionTitle: rentPropertyTypeTitle,
    isLoading: propertyCategoriesLoading,
  } = useRentPropertyCategoryOptions();
  const priceCap =
    variant === "rent" ? RENT_PRICE_FILTER_MAX : SALE_PRICE_FILTER_MAX;
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{
    id: number;
    name: string;
    name_ar: string;
    name_fr?: string;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showToast, setShowToast] = useState(false);

  const dropdownHeight = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);

  useEffect(() => {
    if (activeDropdown) {
      dropdownHeight.value = withTiming(MAX_DROPDOWN_HEIGHT, { duration: 250 });
      dropdownOpacity.value = withTiming(1, { duration: 200 });
      // Disable scroll when dropdown is open
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    } else {
      dropdownHeight.value = withTiming(0, { duration: 200 });
      dropdownOpacity.value = withTiming(0, { duration: 150 });
      // Re-enable scroll when dropdown is closed
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    }
  }, [activeDropdown]);

  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries", currentLanguage || "en"],
    queryFn: async () => {
      try {
        if (!endpoints?.baseURL) return [];
        const r = await axios.get(`${endpoints.baseURL}/countries`, {
          timeout: 10000,
        });
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000,
    enabled: COUNTRY_FILTER_ENABLED && !!endpoints?.baseURL,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: [
      "cities",
      COUNTRY_FILTER_ENABLED ? selectedCountryId : "all",
      currentLanguage || "en",
    ],
    queryFn: async () => {
      try {
        if (!endpoints?.baseURL) return [];
        const params =
          COUNTRY_FILTER_ENABLED && selectedCountryId && selectedCountryId > 0
            ? { country_id: selectedCountryId }
            : undefined;
        const r = await axios.get(`${endpoints.baseURL}/cities`, {
          params,
          timeout: 10000,
        });
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled:
      !!endpoints?.baseURL &&
      (!COUNTRY_FILTER_ENABLED ||
        selectedCountryId == null ||
        selectedCountryId > 0),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ["zones", selectedCityId, currentLanguage || "en"],
    queryFn: async () => {
      if (!selectedCityId || !endpoints?.baseURL) return [];
      try {
        const r = await axios.get(
          `${endpoints.baseURL}/cities/${selectedCityId}/zones`,
          { timeout: 10000 },
        );
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedCityId && !!endpoints?.baseURL,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: quartiersData, isLoading: quartiersLoading } = useQuery({
    queryKey: ["quartiers", selectedZoneId, currentLanguage || "en"],
    queryFn: async () => {
      if (!selectedZoneId || !endpoints?.baseURL) return [];
      try {
        const r = await axios.get(
          `${endpoints.baseURL}/cities/zones/${selectedZoneId}/quartiers`,
          { timeout: 10000 },
        );
        return r.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedZoneId && !!endpoints?.baseURL,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (selectedCountryId && countriesData) {
      const c = countriesData.find((x: any) => x.id === selectedCountryId);
      setSelectedCountry(c || null);
    } else setSelectedCountry(null);
  }, [selectedCountryId, countriesData]);

  useEffect(() => {
    if (selectedCityId && citiesData)
      setSelectedCity(
        citiesData.find((c: City) => c.id === selectedCityId) || null,
      );
    else setSelectedCity(null);
  }, [selectedCityId, citiesData]);

  const getSquareMeterUnit = () => {
    const lang = currentLanguage || "en";
    return lang === "ar" ? "م²" : "m²";
  };

  const getAreaRanges = () => {
    const unit = getSquareMeterUnit();
    const anyLabel =
      currentLanguage === "ar"
        ? "الكل"
        : currentLanguage === "fr"
          ? "Tout"
          : "Any";
    return AREA_RANGES_BASE.map((item) => ({
      ...item,
      label: item.value === undefined ? anyLabel : `${item.value}+ ${unit}`,
    }));
  };

  const yearBuiltOptions = useMemo(() => {
    const anyLabel =
      currentLanguage === "ar"
        ? "الكل"
        : currentLanguage === "fr"
          ? "Tout"
          : "Any";
    const opts: { value?: number; label: string }[] = [
      { value: undefined, label: anyLabel },
    ];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      opts.push({ value: y, label: String(y) });
    }
    return opts;
  }, [currentLanguage]);

  const getYearBuiltLabel = () => {
    if (
      selectedYearBuilt == null ||
      selectedYearBuilt === "" ||
      selectedYearBuilt === "any"
    ) {
      return t("filters.yearBuilt", "Year built");
    }
    return String(selectedYearBuilt);
  };

  const listingTypeOptions = useMemo(
    () => [
      {
        value: "entire_place",
        label: t("homeDiscovery.rentalTypes.entirePlace", "Entire place"),
      },
      {
        value: "private_room",
        label: t("homeDiscovery.rentalTypes.privateRoom", "Private room"),
      },
      {
        value: "shared_room",
        label: t("homeDiscovery.rentalTypes.sharedRoom", "Shared room"),
      },
    ],
    [t],
  );

  const getListingTypeLabel = () => {
    if (variant !== "rent") return "";
    const opt = listingTypeOptions.find((o) => o.value === selectedListingType);
    return opt?.label ?? t("homeDiscovery.filters.listingType", "Listing type");
  };

  const handleListingTypeSelect = (value: string) => {
    const v = selectedListingType === value ? undefined : value;
    onListingTypeChange?.(v);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getPropertyTypeLabel = () => {
    const opt = propertyTypeOptions.find(
      (o) => o.value === selectedPropertyType,
    );
    if (opt) return opt.label;
    return variant === "rent"
      ? rentPropertyTypeTitle
      : t("filters.propertyType", "Property Type");
  };

  const handlePropertyTypeSelect = (value: string) => {
    const v = selectedPropertyType === value ? undefined : value;
    onPropertyTypeChange?.(v);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const hasPropertyTypeFilter = Boolean(selectedPropertyType);

  const getAreaLabel = () => {
    // Check if area filter is actually set (not just default values)
    const hasAreaFilter =
      selectedArea &&
      ((selectedArea.min !== undefined && selectedArea.min > 0) ||
        (selectedArea.max !== undefined && selectedArea.max < 7500));

    if (!hasAreaFilter) return t("filters.area");

    const unit = getSquareMeterUnit();
    const ranges = getAreaRanges();
    const range = ranges.find(
      (r: any) => r.min === selectedArea.min && r.max === selectedArea.max,
    );
    if (range) return range.label;
    const infinity = currentLanguage === "ar" ? "∞" : "∞";
    return `${selectedArea.min || 0}–${selectedArea.max || infinity} ${unit}`;
  };

  const getCountryLabel = () => {
    if (selectedCountry) {
      const lang = currentLanguage || "en";
      if (lang === "ar") return selectedCountry.name_ar || selectedCountry.name;
      if (lang === "fr") return selectedCountry.name_fr || selectedCountry.name;
      return selectedCountry.name;
    }
    if (!selectedCountryId || !countriesData?.length)
      return t("filters.country", "Country");
    const c = countriesData.find((x: any) => x.id === selectedCountryId);
    if (!c) return t("filters.country", "Country");
    const lang = currentLanguage || "en";
    if (lang === "ar") return c.name_ar || c.name;
    if (lang === "fr") return c.name_fr || c.name;
    return c.name;
  };

  const handleCountrySelect = (country: {
    id: number;
    name: string;
    name_ar: string;
    name_fr?: string;
  }) => {
    setSelectedCountry(country);
    onCountryChange?.(country.id, country.name);
    setSelectedCity(null);
    onCityChange?.(undefined, undefined);
    onZoneChange?.(undefined, undefined);
    onQuartierChange?.(undefined, undefined);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getCityLabel = () => {
    if (selectedCity) {
      const lang = currentLanguage || "en";
      return lang === "ar"
        ? selectedCity.name_ar || selectedCity.name
        : selectedCity.name || selectedCity.name_ar;
    }
    if (!selectedCityId || !citiesData) return t("filters.city");
    const city = citiesData.find((c: City) => c.id === selectedCityId);
    const lang = currentLanguage || "en";
    return city
      ? lang === "ar"
        ? city.name_ar || city.name
        : city.name || city.name_ar
      : t("filters.city");
  };

  const getZoneLabel = () => {
    if (!selectedZoneId || !zonesData) return t("filters.zone");
    const zone = zonesData.find((z: Zone) => z.id === selectedZoneId);
    const lang = currentLanguage || "en";
    return zone
      ? lang === "ar"
        ? zone.name_ar || zone.name
        : zone.name || zone.name_ar
      : t("filters.zone");
  };

  const getQuartierLabel = () => {
    if (!selectedQuartierId || !quartiersData) return t("filters.quartier");
    const quartier = quartiersData.find(
      (q: Quartier) => q.id === selectedQuartierId,
    );
    const lang = currentLanguage || "en";
    return quartier
      ? lang === "ar"
        ? quartier.name_ar || quartier.name
        : quartier.name || quartier.name_ar
      : t("filters.quartier");
  };

  const handleAreaSelect = (range: {
    min?: number;
    max?: number;
    [key: string]: any;
  }) => {
    onAreaChange?.(range.min, range.max);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCitySelect = (city: City) => {
    const lang = currentLanguage || "en";
    const cityName =
      lang === "ar" ? city.name_ar || city.name : city.name || city.name_ar;
    setSelectedCity(city);
    onCityChange?.(city.id, cityName);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleZoneSelect = (zone: Zone) => {
    const lang = currentLanguage || "en";
    const zoneName =
      lang === "ar" ? zone.name_ar || zone.name : zone.name || zone.name_ar;
    onZoneChange?.(zone.id, zoneName);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQuartierSelect = (quartier: Quartier) => {
    const lang = currentLanguage || "en";
    const quartierName =
      lang === "ar"
        ? quartier.name_ar || quartier.name
        : quartier.name || quartier.name_ar;
    onQuartierChange?.(quartier.id, quartierName);
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    variant === "rent"
      ? [0, RENT_PRICE_FILTER_MAX]
      : [0, SALE_PRICE_FILTER_MAX],
  );

  useEffect(() => {
    setPriceRange(
      variant === "rent"
        ? [0, RENT_PRICE_FILTER_MAX]
        : [0, SALE_PRICE_FILTER_MAX],
    );
  }, [variant]);

  useEffect(() => {
    if (activeDropdown !== "price") return;
    const min = selectedPriceRange?.min ?? 0;
    const max = selectedPriceRange?.max ?? priceCap;
    setPriceRange([
      Math.max(0, Math.min(min, priceCap)),
      Math.max(0, Math.min(max, priceCap)),
    ]);
  }, [activeDropdown, selectedPriceRange, priceCap]);

  const getPriceLabel = () => {
    const useLive = activeDropdown === "price";
    const min = useLive ? priceRange[0] : (selectedPriceRange?.min ?? 0);
    const max = useLive ? priceRange[1] : (selectedPriceRange?.max ?? priceCap);
    const hasPriceFilter = min > 0 || max < priceCap;

    if (!hasPriceFilter) {
      return variant === "rent"
        ? t("homeDiscovery.filters.pricePerNight", "Price / night")
        : t("filters.price", "Price");
    }
    if (min === 0 && max >= priceCap) {
      return variant === "rent"
        ? t("homeDiscovery.filters.pricePerNight", "Price / night")
        : t("filters.price", "Price");
    }
    if (max >= priceCap) {
      return `${formatPriceThousands(min)}+ MRU`;
    }
    return formatMruPriceRangeLabel(min, max);
  };

  const handlePriceApply = () => {
    onPriceChange?.(
      priceRange[0] === 0 ? undefined : priceRange[0],
      priceRange[1] === priceCap ? undefined : priceRange[1],
    );
    setActiveDropdown(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const hasActiveFilters = useMemo(() => {
    // Check if any filter is actually set (not just default/empty values)
    const hasAreaFilter =
      selectedArea &&
      ((selectedArea.min !== undefined && selectedArea.min > 0) ||
        (selectedArea.max !== undefined && selectedArea.max < 7500));
    const hasPriceFilter =
      selectedPriceRange &&
      ((selectedPriceRange.min !== undefined && selectedPriceRange.min > 0) ||
        (selectedPriceRange.max !== undefined &&
          selectedPriceRange.max < priceCap));

    const hasListingType =
      variant === "rent" &&
      selectedListingType &&
      selectedListingType !== "all";

    const hasPropertyType =
      selectedPropertyType && selectedPropertyType !== "all";

    const hasYear =
      variant === "sale" &&
      selectedYearBuilt != null &&
      selectedYearBuilt !== "" &&
      selectedYearBuilt !== "any";
    const hasInvestment = variant === "sale" && investmentOnly;

    return !!(
      hasAreaFilter ||
      hasListingType ||
      hasPropertyType ||
      (COUNTRY_FILTER_ENABLED && selectedCountryId) ||
      selectedCityId ||
      selectedZoneId ||
      selectedQuartierId ||
      hasPriceFilter ||
      hasYear ||
      hasInvestment
    );
  }, [
    selectedArea,
    selectedCountryId,
    selectedCityId,
    selectedZoneId,
    selectedQuartierId,
    selectedPriceRange,
    variant,
    selectedListingType,
    selectedPropertyType,
    priceCap,
    selectedYearBuilt,
    investmentOnly,
  ]);

  const handleClearAllFilters = () => {
    // Close any open dropdown first
    setActiveDropdown(null);

    // Reset ALL local state completely
    setSelectedCity(null);
    setPriceRange([0, priceCap]);

    // If parent provides onClearAll callback, use it for complete reset
    if (onClearAll) {
      onClearAll();
    } else {
      // Otherwise, reset ALL filter callbacks to undefined/null to clear parent state
      // Call them in sequence to ensure parent state is fully cleared
      // IMPORTANT: Call ALL callbacks even if some might be undefined
      onListingTypeChange?.(undefined);
      onPropertyTypeChange?.(undefined);
      onAreaChange?.(undefined, undefined);
      onCityChange?.(undefined, undefined);
      onZoneChange?.(undefined, undefined);
      onQuartierChange?.(undefined, undefined);
      onPriceChange?.(undefined, undefined);
      onYearBuiltChange?.(undefined);
      onInvestmentChange?.(false);
    }

    // Use setTimeout to ensure state updates happen after callbacks
    setTimeout(() => {
      // Force close dropdown again to ensure it's closed
      setActiveDropdown(null);
      // Show toast notification
      setShowToast(true);
    }, 100);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    opacity: dropdownOpacity.value,
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value * 0.4,
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
              backdropAnimatedStyle,
            ]}
          />
        </TouchableOpacity>
        <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
          <View style={styles.dropdownContent}>
            {activeDropdown === "listingType" && variant === "rent" && (
              <ScrollView
                style={styles.filterGridScroll}
                contentContainerStyle={styles.filterGridContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.listingTypeGrid}>
                  {listingTypeOptions.map((item) => {
                    const isSelected = selectedListingType === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.listingTypeGridItem,
                          isSelected && styles.filterGridItemActive,
                        ]}
                        onPress={() => handleListingTypeSelect(item.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.filterGridItemText,
                            isSelected && styles.filterGridItemTextActive,
                          ]}
                          numberOfLines={2}
                        >
                          {item.label}
                        </Text>
                        {isSelected ? (
                          <Check
                            color={theme["color-temporary-primary"]}
                            size={ICON_SIZE}
                            weight="bold"
                          />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
            {activeDropdown === "propertyType" &&
              (propertyCategoriesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme["color-temporary-primary"]}
                  />
                </View>
              ) : (
                <ScrollView
                  style={styles.filterGridScroll}
                  contentContainerStyle={styles.filterGridContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.propertyTypeGrid}>
                    {propertyTypeOptions.map((item) => {
                      const isSelected = selectedPropertyType === item.value;
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.propertyTypeGridItem,
                            isSelected && styles.filterGridItemActive,
                          ]}
                          onPress={() => handlePropertyTypeSelect(item.value)}
                          activeOpacity={0.7}
                        >
                          {variant === "rent" && item.icon ? (
                            <PhosphorIcon
                              name={item.icon as never}
                              size={22}
                              color={
                                isSelected
                                  ? theme["color-temporary-primary"]
                                  : "#717171"
                              }
                            />
                          ) : null}
                          <Text
                            style={[
                              styles.filterGridItemText,
                              isSelected && styles.filterGridItemTextActive,
                            ]}
                            numberOfLines={2}
                          >
                            {item.label}
                          </Text>
                          {isSelected ? (
                            <Check
                              color={theme["color-temporary-primary"]}
                              size={ICON_SIZE}
                              weight="bold"
                            />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ))}
            {activeDropdown === "yearBuilt" && variant === "sale" && (
              <FlatList
                data={yearBuiltOptions}
                keyExtractor={(item, i) => `year-${item.value ?? i}`}
                renderItem={({ item }) => {
                  const isSelected =
                    item.value === undefined
                      ? selectedYearBuilt == null ||
                        selectedYearBuilt === "" ||
                        selectedYearBuilt === "any"
                      : Number(selectedYearBuilt) === item.value;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        onYearBuiltChange?.(item.value);
                        setActiveDropdown(null);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
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
            {activeDropdown === "area" && (
              <FlatList
                data={getAreaRanges()}
                keyExtractor={(_, i) => `area-${i}`}
                renderItem={({ item }) => {
                  const isSelected =
                    selectedArea?.min === item.min &&
                    selectedArea?.max === item.max;
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
                        numberOfLines={1}
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
            {/* Country picker temporarily disabled — see COUNTRY_FILTER_ENABLED */}
            {COUNTRY_FILTER_ENABLED &&
              activeDropdown === "country" &&
              (countriesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme["color-temporary-primary"]}
                  />
                </View>
              ) : (
                <FlatList
                  data={countriesData || []}
                  keyExtractor={(item: any) => `country-${item.id}`}
                  renderItem={({ item }: { item: any }) => {
                    const isSelected = selectedCountryId === item.id;
                    const lang = currentLanguage || "en";
                    const label =
                      lang === "ar"
                        ? item.name_ar || item.name
                        : lang === "fr"
                          ? item.name_fr || item.name
                          : item.name;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleCountrySelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {label}
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
                    const isSelected =
                      selectedCityId === item.id ||
                      selectedCity?.id === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleCitySelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {(currentLanguage || "en") === "ar"
                            ? item.name_ar || item.name
                            : item.name || item.name_ar}
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
              (!selectedCityId ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.selectCityFirst")}
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
                    const isSelected = selectedZoneId === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleZoneSelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {(currentLanguage || "en") === "ar"
                            ? item.name_ar || item.name
                            : item.name || item.name_ar}
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
              (!selectedZoneId ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.emptyText}>
                    {t("filters.selectZoneFirst")}
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
                    {t(
                      "filters.noQuartiersAvailable",
                      "No quartiers available",
                    )}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={quartiersData || []}
                  keyExtractor={(item: Quartier) => `quartier-${item.id}`}
                  renderItem={({ item }: { item: Quartier }) => {
                    const isSelected = selectedQuartierId === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleQuartierSelect(item)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {(currentLanguage || "en") === "ar"
                            ? item.name_ar || item.name
                            : item.name || item.name_ar}
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
            {activeDropdown === "price" && (
              <ScrollView
                style={styles.priceScrollView}
                contentContainerStyle={styles.priceDropdownContent}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <PriceRangeSlider
                  min={0}
                  max={priceCap}
                  minValue={priceRange[0]}
                  maxValue={priceRange[1]}
                  onMinChange={(v: number) => setPriceRange([v, priceRange[1]])}
                  onMaxChange={(v: number) => setPriceRange([priceRange[0], v])}
                />
                <TouchableOpacity
                  style={styles.applyPriceButton}
                  onPress={handlePriceApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyPriceButtonText}>
                    {t("filters.apply", "Apply")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </>
    );
  }

  return (
    <>
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
            {/* {variant === "rent" && (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedListingType && styles.filterBtnActive,
                ]}
                onPress={() =>
                  setActiveDropdown(
                    activeDropdown === "listingType" ? null : "listingType",
                  )
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedListingType && styles.filterBtnTextActive,
                  ]}
                >
                  {getListingTypeLabel()}
                </Text>
                <CaretDown
                  size={12}
                  color={
                    selectedListingType ? "#222" : "#717171"
                  }
                  weight="bold"
                />
              </TouchableOpacity>
            )} */}

            <TouchableOpacity
              style={[
                styles.filterBtn,
                hasPropertyTypeFilter && styles.filterBtnActive,
              ]}
              onPress={() =>
                setActiveDropdown(
                  activeDropdown === "propertyType" ? null : "propertyType",
                )
              }
              activeOpacity={0.7}
            >
              <Buildings
                size={14}
                color={hasPropertyTypeFilter ? "#222" : "#717171"}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  hasPropertyTypeFilter && styles.filterBtnTextActive,
                ]}
              >
                {getPropertyTypeLabel()}
              </Text>
              <CaretDown
                size={12}
                color={hasPropertyTypeFilter ? "#222" : "#717171"}
                weight="bold"
              />
            </TouchableOpacity>

            {variant !== "rent" && (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedArea &&
                    ((selectedArea.min !== undefined && selectedArea.min > 0) ||
                      (selectedArea.max !== undefined &&
                        selectedArea.max < 7500)) &&
                    styles.filterBtnActive,
                ]}
                onPress={() =>
                  setActiveDropdown(activeDropdown === "area" ? null : "area")
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedArea &&
                      ((selectedArea.min !== undefined &&
                        selectedArea.min > 0) ||
                        (selectedArea.max !== undefined &&
                          selectedArea.max < 7500)) &&
                      styles.filterBtnTextActive,
                  ]}
                >
                  {getAreaLabel()}
                </Text>
                <CaretDown
                  size={12}
                  color={
                    selectedArea &&
                    ((selectedArea.min !== undefined && selectedArea.min > 0) ||
                      (selectedArea.max !== undefined &&
                        selectedArea.max < 7500))
                      ? "#222"
                      : "#717171"
                  }
                  weight="bold"
                />
              </TouchableOpacity>
            )}

            {/* Country filter button temporarily hidden */}
            {COUNTRY_FILTER_ENABLED ? (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  !!selectedCountryId && styles.filterBtnActive,
                ]}
                onPress={() =>
                  setActiveDropdown(
                    activeDropdown === "country" ? null : "country",
                  )
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    !!selectedCountryId && styles.filterBtnTextActive,
                  ]}
                >
                  {getCountryLabel()}
                </Text>
                <CaretDown
                  size={12}
                  color={selectedCountryId ? "#222" : "#717171"}
                  weight="bold"
                />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.filterBtn,
                (!!selectedCityId || !!selectedCity) && styles.filterBtnActive,
                COUNTRY_FILTER_ENABLED &&
                  !selectedCountryId &&
                  styles.filterBtnDisabled,
              ]}
              onPress={() =>
                setActiveDropdown(activeDropdown === "city" ? null : "city")
              }
              disabled={COUNTRY_FILTER_ENABLED && !selectedCountryId}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  (!!selectedCityId || !!selectedCity) &&
                    styles.filterBtnTextActive,
                  COUNTRY_FILTER_ENABLED &&
                    !selectedCountryId &&
                    styles.filterBtnTextDisabled,
                ]}
              >
                {getCityLabel()}
              </Text>
              <CaretDown
                size={12}
                color={
                  COUNTRY_FILTER_ENABLED && !selectedCountryId
                    ? "#CCC"
                    : selectedCityId || selectedCity
                      ? "#222"
                      : "#717171"
                }
                weight="bold"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                !!selectedZoneId && styles.filterBtnActive,
                !selectedCityId && styles.filterBtnDisabled,
              ]}
              onPress={() =>
                setActiveDropdown(
                  !selectedCityId
                    ? null
                    : activeDropdown === "zone"
                      ? null
                      : "zone",
                )
              }
              disabled={!selectedCityId}
              activeOpacity={!selectedCityId ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  !!selectedZoneId && styles.filterBtnTextActive,
                  !selectedCityId && styles.filterBtnTextDisabled,
                ]}
              >
                {getZoneLabel()}
              </Text>
              <CaretDown
                size={12}
                color={
                  selectedZoneId ? "#222" : !selectedCityId ? "#CCC" : "#717171"
                }
                weight="bold"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                !!selectedQuartierId && styles.filterBtnActive,
                !selectedZoneId && styles.filterBtnDisabled,
              ]}
              onPress={() =>
                setActiveDropdown(
                  !selectedZoneId
                    ? null
                    : activeDropdown === "quartier"
                      ? null
                      : "quartier",
                )
              }
              disabled={!selectedZoneId}
              activeOpacity={!selectedZoneId ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  !!selectedQuartierId && styles.filterBtnTextActive,
                  !selectedZoneId && styles.filterBtnTextDisabled,
                ]}
              >
                {getQuartierLabel()}
              </Text>
              <CaretDown
                size={12}
                color={
                  selectedQuartierId
                    ? "#222"
                    : !selectedZoneId
                      ? "#CCC"
                      : "#717171"
                }
                weight="bold"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                selectedPriceRange &&
                  ((selectedPriceRange.min !== undefined &&
                    selectedPriceRange.min > 0) ||
                    (selectedPriceRange.max !== undefined &&
                      selectedPriceRange.max < priceCap)) &&
                  styles.filterBtnActive,
              ]}
              onPress={() => {
                if (activeDropdown !== "price") setPriceRange([0, priceCap]);
                setActiveDropdown(activeDropdown === "price" ? null : "price");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedPriceRange &&
                    ((selectedPriceRange.min !== undefined &&
                      selectedPriceRange.min > 0) ||
                      (selectedPriceRange.max !== undefined &&
                        selectedPriceRange.max < priceCap)) &&
                    styles.filterBtnTextActive,
                ]}
              >
                {getPriceLabel()}
              </Text>
              <CaretDown
                size={12}
                color={
                  selectedPriceRange &&
                  ((selectedPriceRange.min !== undefined &&
                    selectedPriceRange.min > 0) ||
                    (selectedPriceRange.max !== undefined &&
                      selectedPriceRange.max < priceCap))
                    ? "#222"
                    : "#717171"
                }
                weight="bold"
              />
            </TouchableOpacity>

            {variant === "sale" && (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedYearBuilt != null &&
                    selectedYearBuilt !== "" &&
                    selectedYearBuilt !== "any" &&
                    styles.filterBtnActive,
                ]}
                onPress={() =>
                  setActiveDropdown(
                    activeDropdown === "yearBuilt" ? null : "yearBuilt",
                  )
                }
                activeOpacity={0.7}
              >
                <CalendarBlank
                  size={14}
                  color={
                    selectedYearBuilt != null &&
                    selectedYearBuilt !== "" &&
                    selectedYearBuilt !== "any"
                      ? "#222"
                      : "#717171"
                  }
                />
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedYearBuilt != null &&
                      selectedYearBuilt !== "" &&
                      selectedYearBuilt !== "any" &&
                      styles.filterBtnTextActive,
                  ]}
                >
                  {getYearBuiltLabel()}
                </Text>
                <CaretDown size={12} color="#717171" weight="bold" />
              </TouchableOpacity>
            )}

            {variant === "sale" && (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  investmentOnly && styles.filterBtnActive,
                ]}
                onPress={() => {
                  onInvestmentChange?.(!investmentOnly);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <TrendUp
                  size={14}
                  color={investmentOnly ? "#222" : "#717171"}
                  weight={investmentOnly ? "fill" : "regular"}
                />
                <Text
                  style={[
                    styles.filterBtnText,
                    investmentOnly && styles.filterBtnTextActive,
                  ]}
                >
                  {t("filters.investment", "Investment")}
                </Text>
              </TouchableOpacity>
            )}

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearAllFilters}
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
      {/* Toast outside filter bar - positioned at bottom of screen */}
      {/* {showToast && (
      <View style={styles.toastContainer}>
        <Toast
          message={t("filters.allFiltersCleared", "All filters cleared")}
          type="success"
          duration={2000}
          onHide={() => setShowToast(false)}
        />
      </View>
    )} */}
    </>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    pointerEvents: "none",
  },
  wrapper: {
    position: "relative",
    zIndex: 101,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 3,
  },
  container: {
    flexDirection: "row",
    gap: 8,
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
    borderBottomColor: "transparent",
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: theme["color-temporary-primary"],
    borderBottomWidth: 2,
  },
  filterBtnText: {
    fontSize: 13,
    color: "#717171",
    fontWeight: "500",
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  filterBtnTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "600",
  },
  filterBtnTextDisabled: {
    color: "#B0B0B0",
  },
  filterBtnDisabled: {
    opacity: 0.5,
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
    gap: 5,
  },
  clearBtnText: {
    fontSize: 13,
    color: theme["color-temporary-primary"],
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  backdrop: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    bottom: -SCREEN_HEIGHT * 2,
    zIndex: 1200,
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
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 11,
    minHeight: 44,
    backgroundColor: "transparent",
  },
  dropdownItemSelected: {
    backgroundColor: "#F7F7F7",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#222222",
    fontWeight: "400",
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  dropdownItemTextSelected: {
    color: theme["color-temporary-primary"],
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
  },
  filterGridScroll: {
    flex: 1,
  },
  filterGridContent: {
    padding: FILTER_GRID_PADDING,
    paddingBottom: FILTER_GRID_PADDING + 8,
  },
  propertyTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: FILTER_GRID_GAP,
  },
  propertyTypeGridItem: {
    width: PROPERTY_TYPE_CELL_WIDTH,
    minHeight: 88,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  listingTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: FILTER_GRID_GAP,
  },
  listingTypeGridItem: {
    width: LISTING_TYPE_CELL_WIDTH,
    minHeight: 72,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filterGridItemActive: {
    borderColor: theme["color-temporary-primary"],
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  filterGridItemText: {
    fontSize: 13,
    color: "#222222",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  filterGridItemTextActive: {
    color: theme["color-temporary-primary"],
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "400",
  },
  priceScrollView: {
    flex: 1,
  },
  priceDropdownContent: {
    padding: 24,
    paddingBottom: 32,
  },
  applyPriceButton: {
    backgroundColor: "#222222",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  applyPriceButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});

const priceSliderStyles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  histogramContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    gap: 2,
    marginBottom: 12,
  },
  histogramBar: {
    flex: 1,
    borderRadius: 1,
    backgroundColor: "#E7E7E7",
  },
  trackWrapper: {
    position: "relative",
    marginBottom: 24,
    paddingVertical: 16,
  },
  trackContainer: {
    height: 2,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 2,
    backgroundColor: "#E7E7E7",
    borderRadius: 1,
  },
  activeTrack: {
    position: "absolute",
    height: 2,
    backgroundColor: "#222222",
    borderRadius: 1,
  },
  thumbsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumb: {
    position: "absolute",
    top: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#222222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: -15,
  },
  priceRow: {
    flexDirection: "row",
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: "#E7E7E7",
    paddingTop: 20,
    marginBottom: 8,
  },
  priceBox: {
    flex: 1,
  },
  separator: {
    width: 1,
    backgroundColor: "#E7E7E7",
    marginVertical: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E7E7",
    paddingBottom: 8,
  },
  currencySuffix: {
    fontSize: 16,
    color: "#717171",
    fontWeight: "500",
    marginLeft: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "400",
    color: "#222222",
    padding: 0,
    margin: 0,
  },
});
