/**
 * Edit Property Sale Screen
 * Modern Airbnb/TikTok UI - Clean, White Background, Black & White
 * Single screen form with section navigation track
 */

import React, { useState, useEffect, useRef } from "react";
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
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Switch
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { pickImageNative, pickVideoNative } from "../utils/nativePhotoPicker";
import MapView, { Marker } from "react-native-maps";
import {
  ArrowLeftIcon,
  CookingPot,
  Couch,
  Door,
  Bed,
  Toilet,
  ForkKnife,
  Rectangle,
  BookOpen,
  Car,
  Tree,
  Camera,
  Plus
} from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { useUser } from "../hooks/useUser";
import { Loading } from "../components/Loading";
import { endpoints } from "../constants";
import {
  isHttpMediaUrl,
  isLocalMediaUri,
  isUploadedMediaUri,
  isValidMediaUri,
} from "../utils/mediaUri";
import {
  prepareClassifiedPhotosForSubmit,
  prepareImagesForListingSubmit,
  prepareVideoForListingSubmit,
  getReadyImageUrlsForSubmit,
} from "../utils/listingSubmitMedia";
import { PhosphorIcon } from "../components/PhosphorIcon";
import { useAmenities } from "../hooks/queries/useCategories";
import { useLanguage } from "../contexts/LanguageContext";
import CustomToast from "../components/CustomToast";

const COLORS = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textTertiary: "#999999",
  border: "#E5E5E5",
  borderLight: "#F0F0F0",
  cardBackground: "#FFFFFF",
  inactive: "#CCCCCC",
  primary: "#000000"
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Section definitions (titles resolved via i18n at render)
const SECTIONS = [
  { id: 1, key: "basic", icon: "🏠" },
  { id: 2, key: "description", icon: "📝" },
  { id: 3, key: "type", icon: "🏘️" },
  { id: 4, key: "pricing", icon: "💰" },
  { id: 5, key: "details", icon: "📐" },
  { id: 6, key: "location", icon: "📍" },
  { id: 7, key: "indoor", icon: "🏠" },
  { id: 8, key: "outdoor", icon: "🌳" },
  { id: 9, key: "amenities", icon: "✨" },
  { id: 10, key: "papers", icon: "📄" },
  { id: 11, key: "images", icon: "📸" },
  { id: 12, key: "video", icon: "🎥" },
  { id: 13, key: "floorplans", icon: "🗺️" },
  { id: 14, key: "neighborhood", icon: "🏙️" }
] as const;

