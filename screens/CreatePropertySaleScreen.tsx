import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Dimensions
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  X,
  Plus,
  Minus,
  Check,
  Camera,
  Video,
  MapPin,
  Star,
  ArrowRight,
  ArrowLeft,
} from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  pickMultipleImagesNative,
  pickVideoNative,
} from "../utils/nativePhotoPicker";
import MapView, { Marker } from "react-native-maps";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { useUser } from "../hooks/useUser";
import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
import { endpoints } from "../constants";
import { useAmenities } from "../hooks/queries/useCategories";
import { useLanguage } from "../contexts/LanguageContext";
import { AddWithAiFlow } from "../components/listing-ai/AddWithAiFlow";
import { ListingStartMethodPicker } from "../components/listing-ai/ListingStartMethodPicker";
import type { ListingAiDraft } from "../types/listingAi";
import {
  isValidMediaUri,
  normalizeMediaUrlList,
  resolveUploadedMediaUrl,
} from "../utils/mediaUri";
import { usePropertySalePublish } from "../contexts/PropertySalePublishContext";
import {
  useCountriesQuery,
  getCountryDisplayName,
} from "../hooks/queries/useCountriesQuery";
import { useLocationPicker } from "../hooks/useLocationPicker";
import { LocationPickerList } from "../components/location/LocationPickerList";

type CreatePropertySaleRouteParams = { openAiFlow?: boolean };

