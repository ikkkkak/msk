import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { pickImageNative, pickVideoNative } from "../utils/nativePhotoPicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, Polygon } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { theme } from "../theme";
import { AddWithAiFlow } from "../components/listing-ai/AddWithAiFlow";
import { ListingStartMethodPicker } from "../components/listing-ai/ListingStartMethodPicker";
import { applyLandListingDraft } from "../utils/listingAiApply";
import type { ListingAiDraft } from "../types/listingAi";
import { habitatApi } from "../services/habitatApi";
import type { HabitatPlot } from "../types/habitat";
import { useLocationPicker } from "../hooks/useLocationPicker";
import { LocationPickerList } from "../components/location/LocationPickerList";

const { width, height } = Dimensions.get("window");

export const CreateLandmarkScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const mapRef = useRef<MapView>(null);
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const tr = (key: string, fallback: string, vars?: Record<string, unknown>) =>
    t(key, { defaultValue: fallback, ...(vars as object) });

  const buildLandmarkDescriptionTemplates = () => {
    const landTypeLabel = landType
      ? tr(`listing.landmark.landType.${landType}`, landType, {})
      : "";
    const place = [region, zoning, district].filter(Boolean).join(", ");
    const areaStr = area.trim() && parseFloat(area) > 0 ? `${area} m²` : "";
    const priceStr =
      price.trim() && parseFloat(price) > 0 ? `${price} MRU` : "";
    const titleLine = title.trim();
    const line1 = [titleLine, landTypeLabel].filter(Boolean).join(" • ");
    const bullets = [
      place
        ? tr("listing.common.template.locationLine", "Location: {{place}}", {
            place,
          })
        : "",
      areaStr
        ? tr("listing.common.template.areaLine", "Area: {{area}}", {
            area: areaStr,
          })
        : "",
      priceStr
        ? tr("listing.common.template.priceLine", "Price: {{price}}", {
            price: priceStr,
          })
        : "",
    ].filter(Boolean);

    const templates = [
      {
        id: "short",
        title: tr("listing.common.template.shortTitle", "Short", {}),
        text: [line1, bullets.slice(0, 2).join("\n")]
          .filter(Boolean)
          .join("\n"),
      },
      {
        id: "detail",
        title: tr("listing.landmark.template.detailTitle", "Detailed", {}),
        text: [
          line1,
          tr(
            "listing.landmark.template.detailBody",
            "Serious inquiries welcome. Documents and visits can be arranged.",
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
            "listing.landmark.template.investBody",
            "Strong potential in this area for development or long-term hold.",
            {},
          ),
          bullets.join("\n"),
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
    return templates.filter((x) => x.text.trim().length > 0);
  };

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [landType, setLandType] = useState<string>("");
  const [lots, setLots] = useState<string>("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("");
  const [zoning, setZoning] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [elevation, setElevation] = useState("");
  const [sides, setSides] = useState<string>("");
  const [points, setPoints] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [highlightLocation, setHighlightLocation] = useState<boolean>(false);
  const [landmarkImages, setLandmarkImages] = useState<string[]>([]);
  const [landmarkVideo, setLandmarkVideo] = useState<{
    uri: string;
    mimeType?: string;
  } | null>(null);
  /** Optional; only visible to you / your org on the server — never shown to guests. */
  const [hostPrivateNote, setHostPrivateNote] = useState("");
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [customPaperType, setCustomPaperType] = useState("");
  // Uploaded “property papers” (stored as image/document URLs after upload).
  const [paperUploads, setPaperUploads] = useState<string[]>([]);
  const [isUploadingPapers, setIsUploadingPapers] = useState(false);
  /** Inline edit toggles on verify-details (no navigation back to steps). */
  const [reviewEditing, setReviewEditing] = useState<Record<string, boolean>>({});

  const toggleReviewField = (field: string) => {
    setReviewEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Cadastre plot verification state.
  const [plotVerifyStatus, setPlotVerifyStatus] = useState<
    "idle" | "checking" | "matched" | "not_found" | "error"
  >("idle");
  const [matchedPlot, setMatchedPlot] = useState<HabitatPlot | null>(null);
  const [plotConfirmed, setPlotConfirmed] = useState(false);
  const [plotVerifyError, setPlotVerifyError] = useState<string>("");
  const plotVerifyLastQueryRef = useRef<string>("");

  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(
    undefined,
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>(
    undefined,
  );
  const [selectedQuartierId, setSelectedQuartierId] = useState<
    number | undefined
  >(undefined);

  const [areaUnit, setAreaUnit] = useState("m²");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiFlowVisible, setAiFlowVisible] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(true);
  const [isQuartierDropdownOpen, setIsQuartierDropdownOpen] = useState(true);
  const quartierListMaxHeight = Math.min(420, height * 0.48);

  const location = useLocationPicker(selectedCityId, selectedZoneId);
  const {
    cities,
    zones,
    quartiers,
    citiesLoading,
    zonesLoading,
    quartiersLoading,
    label: locationLabel,
    citySearch,
    setCitySearch,
    zoneSearch,
    setZoneSearch,
    quartierSearch,
    setQuartierSearch,
    resetAllSearch,
    habitatCity,
  } = location;

  const onSelectCity = (item: { id: number; name?: string; name_ar?: string }) => {
    const label = locationLabel(item);
    setSelectedCityId(item.id);
    setSelectedZoneId(undefined);
    setSelectedQuartierId(undefined);
    setZoning("");
    setDistrict("");
    setRegion(label);
    resetAllSearch();
    setIsZoneDropdownOpen(true);
    setIsQuartierDropdownOpen(false);
  };

  const onSelectZone = (item: { id: number; name?: string; name_ar?: string }) => {
    const label = locationLabel(item);
    setSelectedZoneId(item.id);
    setSelectedQuartierId(undefined);
    setZoning(label);
    setDistrict("");
    setQuartierSearch("");
    setIsZoneDropdownOpen(false);
    setIsQuartierDropdownOpen(true);
  };

  const onSelectQuartier = (item: { id: number; name?: string; name_ar?: string }) => {
    const label = locationLabel(item);
    setSelectedQuartierId(item.id);
    setDistrict(label);
  };

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

  const initialRegion = (route.params as { initialRegion?: any })
    ?.initialRegion || {
    latitude: 18.0731,
    longitude: -15.9582,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
  const [mapCenter, setMapCenter] = useState(initialRegion);

  // If the user changes plot number or the selected cadastre sector (quartier),
  // we must clear any previous “Is this your plot?” confirmation.
  useEffect(() => {
    setPlotConfirmed(false);
    setPlotVerifyStatus("idle");
    setMatchedPlot(null);
    setPlotVerifyError("");
    plotVerifyLastQueryRef.current = "";
  }, [selectedQuartierId, plotNumber]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    if (points.length < 4) {
      setPoints([...points, { latitude, longitude }]);
    }
  };

  const handleMapRegionChange = (region: any) => {
    setMapCenter({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  const getBase64 = async (uri: string): Promise<string> => {
    try {
      const Encoding: any = (FileSystem as any).EncodingType;
      const token = Encoding && Encoding.Base64 ? Encoding.Base64 : "base64";
      return await FileSystem.readAsStringAsync(uri, { encoding: token });
    } catch (e) {
      const data = await FileSystem.readAsStringAsync(uri as any);
      return data;
    }
  };

  const uploadImageToServer = async (imageUri: string): Promise<string> => {
    try {
      let dataUrl = imageUri;
      if (!/^data:image\//i.test(imageUri)) {
        const base64 = await getBase64(imageUri);
        dataUrl = `data:image/jpeg;base64,${base64}`;
      }

      const response = await axios.post(
        endpoints.uploadImage,
        { data: dataUrl },
        {
          headers: user?.accessToken
            ? { Authorization: `Bearer ${user.accessToken}` }
            : undefined,
          timeout: 120000,
          maxContentLength: Infinity as any,
          maxBodyLength: Infinity as any,
        },
      );

      if (!response.data?.url) {
        throw new Error("Image upload failed");
      }
      return response.data.url;
    } catch (error) {
      console.error("Server image upload error:", error);
      throw error;
    }
  };

  const pickLandmarkImage = async () => {
    if (!user?.accessToken) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.signInToUpload",
          "Please sign in to upload images.",
          {},
        ),
      );
      return;
    }
    setIsUploadingImage(true);
    try {
      const result = await pickImageNative({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = (asset as any).uri || "";
        const base64 = (asset as any).base64;

        let dataUrl: string;
        if (base64 && typeof base64 === "string" && base64.length > 0) {
          dataUrl = `data:image/jpeg;base64,${base64}`;
        } else {
          try {
            const b64 = await getBase64(uri);
            dataUrl = `data:image/jpeg;base64,${b64}`;
          } catch (e) {
            console.error("getBase64 error:", e);
            throw new Error(
              tr(
                "listing.landmark.alerts.couldNotReadImage",
                "Could not read image file",
                {},
              ),
            );
          }
        }

        const serverUrl = await uploadImageToServer(dataUrl);
        setLandmarkImages((prev) => [...prev, serverUrl]);
      }
    } catch (error) {
      console.error("CreateLandmark pick image error:", error);
      const msg =
        (error as any)?.response?.data?.error ||
        (error as any)?.message ||
        tr("listing.landmark.alerts.uploadFailed", "Upload failed", {});
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        String(msg),
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeLandmarkImage = (index: number) => {
    setLandmarkImages(landmarkImages.filter((_, i) => i !== index));
  };

  const pickPaperUpload = async (replaceIndex?: number) => {
    if (!user?.accessToken) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.signInToUpload",
          "Please sign in to upload papers.",
          {},
        ),
      );
      return;
    }

    setIsUploadingPapers(true);
    try {
      const result = await pickImageNative({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0] as any;
      const uri = asset?.uri || "";

      const base64 =
        typeof asset?.base64 === "string" && asset.base64.length > 0
          ? asset.base64
          : await getBase64(uri);

      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const serverUrl = await uploadImageToServer(dataUrl);
      if (replaceIndex !== undefined) {
        setPaperUploads((prev) =>
          prev.map((url, i) => (i === replaceIndex ? serverUrl : url)),
        );
      } else {
        setPaperUploads((prev) => [...prev, serverUrl]);
      }
    } catch (error: any) {
      console.error("Paper upload error:", error);
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        String(
          error?.response?.data?.error ||
            error?.message ||
            tr("listing.landmark.alerts.uploadFailed", "Upload failed", {}),
        ),
      );
    } finally {
      setIsUploadingPapers(false);
    }
  };

  const removePaperUpload = (index: number) => {
    setPaperUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const pickLandmarkVideo = async () => {
    try {
      const result = await pickVideoNative({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = (asset as any).uri || "";
        if (uri) setLandmarkVideo({ uri, mimeType: (asset as any).mimeType });
      }
    } catch (error) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.pickVideoFailed",
          "Failed to pick video. Please try again.",
          {},
        ),
      );
    }
  };

  const removeLandmarkVideo = () => setLandmarkVideo(null);

  const canProceedToNextStep = () => {
    const step = STEPS[currentStep];
    if (!step.validation) return true;
    return step.validation();
  };

  const nextStep = () => {
    if (currentStep >= STEPS.length - 1 || !canProceedToNextStep()) return;
    const stepId = STEPS[currentStep]?.id;
    if (stepId === "plotVerify") {
      const photosIdx = STEPS.findIndex((s) => s.id === "photos");
      if (photosIdx >= 0) {
        setCurrentStep(photosIdx);
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.accessToken) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.mustLogin",
          "You must be logged in to list a property.",
          {},
        ),
      );
      return;
    }

    if (!plotConfirmed) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.plotMustBeConfirmed",
          "Please confirm the plot before publishing.",
          {},
        ),
      );
      return;
    }

    if (
      selectedCityId === undefined ||
      selectedZoneId === undefined ||
      selectedQuartierId === undefined ||
      plotNumber.trim().length === 0
    ) {
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        tr(
          "listing.landmark.alerts.locationRequired",
          "Please complete the city, zone, sector, and plot number.",
          {},
        ),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const coordinates = points.length === 4 ? points : [];
      const [p1, p2, p3, p4] = coordinates;

      let uploadedVideoUrl: string | null = null;
      if (landmarkVideo?.uri && user?.accessToken) {
        try {
          const { uploadVideoChunked } = await import(
            "../services/videoChunkUpload"
          );
          uploadedVideoUrl = await uploadVideoChunked(
            landmarkVideo.uri,
            landmarkVideo.mimeType || "video/mp4",
            user.accessToken,
          );
        } catch (vidErr) {
          console.error("Video upload error:", vidErr);
          Alert.alert(
            tr("listing.landmark.alerts.error", "Error", {}),
            tr(
              "listing.landmark.alerts.uploadVideoFailed",
              "Failed to upload video. Please try again.",
              {},
            ),
          );
          setIsSubmitting(false);
          return;
        }
      }
      const payload = {
        paper_types: Array.from(
          new Set([
            ...paperTypes,
            ...(customPaperType.trim() ? [customPaperType.trim()] : []),
          ]),
        ),
        title: title.trim(),
        description: description.trim(),
        images: landmarkImages,
        ...(uploadedVideoUrl && { video_url: uploadedVideoUrl }),
        area: parseFloat(area) || 0,
        area_unit: areaUnit,
        land_type: landType,
        // Mandatory location IDs (required by backend schema)
        city_id: selectedCityId!,
        zone_id: selectedZoneId!,
        quartier_id: selectedQuartierId!,
        zoning: zoning,
        lots: lots.trim().length ? parseInt(lots, 10) : undefined,
        district: district.trim(),
        region: region.trim(),
        plot_number: plotNumber.trim(),
        elevation_m: parseFloat(elevation) || 0,
        sides: sides.split(/\s+/).filter(Boolean),
        price: parseFloat(price) || 0,
        currency: "MRU",
        utilities: [],
        highlight_location: highlightLocation,
        ...(highlightLocation && points.length === 4
          ? {
              point1_lat: p1.latitude,
              point1_lng: p1.longitude,
              point2_lat: p2.latitude,
              point2_lng: p2.longitude,
              point3_lat: p3.latitude,
              point3_lng: p3.longitude,
              point4_lat: p4.latitude,
              point4_lng: p4.longitude,
            }
          : {}),
        property_papers: paperUploads,
        plot_confirmed: plotConfirmed,
        ...(matchedPlot?.id
          ? { habitat_plot_id: matchedPlot.id }
          : {}),
        ...(hostPrivateNote.trim()
          ? { host_private_note: hostPrivateNote.trim() }
          : {}),
      };

      await axios.post(`${endpoints.baseURL}/landmarks`, payload, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      Alert.alert(
        tr("listing.landmark.alerts.successTitle", "Success", {}),
        tr(
          "listing.landmark.alerts.successBody",
          "Your property has been listed successfully!",
          {},
        ),
        [
          {
            text: tr("listing.common.ok", "OK", {}),
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      console.error("Create landmark error:", error);
      Alert.alert(
        tr("listing.landmark.alerts.error", "Error", {}),
        error.response?.data?.error ||
          tr(
            "listing.landmark.alerts.createFailed",
            "Failed to create property listing. Please try again.",
            {},
          ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define all steps with Airbnb-style one-focus approach
  const renderReviewEditToggle = (field: string) => (
    <TouchableOpacity
      style={[
        styles.reviewEditPencil,
        reviewEditing[field] && styles.reviewEditPencilActive,
      ]}
      onPress={() => toggleReviewField(field)}
    >
      <MaterialIcons
        name={reviewEditing[field] ? "check" : "edit"}
        size={16}
        color={reviewEditing[field] ? "#00A699" : "#717171"}
      />
    </TouchableOpacity>
  );

  const renderPaperTypeChips = () => (
    <>
      <View style={styles.chipsWrap}>
        {PAPER_TYPE_OPTIONS.map((paper) => {
          const active = paperTypes.includes(paper);
          return (
            <TouchableOpacity
              key={paper}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() =>
                setPaperTypes((prev) =>
                  prev.includes(paper)
                    ? prev.filter((p) => p !== paper)
                    : [...prev, paper],
                )
              }
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
          "listing.landmark.steps.papers.otherPlaceholder",
          "Add another paper title (optional)",
          {},
        )}
        placeholderTextColor="#999"
      />
    </>
  );

  const renderPaperUploadsGrid = () => (
    <View style={styles.paperUploadsGrid}>
      {paperUploads.map((url, idx) => (
        <View key={url + idx} style={styles.paperItem}>
          <Image source={{ uri: url }} style={styles.paperThumb} />
          <TouchableOpacity
            style={styles.paperCrop}
            onPress={() => pickPaperUpload(idx)}
            disabled={isUploadingPapers}
          >
            <MaterialIcons name="crop" size={14} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.paperRemove}
            onPress={() => removePaperUpload(idx)}
          >
            <MaterialIcons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.paperItem, styles.paperItemAdd]}
        onPress={() => pickPaperUpload()}
        disabled={isUploadingPapers}
      >
        {isUploadingPapers ? (
          <ActivityIndicator size="small" color="#717171" />
        ) : (
          <MaterialIcons name="add" size={28} color="#717171" />
        )}
      </TouchableOpacity>
    </View>
  );

  const STEPS = [
    {
      id: "intro",
      title: tr("listing.landmark.steps.intro.title", "Let's get started", {}),
      subtitle: tr(
        "listing.landmark.steps.intro.subtitle",
        "We'll help you list your property in a few simple steps",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.introContainer}>
          <ListingStartMethodPicker
            headline={tr(
              "listing.landmark.steps.intro.headline",
              "List your land",
              {},
            )}
            body={tr(
              "listing.landmark.steps.intro.body",
              "Share your land with buyers in a few simple steps.",
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
      title: tr(
        "listing.landmark.steps.title.title",
        "Give your property a title",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.title.subtitle",
        "This helps buyers understand what makes your land special",
        {},
      ),
      placeholder: tr(
        "listing.landmark.steps.title.placeholder",
        "e.g., Prime Commercial Land in City Center",
        {},
      ),
      validation: () => title.trim().length > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={title}
            onChangeText={setTitle}
            placeholder={tr(
              "listing.landmark.steps.title.placeholder",
              "e.g., Prime Commercial Land in City Center",
              {},
            )}
            placeholderTextColor="#B0B0B0"
            autoFocus
            multiline={false}
          />
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.title.hint",
              "Choose a clear, descriptive title",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "description",
      title: tr(
        "listing.landmark.steps.description.title",
        "Describe your property",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.description.subtitle",
        "What should buyers know about this land?",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={[styles.focusedInput, styles.focusedTextArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={tr(
              "listing.landmark.steps.description.placeholder",
              "Describe the location, features, and potential uses...",
              {},
            )}
            placeholderTextColor="#B0B0B0"
            autoFocus
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.description.hint",
              "Optional, but helps attract serious buyers",
              {},
            )}
          </Text>
          <View style={{ marginTop: 16 }}>
            <Text
              style={[styles.inputHint, { fontWeight: "600", color: "#222" }]}
            >
              {tr("listing.common.suggestedTemplates", "Suggested", {})}
            </Text>
            <View style={styles.chipsWrap}>
              {buildLandmarkDescriptionTemplates().map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  style={styles.chip}
                  onPress={() => setDescription(tpl.text)}
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
      id: "area",
      title: tr(
        "listing.landmark.steps.area.title",
        "What's the area of your property?",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.area.subtitle",
        "Be as accurate as possible",
        {},
      ),
      validation: () => area.trim().length > 0 && parseFloat(area) > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={styles.focusedInputWithUnit}
              value={area}
              onChangeText={setArea}
              placeholder={tr(
                "listing.landmark.steps.area.placeholder",
                "1000",
                {},
              )}
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.unitLabel}>m²</Text>
          </View>
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.area.hint",
              "Enter the total area in square meters",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "price",
      title: tr(
        "listing.landmark.steps.price.title",
        "Set your asking price",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.price.subtitle",
        "Consider competitive pricing in your area",
        {},
      ),
      validation: () => price.trim().length > 0 && parseFloat(price) > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={styles.focusedInputWithUnit}
              value={price}
              onChangeText={setPrice}
              placeholder={tr(
                "listing.landmark.steps.price.placeholder",
                "5000000",
                {},
              )}
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.unitLabel}>MRU</Text>
          </View>
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.price.hint",
              "Research similar properties nearby to set a competitive price",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "landType",
      title: tr(
        "listing.landmark.steps.landType.title",
        "What type of land is this?",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.landType.subtitle",
        "This helps buyers find your listing",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          {[
            {
              key: "residential",
              labelKey: "listing.landmark.landType.residential",
              labelFb: "Residential",
              icon: "home",
            },
            {
              key: "commercial",
              labelKey: "listing.landmark.landType.commercial",
              labelFb: "Commercial",
              icon: "store",
            },
            {
              key: "agricultural",
              labelKey: "listing.landmark.landType.agricultural",
              labelFb: "Agricultural",
              icon: "agriculture",
            },
            {
              key: "industrial",
              labelKey: "listing.landmark.landType.industrial",
              labelFb: "Industrial",
              icon: "factory",
            },
            {
              key: "mixed",
              labelKey: "listing.landmark.landType.mixed",
              labelFb: "Mixed Use",
              icon: "business",
            },
            {
              key: "other",
              labelKey: "listing.landmark.landType.other",
              labelFb: "Other",
              icon: "more-horiz",
            },
          ].map((opt) => {
            const active = landType === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionCard, active && styles.optionCardActive]}
                activeOpacity={0.7}
                onPress={() => setLandType(active ? "" : opt.key)}
              >
                <MaterialIcons
                  name={opt.icon as any}
                  size={32}
                  color={active ? "#D16024" : "#717171"}
                />
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                >
                  {tr(opt.labelKey, opt.labelFb, {})}
                </Text>
                {active && (
                  <View style={styles.checkMark}>
                    <MaterialIcons name="check" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.landType.skipHint",
              "Optional - Skip if not applicable",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "city",
      title: tr(
        "listing.landmark.steps.city.title",
        "Where is your property located?",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.city.subtitle",
        "Start with the city",
        {},
      ),
      validation: () => selectedCityId !== undefined,
      render: () => (
        <View style={styles.optionsContainer}>
          <LocationPickerList
            items={cities}
            selectedId={selectedCityId}
            search={citySearch}
            onSearchChange={setCitySearch}
            onSelect={(item) => onSelectCity(item)}
            label={locationLabel}
            loading={citiesLoading}
            nested
          />
        </View>
      ),
    },
    {
      id: "zone",
      title: tr("listing.landmark.steps.zone.title", "Which zone?", {}),
      subtitle: habitatCity
        ? tr("listing.landmark.steps.zone.subtitleHabitat", {
            defaultValue: "Pick a district (cadastre plan)",
          })
        : tr(
            "listing.landmark.steps.zone.subtitle",
            "Help buyers narrow down the location",
            {},
          ),
      validation: () => selectedZoneId !== undefined,
      render: () => (
        <View style={styles.optionsContainer}>
          {!selectedCityId ? (
            <Text style={styles.errorText}>
              {tr(
                "listing.landmark.steps.zone.selectCityFirst",
                "Please select a city first",
                {},
              )}
            </Text>
          ) : (
            <LocationPickerList
              items={zones}
              selectedId={selectedZoneId}
              search={zoneSearch}
              onSearchChange={setZoneSearch}
              onSelect={(item) => onSelectZone(item)}
              label={locationLabel}
              loading={zonesLoading}
              nested
              listMaxHeight={280}
            />
          )}
        </View>
      ),
    },
    {
      id: "quartier",
      title: tr("listing.landmark.steps.quartier.title", "Which quartier?", {}),
      subtitle: habitatCity
        ? tr("listing.landmark.steps.quartier.subtitleHabitat", {
            defaultValue: "Pick a cadastre sector",
          })
        : tr(
            "listing.landmark.steps.quartier.subtitle",
            "Be more specific about the location",
            {},
          ),
      validation: () => selectedQuartierId !== undefined,
      render: () => (
        <View style={styles.optionsContainer}>
          {!selectedZoneId ? (
            <Text style={styles.errorText}>
              {tr(
                "listing.landmark.steps.quartier.selectZoneFirst",
                "Please select a zone first",
                {},
              )}
            </Text>
          ) : (
            <>
              {selectedQuartierId ? (
                <View style={styles.quartierSelectedBanner}>
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={theme["color-temporary-primary"]}
                  />
                  <Text style={styles.quartierSelectedBannerText} numberOfLines={2}>
                    {district}
                  </Text>
                </View>
              ) : null}
              <LocationPickerList
                items={quartiers}
                selectedId={selectedQuartierId}
                search={quartierSearch}
                onSearchChange={setQuartierSearch}
                onSelect={(item) => onSelectQuartier(item)}
                label={locationLabel}
                loading={quartiersLoading}
                nested
                listMaxHeight={quartierListMaxHeight}
                showHabitatBadge={habitatCity}
              />
            </>
          )}
        </View>
      ),
    },
    {
      id: "plotNumber",
      title: tr(
        "listing.landmark.steps.plotNumber.title",
        "Enter your plot number",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.plotNumber.subtitle",
        "Use the exact number written on your documents",
        {},
      ),
      validation: () => plotNumber.trim().length > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={plotNumber}
            onChangeText={setPlotNumber}
            placeholder={tr(
              "listing.landmark.steps.plotNumber.placeholder",
              "e.g., 15",
              {},
            )}
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.plotNumber.hint",
              "Enter the exact plot number from your title deed. We match it precisely in the cadastre for your sector.",
              {},
            )}
          </Text>
        </View>
      ),
    },
    {
      id: "plotVerify",
      title: tr(
        "listing.landmark.steps.plotVerify.title",
        "Is this your plot?",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.plotVerify.subtitle",
        "We’ll look it up in our cadastre data",
        {},
      ),
      validation: () => plotConfirmed,
      render: () => (
        <View style={styles.plotVerifyContainer}>
          <View style={styles.plotVerifyMetaCard}>
            <View style={styles.plotVerifyMetaRow}>
              <Text style={styles.plotVerifyMetaLabel}>
                {tr("listing.landmark.steps.plotVerify.city", "City", {})}
              </Text>
              <Text style={styles.plotVerifyMetaValue}>
                {region || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.plotVerifyMetaRow}>
              <Text style={styles.plotVerifyMetaLabel}>
                {tr("listing.landmark.steps.plotVerify.zone", "Zone", {})}
              </Text>
              <Text style={styles.plotVerifyMetaValue}>
                {zoning || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.plotVerifyMetaRow}>
              <Text style={styles.plotVerifyMetaLabel}>
                {tr("listing.landmark.steps.plotVerify.quartier", "Quartier", {})}
              </Text>
              <Text style={styles.plotVerifyMetaValue}>
                {district || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
            <View style={styles.plotVerifyMetaRow}>
              <Text style={styles.plotVerifyMetaLabel}>
                {tr("listing.landmark.steps.plotNumber.title", "Plot number", {})}
              </Text>
              <Text style={styles.plotVerifyMetaValue}>
                {plotNumber.trim() || tr("listing.common.notSet", "Not set", {})}
              </Text>
            </View>
          </View>

          {plotVerifyStatus === "checking" || plotVerifyStatus === "idle" ? (
            <View style={styles.plotVerifyLoading}>
              <ActivityIndicator size="large" color="#D16024" />
              <Text style={styles.plotVerifyLoadingText}>
                {tr(
                  "listing.landmark.steps.plotVerify.checking",
                  "Checking…",
                  {},
                )}
              </Text>
            </View>
          ) : null}

          {plotVerifyStatus === "error" ? (
            <View style={styles.plotVerifyResultCard}>
              <Text style={styles.plotVerifyErrorText}>
                {plotVerifyError || tr("listing.common.notSet", "Not set", {})}
              </Text>
              <TouchableOpacity
                style={[styles.nextButton, { marginTop: 14 }]}
                onPress={() => {
                  setPlotVerifyStatus("idle");
                  plotVerifyLastQueryRef.current = "";
                  setCurrentStep(currentStep - 1);
                }}
              >
                <Text style={styles.nextButtonText}>
                  {tr(
                    "listing.landmark.steps.plotVerify.editPlot",
                    "Edit plot details",
                    {},
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {plotVerifyStatus === "not_found" ? (
            <View style={styles.plotConfirmCard}>
              <MaterialIcons name="info-outline" size={22} color="#D16024" />
              <Text style={styles.plotConfirmTitle}>
                {tr(
                  "listing.landmark.steps.plotVerify.sureInfoTitle",
                  "Are you sure your information below is correct?",
                  {},
                )}
              </Text>
              <Text style={styles.plotVerifySubErrorText}>
                {tr(
                  "listing.landmark.steps.plotVerify.notFound",
                  "We couldn’t find this plot in our cadastre for the selected sector.",
                  {},
                )}
              </Text>
              {!!plotVerifyError && (
                <Text style={styles.plotVerifySubErrorText}>{plotVerifyError}</Text>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.nextButton, { flex: 1 }]}
                  onPress={() => {
                    setMatchedPlot(null);
                    setPlotConfirmed(true);
                    const photosIdx = STEPS.findIndex((s) => s.id === "photos");
                    setCurrentStep(photosIdx >= 0 ? photosIdx : currentStep + 1);
                  }}
                >
                  <Text style={styles.nextButtonText}>
                    {tr(
                      "listing.landmark.steps.plotVerify.yesSureProceed",
                      "Yes, proceed",
                      {},
                    )}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1 }]}
                  onPress={() => {
                    setPlotConfirmed(false);
                    setPlotVerifyStatus("idle");
                    plotVerifyLastQueryRef.current = "";
                    setCurrentStep(currentStep - 1);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {tr(
                      "listing.landmark.steps.plotVerify.noEdit",
                      "No, edit",
                      {},
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 10, alignSelf: "center" }]}
                onPress={() => {
                  setPlotConfirmed(false);
                  setPlotVerifyStatus("idle");
                  plotVerifyLastQueryRef.current = "";
                  setCurrentStep(currentStep - 2);
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: "#717171" }]}>
                  {tr(
                    "listing.landmark.steps.plotVerify.editSector",
                    "Change sector",
                    {},
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {plotVerifyStatus === "matched" && matchedPlot ? (
            <View style={styles.plotConfirmCard}>
              <Text style={styles.plotConfirmTitle}>
                {tr("listing.landmark.steps.plotVerify.confirmQuestion", "Is this your plot?", {})}
              </Text>

              <View style={styles.plotConfirmPlotRow}>
                <Text style={styles.plotConfirmNumber}>
                  {matchedPlot.plot_number}
                </Text>
              </View>
              <Text style={styles.plotConfirmMeta}>
                {(matchedPlot.plan?.name_ar || matchedPlot.plan?.name || "—") +
                  " • " +
                  (matchedPlot.sector?.name_ar ||
                    matchedPlot.sector?.name ||
                    "—")}
              </Text>
              <Text style={styles.plotConfirmArea}>
                {matchedPlot.area_m2 != null
                  ? `${matchedPlot.area_m2} m²`
                  : tr("listing.common.notSet", "Not set", {})}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.nextButton, { flex: 1 }]}
                  onPress={() => {
                    setPlotConfirmed(true);
                    setPlotVerifyStatus("matched");
                    const photosIdx = STEPS.findIndex((s) => s.id === "photos");
                    setCurrentStep(photosIdx >= 0 ? photosIdx : currentStep + 1);
                  }}
                >
                  <Text style={styles.nextButtonText}>
                    {tr(
                      "listing.landmark.steps.plotVerify.yesProceed",
                      "Yes, proceed",
                      {},
                    )}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1 }]}
                  onPress={() => {
                    setPlotConfirmed(false);
                    setPlotVerifyStatus("idle");
                    plotVerifyLastQueryRef.current = "";
                    setMatchedPlot(null);
                    setPlotVerifyError("");
                    setCurrentStep(currentStep - 1); // plotNumber
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {tr(
                      "listing.landmark.steps.plotVerify.noEdit",
                      "No, edit",
                      {},
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      ),
    },
    {
      id: "papers",
      title: tr("listing.landmark.steps.papers.title", "Property papers", {}),
      subtitle: tr(
        "listing.landmark.steps.papers.subtitleOptional",
        "Optional — upload papers to appear more credible and rank higher in search",
        {},
      ),
      validation: () => true,
      render: () => (
        <View style={styles.optionsContainer}>
          <View style={styles.papersWhyCard}>
            <MaterialIcons name="verified" size={18} color="#00A699" />
            <Text style={styles.papersWhyText}>
              {tr(
                "listing.landmark.steps.papers.why",
                "Upload any papers that concern this property. This helps us show your listing more often and leads to a verified badge after the verification process ends.",
                {},
              )}
            </Text>
          </View>

          {renderPaperTypeChips()}
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.papers.hint",
              "Example: Titre foncier, Quitane, Lettre.",
              {},
            )}
          </Text>
          <Text style={styles.inputHint}>
            {tr(
              "listing.landmark.steps.papers.cropHint",
              "You can crop each document after selecting it. Tap the crop icon to adjust.",
              {},
            )}
          </Text>

          <View style={{ marginTop: 14 }}>
            {paperUploads.length === 0 ? (
              <TouchableOpacity
                style={styles.paperUploadLarge}
                onPress={() => pickPaperUpload()}
                disabled={isUploadingPapers}
              >
                {isUploadingPapers ? (
                  <ActivityIndicator size="large" color="#D16024" />
                ) : (
                  <MaterialIcons
                    name="document-scanner"
                    size={54}
                    color="#B0B0B0"
                  />
                )}
                <Text style={styles.paperUploadText}>
                  {isUploadingPapers
                    ? tr(
                        "listing.landmark.steps.papers.uploading",
                        "Uploading…",
                        {},
                      )
                    : tr(
                        "listing.landmark.steps.papers.addPapers",
                        "Upload papers",
                        {},
                      )}
                </Text>
                <Text style={styles.paperUploadHint}>
                  {tr(
                    "listing.landmark.steps.papers.tapToUpload",
                    "Tap to select from your device",
                    {},
                  )}
                </Text>
              </TouchableOpacity>
            ) : (
              renderPaperUploadsGrid()
            )}
          </View>

          <TouchableOpacity
            style={styles.papersSkipBtn}
            onPress={() => {
              const photosIdx = STEPS.findIndex((s) => s.id === "photos");
              if (photosIdx >= 0) setCurrentStep(photosIdx);
            }}
          >
            <Text style={styles.papersSkipText}>
              {tr(
                "listing.landmark.steps.papers.skip",
                "Skip for now — continue without papers",
                {},
              )}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: "photos",
      title: tr(
        "listing.landmark.steps.photos.title",
        "Add photos or video",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.photos.subtitle",
        "At least one photo or one video is required",
        {},
      ),
      validation: () => landmarkImages.length > 0 || !!landmarkVideo,
      render: () => (
        <View style={styles.photosContainer}>
          {landmarkImages.length === 0 && !landmarkVideo ? (
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={styles.photoUploadLarge}
                onPress={pickLandmarkImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="large" color="#D16024" />
                ) : (
                  <MaterialIcons
                    name="add-photo-alternate"
                    size={64}
                    color="#B0B0B0"
                  />
                )}
                <Text style={styles.photoUploadText}>
                  {isUploadingImage
                    ? tr(
                        "listing.landmark.steps.photos.uploading",
                        "Uploading…",
                        {},
                      )
                    : tr(
                        "listing.landmark.steps.photos.addPhotos",
                        "Add photos",
                        {},
                      )}
                </Text>
                <Text style={styles.photoUploadHint}>
                  {isUploadingImage
                    ? tr(
                        "listing.landmark.steps.photos.pleaseWait",
                        "Please wait",
                        {},
                      )
                    : tr(
                        "listing.landmark.steps.photos.tapToUpload",
                        "Tap to upload from your device",
                        {},
                      )}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoUploadLarge, { borderStyle: "dashed" }]}
                onPress={pickLandmarkVideo}
              >
                <MaterialIcons name="videocam" size={64} color="#B0B0B0" />
                <Text style={styles.photoUploadText}>
                  {tr(
                    "listing.landmark.steps.photos.orVideo",
                    "Or add a video",
                    {},
                  )}
                </Text>
                <Text style={styles.photoUploadHint}>
                  {tr(
                    "listing.landmark.steps.photos.mp4Hint",
                    "mp4 preferred",
                    {},
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.photoGrid}>
                {landmarkImages.map((image, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: image }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => removeLandmarkImage(index)}
                    >
                      <MaterialIcons name="close" size={18} color="#FFF" />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>
                          {tr(
                            "listing.landmark.steps.photos.cover",
                            "Cover",
                            {},
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {landmarkImages.length < 10 && (
                  <TouchableOpacity
                    style={styles.photoAddMore}
                    onPress={pickLandmarkImage}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator size="small" color="#717171" />
                    ) : (
                      <MaterialIcons name="add" size={32} color="#717171" />
                    )}
                  </TouchableOpacity>
                )}
                {!landmarkVideo && (
                  <TouchableOpacity
                    style={styles.photoAddMore}
                    onPress={pickLandmarkVideo}
                  >
                    <MaterialIcons name="videocam" size={32} color="#717171" />
                  </TouchableOpacity>
                )}
              </View>
              {landmarkVideo && (
                <View style={[styles.photoItem, { marginTop: 12 }]}>
                  <View
                    style={[
                      styles.photoImage,
                      {
                        backgroundColor: "#111",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <MaterialIcons name="videocam" size={48} color="#FFF" />
                  </View>
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={removeLandmarkVideo}
                  >
                    <MaterialIcons name="close" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>
                      {tr("listing.landmark.steps.photos.video", "Video", {})}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.photoTips}>
                <MaterialIcons
                  name="lightbulb-outline"
                  size={20}
                  color="#D16024"
                />
                <Text style={styles.photoTipsText}>
                  {tr(
                    "listing.landmark.steps.photos.tips",
                    "Add at least 5 photos showing different angles for best results",
                    {},
                  )}
                </Text>
              </View>
            </>
          )}
        </View>
      ),
    },
    {
      id: "verifyDetails",
      title: tr(
        "listing.landmark.steps.verifyDetails.title",
        "Verify details",
        {},
      ),
      subtitle: tr(
        "listing.landmark.steps.verifyDetails.subtitle",
        "Final check before publishing",
        {},
      ),
      validation: () =>
        plotConfirmed &&
        (landmarkImages.length > 0 || !!landmarkVideo),
      render: () => (
        <View style={styles.verifyDetailsShell}>
          <View style={styles.verifyDetailsCard}>
            <View style={styles.verifyHero}>
              {landmarkImages[0] ? (
                <Image
                  source={{ uri: landmarkImages[0] }}
                  style={styles.verifyHeroImage}
                />
              ) : (
                <View style={styles.verifyHeroImagePlaceholder}>
                  <MaterialIcons
                    name="image"
                    size={36}
                    color="#B0B0B0"
                  />
                </View>
              )}
              <View style={styles.verifyHeroOverlay}>
                {plotNumber.trim().length > 0 ? (
                  <View style={styles.verifyHeroPlotChip}>
                    <MaterialIcons
                      name={matchedPlot ? "verified" : "tag"}
                      size={14}
                      color={theme["color-temporary-primary"]}
                    />
                    <Text style={styles.verifyHeroPlotChipText}>
                      {tr(
                        "listing.landmark.steps.review.plotChip",
                        "Plot {{number}}",
                        { number: plotNumber.trim() },
                      )}
                    </Text>
                  </View>
                ) : null}
                {matchedPlot &&
                plotConfirmed &&
                paperUploads.length > 0 &&
                (landmarkImages.length > 0 || !!landmarkVideo) ? (
                  <View style={[styles.verifiedBadge, { marginTop: 8 }]}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#00A699"
                    />
                    <Text style={styles.verifiedBadgeText}>
                      {tr("listing.landmark.verify.verified", "Verified")}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.verifyDetailsInner}>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr("listing.landmark.steps.review.titleLabel", "Title", {})}
              </Text>
              {renderReviewEditToggle("title")}
            </View>
            {reviewEditing.title ? (
              <TextInput
                style={styles.reviewInlineInput}
                value={title}
                onChangeText={setTitle}
                placeholder={tr(
                  "listing.landmark.steps.title.placeholder",
                  "Land for sale in…",
                  {},
                )}
                placeholderTextColor="#B0B0B0"
              />
            ) : (
              <Text style={styles.reviewValue}>
                {title || tr("listing.common.notSet", "Not set", {})}
              </Text>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr("listing.landmark.steps.review.areaLabel", "Area", {})}
              </Text>
              {renderReviewEditToggle("area")}
            </View>
            {reviewEditing.area ? (
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.reviewInlineInput, { flex: 1 }]}
                  value={area}
                  onChangeText={setArea}
                  keyboardType="numeric"
                  placeholder="1000"
                  placeholderTextColor="#B0B0B0"
                />
                <Text style={styles.unitLabel}>m²</Text>
              </View>
            ) : (
              <Text style={styles.reviewValue}>
                {area ? `${area} m²` : tr("listing.common.notSet", "Not set", {})}
              </Text>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr("listing.landmark.steps.review.priceLabel", "Price", {})}
              </Text>
              {renderReviewEditToggle("price")}
            </View>
            {reviewEditing.price ? (
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.reviewInlineInput, { flex: 1 }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="5000000"
                  placeholderTextColor="#B0B0B0"
                />
                <Text style={styles.unitLabel}>MRU</Text>
              </View>
            ) : (
              <Text style={styles.reviewValue}>
                {price
                  ? `${price} MRU`
                  : tr("listing.common.notSet", "Not set", {})}
              </Text>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.landmark.steps.review.locationLabel",
                  "Location",
                  {},
                )}
              </Text>
              {renderReviewEditToggle("location")}
            </View>
            {reviewEditing.location ? (
              <View style={styles.reviewInlineLocation}>
                <Text style={styles.reviewInlineLocationLabel}>
                  {tr("listing.landmark.steps.city.title", "City", {})}
                </Text>
                <LocationPickerList
                  items={cities}
                  selectedId={selectedCityId}
                  search={citySearch}
                  onSearchChange={setCitySearch}
                  onSelect={(item) => onSelectCity(item)}
                  label={locationLabel}
                  loading={citiesLoading}
                  nested
                  listMaxHeight={160}
                />
                {selectedCityId ? (
                  <>
                    <Text style={styles.reviewInlineLocationLabel}>
                      {tr("listing.landmark.steps.map.zone", "Zone", {})}
                    </Text>
                    <LocationPickerList
                      items={zones}
                      selectedId={selectedZoneId}
                      search={zoneSearch}
                      onSearchChange={setZoneSearch}
                      onSelect={(item) => onSelectZone(item)}
                      label={locationLabel}
                      loading={zonesLoading}
                      nested
                      listMaxHeight={160}
                    />
                  </>
                ) : null}
                {selectedZoneId ? (
                  <>
                    <Text style={styles.reviewInlineLocationLabel}>
                      {tr(
                        "listing.landmark.steps.quartier.title",
                        "Quartier",
                        {},
                      )}
                    </Text>
                    <LocationPickerList
                      items={quartiers}
                      selectedId={selectedQuartierId}
                      search={quartierSearch}
                      onSearchChange={setQuartierSearch}
                      onSelect={(item) => onSelectQuartier(item)}
                      label={locationLabel}
                      loading={quartiersLoading}
                      nested
                      listMaxHeight={160}
                      showHabitatBadge={habitatCity}
                    />
                  </>
                ) : null}
              </View>
            ) : (
              <Text style={styles.reviewValue}>
                {region || tr("listing.common.notSet", "Not set", {})}
                {zoning && ` - ${zoning}`}
                {district && ` - ${district}`}
              </Text>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.landmark.steps.review.plotLabel",
                  "Plot number",
                  {},
                )}
              </Text>
              {renderReviewEditToggle("plot")}
            </View>
            {reviewEditing.plot ? (
              <TextInput
                style={styles.reviewInlineInput}
                value={plotNumber}
                onChangeText={(v) => {
                  setPlotNumber(v);
                  setPlotConfirmed(false);
                  setMatchedPlot(null);
                  setPlotVerifyStatus("idle");
                  plotVerifyLastQueryRef.current = "";
                }}
                placeholder={tr(
                  "listing.landmark.steps.plotNumber.placeholder",
                  "e.g. 1234",
                  {},
                )}
                placeholderTextColor="#B0B0B0"
                keyboardType="default"
              />
            ) : plotNumber.trim().length > 0 ? (
              <>
                <View style={styles.verifyPlotChip}>
                  <MaterialIcons
                    name={matchedPlot ? "verified" : "tag"}
                    size={16}
                    color={theme["color-temporary-primary"]}
                  />
                  <Text style={styles.verifyPlotChipText}>
                    {tr(
                      "listing.landmark.steps.review.plotChip",
                      "Plot {{number}}",
                      { number: plotNumber.trim() },
                    )}
                  </Text>
                </View>
                <Text style={styles.verifyPlotStatus}>
                  {matchedPlot
                    ? tr(
                        "listing.landmark.steps.review.plotCadastreMatched",
                        "Matched in cadastre",
                        {},
                      )
                    : plotConfirmed
                      ? tr(
                          "listing.landmark.steps.review.plotConfirmedNoMatch",
                          "Confirmed (not found in cadastre)",
                          {},
                        )
                      : tr(
                          "listing.landmark.steps.review.plotNotConfirmed",
                          "Not confirmed yet",
                          {},
                        )}
                </Text>
              </>
            ) : (
              <Text style={styles.reviewValue}>
                {tr("listing.common.notSet", "Not set", {})}
              </Text>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.landmark.steps.review.papersLabel",
                  "Property papers",
                  {},
                )}
              </Text>
              {renderReviewEditToggle("papers")}
            </View>
            {reviewEditing.papers ? (
              <View style={{ gap: 10 }}>
                {renderPaperTypeChips()}
                {renderPaperUploadsGrid()}
              </View>
            ) : (
              <>
                {[...paperTypes, customPaperType.trim()].filter(Boolean).length >
                0 ? (
                  <Text style={styles.verifyMediaMeta}>
                    {[...paperTypes, customPaperType.trim()]
                      .filter(Boolean)
                      .map((paper) => getPaperTypeLabel(paper))
                      .join(" • ")}
                  </Text>
                ) : (
                  <Text style={styles.reviewValue}>
                    {tr("listing.common.notSet", "Not set", {})}
                  </Text>
                )}
                {paperUploads.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.verifyMediaScroll}
                    contentContainerStyle={styles.verifyMediaScrollContent}
                  >
                    {paperUploads.map((url, idx) => (
                      <View
                        key={`paper-${url}-${idx}`}
                        style={styles.verifyMediaItem}
                      >
                        <Image
                          source={{ uri: url }}
                          style={styles.verifyMediaThumb}
                        />
                        <View style={styles.verifyMediaBadge}>
                          <MaterialIcons
                            name="description"
                            size={12}
                            color="#FFF"
                          />
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.verifyMediaEmpty}>
                    {tr(
                      "listing.landmark.steps.review.noPapersUploaded",
                      "No documents uploaded",
                      {},
                    )}
                  </Text>
                )}
              </>
            )}
          </View>
          <View style={styles.reviewSection}>
            <View style={styles.reviewLabelRow}>
              <Text style={styles.reviewLabel}>
                {tr(
                  "listing.landmark.steps.review.mediaLabel",
                  "Photos & video",
                  {},
                )}
              </Text>
              {renderReviewEditToggle("media")}
            </View>
            {reviewEditing.media ? (
              <View style={{ gap: 10 }}>
                <View style={styles.reviewMediaEditGrid}>
                  {landmarkImages.map((image, index) => (
                    <View key={`edit-photo-${index}`} style={styles.paperItem}>
                      <Image source={{ uri: image }} style={styles.paperThumb} />
                      <TouchableOpacity
                        style={styles.paperRemove}
                        onPress={() => removeLandmarkImage(index)}
                      >
                        <MaterialIcons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                      {index === 0 ? (
                        <View style={styles.verifyCoverBadge}>
                          <Text style={styles.verifyCoverBadgeText}>
                            {tr(
                              "listing.landmark.steps.photos.cover",
                              "Cover",
                              {},
                            )}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                  {landmarkVideo ? (
                    <View style={styles.paperItem}>
                      <View style={styles.verifyVideoThumb}>
                        <MaterialIcons
                          name="play-circle-fill"
                          size={36}
                          color="#FFF"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.paperRemove}
                        onPress={removeLandmarkVideo}
                      >
                        <MaterialIcons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.paperItem, styles.paperItemAdd]}
                    onPress={pickLandmarkImage}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator size="small" color="#717171" />
                    ) : (
                      <MaterialIcons name="add-a-photo" size={28} color="#717171" />
                    )}
                  </TouchableOpacity>
                  {!landmarkVideo ? (
                    <TouchableOpacity
                      style={[styles.paperItem, styles.paperItemAdd]}
                      onPress={pickLandmarkVideo}
                    >
                      <MaterialIcons name="videocam" size={28} color="#717171" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.verifyMediaMeta}>
                  {[
                    landmarkImages.length > 0
                      ? tr(
                          "listing.landmark.steps.review.photosValue",
                          "{{count}} photo(s)",
                          { count: landmarkImages.length },
                        )
                      : null,
                    landmarkVideo
                      ? tr("listing.landmark.steps.photos.video", "Video", {})
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") ||
                    tr("listing.common.notSet", "Not set", {})}
                </Text>
                {landmarkImages.length > 0 || landmarkVideo ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.verifyMediaScroll}
                    contentContainerStyle={styles.verifyMediaScrollContent}
                  >
                    {landmarkImages.map((image, index) => (
                      <View
                        key={`photo-${image}-${index}`}
                        style={styles.verifyMediaItem}
                      >
                        <Image
                          source={{ uri: image }}
                          style={styles.verifyMediaThumb}
                        />
                        {index === 0 ? (
                          <View style={styles.verifyCoverBadge}>
                            <Text style={styles.verifyCoverBadgeText}>
                              {tr(
                                "listing.landmark.steps.photos.cover",
                                "Cover",
                                {},
                              )}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))}
                    {landmarkVideo ? (
                      <View style={styles.verifyMediaItem}>
                        <View style={styles.verifyVideoThumb}>
                          <MaterialIcons
                            name="play-circle-fill"
                            size={36}
                            color="#FFF"
                          />
                        </View>
                        <View style={styles.verifyCoverBadge}>
                          <Text style={styles.verifyCoverBadgeText}>
                            {tr(
                              "listing.landmark.steps.photos.video",
                              "Video",
                              {},
                            )}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </ScrollView>
                ) : (
                  <Text style={styles.verifyMediaEmpty}>
                    {tr(
                      "listing.landmark.steps.review.noMediaUploaded",
                      "No photos or video uploaded",
                      {},
                    )}
                  </Text>
                )}
              </>
            )}
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>
              {tr(
                "listing.landmark.steps.review.privateNoteLabel",
                "Private note (only you & your org)",
                {},
              )}
            </Text>
            <Text style={styles.reviewHint}>
              {tr(
                "listing.landmark.steps.review.privateNoteHint",
                "Not shown to guests. Optional reminder for this listing.",
                {},
              )}
            </Text>
            <TextInput
              style={styles.privateNoteInput}
              placeholder={tr(
                "listing.landmark.steps.review.privateNotePlaceholder",
                "e.g. internal reference, buyer context…",
                {},
              )}
              placeholderTextColor="#999"
              multiline
              maxLength={2000}
              value={hostPrivateNote}
              onChangeText={setHostPrivateNote}
            />
          </View>
          {highlightLocation && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>
                {tr("listing.landmark.steps.review.mapLabel", "Map", {})}
              </Text>
              <Text style={styles.reviewValue}>
                {points.length === 4
                  ? tr(
                      "listing.landmark.steps.review.mapDone",
                      "Location marked on map",
                      {},
                    )
                  : tr(
                      "listing.landmark.steps.review.mapNotMarked",
                      "Not marked",
                      {},
                    )}
              </Text>
            </View>
          )}
          <View style={styles.reviewNote}>
            <MaterialIcons name="info-outline" size={20} color="#D16024" />
            <Text style={styles.reviewNoteText}>
              {tr(
                "listing.landmark.steps.review.editAnytime",
                "You can edit your listing anytime after publishing",
                {},
              )}
            </Text>
          </View>

            </View>
          </View>
        </View>
      ),
    },
  ];

  useEffect(() => {
    if (STEPS[currentStep]?.id === "quartier") {
      setIsQuartierDropdownOpen(true);
    }
  }, [currentStep]);

  // Plot verification side-effect: runs when the user enters the “plotVerify” step.
  useEffect(() => {
    const stepId = STEPS[currentStep]?.id;
    if (stepId !== "plotVerify") return;
    if (plotConfirmed) return;

    const sectorId = selectedQuartierId;
    const pn = plotNumber.trim();
    if (!sectorId || pn.length === 0) {
      setPlotVerifyStatus("idle");
      return;
    }

    const signature = `${sectorId}|${pn.toLowerCase()}`;
    if (signature === plotVerifyLastQueryRef.current && plotVerifyStatus !== "idle") {
      return;
    }
    plotVerifyLastQueryRef.current = signature;

    let cancelled = false;
    setPlotVerifyStatus("checking");
    setPlotVerifyError("");
    setMatchedPlot(null);

    (async () => {
      try {
        const { plot, meta } = await habitatApi.lookupPlotForLandListing(
          sectorId,
          pn,
        );

        if (cancelled) return;

        if (plot) {
          setMatchedPlot(plot);
          setPlotVerifyStatus("matched");
          return;
        }

        setPlotVerifyStatus("not_found");
        const reason =
          typeof meta?.reason === "string" ? meta.reason : "";
        if (reason.includes("no cadastre zone") || reason.includes("no cadastre sector")) {
          setPlotVerifyError(
            tr(
              "listing.landmark.steps.plotVerify.sectorNotInCadastre",
              "This sector is not linked to cadastre data yet. Try another sector or contact support.",
              {},
            ),
          );
        } else if (reason) {
          setPlotVerifyError(reason);
        } else {
          setPlotVerifyError(
            tr(
              "listing.landmark.steps.plotVerify.notFoundDetail",
              "No plot #{{plot}} found in the cadastre for this sector.",
              { plot: pn },
            ),
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setPlotVerifyStatus("error");
        setPlotVerifyError(
          String(
            e?.response?.data?.error ||
              e?.message ||
              "Plot verification failed",
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, plotConfirmed, selectedQuartierId, plotNumber]);

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerStepTitle} numberOfLines={1}>
            {currentStepData.title}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepContent}>
          {currentStepData.subtitle && (
            <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          )}
          <View style={styles.stepBody}>{currentStepData.render()}</View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerProgressBar}>
          <View
            style={[styles.footerProgressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.footerSummaryLine} numberOfLines={1}>
          {tr("listing.common.stepOf", "Step {{current}}/{{total}}", {
            current: currentStep + 1,
            total: STEPS.length,
          })}
          {" • "}
          {tr("listing.common.stepsLeft", "{{count}} left", {
            count: Math.max(0, STEPS.length - currentStep - 1),
          })}
          {currentStep < STEPS.length - 1
            ? ` • ${tr("listing.common.nextStepPrefix", "Next:", {})} ${STEPS[currentStep + 1]?.title ?? ""}`
            : ""}
        </Text>
        <View style={styles.footerContent}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <MaterialIcons name="arrow-back" size={24} color="#222" />
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
                (isSubmitting || !canProceedToNextStep()) &&
                  styles.nextButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !canProceedToNextStep()}
            >
              {isSubmitting ? (
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
                !canProceedToNextStep() && styles.nextButtonDisabled,
              ]}
              onPress={nextStep}
              disabled={!canProceedToNextStep()}
            >
              <Text style={styles.nextButtonText}>
                {tr("listing.common.next", "Next", {})}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <AddWithAiFlow
        visible={aiFlowVisible}
        kind="land"
        onClose={() => setAiFlowVisible(false)}
        onApply={(draft: ListingAiDraft) => {
          applyLandListingDraft(draft, {
            setTitle,
            setDescription,
            setArea,
            setPrice,
            setLandType,
            setRegion,
            setDistrict,
            setSelectedCityId,
            setSelectedZoneId,
            setSelectedQuartierId,
            setLandmarkImages,
            setPlotNumber,
          });
          if (draft.paper_types?.length) {
            setPaperTypes(draft.paper_types);
          }
          setAiFlowVisible(false);
          const cityId = draft.city_id ?? selectedCityId;
          const zoneId = draft.zone_id ?? selectedZoneId;
          const quartierId = draft.quartier_id ?? selectedQuartierId;
          const appliedPlot = (draft.plot_number ?? "").trim();
          const targetStepId = !cityId
            ? "city"
            : zoneId === undefined
              ? "zone"
              : quartierId === undefined
                ? "quartier"
                : appliedPlot.length === 0
                  ? "plotNumber"
                  : "plotVerify";
          const targetIdx = STEPS.findIndex((s) => s.id === targetStepId);
          if (targetIdx >= 0) setCurrentStep(targetIdx);
          Alert.alert(
            tr("listingAi.doneTitle", "Listing ready", {}),
            tr(
              "listingAi.doneBody",
              "Review the details and publish when you're ready.",
              {},
            ),
          );
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
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerStepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  stepSubtitle: {
    fontSize: 18,
    color: "#717171",
    marginBottom: 16,
    lineHeight: 26,
  },
  stepBody: {
    flex: 1,
  },

  // Intro Screen
  introContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  introIcon: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
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
  introStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  introStepNumberText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  introStepText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
  },

  // Focused Input
  focusedInputContainer: {
    width: "100%",
  },
  focusedInput: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  focusedTextArea: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 140,
    textAlignVertical: "top",
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  focusedInputWithUnit: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    flex: 1,
  },
  unitLabel: {
    fontSize: 24,
    fontWeight: "400",
    color: "#717171",
    marginLeft: 12,
    marginBottom: 2,
  },
  inputHint: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
  },

  // Options (Cards)
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
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    flex: 1,
  },
  optionTextActive: {
    fontWeight: "600",
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D16024",
    justifyContent: "center",
    alignItems: "center",
  },

  // List Options (Cities, Zones, etc.)
  cityList: {
    maxHeight: 400,
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
    marginBottom: 12,
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

  // Photos
  photosContainer: {
    width: "100%",
  },
  photoUploadLarge: {
    height: 300,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  photoUploadText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#222",
    marginTop: 16,
  },
  photoUploadHint: {
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
    width: (width - 60) / 2,
    height: (width - 60) / 2,
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
  coverBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  photoAddMore: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  photoTips: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4ED",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 12,
  },
  photoTipsText: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // Map
  mapStepContainer: {
    width: "100%",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  toggleOption: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  toggleOptionActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
    marginTop: 12,
  },
  toggleOptionTextActive: {
    fontWeight: "600",
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
  cornerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D16024",
    borderWidth: 3,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  cornerMarkerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  mapInstructions: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 8,
  },
  mapInstructionsText: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D16024",
  },

  // Review
  reviewContainer: {
    width: "100%",
    gap: 20,
  },
  reviewSection: {
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF4ED",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginTop: 8,
  },
  reviewNoteText: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // Verify details (final card)
  verifyDetailsShell: {
    width: "100%",
    paddingHorizontal: 0,
  },
  verifyDetailsCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingBottom: 14,
    overflow: "hidden",
  },
  verifyHero: {
    flexDirection: "row",
    width: "100%",
    height: 190,
    backgroundColor: "#111",
    position: "relative",
  },
  verifyHeroImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  verifyHeroImagePlaceholder: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyHeroOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    alignItems: "flex-start",
  },
  verifiedBadge: {
    backgroundColor: "#EFFFF7",
    borderColor: "#00A699",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00A699",
  },
  verifyDetailsInner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  verifyHeroPlotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 241, 234, 0.95)",
    borderColor: "#F4C9B4",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verifyHeroPlotChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme["color-temporary-primary"],
  },
  verifyPlotChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF1EA",
    borderColor: "#F4C9B4",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 6,
  },
  verifyPlotChipText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme["color-temporary-primary"],
  },
  verifyPlotStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: "#717171",
  },
  verifyMediaMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    lineHeight: 18,
  },
  verifyMediaScroll: {
    marginHorizontal: -4,
  },
  verifyMediaScrollContent: {
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  verifyMediaItem: {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  verifyMediaThumb: {
    width: "100%",
    height: "100%",
  },
  verifyMediaBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyVideoThumb: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyCoverBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifyCoverBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  verifyMediaEmpty: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  reviewLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  reviewEditPencil: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewEditPencilActive: {
    borderColor: "#00A699",
    backgroundColor: "#EFFFF7",
  },
  reviewInlineInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    backgroundColor: "#FAFAFA",
  },
  reviewInlineLocation: {
    gap: 8,
    marginTop: 4,
  },
  reviewInlineLocationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#717171",
    marginTop: 6,
  },
  reviewInlineScroll: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
  },
  reviewMediaEditGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  verifyPublishButton: {
    marginTop: 14,
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyPublishButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  verifyPublishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  // Plot verification step
  plotVerifyContainer: {
    width: "100%",
    gap: 12,
  },
  plotVerifyMetaCard: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  plotVerifyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  plotVerifyMetaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#717171",
  },
  plotVerifyMetaValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
  },
  plotVerifyLoading: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
  },
  plotVerifyLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
  },
  plotVerifyResultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    gap: 10,
  },
  plotVerifyErrorText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C13515",
    textAlign: "left",
    marginTop: 4,
  },
  plotVerifySubErrorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#717171",
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#717171",
  },
  plotConfirmCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    gap: 8,
  },
  plotConfirmTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  plotConfirmPlotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plotConfirmNumber: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
  },
  plotConfirmMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  plotConfirmArea: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  // Papers upload step
  papersWhyCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#FFF4ED",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFE8D5",
    padding: 14,
    marginBottom: 14,
  },
  papersWhyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    lineHeight: 18,
  },
  papersSkipBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 10,
  },
  papersSkipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
    textDecorationLine: "underline",
  },
  paperUploadLarge: {
    height: 170,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    gap: 10,
  },
  paperUploadText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },
  paperUploadHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "#717171",
  },
  paperUploadsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  paperItem: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  paperItemAdd: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  paperThumb: {
    width: "100%",
    height: "100%",
  },
  paperCrop: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  paperRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  // Footer
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingVertical: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  footerProgressBar: {
    height: 3,
    backgroundColor: "#EBEBEB",
    marginHorizontal: -24,
    marginBottom: 10,
  },
  footerProgressFill: {
    height: "100%",
    backgroundColor: "#222",
  },
  footerSummaryLine: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 12,
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
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  accordionCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownHeader: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  dropdownHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "65%",
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: "#374151",
    maxWidth: 160,
  },
  dropdownHeaderIcon: {
    color: "#6B7280",
    fontSize: 12,
  },
  locationSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
    padding: 0,
  },
  locationSearchEmpty: {
    padding: 16,
    textAlign: "center",
    color: "#717171",
    fontSize: 14,
  },
  cadastreLinkedHint: {
    marginTop: 2,
    fontSize: 11,
    color: "#00A699",
    fontWeight: "600",
  },
  dropdownContentWindow: {
    maxHeight: 220,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dropdownContentWindowQuartier: {
    minHeight: 280,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  quartierSelectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFAF7",
  },
  quartierSelectedBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  chipText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },
  chipActive: {
    backgroundColor: "#222",
    borderColor: "#222",
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
});

export { styles as landmarkFormStyles };