export const EditPropertySaleScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: number }>({});

  const { propertyId } = (route.params as any) || {};

  const [activeSection, setActiveSection] = useState<string>("basic");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  // Fetch property data
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["property-sale", propertyId],
    queryFn: async () => {
      const response = await axios.get(
        `${endpoints.propertySales}/${propertyId}`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return response.data.property;
    },
    enabled: !!user?.accessToken && !!propertyId
  });

  const canToggleGold = false;

  // Fetch amenities
  const { data: amenitiesData, isLoading: amenitiesLoading } = useAmenities();
  const amenitiesList = amenitiesData || [];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    year_built: "",
    address: "",
    city: "",
    city_id: null as number | null,
    zone_id: null as number | null,
    quartier_id: null as number | null,
    state: "",
    country: "",
    postal_code: "",
    latitude: null as number | null,
    longitude: null as number | null,
    indoor_features: [] as string[],
    outdoor_features: [] as string[],
    amenity_ids: [] as number[],
    paper_types: [] as string[],
    floor_plans: [] as any[],
    classified_photos: [] as Array<{ room_type: string; photos: string[] }>,
    host_private_note: "",
    is_gold: false,
    neighborhood: {
      noise_level: "",
      safety_level: "",
      traffic_level: "",
      notes: ""
    } as any,
  });
  const [customPaperType, setCustomPaperType] = useState("");
  const PAPER_TYPE_OPTIONS = [
    "titre_foncier",
    "quitane",
    "lettre",
    "concession",
    "bornage"
  ];
  const normalizePaperType = (paperType: string) => {
    const normalized = paperType.trim().toLowerCase();
    const aliasMap: Record<string, string> = {
      "titre foncier": "titre_foncier",
      titre_foncier: "titre_foncier",
      quitane: "quitane",
      lettre: "lettre",
      concession: "concession",
      bornage: "bornage"
    };
    return aliasMap[normalized] || paperType.trim();
  };
  const getPaperTypeLabel = (paperType: string) => {
    const key = normalizePaperType(paperType);
    return key
      ? t(`listing.common.paperTypes.${key}`, paperType)
      : paperType;
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [quartiers, setQuartiers] = useState<any[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showQuartierModal, setShowQuartierModal] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");
  const [quartierSearch, setQuartierSearch] = useState("");
  const MODAL_MAX_HEIGHT = Math.round(Dimensions.get("window").height * 0.75);
  const [mapRegion, setMapRegion] = useState({
    latitude: 18.0731,
    longitude: -15.9582,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });

  // Populate form when property loads
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        property_type: property.property_type || "",
        price: property.listing_price ? String(property.listing_price) : "",
        bedrooms: property.bedrooms ? String(property.bedrooms) : "",
        bathrooms: property.bathrooms ? String(property.bathrooms) : "",
        area: property.square_footage ? String(property.square_footage) : "",
        year_built: property.year_built ? String(property.year_built) : "",
        address: property.address || "",
        city: property.city || "",
        city_id: property.city_id || null,
        zone_id: property.zone_id || null,
        quartier_id: property.quartier_id || null,
        state: property.state || "",
        country: property.country || "",
        postal_code: property.postal_code || "",
        latitude: property.latitude || null,
        longitude: property.longitude || null,
        indoor_features:
          property.features?.filter((f: string) =>
            [
              "Air Conditioning",
              "Heating",
              "Washer",
              "Dryer",
              "Dishwasher",
              "Elevator",
              "Fireplace",
              "Walk-in Closet",
              "Built-in Wardrobe",
              "Central Heating",
              "Built-in Kitchen",
              "Furnished",
              "Unfurnished",
              "Tiles Flooring",
              "Parquet Flooring",
              "Marble Flooring"
            ].includes(f)
          ) || [],
        outdoor_features:
          property.features?.filter(
            (f: string) =>
              ![
                "Air Conditioning",
                "Heating",
                "Washer",
                "Dryer",
                "Dishwasher",
                "Elevator",
                "Fireplace",
                "Walk-in Closet",
                "Built-in Wardrobe",
                "Central Heating",
                "Built-in Kitchen",
                "Furnished",
                "Unfurnished",
                "Tiles Flooring",
                "Parquet Flooring",
                "Marble Flooring"
              ].includes(f)
          ) || [],
        amenity_ids: property.amenity_list?.map((a: any) => a.id) || [],
        paper_types: Array.isArray(property.paper_types)
          ? property.paper_types.map((p: string) => normalizePaperType(p))
          : [],
        floor_plans: property.floor_plans || [],
        classified_photos: property.classified_photos || [],
        host_private_note:
          property.host_private_note || property.hostPrivateNote || "",
        is_gold: !!(property.is_gold ?? property.isGold),
        neighborhood: property.neighborhood || {
          noise_level: "",
          safety_level: "",
          traffic_level: "",
          notes: ""
        },
      });

      if (property.images) {
        const raw = Array.isArray(property.images) ? property.images : [];
        setImages(
          raw.filter((u: string) => {
            const s = String(u || "").trim();
            if (!s) return false;
            if (isHttpMediaUrl(s) || isLocalMediaUri(s) || /^data:image\//i.test(s)) {
              return true;
            }
            // Skip corrupt raw base64 blobs previously saved in DB
            return false;
          }),
        );
      }
      if (property.videos) {
        setVideos(Array.isArray(property.videos) ? property.videos : []);
      }

      if (property.latitude && property.longitude) {
        setMapRegion({
          latitude: property.latitude,
          longitude: property.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    }
  }, [property]);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${endpoints.baseURL}/cities`);
        setCities(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, []);

  // Fetch zones when city changes
  useEffect(() => {
    if (formData.city_id) {
      const fetchZones = async () => {
        try {
          const response = await axios.get(
            `${endpoints.baseURL}/cities/${formData.city_id}/zones`
          );
          setZones(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch zones:", error);
        }
      };
      fetchZones();
    } else {
      setZones([]);
      setFormData((prev) => ({ ...prev, zone_id: null, quartier_id: null }));
    }
  }, [formData.city_id]);

  // Also fetch zones on mount if property has city_id
  useEffect(() => {
    if (
      property?.city_id &&
      !zones.length &&
      formData.city_id === property.city_id
    ) {
      const fetchZones = async () => {
        try {
          const response = await axios.get(
            `${endpoints.baseURL}/cities/${property.city_id}/zones`
          );
          setZones(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch zones on mount:", error);
        }
      };
      fetchZones();
    }
  }, [property?.city_id]);

  // Fetch quartiers when zone changes
  useEffect(() => {
    if (formData.zone_id) {
      const fetchQuartiers = async () => {
        try {
          const response = await axios.get(
            `${endpoints.baseURL}/cities/zones/${formData.zone_id}/quartiers`
          );
          setQuartiers(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch quartiers:", error);
        }
      };
      fetchQuartiers();
    } else {
      setQuartiers([]);
      setFormData((prev) => ({ ...prev, quartier_id: null }));
    }
  }, [formData.zone_id]);

  // Also fetch quartiers on mount if property has zone_id
  useEffect(() => {
    if (
      property?.zone_id &&
      !quartiers.length &&
      formData.zone_id === property.zone_id
    ) {
      const fetchQuartiers = async () => {
        try {
          const response = await axios.get(
            `${endpoints.baseURL}/cities/zones/${property.zone_id}/quartiers`
          );
          setQuartiers(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch quartiers on mount:", error);
        }
      };
      fetchQuartiers();
    }
  }, [property?.zone_id]);

  // Scroll to section
  const scrollToSection = (sectionKey: string) => {
    setActiveSection(sectionKey);
    const y = sectionRefs.current[sectionKey];
    if (y !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  // Room types for photo classification
  const ROOM_TYPES = [
    {
      key: "kitchen",
      label: t("createPropertySale.roomTypes.kitchen", "Kitchen"),
      Icon: CookingPot
    },
    {
      key: "living_room",
      label: t("createPropertySale.roomTypes.livingRoom", "Living Room"),
      Icon: Couch
    },
    {
      key: "hall",
      label: t("createPropertySale.roomTypes.hall", "Hall"),
      Icon: Door
    },
    {
      key: "bedroom",
      label: t("createPropertySale.roomTypes.bedroom", "Bedroom"),
      Icon: Bed
    },
    {
      key: "bathroom",
      label: t("createPropertySale.roomTypes.bathroom", "Bathroom"),
      Icon: Toilet
    },
    {
      key: "dining_room",
      label: t("createPropertySale.roomTypes.diningRoom", "Dining Room"),
      Icon: ForkKnife
    },
    {
      key: "balcony",
      label: t("createPropertySale.roomTypes.balcony", "Balcony"),
      Icon: Rectangle
    },
    {
      key: "study",
      label: t("createPropertySale.roomTypes.study", "Study/Office"),
      Icon: BookOpen
    },
    {
      key: "garage",
      label: t("createPropertySale.roomTypes.garage", "Garage"),
      Icon: Car
    },
    {
      key: "garden",
      label: t("createPropertySale.roomTypes.garden", "Garden"),
      Icon: Tree
    },
    {
      key: "other",
      label: t("createPropertySale.roomTypes.other", "Other"),
      Icon: Camera
    }
  ];

  // Classified photo functions
  const pickClassifiedPhoto = async (roomType: string) => {
    try {
      // Use native picker - no permissions needed
      const result = await pickImageNative({
        allowsEditing: false,
        base64: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const uri = asset.uri;
      if (uri && isValidMediaUri(uri)) {
        setFormData((prev) => {
          const current = prev.classified_photos || [];
          const existing = current.find((cp) => cp.room_type === roomType);
          if (existing) {
            return {
              ...prev,
              classified_photos: current.map((cp) =>
                cp.room_type === roomType
                  ? { ...cp, photos: [...cp.photos, uri] }
                  : cp
              )
            };
          } else {
            return {
              ...prev,
              classified_photos: [
                ...current,
                { room_type: roomType, photos: [uri] }
              ]
            };
          }
        });
      }
    } catch (error) {
      console.error("Error picking classified photo:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeClassifiedPhoto = (roomType: string, photoIndex: number) => {
    setFormData((prev) => {
      const current = prev.classified_photos || [];
      return {
        ...prev,
        classified_photos: current
          .map((cp) => {
            if (cp.room_type === roomType) {
              const newPhotos = cp.photos.filter(
                (_, idx) => idx !== photoIndex
              );
              if (newPhotos.length === 0) {
                return null;
              }
              return { ...cp, photos: newPhotos };
            }
            return cp;
          })
          .filter(Boolean) as Array<{ room_type: string; photos: string[] }>
      };
    });
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(
        `${endpoints.propertySales}/${propertyId}`,
        data,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return response.data;
    },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["property-sale", propertyId] });
        queryClient.invalidateQueries({ queryKey: ["user-properties"] });
        setToastMessage("Property updated successfully!");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.error || "Failed to update property";
        setToastMessage(errorMessage);
        setToastType("error");
        setShowToast(true);
      }
    }
  );

  const handleSave = async () => {
    if (!user?.accessToken) {
      setToastMessage("You must be logged in");
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsSaving(true);
    setSaveStatus("");

    try {
      // Check if there are local videos that need upload
      const hasLocalVideos = videos.some((v) => typeof v === "string" && isLocalMediaUri(v));
      
      // If there are local videos, upload images first, then save and upload videos in background
      if (hasLocalVideos) {
        setSaveStatus("Uploading photos…");
        
        // Upload images first (they're faster than videos)
        let resolvedImages = images;
        const readyImages = getReadyImageUrlsForSubmit(images);
        if (images.length > 0 && readyImages === null) {
          setUploading(true);
          resolvedImages = await prepareImagesForListingSubmit(
            images,
            user.accessToken,
            (ratio) => {
              setSaveStatus(`Uploading photos… ${Math.round(ratio * 100)}%`);
            },
          );
          setUploading(false);
        } else if (readyImages !== null) {
          resolvedImages = readyImages;
        }

        // Upload classified photos
        let resolvedClassified = formData.classified_photos;
        const hasLocalClassified = (formData.classified_photos ?? []).some((cp) =>
          (cp.photos ?? []).some((p) => isLocalMediaUri(p) || /^data:image\//i.test(p)),
        );
        if (hasLocalClassified) {
          setUploading(true);
          setSaveStatus("Uploading room photos…");
          resolvedClassified = await prepareClassifiedPhotosForSubmit(
            formData.classified_photos,
            user.accessToken,
            (ratio) => {
              setSaveStatus(`Uploading room photos… ${Math.round(ratio * 100)}%`);
            },
          );
          setUploading(false);
        }

        setSaveStatus("Saving property details…");
        
        // Save with uploaded images and existing videos (no new videos yet)
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type,
          listing_price: parseFloat(formData.price) || 0,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          square_footage: parseInt(formData.area) || 0,
          year_built: parseInt(formData.year_built) || 0,
          address: formData.address,
          city: formData.city,
          city_id: formData.city_id,
          zone_id: formData.zone_id,
          quartier_id: formData.quartier_id,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code,
          latitude: formData.latitude || 0,
          longitude: formData.longitude || 0,
          indoor_features: formData.indoor_features,
          outdoor_features: formData.outdoor_features,
          amenity_ids: formData.amenity_ids,
          paper_types: Array.from(
            new Set([
              ...(formData.paper_types || []),
              ...(customPaperType.trim() ? [customPaperType.trim()] : [])
            ])
          ),
          images: resolvedImages, // Use uploaded images
          videos: videos.filter((v) => isHttpMediaUrl(v) || isUploadedMediaUri(v)), // Only already uploaded videos
          floor_plans: formData.floor_plans,
          classified_photos: resolvedClassified,
          neighborhood: formData.neighborhood,
          host_private_note: formData.host_private_note,
          ...(canToggleGold ? { is_gold: !!formData.is_gold } : {}),
        };

        console.log("Saving property with data:", JSON.stringify(updateData, null, 2));
        
        // Save property first
        await updateMutation.mutateAsync(updateData);
        
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["property-sale", propertyId] });
        queryClient.invalidateQueries({ queryKey: ["user-properties"] });
        queryClient.invalidateQueries({ queryKey: ["organization-properties"] });
        
        // Initiate video uploads in background
        const uploadIds: string[] = [];
        for (let i = 0; i < videos.length; i++) {
          const v = videos[i];
          if (typeof v === "string" && isLocalMediaUri(v)) {
            try {
              const ids = await prepareVideoForListingSubmit(
                { uri: v, mimeType: "video/mp4" },
                user.accessToken,
                true, // returnUploadIdOnly
              );
              if (ids[0]) uploadIds.push(ids[0]);
            } catch (e) {
              console.error("Failed to initiate video upload:", e);
            }
          }
        }
        
        // Store uploadIds for tracking (using SecureStore or AsyncStorage)
        if (uploadIds.length > 0) {
          try {
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            await AsyncStorage.setItem(
              `property_${property.id}_uploads`,
              JSON.stringify({
                uploadIds,
                timestamp: Date.now()
              })
            );
          } catch (e) {
            console.error("Failed to store uploadIds:", e);
          }
        }
        
        setIsSaving(false);
        setSaveStatus("");
        setToastMessage("Property saved! Video uploading in background...");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => navigation.goBack(), 1500);
        return;
      }

      // Original flow for when there are no local videos
      let resolvedImages = images;
      const readyImages = getReadyImageUrlsForSubmit(images);
      if (images.length > 0 && readyImages === null) {
        setUploading(true);
        setSaveStatus("Uploading photos…");
        resolvedImages = await prepareImagesForListingSubmit(
          images,
          user.accessToken,
          (ratio) => {
            setSaveStatus(`Uploading photos… ${Math.round(ratio * 100)}%`);
          },
        );
        setUploading(false);
      } else if (readyImages !== null) {
        resolvedImages = readyImages;
      }

      let resolvedClassified = formData.classified_photos;
      const hasLocalClassified = (formData.classified_photos ?? []).some((cp) =>
        (cp.photos ?? []).some((p) => isLocalMediaUri(p) || /^data:image\//i.test(p)),
      );
      if (hasLocalClassified) {
        setUploading(true);
        setSaveStatus("Uploading room photos…");
        resolvedClassified = await prepareClassifiedPhotosForSubmit(
          formData.classified_photos,
          user.accessToken,
          (ratio) => {
            setSaveStatus(`Uploading room photos… ${Math.round(ratio * 100)}%`);
          },
        );
        setUploading(false);
      }

      const resolvedVideos: string[] = [];
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (isHttpMediaUrl(v) || isUploadedMediaUri(v)) {
          resolvedVideos.push(v);
          continue;
        }
        if (typeof v === "string" && isLocalMediaUri(v)) {
          setSaveStatus(`Uploading video ${i + 1}/${videos.length}…`);
          setUploading(true);
          try {
            const urls = await prepareVideoForListingSubmit(
              { uri: v, mimeType: "video/mp4" },
              user.accessToken,
            );
            if (urls[0]) resolvedVideos.push(urls[0]);
          } catch (e) {
            console.error("Failed to upload video:", e);
            setToastMessage(
              e instanceof Error ? e.message : "Video upload failed",
            );
            setToastType("error");
            setShowToast(true);
            setIsSaving(false);
            setUploading(false);
            setSaveStatus("");
            return;
          } finally {
            setUploading(false);
          }
        }
      }

      setSaveStatus("Saving…");

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        listing_price: parseFloat(formData.price) || 0,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        square_footage: parseInt(formData.area) || 0,
        year_built: parseInt(formData.year_built) || 0,
        address: formData.address,
        city: formData.city,
        city_id: formData.city_id,
        zone_id: formData.zone_id,
        quartier_id: formData.quartier_id,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        indoor_features: formData.indoor_features,
        outdoor_features: formData.outdoor_features,
        amenity_ids: formData.amenity_ids,
        paper_types: Array.from(
          new Set([
            ...(formData.paper_types || []),
            ...(customPaperType.trim() ? [customPaperType.trim()] : [])
          ])
        ),
        images: resolvedImages,
        videos: resolvedVideos,
        floor_plans: formData.floor_plans,
        classified_photos: resolvedClassified,
        neighborhood: formData.neighborhood,
        host_private_note: formData.host_private_note,
        ...(canToggleGold ? { is_gold: !!formData.is_gold } : {}),
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["property-sale", propertyId] });
          queryClient.invalidateQueries({ queryKey: ["user-properties"] });
          queryClient.invalidateQueries({ queryKey: ["organization-properties"] });
        },
        onError: (error: any) => {
          console.error("Update mutation error:", error);
          console.error("Error response:", error?.response?.data);
        },
        onSettled: () => {
          setIsSaving(false);
          setSaveStatus("");
        },
      });
    } catch (err) {
      console.error("handleSave error:", err);
      setIsSaving(false);
      setUploading(false);
      setSaveStatus("");
      setToastMessage(
        err instanceof Error ? err.message : "Failed to save",
      );
      setToastType("error");
      setShowToast(true);
    }
  };

  if (!user) return <Loading />;
  if (propertyLoading) return <Loading />;
  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Property not found</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeftIcon size={20} color={COLORS.text} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("editPropertySale.title", "Edit property")}
          </Text>
          <TouchableOpacity
            style={styles.saveHeaderButton}
            onPress={handleSave}
            disabled={isSaving || updateMutation.isPending}
          >
            {(isSaving || updateMutation.isPending) ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.saveHeaderButtonText}>
                {t("editPropertySale.save", "Save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {saveStatus ? (
          <Text style={styles.saveStatusText}>{saveStatus}</Text>
        ) : null}

        {/* Section Navigation Track */}
        <View style={styles.sectionTrack}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTrackContent}
          >
            {SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionTrackItem,
                  activeSection === section.key && styles.sectionTrackItemActive
                ]}
                onPress={() => scrollToSection(section.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sectionTrackText,
                    activeSection === section.key &&
                      styles.sectionTrackTextActive
                  ]}
                >
                  {section.icon}{" "}
                  {t(`editPropertySale.sections.${section.key}`, section.key)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Content */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section: Basic Info */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["basic"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.basic", "Basic information")}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, title: text }));
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder={t(
                  "editPropertySale.placeholders.title",
                  "Property title",
                )}
                placeholderTextColor={COLORS.textTertiary}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>
            {canToggleGold ? (
              <View style={styles.inputGroup}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.label}>
                    {t("organization.goldListing", "Gold listing")}
                  </Text>
                  <Switch
                    value={!!formData.is_gold}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, is_gold: v }))
                    }
                    trackColor={{ false: COLORS.border, true: COLORS.text }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 6,
                    lineHeight: 16,
                  }}
                >
                  {t(
                    "organization.goldListingEditHint",
                    "Higher priority in feeds and discovery."
                  )}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section: Description */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["description"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.description", "Description")}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError
                ]}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, description: text }));
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder={t(
                  "editPropertySale.placeholders.description",
                  "Describe your property",
                )}
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Section: Property Type */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["type"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.type", "Property type")}
            </Text>
            <View style={styles.chipContainer}>
              {[
                "Apartment",
                "House",
                "Villa",
                "Studio",
                "Townhouse",
                "Duplex"
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    formData.property_type === type && styles.chipActive
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, property_type: type }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.property_type === type && styles.chipTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Pricing */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["pricing"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.pricing", "Pricing")}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (MRU) *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.largeInput,
                  errors.price && styles.inputError
                ]}
                value={formData.price}
                onChangeText={(text) => {
                  setFormData((prev) => ({
                    ...prev,
                    price: text.replace(/[^0-9]/g, "")
                  }));
                  setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Section: Details */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["details"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.details", "Property details")}
            </Text>
            <View style={styles.detailsRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      bedrooms: text.replace(/[^0-9]/g, "")
                    }))
                  }
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      bathrooms: text.replace(/[^0-9]/g, "")
                    }))
                  }
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area (m²)</Text>
              <TextInput
                style={styles.input}
                value={formData.area}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    area: text.replace(/[^0-9]/g, "")
                  }))
                }
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year Built</Text>
              <TextInput
                style={styles.input}
                value={formData.year_built}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    year_built: text.replace(/[^0-9]/g, "")
                  }))
                }
                placeholder="2024"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Section: Location */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["location"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.location", "Location")}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, address: text }));
                  setErrors((prev) => ({ ...prev, address: "" }));
                }}
                placeholder={t(
                  "editPropertySale.placeholders.address",
                  "Street address",
                )}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("createPropertySale.steps.step6.city", "City")} *
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdownInput,
                  errors.city && styles.inputError
                ]}
                onPress={() => {
                  setCitySearch("");
                  setShowCityModal(true);
                }}
              >
                <MaterialIcons
                  name="location-city"
                  size={20}
                  color={formData.city_id ? COLORS.text : COLORS.textTertiary}
                />
                <Text
                  style={[
                    styles.dropdownInputText,
                    !formData.city_id && styles.dropdownPlaceholder
                  ]}
                >
                  {formData.city_id
                    ? currentLanguage === "ar"
                      ? cities.find((c) => c.id === formData.city_id)
                          ?.name_ar ||
                        cities.find((c) => c.id === formData.city_id)?.name
                      : cities.find((c) => c.id === formData.city_id)?.name ||
                        cities.find((c) => c.id === formData.city_id)?.name_ar
                    : t("createPropertySale.selectCity", "Select a city")}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            {formData.city_id && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t("createPropertySale.steps.step6.zone", "Zone")} *
                </Text>
                <TouchableOpacity
                  style={[styles.input, styles.dropdownInput]}
                  onPress={() => {
                    if (zones.length === 0) return;
                    setZoneSearch("");
                    setShowZoneModal(true);
                  }}
                  disabled={zones.length === 0}
                >
                  <MaterialIcons
                    name="place"
                    size={20}
                    color={formData.zone_id ? COLORS.text : COLORS.textTertiary}
                  />
                  <Text
                    style={[
                      styles.dropdownInputText,
                      !formData.zone_id && styles.dropdownPlaceholder
                    ]}
                  >
                    {formData.zone_id
                      ? currentLanguage === "ar"
                        ? zones.find((z) => z.id === formData.zone_id)
                            ?.name_ar ||
                          zones.find((z) => z.id === formData.zone_id)?.name
                        : zones.find((z) => z.id === formData.zone_id)?.name ||
                          zones.find((z) => z.id === formData.zone_id)?.name_ar
                      : t("createPropertySale.selectZone", "Select a zone")}
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {formData.zone_id && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t("filters.quartier", "Quartier")} (
                  {t("common.optional", "Optional")})
                </Text>
                <TouchableOpacity
                  style={[styles.input, styles.dropdownInput]}
                  onPress={() => {
                    if (quartiers.length === 0) return;
                    setQuartierSearch("");
                    setShowQuartierModal(true);
                  }}
                  disabled={!formData.zone_id || quartiers.length === 0}
                >
                  <MaterialIcons
                    name="map"
                    size={20}
                    color={
                      formData.quartier_id ? COLORS.text : COLORS.textTertiary
                    }
                  />
                  <Text
                    style={[
                      styles.dropdownInputText,
                      !formData.quartier_id && styles.dropdownPlaceholder
                    ]}
                  >
                    {formData.quartier_id
                      ? currentLanguage === "ar"
                        ? quartiers.find((q) => q.id === formData.quartier_id)
                            ?.name_ar ||
                          quartiers.find((q) => q.id === formData.quartier_id)
                            ?.name
                        : quartiers.find((q) => q.id === formData.quartier_id)
                            ?.name ||
                          quartiers.find((q) => q.id === formData.quartier_id)
                            ?.name_ar
                      : t(
                          "createPropertySale.selectQuartier",
                          "Select a quartier"
                        )}
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude
                  }));
                  setMapRegion((prev) => ({
                    ...prev,
                    latitude,
                    longitude
                  }));
                }}
              >
                {formData.latitude && formData.longitude && (
                  <Marker
                    coordinate={{
                      latitude: formData.latitude,
                      longitude: formData.longitude
                    }}
                  />
                )}
              </MapView>
            </View>
          </View>

          {/* Section: Indoor Features */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["indoor"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.indoor", "Indoor features")}
            </Text>
            <View style={styles.chipContainer}>
              {[
                "Air Conditioning",
                "Heating",
                "Washer",
                "Dryer",
                "Dishwasher",
                "Elevator",
                "Fireplace",
                "Walk-in Closet",
                "Built-in Wardrobe",
                "Central Heating",
                "Built-in Kitchen",
                "Furnished",
                "Unfurnished",
                "Tiles Flooring",
                "Parquet Flooring",
                "Marble Flooring"
              ].map((feature) => (
                <TouchableOpacity
                  key={feature}
                  style={[
                    styles.chip,
                    formData.indoor_features.includes(feature) &&
                      styles.chipActive
                  ]}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      indoor_features: prev.indoor_features.includes(feature)
                        ? prev.indoor_features.filter((f) => f !== feature)
                        : [...prev.indoor_features, feature]
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.indoor_features.includes(feature) &&
                        styles.chipTextActive
                    ]}
                  >
                    {feature}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Outdoor Features */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["outdoor"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.outdoor", "Outdoor features")}
            </Text>
            <View style={styles.chipContainer}>
              {[
                "Balcony",
                "Garden",
                "Patio",
                "Terrace",
                "Pool",
                "Private Parking",
                "Security",
                "Playground",
                "Garage",
                "Rooftop",
                "Front Yard",
                "Backyard",
                "Swimming Pool",
                "Jacuzzi",
                "Outdoor Kitchen",
                "Barbecue Area"
              ].map((feature) => (
                <TouchableOpacity
                  key={feature}
                  style={[
                    styles.chip,
                    formData.outdoor_features.includes(feature) &&
                      styles.chipActive
                  ]}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      outdoor_features: prev.outdoor_features.includes(feature)
                        ? prev.outdoor_features.filter((f) => f !== feature)
                        : [...prev.outdoor_features, feature]
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.outdoor_features.includes(feature) &&
                        styles.chipTextActive
                    ]}
                  >
                    {feature}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Amenities */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["amenities"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.amenities", "Amenities")}
            </Text>
            {amenitiesLoading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <View style={styles.chipContainer}>
                {amenitiesList.map((amenity: any) => {
                  const selected = formData.amenity_ids.includes(amenity.id);
                  const label =
                    amenity.name?.[currentLanguage] ||
                    amenity.name?.en ||
                    amenity.name;
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => {
                        setFormData((prev) => ({
                          ...prev,
                          amenity_ids: selected
                            ? prev.amenity_ids.filter((id) => id !== amenity.id)
                            : [...prev.amenity_ids, amenity.id]
                        }));
                      }}
                      activeOpacity={0.8}
                    >
                      {amenity.icon && (
                        <View style={{ marginRight: 6 }}>
                          <PhosphorIcon
                            name={amenity.icon}
                            size={16}
                            color={selected ? "#111827" : "#4B5563"}
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextActive
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section: Property Papers */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["papers"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("listing.sale.steps.papers.title", "Property papers")}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t(
                "listing.sale.steps.papers.subtitle",
                "Select available legal papers to build buyer trust"
              )}
            </Text>
            <View style={styles.chipContainer}>
              {PAPER_TYPE_OPTIONS.map((paper) => {
                const active = (formData.paper_types || []).includes(paper);
                return (
                  <TouchableOpacity
                    key={paper}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paper_types: active
                          ? prev.paper_types.filter((p) => p !== paper)
                          : [...prev.paper_types, paper]
                      }))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {getPaperTypeLabel(paper)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("listing.common.optional", "Optional")}
              </Text>
              <TextInput
                style={styles.input}
                value={customPaperType}
                onChangeText={setCustomPaperType}
                placeholder={t(
                  "listing.sale.steps.papers.otherPlaceholder",
                  "Add another paper title (optional)"
                )}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          {/* Section: Images */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["images"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.images", "Images")}
            </Text>
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <MaterialIcons
                      name="close"
                      size={18}
                      color={COLORS.background}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={async () => {
                  try {
                    // Use native picker - no permissions needed
                    const result = await pickImageNative({
                      allowsEditing: false,
                      base64: false,
                      quality: 0.8,
                    });
                    if (result.canceled || !result.assets || result.assets.length === 0) return;
                    const asset = result.assets[0];
                    const uri = asset.uri;
                    if (uri && isValidMediaUri(uri)) {
                      setImages((prev) => [...prev, uri]);
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to pick image");
                  }
                }}
              >
                <MaterialIcons
                  name="add"
                  size={32}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>

            {/* Classified Photos Section - Realtor.com Style */}
            <View style={styles.inputGroup}>
              <Text style={styles.realtorSectionTitle}>
                {t(
                  "createPropertySale.classifiedPhotos.title",
                  "Classify Photos by Room Type"
                )}
              </Text>
              <Text style={styles.realtorSectionSubtitle}>
                {t(
                  "createPropertySale.classifiedPhotos.subtitle",
                  "Add photos for specific rooms to help buyers explore your property"
                )}
              </Text>

              <View style={styles.realtorClassifiedGrid}>
                {ROOM_TYPES.map((roomType) => {
                  const roomPhotos = formData.classified_photos?.find(
                    (cp) => cp.room_type === roomType.key
                  );
                  const photoCount = roomPhotos?.photos?.length || 0;
                  const IconComponent = roomType.Icon;

                  return (
                    <TouchableOpacity
                      key={roomType.key}
                      style={styles.realtorRoomCard}
                      onPress={() => pickClassifiedPhoto(roomType.key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.realtorRoomCardContent}>
                        <View style={styles.realtorRoomIconWrapper}>
                          <IconComponent
                            size={20}
                            color="#006AFF"
                            weight="regular"
                          />
                        </View>
                        <View style={styles.realtorRoomInfo}>
                          <Text
                            style={styles.realtorRoomLabel}
                            numberOfLines={1}
                          >
                            {roomType.label}
                          </Text>
                          {photoCount > 0 && (
                            <Text style={styles.realtorRoomCount}>
                              {photoCount}{" "}
                              {photoCount === 1 ? "photo" : "photos"}
                            </Text>
                          )}
                        </View>
                        {photoCount > 0 && (
                          <View style={styles.realtorRoomBadge}>
                            <Text style={styles.realtorRoomBadgeText}>
                              {photoCount}
                            </Text>
                          </View>
                        )}
                      </View>

                      {photoCount > 0 ? (
                        <View style={styles.realtorRoomThumbs}>
                          {roomPhotos!.photos
                            .slice(0, 2)
                            .map((photoUri, idx) => (
                              <TouchableOpacity
                                key={`${roomType.key}-${idx}`}
                                style={styles.realtorRoomThumb}
                                onPress={(e) => {
                                  e.stopPropagation();
                                }}
                                activeOpacity={1}
                              >
                                <Image
                                  source={{ uri: photoUri }}
                                  style={styles.realtorRoomThumbImage}
                                />
                                <TouchableOpacity
                                  style={styles.realtorRoomThumbRemove}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    removeClassifiedPhoto(roomType.key, idx);
                                  }}
                                >
                                  <MaterialIcons
                                    name="close"
                                    size={10}
                                    color="#FFFFFF"
                                  />
                                </TouchableOpacity>
                              </TouchableOpacity>
                            ))}
                          {photoCount > 2 && (
                            <View style={styles.realtorRoomThumbMore}>
                              <Text style={styles.realtorRoomThumbMoreText}>
                                +{photoCount - 2}
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.realtorRoomEmpty}>
                          <Plus size={16} color="#171717" weight="regular" />
                          <Text style={styles.realtorRoomEmptyText}>
                            Add photos
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section: Video */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["video"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.video", "Video")}
            </Text>
            <View style={styles.videosContainer}>
              {videos.map((uri, index) => (
                <View key={index} style={styles.videoWrapper}>
                  <Text style={styles.videoText}>Video {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeVideoButton}
                    onPress={() =>
                      setVideos((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <MaterialIcons
                      name="close"
                      size={18}
                      color={COLORS.background}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addVideoButton}
                onPress={async () => {
                  try {
                    // Use native picker for videos
                    const result = await pickVideoNative({
                      allowsEditing: false,
                      quality: 0.8,
                      videoMaxDuration: 600, // Max 10 minutes (in seconds)
                    });
                    
                    // Check for errors first
                    if (result.error) {
                      console.error("❌ Video picker error:", result.error);
                      Alert.alert("Error", result.error || "Failed to pick video");
                      return;
                    }
                    
                    // Check if canceled
                    if (result.canceled) {
                      console.log("ℹ️ Video picker was canceled");
                      return;
                    }
                    
                    // Check if assets exist
                    if (!result.assets || result.assets.length === 0) {
                      console.log("⚠️ Video picker returned no assets");
                      Alert.alert("Error", "No video was selected");
                      return;
                    }
                    
                    const asset = result.assets[0];
                    const uri = asset.uri;
                    
                    if (uri) {
                      console.log("✅ Video picked successfully:", uri.substring(0, 50) + "...");
                      setVideos((prev) => [...prev, uri]);
                    } else {
                      console.error("❌ Video URI is empty");
                      Alert.alert("Error", "Failed to get video URI");
                    }
                  } catch (error: any) {
                    console.error("❌ Video picker exception:", error);
                    Alert.alert(
                      "Error", 
                      error?.message || "Failed to pick video. Please try again."
                    );
                  }
                }}
              >
                <MaterialIcons
                  name="videocam"
                  size={32}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.addVideoText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Floor Plans */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["floorplans"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.floorplans", "Floor plans")}
            </Text>
            {formData.floor_plans.map((plan, index) => (
              <View key={index} style={styles.floorPlanCard}>
                <Text style={styles.floorPlanTitle}>Floor {index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeFloorPlanButton}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      floor_plans: prev.floor_plans.filter(
                        (_, i) => i !== index
                      )
                    }));
                  }}
                >
                  <MaterialIcons name="delete" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addFloorPlanButton}
              onPress={() => {
                setFormData((prev) => ({
                  ...prev,
                  floor_plans: [
                    ...prev.floor_plans,
                    {
                      floor_number: prev.floor_plans.length + 1,
                      bedrooms: 0,
                      bathrooms: 0,
                      area: 0,
                      images: []
                    }
                  ]
                }));
              }}
            >
              <MaterialIcons name="add" size={20} color={COLORS.text} />
              <Text style={styles.addFloorPlanText}>Add Floor Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Section: Neighborhood */}
          <View
            style={styles.section}
            onLayout={(e) => {
              sectionRefs.current["neighborhood"] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("editPropertySale.sectionTitles.neighborhood", "Neighborhood")}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Noise Level</Text>
              <View style={styles.chipContainer}>
                {["Quiet", "Moderate", "Busy"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chip,
                      formData.neighborhood.noise_level === level &&
                        styles.chipActive
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        neighborhood: {
                          ...prev.neighborhood,
                          noise_level: level
                        }
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.neighborhood.noise_level === level &&
                          styles.chipTextActive
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Safety Level</Text>
              <View style={styles.chipContainer}>
                {["Very Safe", "Safe", "Moderate"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chip,
                      formData.neighborhood.safety_level === level &&
                        styles.chipActive
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        neighborhood: {
                          ...prev.neighborhood,
                          safety_level: level
                        }
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.neighborhood.safety_level === level &&
                          styles.chipTextActive
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Private Note (Only you / your agency)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.host_private_note}
                onChangeText={(text) => {
                  setFormData((prev) => ({
                    ...prev,
                    host_private_note: text
                  }));
                }}
                placeholder="Internal notes, reminders, buyer context..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.neighborhood.notes}
                onChangeText={(text) => {
                  setFormData((prev) => ({
                    ...prev,
                    neighborhood: { ...prev.neighborhood, notes: text }
                  }));
                }}
                placeholder="Neighborhood notes"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isSaving || updateMutation.isPending) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaving || updateMutation.isPending}
              activeOpacity={0.8}
            >
              {(isSaving || updateMutation.isPending) ? (
                <View style={styles.saveButtonLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.background} />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>
                  {t("editPropertySale.saveChanges", "Save changes")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Modal */}
      {showCityModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.cityZoneModal}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {t("createPropertySale.steps.step6.city", "City")}
              </Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <MaterialIcons name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={styles.bigInput}
                placeholder={t("common.search")}
                placeholderTextColor="#717171"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>
            <ScrollView
              style={{ maxHeight: MODAL_MAX_HEIGHT }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator
            >
              {(cities || [])
                .filter((c: any) => {
                  const search = (citySearch || "").toLowerCase();
                  if (!search) return true;
                  return (
                    (c.name || "").toLowerCase().includes(search) ||
                    (c.name_ar || "").toLowerCase().includes(search)
                  );
                })
                .map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        city_id: c.id,
                        city:
                          currentLanguage === "ar"
                            ? c.name_ar || c.name
                            : c.name || c.name_ar,
                        zone_id: null,
                        quartier_id: null
                      }));
                      setShowCityModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>
                      {currentLanguage === "ar"
                        ? c.name_ar || c.name
                        : c.name || c.name_ar}
                    </Text>
                    <Text style={styles.modalOptionSub}>
                      {currentLanguage === "ar" ? c.name : c.name_ar}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.cityZoneModal}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {t("createPropertySale.steps.step6.zone", "Zone")}
              </Text>
              <TouchableOpacity onPress={() => setShowZoneModal(false)}>
                <MaterialIcons name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={styles.bigInput}
                placeholder={t("common.search")}
                placeholderTextColor="#717171"
                value={zoneSearch}
                onChangeText={setZoneSearch}
              />
            </View>
            <ScrollView
              style={{ maxHeight: MODAL_MAX_HEIGHT }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator
            >
              {(zones || [])
                .filter((z: any) => {
                  const search = (zoneSearch || "").toLowerCase();
                  if (!search) return true;
                  return (
                    (z.name || "").toLowerCase().includes(search) ||
                    (z.name_ar || "").toLowerCase().includes(search)
                  );
                })
                .map((z: any) => (
                  <TouchableOpacity
                    key={z.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        zone_id: z.id,
                        quartier_id: null
                      }));
                      setShowZoneModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>
                      {currentLanguage === "ar"
                        ? z.name_ar || z.name
                        : z.name || z.name_ar}
                    </Text>
                    <Text style={styles.modalOptionSub}>
                      {currentLanguage === "ar" ? z.name : z.name_ar}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Quartier Modal */}
      {showQuartierModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.cityZoneModal}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {t("filters.quartier", "Quartier")}{" "}
                {t("common.optional", "(Optional)")}
              </Text>
              <TouchableOpacity onPress={() => setShowQuartierModal(false)}>
                <MaterialIcons name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={styles.bigInput}
                placeholder={t("common.search")}
                placeholderTextColor="#717171"
                value={quartierSearch}
                onChangeText={setQuartierSearch}
              />
            </View>
            <ScrollView
              style={{ maxHeight: MODAL_MAX_HEIGHT }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator
            >
              {(quartiers || [])
                .filter((q: any) => {
                  const search = (quartierSearch || "").toLowerCase();
                  if (!search) return true;
                  return (
                    (q.name || "").toLowerCase().includes(search) ||
                    (q.name_ar || "").toLowerCase().includes(search)
                  );
                })
                .map((q: any) => (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, quartier_id: q.id }));
                      setShowQuartierModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>
                      {currentLanguage === "ar"
                        ? q.name_ar || q.name
                        : q.name || q.name_ar}
                    </Text>
                    <Text style={styles.modalOptionSub}>
                      {currentLanguage === "ar" ? q.name : q.name_ar}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showToast && (
        <CustomToast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.3
  },
  saveHeaderButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  saveHeaderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.background
  },
  saveStatusText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Section Track
  sectionTrack: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background
  },
  sectionTrackContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8
  },
  sectionTrackItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.borderLight,
    marginRight: 8
  },
  sectionTrackItemActive: {
    backgroundColor: COLORS.text
  },
  sectionTrackText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  sectionTrackTextActive: {
    color: COLORS.background
  },
  // Scroll Content
  scrollContent: {
    paddingBottom: 32
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12
  },
  // Inputs
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.2
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  largeInput: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 20
  },
  inputError: {
    borderColor: "#DC2626"
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 14
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500"
  },
  // Details Row
  detailsRow: {
    flexDirection: "row",
    marginBottom: 16
  },
  // Chips
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground
  },
  chipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text
  },
  chipTextActive: {
    color: COLORS.background
  },
  // Map
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  map: {
    width: "100%",
    height: "100%"
  },
  // Images
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  imageWrapper: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  image: {
    width: "100%",
    height: "100%"
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  addImageButton: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderLight
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: "500"
  },
  // Videos
  videosContainer: {
    gap: 12
  },
  videoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.borderLight
  },
  videoText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text
  },
  removeVideoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center"
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    backgroundColor: COLORS.borderLight,
    gap: 8
  },
  addVideoText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  // Floor Plans
  floorPlanCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  floorPlanTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text
  },
  removeFloorPlanButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  addFloorPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    backgroundColor: COLORS.borderLight,
    gap: 8
  },
  addFloorPlanText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  // Save Section
  saveSection: {
    paddingHorizontal: 20,
    paddingTop: 32
  },
  saveButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2
  },
  saveButtonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  // Error States
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 24
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "600"
  },
  bottomSpacing: {
    height: 24
  },
  // Dropdown Input
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dropdownInputText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text
  },
  dropdownPlaceholder: {
    color: COLORS.textTertiary
  },
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000
  },
  cityZoneModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937"
  },
  bigInput: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222222"
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  modalOptionSub: {
    fontSize: 14,
    color: "#717171"
  },
  // Realtor.com Style - Classified Photos (Enhanced - Larger & More Readable)
  realtorSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 8,
    marginTop: 8,
    textAlign: "center"
  },
  realtorSectionSubtitle: {
    fontSize: 14,
    color: "#171717",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20
  },
  realtorClassifiedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%"
  },
  realtorRoomCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  realtorRoomCardContent: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  realtorRoomIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center"
  },
  realtorRoomInfo: {
    flex: 1,
    minWidth: 0
  },
  realtorRoomLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#171717",
    lineHeight: 20
  },
  realtorRoomCount: {
    fontSize: 12,
    color: "#171717",
    marginTop: 3,
    lineHeight: 16,
    opacity: 0.7
  },
  realtorRoomBadge: {
    backgroundColor: "#006AFF",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  realtorRoomBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  realtorRoomThumbs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8
  },
  realtorRoomThumb: {
    position: "relative",
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  realtorRoomThumbImage: {
    width: 50,
    height: 50,
    borderRadius: 6
  },
  realtorRoomThumbRemove: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  realtorRoomThumbMore: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center"
  },
  realtorRoomThumbMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#171717"
  },
  realtorRoomEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6
  },
  realtorRoomEmptyText: {
    fontSize: 12,
    color: "#171717",
    fontWeight: "500",
    opacity: 0.6
  }
});

export default EditPropertySaleScreen;