export const CreatePropertySaleScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const { startBackgroundPublish } = usePropertySalePublish();
  const { currentLanguage } = useLanguage();

  const tr = (key: string, fallback: string, vars?: Record<string, any>) =>
    t(key, { defaultValue: fallback, ...(vars || {}) });

  const [currentStep, setCurrentStep] = useState(0);
  const [aiFlowVisible, setAiFlowVisible] = useState(false);

  useEffect(() => {
    const params = route.params as CreatePropertySaleRouteParams | undefined;
    if (!params?.openAiFlow) return;
    setAiFlowVisible(true);
    try {
      (navigation as any).setParams({ openAiFlow: undefined });
    } catch {
      /* ignore */
    }
  }, [route.params, navigation]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    year_built: "",
    country_id: null as number | null,
    city_id: null as number | null,
    zone_id: null as number | null,
    quartier_id: null as number | null,
    latitude: null as number | null,
    longitude: null as number | null,
    indoor_features: [] as string[],
    outdoor_features: [] as string[],
    amenity_ids: [] as number[],
    paper_types: [] as string[],
    host_private_note: "",
  });
  const [customPaperType, setCustomPaperType] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 18.0731,
    longitude: -15.9582,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const { data: countries = [], isLoading: countriesLoading } =
    useCountriesQuery();
  const defaultCountry = useMemo(
    () => countries.find((c) => c.code === "MR") ?? countries[0],
    [countries],
  );
  const location = useLocationPicker(formData.city_id, formData.zone_id, {
    countryId: formData.country_id,
  });
  const {
    cities,
    zones,
    quartiers,
    citiesLoading,
    zonesLoading,
    quartiersLoading,
    citiesError,
    zonesError,
    quartiersError,
    refetchCities,
    refetchZones,
    label: locationLabel,
    citySearch,
    setCitySearch,
    zoneSearch,
    setZoneSearch,
    quartierSearch,
    setQuartierSearch,
    habitatCity,
  } = location;

  useEffect(() => {
    if (!defaultCountry?.id || formData.country_id) return;
    setFormData((prev) => ({ ...prev, country_id: defaultCountry.id }));
  }, [defaultCountry?.id, formData.country_id]);

  // Fetch amenities
  const { data: amenitiesData = [] } = useAmenities();

  const buildDescriptionTemplates = () => {
    const type = formData.property_type || tr("listing.sale.propertyType.unknown", "Property", {});
    const bedrooms =
      formData.bedrooms && formData.bedrooms !== "skip" ? formData.bedrooms : "";
    const bathrooms =
      formData.bathrooms && formData.bathrooms !== "skip" ? formData.bathrooms : "";
    const cityName = location.cityName;
    const zoneName = location.zoneName;
    const place = [zoneName, cityName].filter(Boolean).join(", ");
    const area = formData.area?.trim() ? `${formData.area} m²` : "";
    const price = formData.price?.trim() ? `${formData.price} MRU` : "";

    const line1 = [
      type,
      bedrooms ? tr("listing.common.bedroomsShort", "{{count}} bd", { count: bedrooms }) : "",
      bathrooms ? tr("listing.common.bathroomsShort", "{{count}} ba", { count: bathrooms }) : "",
    ]
      .filter(Boolean)
      .join(" • ");

    const bullets = [
      place ? tr("listing.common.template.locationLine", "Location: {{place}}", { place }) : "",
      area ? tr("listing.common.template.areaLine", "Area: {{area}}", { area }) : "",
      price ? tr("listing.common.template.priceLine", "Price: {{price}}", { price }) : "",
    ].filter(Boolean);

    return [
      {
        id: "short",
        title: tr("listing.common.template.shortTitle", "Short", {}),
        text: [line1, bullets.slice(0, 2).join("\n")].filter(Boolean).join("\n"),
      },
      {
        id: "family",
        title: tr("listing.common.template.familyTitle", "Family-friendly", {}),
        text: [
          line1,
          place ? tr("listing.common.template.nearLine", "Near: {{place}}", { place }) : "",
          tr(
            "listing.sale.template.familyBody",
            "Bright, comfortable home with a practical layout. Ideal for a family or long-term living.",
            {},
          ),
          bullets.join("\n"),
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        id: "invest",
        title: tr("listing.common.template.investTitle", "Investment", {}),
        text: [
          line1,
          tr(
            "listing.sale.template.investBody",
            "Great opportunity in a high-demand area. Suitable for living or investment.",
            {},
          ),
          bullets.join("\n"),
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ].filter((x) => x.text.trim().length > 0);
  };

  const PROPERTY_TYPES = [
    {
      key: "Apartment",
      label: tr("listing.sale.propertyType.apartment", "Apartment", {}),
      icon: "🏢",
    },
    { key: "House", label: tr("listing.sale.propertyType.house", "House", {}), icon: "🏠" },
    { key: "Villa", label: tr("listing.sale.propertyType.villa", "Villa", {}), icon: "🏛️" },
    { key: "Studio", label: tr("listing.sale.propertyType.studio", "Studio", {}), icon: "🏙️" },
    {
      key: "Townhouse",
      label: tr("listing.sale.propertyType.townhouse", "Townhouse", {}),
      icon: "🏘️",
    },
    { key: "Duplex", label: tr("listing.sale.propertyType.duplex", "Duplex", {}), icon: "🏗️" },
  ];

  const INDOOR_FEATURES = [
    {
      key: "Air Conditioning",
      label: tr("listing.sale.steps.indoorFeatures.airConditioning", "Air Conditioning", {}),
    },
    { key: "Heating", label: tr("listing.sale.steps.indoorFeatures.heating", "Heating", {}) },
    { key: "Washer", label: tr("listing.sale.steps.indoorFeatures.washer", "Washer", {}) },
    { key: "Dryer", label: tr("listing.sale.steps.indoorFeatures.dryer", "Dryer", {}) },
    {
      key: "Dishwasher",
      label: tr("listing.sale.steps.indoorFeatures.dishwasher", "Dishwasher", {}),
    },
    { key: "Elevator", label: tr("listing.sale.steps.indoorFeatures.elevator", "Elevator", {}) },
    {
      key: "Fireplace",
      label: tr("listing.sale.steps.indoorFeatures.fireplace", "Fireplace", {}),
    },
    {
      key: "Walk-in Closet",
      label: tr("listing.sale.steps.indoorFeatures.walkInCloset", "Walk-in Closet", {}),
    },
    { key: "Furnished", label: tr("listing.sale.steps.indoorFeatures.furnished", "Furnished", {}) },
  ];

  const OUTDOOR_FEATURES = [
    { key: "Balcony", label: tr("listing.sale.steps.outdoorFeatures.balcony", "Balcony", {}) },
    { key: "Garden", label: tr("listing.sale.steps.outdoorFeatures.garden", "Garden", {}) },
    { key: "Patio", label: tr("listing.sale.steps.outdoorFeatures.patio", "Patio", {}) },
    { key: "Terrace", label: tr("listing.sale.steps.outdoorFeatures.terrace", "Terrace", {}) },
    { key: "Pool", label: tr("listing.sale.steps.outdoorFeatures.pool", "Pool", {}) },
    {
      key: "Private Parking",
      label: tr("listing.sale.steps.outdoorFeatures.privateParking", "Private Parking", {}),
    },
    { key: "Security", label: tr("listing.sale.steps.outdoorFeatures.security", "Security", {}) },
    { key: "Garage", label: tr("listing.sale.steps.outdoorFeatures.garage", "Garage", {}) },
  ];
  const PAPER_TYPE_OPTIONS = [
    "titre_foncier",
    "quitane",
    "lettre",
    "concession",
    "bornage",
  ];
  const getPaperTypeLabel = (paperType: string) => {
    const normalized = paperType.trim().toLowerCase();
    const aliasMap: Record<string, string> = {
      "titre foncier": "titre_foncier",
      titre_foncier: "titre_foncier",
      quitane: "quitane",
      lettre: "lettre",
      concession: "concession",
      bornage: "bornage",
    };
    const key = aliasMap[normalized];
    return key
      ? tr(`listing.common.paperTypes.${key}`, paperType, {})
      : paperType;
  };

  const isValidUri = (u: unknown) => isValidMediaUri(u);

  const pickImages = async () => {
    try {
      const result = await pickMultipleImagesNative({
        allowsEditing: false,
        base64: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0)
        return;
      const newImages: string[] = [];
      for (const asset of result.assets) {
        const assetAny = asset as any;
        const uri = assetAny.uri || assetAny.localUri || assetAny.fileUri || "";
        if (uri && isValidUri(uri)) newImages.push(uri);
      }
      if (newImages.length > 0) setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await pickVideoNative({
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0)
        return;
      const asset = result.assets[0];
      const assetAny = asset as any;
      const uri = assetAny.uri || assetAny.localUri || assetAny.fileUri || "";
      if (!uri || !isValidUri(uri)) return;
      setVideo({ uri, mimeType: assetAny?.mimeType });
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as unknown as string[]) || [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const toggleAmenityId = (amenityId: number) => {
    setFormData((prev) => {
      const current = prev.amenity_ids || [];
      const exists = current.includes(amenityId);
      const next = exists
        ? current.filter((id) => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenity_ids: next };
    });
  };

  const getAmenityName = (amenity: any) => {
    if (!amenity?.name) return "";
    const lang = currentLanguage?.toLowerCase() || "en";
    switch (lang) {
      case "fr":
        return amenity.name.fr || amenity.name.en || "";
      case "ar":
        return amenity.name.ar || amenity.name.en || "";
      default:
        return amenity.name.en || "";
    }
  };

  const handleSubmit = async () => {
    if (!user?.accessToken) {
      Alert.alert(
        tr("listing.common.errorTitle", "Error", {}),
        tr("listing.common.mustBeLoggedIn", "You must be logged in", {}),
      );
      return;
    }

    const hasImages = images.length > 0;
    const hasVideo =
      video?.uri && typeof video.uri === "string" && isValidUri(video.uri);
    if (!hasImages && !hasVideo) {
      Alert.alert(
        tr("listing.common.errorTitle", "Error", {}),
        tr(
          "listing.common.mediaRequired",
          "Please add at least one photo or one video to publish",
          {},
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      let selectedCity, selectedZone;
      try {
        selectedCity = cities.find((c: any) => c.id === formData.city_id);
      } catch (cityErr) {
        console.error(
          "Failed selecting city from cities",
          formData.city_id,
          cityErr,
        );
        selectedCity = null;
      }
      try {
        selectedZone = zones.find((z: any) => z.id === formData.zone_id);
      } catch (zoneErr) {
        console.error(
          "Failed selecting zone from zones",
          formData.zone_id,
          zoneErr,
        );
        selectedZone = null;
      }

      // Sanitize numbers: NaN produces invalid JSON (server returns "Invalid JSON").
      const safeNum = (v: any, def: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : def;
      };
      const cityName = selectedCity?.name || (formData as any).city_name || "";
      const addressStr =
        [selectedZone?.name, selectedCity?.name].filter(Boolean).join(", ") ||
        cityName ||
        "Address";

      const normalizedCustomPaper = customPaperType.trim();
      const finalPaperTypes = Array.from(
        new Set([
          ...(formData.paper_types || []),
          ...(normalizedCustomPaper ? [normalizedCustomPaper] : []),
        ]),
      );

      startBackgroundPublish({
        accessToken: user.accessToken,
        images,
        video,
        form: {
          title: String(formData.title || ""),
          description: String(formData.description || ""),
          property_type:
            String(formData.property_type || "Apartment").trim() || "Apartment",
          price: safeNum(formData.price, 0),
          bedrooms:
            formData.bedrooms.trim() && formData.bedrooms !== "skip"
              ? Math.max(0, Math.round(safeNum(formData.bedrooms, 0)))
              : null,
          bathrooms:
            formData.bathrooms.trim() && formData.bathrooms !== "skip"
              ? Math.max(0, Math.round(safeNum(formData.bathrooms, 0)))
              : null,
          area: Math.max(1, Math.round(safeNum(formData.area, 0))),
          year_built: formData.year_built
            ? Math.max(0, Math.round(safeNum(formData.year_built, 0)))
            : 0,
          country_id: formData.country_id || null,
          city_id: formData.city_id || null,
          zone_id: formData.zone_id || null,
          quartier_id: formData.quartier_id || null,
          latitude: safeNum(formData.latitude, 18.0463),
          longitude: safeNum(formData.longitude, -15.9654),
          indoor_features: formData.indoor_features || [],
          outdoor_features: formData.outdoor_features || [],
          amenity_ids: formData.amenity_ids || [],
          paper_types: finalPaperTypes,
          address: addressStr,
          city: cityName,
          state: "-",
          country: (() => {
            const c = countries.find((x) => x.id === formData.country_id);
            return c
              ? getCountryDisplayName(c, currentLanguage || "en")
              : "Mauritania";
          })(),
          ...(String(formData.host_private_note || "").trim()
            ? {
                host_private_note: String(formData.host_private_note).trim(),
              }
            : {}),
        },
        meta: {
          title: String(formData.title || ""),
          previewUri: images[0] || video?.uri,
          price: safeNum(formData.price, 0),
          city: cityName,
          source: "manual",
        },
      });

      navigation.goBack();
    } catch (error) {
      // Most outer catch: log full error, also check for JSON parse, network, etc.
      if (error && typeof error === "object") {
        // Axios will sometimes place an error.response property or a message
        if ((error as any).response) {
          const resp = (error as any).response;
          let respText = "";
          if (typeof resp.data === "string") {
            respText = resp.data;
          } else if (typeof resp.data === "object") {
            try {
              respText = JSON.stringify(resp.data);
            } catch {
              respText = "Unserializable response data";
            }
          }
          console.error(
            "Outer error - axios response:",
            resp.status,
            resp.statusText,
            respText,
            error,
          );
          // Ensure the user sees something even if we threw before mutation (uploads, payload build, etc.)
          const msg =
            (resp?.data &&
              typeof resp.data === "object" &&
              (resp.data as any).error) ||
            (typeof resp?.data === "string" ? resp.data : "") ||
            "Request failed";
          if (msg) Alert.alert(tr("listing.common.errorTitle", "Error", {}), String(msg));
        } else if ((error as any).request || /timeout/i.test(String((error as any).message))) {
          console.error(
            "Outer error - no response received:",
            (error as any).request,
            error,
          );
          Alert.alert(
            tr("listing.common.errorTitle", "Error", {}),
            tr(
              "listing.sale.createTimeout",
              "Server did not respond. Restart the API server, confirm Postgres is running (port in .env), then try again.",
              {},
            ),
          );
        } else if (
          (error as any).message &&
          /(json)/i.test((error as any).message)
        ) {
          // Possible invalid JSON parse error
          console.error(
            "Outer error - invalid JSON error or similar:",
            (error as any).message,
            error,
          );
          Alert.alert(
            tr("listing.common.errorTitle", "Error", {}),
            tr(
              "listing.common.invalidServerJson",
              "Server response could not be parsed (invalid JSON).",
              {},
            ),
          );
        } else {
          console.error("Outer error - generic:", error);
          Alert.alert(
            tr("listing.common.errorTitle", "Error", {}),
            (error as any)?.message ||
              tr("listing.common.genericError", "Something went wrong. Please try again.", {}),
          );
        }
      } else {
        console.error("Outer error - unknown error:", error);
        Alert.alert(
          tr("listing.common.errorTitle", "Error", {}),
          tr("listing.common.genericError", "Something went wrong. Please try again.", {}),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    if (!step.validation) return true;
    return step.validation();
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Define all steps
  const STEPS = [
    {
      id: "intro",
              title: tr("listing.sale.steps.intro.title", "Let's list your property", {}),
              subtitle: tr("listing.sale.steps.intro.subtitle", "We'll guide you through every step", {}),
      validation: () => true,
      render: () => (
        <View style={styles.introContainer}>
          <ListingStartMethodPicker
            headline={tr("listing.sale.steps.intro.headline", "Ready to sell?", {})}
            body={tr(
              "listing.sale.steps.intro.body",
              "Creating a great listing takes just a few minutes.",
              {},
            )}
            onAiPress={() => setAiFlowVisible(true)}
            onManualPress={() => setCurrentStep(1)}
          />
        </View>
      ),
    },
    {
      id: "title",
              title: tr("listing.sale.steps.title.title", "Give your property a title", {}),
              subtitle: tr("listing.sale.steps.title.subtitle", "Make it clear and descriptive", {}),
      validation: () => formData.title.trim().length >= 10,
      render: () => (
        <View style={styles.focusContainer}>
          <TextInput
            style={styles.bigInput}
            value={formData.title}
            onChangeText={(v) => handleInputChange("title", v)}
                    placeholder={tr(
                      "listing.sale.steps.title.placeholder",
                      "e.g., Spacious 3-Bedroom Apartment in City Center",
                      {},
                    )}
            placeholderTextColor="#B0B0B0"
            autoFocus
            multiline={false}
          />
                  <Text style={styles.hint}>
                    {tr("listing.common.minCharsHint", "At least {{count}} characters", { count: 10 })}
                  </Text>
        </View>
      ),
    },
    {
      id: "description",
              title: tr("listing.sale.steps.description.title", "Describe your property", {}),
              subtitle: tr("listing.sale.steps.description.subtitle", "What makes it special?", {}),
      validation: () => true,
      render: () => (
        <View style={styles.focusContainer}>
          <TextInput
            style={[styles.bigInput, styles.textArea]}
            value={formData.description}
            onChangeText={(v) => handleInputChange("description", v)}
                    placeholder={tr(
                      "listing.sale.steps.description.placeholder",
                      "Describe the location, features, and what buyers will love...",
                      {},
                    )}
            placeholderTextColor="#B0B0B0"
            autoFocus
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
                  <Text style={styles.hint}>
                    {tr("listing.common.optionalRecommended", "Optional, but recommended", {})}
                  </Text>

                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.hint, { fontWeight: "600", color: "#222" }]}>
                      {tr("listing.common.suggestedTemplates", "Suggested", {})}
                    </Text>
                    <View style={styles.chipsWrap}>
                      {buildDescriptionTemplates().map((tpl) => (
                        <TouchableOpacity
                          key={tpl.id}
                          style={styles.chip}
                          onPress={() => handleInputChange("description", tpl.text)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.chipText}>{tpl.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
        </View>
      ),
    },
    {
      id: "property_type",
      title: tr("listing.sale.steps.propertyType.title", "What type of property?", {}),
      subtitle: tr("listing.sale.steps.propertyType.subtitle", "Choose one that fits best", {}),
      validation: () => formData.property_type.length > 0,
      render: () => (
        <View style={styles.optionsContainer}>
          {PROPERTY_TYPES.map((type) => {
            const active = formData.property_type === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => handleInputChange("property_type", type.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{type.icon}</Text>
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                >
                  {type.label}
                </Text>
                {active && (
                  <View style={styles.checkBadge}>
                    <Check size={16} color="#FFF" weight="bold" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ),
    },
    {
      id: "price",
              title: tr("listing.sale.steps.price.title", "Set your asking price", {}),
              subtitle: tr(
                "listing.sale.steps.price.subtitle",
                "Research similar properties for competitive pricing",
                {},
              ),
      validation: () =>
        formData.price.trim().length > 0 && parseFloat(formData.price) > 0,
      render: () => (
        <View style={styles.focusContainer}>
          <View style={styles.priceInput}>
            <TextInput
              style={styles.priceValue}
              value={formData.price}
              onChangeText={(v) => handleInputChange("price", v)}
              placeholder="0"
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.priceUnit}>MRU</Text>
          </View>
          <Text style={styles.hint}>
            {tr("listing.sale.steps.price.hint", "Enter your asking price", {})}
          </Text>
        </View>
      ),
    },
    {
      id: "bedrooms",
      title: tr("listing.sale.steps.bedrooms.title", "How many bedrooms?", {}),
      subtitle: tr(
        "listing.sale.steps.bedrooms.subtitle",
        "Optional - skip if not applicable",
        {},
      ),
      validation: () => true,
      render: () => {
        const count = parseInt(formData.bedrooms) || 0;
        const isSkipped = !formData.bedrooms.trim() || formData.bedrooms === "skip";
        return (
          <View style={styles.focusContainer}>
            <TouchableOpacity
              style={[styles.skipOption, isSkipped && styles.skipOptionActive]}
              onPress={() => handleInputChange("bedrooms", "skip")}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipOptionText, isSkipped && styles.skipOptionTextActive]}>
                {tr(
                  "listing.sale.steps.bedrooms.skip",
                  "Skip - Not applicable",
                  {},
                )}
              </Text>
              {isSkipped && <Check size={20} color="#10B981" weight="bold" />}
            </TouchableOpacity>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  handleInputChange(
                    "bedrooms",
                    formData.bedrooms === "skip" ? "0" : Math.max(0, count - 1).toString(),
                  )
                }
                activeOpacity={0.7}
              >
                <Minus size={24} color="#222" weight="bold" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{isSkipped ? "—" : count}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  handleInputChange("bedrooms", (count + 1).toString())
                }
                activeOpacity={0.7}
              >
                <Plus size={24} color="#222" weight="bold" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              {tr("listing.sale.steps.bedrooms.hint", "Bedrooms", {})}
            </Text>
          </View>
        );
      },
    },
    {
      id: "bathrooms",
      title: tr("listing.sale.steps.bathrooms.title", "How many bathrooms?", {}),
      subtitle: tr(
        "listing.sale.steps.bathrooms.subtitle",
        "Optional - skip if not applicable",
        {},
      ),
      validation: () => true,
      render: () => {
        const count = parseInt(formData.bathrooms) || 0;
        const isSkipped = !formData.bathrooms.trim() || formData.bathrooms === "skip";
        return (
          <View style={styles.focusContainer}>
            <TouchableOpacity
              style={[styles.skipOption, isSkipped && styles.skipOptionActive]}
              onPress={() => handleInputChange("bathrooms", "skip")}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipOptionText, isSkipped && styles.skipOptionTextActive]}>
                {tr(
                  "listing.sale.steps.bathrooms.skip",
                  "Skip - Not applicable",
                  {},
                )}
              </Text>
              {isSkipped && <Check size={20} color="#10B981" weight="bold" />}
            </TouchableOpacity>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  handleInputChange(
                    "bathrooms",
                    formData.bathrooms === "skip" ? "0" : Math.max(0, count - 1).toString(),
                  )
                }
                activeOpacity={0.7}
              >
                <Minus size={24} color="#222" weight="bold" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{isSkipped ? "—" : count}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  handleInputChange("bathrooms", (count + 1).toString())
                }
                activeOpacity={0.7}
              >
                <Plus size={24} color="#222" weight="bold" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              {tr("listing.sale.steps.bathrooms.hint", "Bathrooms", {})}
            </Text>
          </View>
        );
      },
    },
    {
      id: "area",
      title: tr("listing.sale.steps.area.title", "What's the total area?", {}),
      subtitle: tr("listing.sale.steps.area.subtitle", "Be as accurate as possible", {}),
      validation: () =>
        formData.area.trim().length > 0 && parseFloat(formData.area) > 0,
      render: () => (
        <View style={styles.focusContainer}>
          <View style={styles.priceInput}>
            <TextInput
              style={styles.priceValue}
              value={formData.area}
              onChangeText={(v) => handleInputChange("area", v)}
              placeholder="0"
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.priceUnit}>m²</Text>
          </View>
          <Text style={styles.hint}>
            {tr("listing.sale.steps.area.hint", "Total area in square meters", {})}
          </Text>
        </View>
      ),
    },
    {
      id: "year_built",
      title: tr("listing.sale.steps.yearBuilt.title", "When was it built?", {}),
      subtitle: tr(
        "listing.sale.steps.yearBuilt.subtitle",
        "Optional - helps buyers understand the property age",
        {},
      ),
      validation: () => true,
      render: () => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
        return (
          <View style={styles.focusContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.yearScroll}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearChip,
                    formData.year_built === year.toString() &&
                      styles.yearChipActive,
                  ]}
                  onPress={() =>
                    handleInputChange("year_built", year.toString())
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.yearChipText,
                      formData.year_built === year.toString() &&
                        styles.yearChipTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.hint}>
              {tr("listing.sale.steps.yearBuilt.hint", "Scroll to select year", {})}
            </Text>
          </View>
        );
      },
    },
    {
      id: "country",
      title: tr("listing.sale.steps.country.title", "Which country?", {}),
      subtitle: tr(
        "listing.sale.steps.country.subtitle",
        "Required — origin country for this listing",
        {},
      ),
      validation: () => formData.country_id !== null && formData.country_id > 0,
      render: () => (
        <View style={styles.optionsContainer}>
          {countriesLoading ? (
            <ActivityIndicator
              size="large"
              color="#D16024"
              style={{ marginTop: 40 }}
            />
          ) : (
            <ScrollView
              style={styles.cityList}
              showsVerticalScrollIndicator={false}
            >
              {countries.map((country) => {
                const active = formData.country_id === country.id;
                const label = getCountryDisplayName(
                  country,
                  currentLanguage || "en",
                );
                return (
                  <TouchableOpacity
                    key={country.id}
                    style={[styles.listOption, active && styles.listOptionActive]}
                    onPress={() => {
                      handleInputChange("country_id", country.id);
                      handleInputChange("city_id", null);
                      handleInputChange("zone_id", null);
                      handleInputChange("quartier_id", null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.listOptionText,
                        active && styles.listOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                    {active && (
                      <Check size={24} color="#D16024" weight="bold" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      ),
    },
    {
      id: "city",
      title: tr("listing.sale.steps.city.title", "Where is it located?", {}),
      subtitle: tr(
        "listing.sale.steps.city.subtitleOptional",
        "Optional — pick a city or skip",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          {citiesError ? (
            <TouchableOpacity
              style={styles.retryBanner}
              onPress={() => refetchCities()}
              activeOpacity={0.8}
            >
              <Text style={styles.errorText}>
                {tr(
                  "listing.sale.steps.city.loadFailed",
                  "Could not load cities. Tap to retry.",
                  {},
                )}
              </Text>
            </TouchableOpacity>
          ) : null}
          <LocationPickerList
            items={cities}
            selectedId={formData.city_id}
            search={citySearch}
            onSearchChange={setCitySearch}
            onSelect={(item) => {
              handleInputChange("city_id", item.id);
              handleInputChange("zone_id", null);
              handleInputChange("quartier_id", null);
              setZoneSearch("");
              setQuartierSearch("");
            }}
            label={locationLabel}
            loading={citiesLoading}
            nested
            leadingOption={{
              key: "skip-city",
              label: tr(
                "listing.sale.steps.city.skipNoCity",
                "Skip — no specific city",
                {},
              ),
              selected: !formData.city_id,
              onPress: () => {
                handleInputChange("city_id", null);
                handleInputChange("zone_id", null);
                handleInputChange("quartier_id", null);
                setZoneSearch("");
                setQuartierSearch("");
              },
            }}
            emptyText={
              !citiesLoading && !formData.country_id
                ? tr(
                    "listing.sale.steps.city.selectCountryFirst",
                    "Select a country on the previous step first",
                    {},
                  )
                : tr(
                    "listing.sale.steps.city.empty",
                    "No cities available for this country",
                    {},
                  )
            }
          />
        </View>
      ),
    },
    {
      id: "zone",
      title: tr("listing.sale.steps.zone.title", "Which zone?", {}),
      subtitle: habitatCity
        ? tr(
            "listing.sale.steps.zone.subtitleHabitat",
            "Pick a district (cadastre plan) — optional",
            {},
          )
        : tr("listing.sale.steps.zone.subtitle", "Optional - helps narrow down location", {}),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          {!formData.city_id ? (
            <Text style={styles.hint}>
              {tr(
                "listing.sale.steps.zone.noCityOptional",
                "No city selected — that's OK. Continue to skip zone and sector too.",
                {},
              )}
            </Text>
          ) : (
            <>
              {zonesError ? (
                <TouchableOpacity
                  style={styles.retryBanner}
                  onPress={() => refetchZones()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.errorText}>
                    {tr(
                      "listing.sale.steps.zone.loadFailed",
                      "Could not load zones. Tap to retry.",
                      {},
                    )}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <LocationPickerList
                items={zones}
                selectedId={formData.zone_id}
                search={zoneSearch}
                onSearchChange={setZoneSearch}
                onSelect={(item) => {
                  handleInputChange("zone_id", item.id);
                  handleInputChange("quartier_id", null);
                  setQuartierSearch("");
                }}
                label={locationLabel}
                loading={zonesLoading}
                nested
                leadingOption={{
                  key: "skip-zone",
                  label: tr(
                    "listing.sale.steps.zone.skipNoZone",
                    "Skip - No specific zone",
                    {},
                  ),
                  selected: !formData.zone_id,
                  onPress: () => {
                    handleInputChange("zone_id", null);
                    handleInputChange("quartier_id", null);
                  },
                }}
                emptyText={tr(
                  "listing.sale.steps.zone.empty",
                  "No zones for this city",
                  {},
                )}
              />
              {formData.zone_id ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.dropdownHeaderText}>
                    {tr("listing.sale.steps.zone.quartierLabel", "Quartier (optional)", {})}
                  </Text>
                  <LocationPickerList
                    items={quartiers}
                    selectedId={formData.quartier_id}
                    search={quartierSearch}
                    onSearchChange={setQuartierSearch}
                    onSelect={(item) => handleInputChange("quartier_id", item.id)}
                    label={locationLabel}
                    loading={quartiersLoading}
                    nested
                    showHabitatBadge={habitatCity}
                    leadingOption={{
                      key: "skip-quartier",
                      label: tr(
                        "listing.sale.steps.zone.skipNoQuartier",
                        "Skip - No specific quartier",
                        {},
                      ),
                      selected: !formData.quartier_id,
                      onPress: () => handleInputChange("quartier_id", null),
                    }}
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      ),
    },
    {
      id: "map",
      title: tr("listing.sale.steps.map.title", "Mark your location", {}),
      subtitle: tr(
        "listing.sale.steps.map.subtitle",
        "Optional - tap on the map to set the exact spot",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.focusContainer}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              mapType="satellite"
              onRegionChangeComplete={setMapRegion}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setSelectedLocation({ latitude, longitude });
                handleInputChange("latitude", latitude);
                handleInputChange("longitude", longitude);
              }}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title={tr("listing.sale.steps.map.pinTitle", "Your Property", {})}
                />
              )}
            </MapView>
          </View>
          <Text style={styles.hint}>
            {selectedLocation
              ? tr("listing.sale.steps.map.locationSet", "Location set", {})
              : tr(
                  "listing.sale.steps.map.tapHint",
                  "Tap on the map to mark your property",
                  {},
                )}
          </Text>
        </View>
      ),
    },
    {
      id: "indoor",
      title: tr("listing.sale.steps.indoor.title", "Indoor features", {}),
      subtitle: tr("listing.sale.steps.indoor.subtitle", "Select all that apply", {}),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          <View style={styles.chipsWrap}>
            {INDOOR_FEATURES.map((feat) => {
              const active = (formData.indoor_features || []).includes(
                feat.key,
              );
              return (
                <TouchableOpacity
                  key={feat.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleArrayValue("indoor_features", feat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {feat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {tr("listing.sale.steps.indoor.hint", "Optional - skip if not applicable", {})}
          </Text>
        </View>
      ),
    },
    {
      id: "outdoor",
      title: tr("listing.sale.steps.outdoor.title", "Outdoor features", {}),
      subtitle: tr("listing.sale.steps.outdoor.subtitle", "What's outside?", {}),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          <View style={styles.chipsWrap}>
            {OUTDOOR_FEATURES.map((feat) => {
              const active = (formData.outdoor_features || []).includes(
                feat.key,
              );
              return (
                <TouchableOpacity
                  key={feat.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleArrayValue("outdoor_features", feat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {feat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {tr("listing.sale.steps.outdoor.hint", "Optional - skip if not applicable", {})}
          </Text>
        </View>
      ),
    },
    {
      id: "amenities",
      title: tr("listing.sale.steps.amenities.title", "Premium amenities", {}),
      subtitle: tr(
        "listing.sale.steps.amenities.subtitle",
        "Extra features that add value",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          <View style={styles.chipsWrap}>
            {amenitiesData.map((amenity: any) => {
              const active = (formData.amenity_ids || []).includes(amenity.id);
              const name = getAmenityName(amenity);
              return (
                <TouchableOpacity
                  key={amenity.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleAmenityId(amenity.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {tr("listing.sale.steps.amenities.hint", "Optional - skip if not applicable", {})}
          </Text>
        </View>
      ),
    },
    {
      id: "papers",
      title: tr("listing.sale.steps.papers.title", "Property papers", {}),
      subtitle: tr(
        "listing.sale.steps.papers.subtitle",
        "Select available legal papers to build buyer trust",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          <View style={styles.chipsWrap}>
            {PAPER_TYPE_OPTIONS.map((paper) => {
              const active = (formData.paper_types || []).includes(paper);
              return (
                <TouchableOpacity
                  key={paper}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleArrayValue("paper_types", paper)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {getPaperTypeLabel(paper)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.paperInput}
            value={customPaperType}
            onChangeText={setCustomPaperType}
            placeholder={tr(
              "listing.sale.steps.papers.otherPlaceholder",
              "Add another paper title (optional)",
              {},
            )}
            placeholderTextColor="#999"
          />
          <Text style={styles.hint}>
            {tr(
              "listing.sale.steps.papers.hint",
              "Example: Titre foncier, Quitane, Lettre. This helps reduce fraud.",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "media",
      title: tr("listing.sale.steps.media.title", "Add photos or video", {}),
      subtitle: tr(
        "listing.sale.steps.media.subtitle",
        "At least one photo or one video is required",
        {},
      ),
      validation: () => images.length >= 1 || (!!video?.uri),
      render: () => (
        <View style={styles.focusContainer}>
          {images.length === 0 && !video ? (
            <View style={{ gap: 16 }}>
              <TouchableOpacity
                style={styles.uploadLarge}
                onPress={pickImages}
                activeOpacity={0.8}
              >
                <Camera size={64} color="#B0B0B0" weight="thin" />
                <Text style={styles.uploadText}>
                  {tr("listing.sale.steps.media.addPhotos", "Add photos", {})}
                </Text>
                <Text style={styles.uploadHint}>
                  {tr("listing.sale.steps.media.tapUpload", "Tap to upload", {})}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadLarge, styles.uploadLargeAlt]}
                onPress={pickVideo}
                activeOpacity={0.8}
              >
                <Video size={64} color="#B0B0B0" weight="thin" />
                <Text style={styles.uploadText}>
                  {tr("listing.sale.steps.media.videoOnly", "Or add a video only", {})}
                </Text>
                <Text style={styles.uploadHint}>
                  {tr("listing.sale.steps.media.videoOnlyHint", "Skip photos, video is enough", {})}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {images.length > 0 && (
                <View style={styles.photoGrid}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image
                        source={{ uri: resolveUploadedMediaUrl(uri) }}
                        style={styles.photoImage}
                      />
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => removeImage(index)}
                        activeOpacity={0.8}
                      >
                        <X size={14} color="#FFF" weight="bold" />
                      </TouchableOpacity>
                      {index === 0 && (
                        <View style={styles.coverBadge}>
                          <Star size={12} color="#FFF" weight="fill" />
                        </View>
                      )}
                    </View>
                  ))}
                  {images.length < 10 && (
                    <TouchableOpacity
                      style={styles.photoAdd}
                      onPress={pickImages}
                      activeOpacity={0.8}
                    >
                      <Plus size={32} color="#717171" weight="regular" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {video && (
                <View style={[styles.videoPreview, { marginTop: images.length > 0 ? 16 : 0 }]}>
                  <View style={styles.videoInfo}>
                    <Video size={24} color="#D16024" weight="fill" />
                    <View style={styles.videoText}>
                      <Text style={styles.videoTitle}>
                        {tr("listing.sale.steps.media.videoReady", "Video ready", {})}
                      </Text>
                      <Text style={styles.videoSubtitle}>
                        {tr("listing.sale.steps.media.readyToUpload", "Ready to upload", {})}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.videoRemove}
                    onPress={() => setVideo(null)}
                    activeOpacity={0.8}
                  >
                    <X size={16} color="#FFF" weight="bold" />
                  </TouchableOpacity>
                </View>
              )}
              {(images.length > 0 || video) && (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                  {images.length < 10 && (
                    <TouchableOpacity
                      style={styles.addMoreBtn}
                      onPress={pickImages}
                      activeOpacity={0.8}
                    >
                      <Camera size={18} color="#222" weight="regular" />
                      <Text style={styles.addMoreBtnText}>
                        {tr("listing.sale.steps.media.addPhotos", "Add photos", {})}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!video && (
                    <TouchableOpacity
                      style={styles.addMoreBtn}
                      onPress={pickVideo}
                      activeOpacity={0.8}
                    >
                      <Video size={18} color="#222" weight="regular" />
                      <Text style={styles.addMoreBtnText}>
                        {tr("listing.sale.steps.media.addVideo", "Add video", {})}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text style={styles.hint}>
                {images.length > 0 && `${images.length} photo(s) `}
                {video && "Video "}
                {tr("listing.sale.steps.media.addedSuffix", "added", {})}
              </Text>
            </>
          )}
        </View>
      ),
    },
    {
      id: "review",
      title: tr("listing.sale.steps.review.title", "Review your listing", {}),
      subtitle: tr("listing.sale.steps.review.subtitle", "Everything look good?", {}),
      validation: () => true,
      render: () => {
        const selectedCity = cities.find((c) => c.id === formData.city_id);
        const selectedZone = zones.find((z) => z.id === formData.zone_id);
        return (
          <View style={styles.reviewContainer}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.titleLabel", "Title", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {formData.title || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.typeLabel", "Type", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {formData.property_type || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.priceLabel", "Price", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {formData.price
                  ? `${formData.price} MRU`
                  : tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.sale.steps.review.bedBathLabel",
                  "Bedrooms / Bathrooms",
                  {},
                )}
              </Text>
              <Text style={styles.reviewValue}>
                {(formData.bedrooms && formData.bedrooms !== "skip"
                  ? formData.bedrooms
                  : tr("listing.common.notSet", "Not set", {}))}{" "}
                {tr("listing.sale.steps.review.bedShort", "bd", {})}{" "}
                /{" "}
                {(formData.bathrooms && formData.bathrooms !== "skip"
                  ? formData.bathrooms
                  : tr("listing.common.notSet", "Not set", {}))}{" "}
                {tr("listing.sale.steps.review.bathShort", "ba", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.areaLabel", "Area", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {formData.area
                  ? `${formData.area} m²`
                  : tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.locationLabel", "Location", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {selectedCity?.name || tr("listing.common.notSet", "Not set", {})}
                {selectedZone && ` - ${selectedZone.name}`}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.papersLabel", "Property papers", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {[...(formData.paper_types || []), customPaperType.trim()]
                  .filter(Boolean)
                  .map((paper) => getPaperTypeLabel(paper))
                  .join(", ") || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr("listing.sale.steps.review.mediaLabel", "Media", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {images.length > 0 && `${images.length} photo(s) `}
                {video && `${tr("listing.sale.steps.media.videoLabel", "Video", {})} `}
                {images.length === 0 && !video
                  ? tr("listing.common.notSet", "Not set", {})
                  : `✓ ${tr("listing.sale.steps.review.added", "Added", {})}`}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.sale.steps.review.privateNoteLabel",
                  "Private note (only you & your org)",
                  {},
                )}
              </Text>
              <Text style={styles.reviewHint}>
                {tr(
                  "listing.sale.steps.review.privateNoteHint",
                  "Not shown to guests. Optional reminder for this listing.",
                  {},
                )}
              </Text>
              <TextInput
                style={styles.privateNoteInput}
                placeholder={tr(
                  "listing.sale.steps.review.privateNotePlaceholder",
                  "e.g. gate code, buyer context…",
                  {},
                )}
                placeholderTextColor="#999"
                multiline
                maxLength={2000}
                value={formData.host_private_note}
                onChangeText={(t) => handleInputChange("host_private_note", t)}
              />
            </View>
            <View style={styles.reviewNote}>
              <Text style={styles.reviewNoteText}>
                {tr(
                  "listing.sale.steps.review.tip",
                  "You can edit your listing anytime after publishing",
                  {},
                )}
              </Text>
            </View>
          </View>
        );
      },
    },
  ];

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  if (!user) return <SignUpOrSignInScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={28} color="#222" weight="regular" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: "#717171" }}>
            {tr(
              "listing.common.stepOf",
              "Step {{current}}/{{total}}",
              { current: currentStep + 1, total: STEPS.length },
            )}
            {currentStep < STEPS.length - 1
              ? ` • ${tr("listing.common.stepsLeft", "{{count}} left", {
                  count: STEPS.length - (currentStep + 1),
                })}`
              : ""}
          </Text>
          {currentStep < STEPS.length - 1 ? (
            <Text style={{ fontSize: 12, color: "#717171" }}>
              {tr("listing.common.nextStepPrefix", "Next:", {})}{" "}
              {STEPS[currentStep + 1]?.title || ""}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          {currentStepData.subtitle && (
            <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          )}
          <View style={styles.stepBody}>{currentStepData.render()}</View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={prevStep}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#222" weight="regular" />
              <Text style={styles.backButtonText}>
                {tr("listing.common.back", "Back", {})}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          {isLastStep ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                submitting && styles.nextButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {tr("listing.common.publish", "Publish", {})}
                </Text>
              )}
            </TouchableOpacity>
          ) : currentStep === 0 ? null : (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={nextStep}
              disabled={!canProceed()}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>
                {tr("listing.common.next", "Next", {})}
              </Text>
              <ArrowRight size={20} color="#FFF" weight="regular" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Background publish — progress shown on Organization tab */}

      <AddWithAiFlow
        visible={aiFlowVisible}
        kind="sale"
        onClose={() => setAiFlowVisible(false)}
        onPublished={() => {
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 12,
  },
  progressBar: {
    height: 2,
    backgroundColor: "#EBEBEB",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#222",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
    lineHeight: 40,
  },
  stepSubtitle: {
    fontSize: 18,
    color: "#717171",
    marginBottom: 32,
    lineHeight: 26,
  },
  stepBody: {
    flex: 1,
  },

  // Intro
  introContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  introEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  introSteps: {
    width: "100%",
    gap: 20,
  },
  introStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  introStepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  introStepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  introStepText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
  },

  // Focus Input
  focusContainer: {
    width: "100%",
  },
  bigInput: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  textArea: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 140,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    flex: 1,
  },
  priceUnit: {
    fontSize: 24,
    fontWeight: "400",
    color: "#717171",
    marginLeft: 12,
    marginBottom: 2,
  },

  // Counter
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    paddingVertical: 20,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
  },
  counterValue: {
    fontSize: 48,
    fontWeight: "300",
    color: "#222",
    minWidth: 80,
    textAlign: "center",
  },
  skipOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  skipOptionActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  skipOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  skipOptionTextActive: {
    color: "#10B981",
  },
  uploadLargeAlt: {
    borderStyle: "dashed",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addMoreBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  // Year Scroll
  yearScroll: {
    paddingVertical: 10,
    gap: 12,
  },
  yearChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  yearChipActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  yearChipText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },
  yearChipTextActive: {
    color: "#FFFFFF",
  },

  // Options
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  optionCardActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    flex: 1,
  },
  optionTextActive: {
    fontWeight: "600",
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D16024",
    justifyContent: "center",
    alignItems: "center",
  },

  // List Options
  cityList: {
    width: "100%",
  },
  dropdownContentWindow: {
    maxHeight: 260,
    paddingTop: 4,
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dropdownHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: "#444",
    maxWidth: 180,
  },
  dropdownHeaderText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
  },
  dropdownHeaderIcon: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "700",
  },
  listOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  listOptionActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  listOptionText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
  },
  listOptionTextActive: {
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#C13515",
    textAlign: "center",
    padding: 20,
  },
  retryBanner: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5C6C0",
    backgroundColor: "#FFF5F3",
  },
  mapContainer: {
    height: 350,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },

  // Chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  chipText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  paperInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#FAFAFA",
  },

  // Photos
  uploadLarge: {
    height: 300,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  uploadHint: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    position: "relative",
    width: (SCREEN_WIDTH - 60) / 2,
    height: (SCREEN_WIDTH - 60) / 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  coverBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#222",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoAdd: {
    width: (SCREEN_WIDTH - 60) / 2,
    height: (SCREEN_WIDTH - 60) / 2,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  // Video
  videoPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F7",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  videoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  videoText: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  videoSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginTop: 2,
  },
  videoRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Review
  reviewContainer: {
    width: "100%",
    gap: 20,
  },
  reviewItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
  },
  reviewHint: {
    fontSize: 13,
    color: "#717171",
    marginBottom: 10,
    lineHeight: 18,
  },
  privateNoteInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#222",
    textAlignVertical: "top",
    backgroundColor: "#FAFAFA",
  },
  reviewNote: {
    backgroundColor: "#FFF4ED",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewNoteText: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    textDecorationLine: "underline",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Upload Overlay
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadCard: {
    backgroundColor: "#222",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: "#222",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
});
