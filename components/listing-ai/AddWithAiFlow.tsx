// import React, { useCallback, useRef, useState } from "react";
// import {
//   Alert,
//   Animated,
//   Image,
//   Modal,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useTranslation } from "react-i18next";
// import {
//   pickMultipleImagesNative,
//   pickVideoNative,
// } from "../../utils/nativePhotoPicker";
// import type { ListingAiDraft, ListingAiKind } from "../../types/listingAi";
// import {
//   pollListingAiJob,
//   recordListingAiPublished,
//   startListingAiJob,
// } from "../../services/listingAiService";
// import {
//   uploadListingAiImages,
//   uploadListingAiVideo,
// } from "../../utils/listingAiMediaUpload";
// import { detectListingOutputLanguage } from "../../utils/detectInputLanguage";
// import { normalizeMediaUrlList } from "../../utils/mediaUri";
// import { ListingAiUploadSheet } from "./ListingAiUploadSheet";
// import { ListingAiGenerateButton } from "./ListingAiGenerateButton";
// import { ListingAiComposeExtras } from "./ListingAiComposeExtras";
// import { ListingAiSuggestionChips } from "./ListingAiSuggestionChips";
// import { ListingAiComposeHero } from "./ListingAiComposeHero";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { ListingAiLocationPickerStep } from "./ListingAiLocationPickerStep";
// import { useListingLocationCatalog } from "../../hooks/useListingLocationCatalog";
// import {
//   describeListingFlowError,
//   logListingFlowDebug,
// } from "../../utils/listingAiFlowError";
// import { parseFormattedNumber } from "./listingAiFormatters";
// import { ListingAiReviewStep } from "./ListingAiReviewStep";
// import { ListingAiPlotNumberStep } from "./ListingAiPlotNumberStep";
// import {
//   ListingAiMediaPrompt,
//   ListingAiMediaThumbs,
// } from "./ListingAiMediaPrompt";
// import { ListingAiMediaSheet } from "./ListingAiMediaSheet";
// import { PublishRingProgress } from "../PublishRingProgress";
// import { useUser } from "../../hooks/useUser";
// import { usePropertySalePublish } from "../../contexts/PropertySalePublishContext";
// import {
//   listingAiDraftToPropertySalePublish,
//   validateListingAiDraftForSalePublish,
// } from "../../utils/listingAiToPropertySale";
// import {
//   listingAiDraftToRentPayload,
//   validateListingAiDraftForRentPublish,
// } from "../../utils/listingAiToRent";
// import { api } from "../../services/api";
// import {
//   useAmenities,
//   usePropertyCategories,
// } from "../../hooks/queries/useCategories";
// import { useQueryClient } from "@tanstack/react-query";
// import { LAI, laiStyles } from "./listingAiTheme";
// import { ListingAiGeneratingOverlay } from "./ListingAiGeneratingOverlay";

// // â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// type Phase = "compose" | "review";

// type StepId =
//   | "basics"
//   | "extras"
//   | "city"
//   | "zone"
//   | "quartier"
//   | "plotNumber"
//   | "story"
//   | "media";

// type Props = {
//   visible: boolean;
//   kind: ListingAiKind;
//   onClose: () => void;
//   onApply?: (draft: ListingAiDraft) => void;
//   onPublished?: (propertyId: number) => void;
// };

// // â”€â”€â”€ Step progress dots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// function StepDots({ total, current }: { total: number; current: number }) {
//   return (
//     <View style={dotStyles.row}>
//       {Array.from({ length: total }).map((_, i) => (
//         <View
//           key={i}
//           style={[
//             dotStyles.dot,
//             i === current && dotStyles.dotActive,
//             i < current && dotStyles.dotDone,
//           ]}
//         />
//       ))}
//     </View>
//   );
// }

// const dotStyles = StyleSheet.create({
//   row: {
//     flexDirection: "row",
//     gap: 5,
//     alignItems: "center",
//   },
//   dot: {
//     width: 5,
//     height: 5,
//     borderRadius: 3,
//     backgroundColor: LAI.borderLight,
//   },
//   dotActive: {
//     width: 18,
//     backgroundColor: LAI.brand,
//     borderRadius: 3,
//   },
//   dotDone: {
//     backgroundColor: LAI.brand,
//     opacity: 0.35,
//   },
// });

// // â”€â”€â”€ Step shell â€” header + scroll + footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// function StepShell({
//   title,
//   subtitle,
//   stepIndex,
//   totalSteps,
//   onBack,
//   onClose,
//   footer,
//   children,
//   scrollable = true,
// }: {
//   title: string;
//   subtitle?: string;
//   stepIndex: number;
//   totalSteps: number;
//   onBack?: () => void;
//   onClose: () => void;
//   footer: React.ReactNode;
//   children: React.ReactNode;
//   scrollable?: boolean;
// }) {
//   const content = <View style={shellStyles.body}>{children}</View>;

//   return (
//     <View style={shellStyles.root}>
//       {/* Top bar */}
//       <View style={shellStyles.topBar}>
//         {onBack ? (
//           <TouchableOpacity
//             onPress={onBack}
//             style={shellStyles.backBtn}
//             hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//             activeOpacity={0.6}
//           >
//             <View style={shellStyles.backChevron} />
//           </TouchableOpacity>
//         ) : (
//           <View style={shellStyles.backPlaceholder} />
//         )}

//         <StepDots total={totalSteps} current={stepIndex} />

//         <TouchableOpacity
//           onPress={onClose}
//           style={shellStyles.closeBtn}
//           hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//           activeOpacity={0.6}
//         >
//           <View style={shellStyles.closeLine1} />
//           <View style={shellStyles.closeLine2} />
//         </TouchableOpacity>
//       </View>

//       {/* Heading */}
//       <View style={shellStyles.heading}>
//         <Text style={shellStyles.title}>{title}</Text>
//         {subtitle ? <Text style={shellStyles.subtitle}>{subtitle}</Text> : null}
//       </View>

//       {/* Body */}
//       {scrollable ? (
//         <KeyboardAwareScrollView
//           style={shellStyles.scroll}
//           contentContainerStyle={shellStyles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           enableOnAndroid
//           enableAutomaticScroll
//           extraScrollHeight={Platform.OS === "ios" ? 32 : 64}
//           showsVerticalScrollIndicator={false}
//         >
//           {content}
//         </KeyboardAwareScrollView>
//       ) : (
//         <View style={shellStyles.scrollContent}>{content}</View>
//       )}

//       {/* Footer */}
//       <View style={shellStyles.footer}>{footer}</View>
//     </View>
//   );
// }

// const shellStyles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: LAI.canvas,
//   },
//   topBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === "ios" ? 56 : 20,
//     paddingBottom: 8,
//   },
//   backBtn: {
//     width: 36,
//     height: 36,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   backChevron: {
//     width: 10,
//     height: 10,
//     borderLeftWidth: 1.5,
//     borderBottomWidth: 1.5,
//     borderColor: LAI.text,
//     transform: [{ rotate: "45deg" }],
//     marginLeft: 4,
//   },
//   backPlaceholder: {
//     width: 36,
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   closeLine1: {
//     position: "absolute",
//     width: 16,
//     height: 1.5,
//     backgroundColor: LAI.text,
//     borderRadius: 1,
//     transform: [{ rotate: "45deg" }],
//   },
//   closeLine2: {
//     position: "absolute",
//     width: 16,
//     height: 1.5,
//     backgroundColor: LAI.text,
//     borderRadius: 1,
//     transform: [{ rotate: "-45deg" }],
//   },
//   heading: {
//     paddingHorizontal: 24,
//     paddingTop: 20,
//     paddingBottom: 8,
//     gap: 6,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: LAI.text,
//     letterSpacing: -0.5,
//     lineHeight: 34,
//   },
//   subtitle: {
//     fontSize: 15,
//     color: LAI.textSecondary,
//     lineHeight: 22,
//   },
//   scroll: { flex: 1 },
//   scrollContent: {
//     paddingHorizontal: 24,
//     paddingTop: 16,
//     paddingBottom: 32,
//   },
//   body: {
//     gap: 0,
//   },
//   footer: {
//     paddingHorizontal: 24,
//     paddingTop: 12,
//     paddingBottom: Platform.OS === "ios" ? 40 : 24,
//     gap: 10,
//     borderTopWidth: StyleSheet.hairlineWidth,
//     borderTopColor: LAI.borderLight,
//     backgroundColor: LAI.canvas,
//   },
// });

// // â”€â”€â”€ Primary CTA button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// function PrimaryBtn({
//   label,
//   onPress,
//   disabled,
// }: {
//   label: string;
//   onPress: () => void;
//   disabled?: boolean;
// }) {
//   return (
//     <TouchableOpacity
//       style={[btnStyles.primary, disabled && btnStyles.disabled]}
//       onPress={onPress}
//       disabled={disabled}
//       activeOpacity={0.85}
//     >
//       <Text style={btnStyles.primaryText}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// function GhostBtn({
//   label,
//   onPress,
//   disabled,
// }: {
//   label: string;
//   onPress: () => void;
//   disabled?: boolean;
// }) {
//   return (
//     <TouchableOpacity
//       style={[btnStyles.ghost, disabled && btnStyles.disabled]}
//       onPress={onPress}
//       disabled={disabled}
//       activeOpacity={0.7}
//     >
//       <Text style={btnStyles.ghostText}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// const btnStyles = StyleSheet.create({
//   primary: {
//     backgroundColor: LAI.brand,
//     borderRadius: 14,
//     paddingVertical: 16,
//     alignItems: "center",
//   },
//   primaryText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#fff",
//     letterSpacing: 0.1,
//   },
//   ghost: {
//     paddingVertical: 12,
//     alignItems: "center",
//   },
//   ghostText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: LAI.textSecondary,
//   },
//   disabled: {
//     opacity: 0.45,
//   },
// });

// // â”€â”€â”€ Inline error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// function InlineError({ message }: { message: string }) {
//   return (
//     <View style={errStyles.wrap}>
//       <Text style={errStyles.text}>{message}</Text>
//     </View>
//   );
// }

// const errStyles = StyleSheet.create({
//   wrap: { marginTop: 6 },
//   text: { fontSize: 13, color: "#C0392B", lineHeight: 18 },
// });

// // â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// export function AddWithAiFlow({
//   visible,
//   kind,
//   onClose,
//   onApply,
//   onPublished,
// }: Props) {
//   const { t, i18n } = useTranslation();
//   const { user } = useUser();
//   const queryClient = useQueryClient();
//   const { startBackgroundPublish } = usePropertySalePublish();

//   const [phase, setPhase] = useState<Phase>("compose");
//   const [stepIndex, setStepIndex] = useState(0);

//   // â”€â”€ Form state â”€â”€
//   const [price, setPrice] = useState("");
//   const [area, setArea] = useState("");
//   const [bedrooms, setBedrooms] = useState("");
//   const [bathrooms, setBathrooms] = useState("");
//   const [propertyType, setPropertyType] = useState("");
//   const [yearBuilt, setYearBuilt] = useState("");
//   const [amenityIds, setAmenityIds] = useState<number[]>([]);
//   const [selectedCityId, setSelectedCityId] = useState<number | undefined>();
//   const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
//   const [selectedQuartierId, setSelectedQuartierId] = useState<
//     number | undefined
//   >();
//   const [cityName, setCityName] = useState("");
//   const [zoneName, setZoneName] = useState("");
//   const [quartierName, setQuartierName] = useState("");
//   const [citySearch, setCitySearch] = useState("");
//   const [zoneSearch, setZoneSearch] = useState("");
//   const [quartierSearch, setQuartierSearch] = useState("");
//   const [plotNumber, setPlotNumber] = useState("");
//   const [details, setDetails] = useState("");
//   const [localImages, setLocalImages] = useState<string[]>([]);
//   const [video, setVideo] = useState<{ uri: string; mimeType?: string } | null>(
//     null,
//   );

//   // â”€â”€ Errors â”€â”€
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [showExtrasErrors, setShowExtrasErrors] = useState(false);

//   // â”€â”€ Flow state â”€â”€
//   const [generating, setGenerating] = useState(false);
//   const [progress, setProgress] = useState("queued");
//   const [reviewDraft, setReviewDraft] = useState<ListingAiDraft | null>(null);
//   const [paperTypes, setPaperTypes] = useState<string[]>([]);
//   const [skipPapers, setSkipPapers] = useState(false);
//   const [mediaPromptDismissed, setMediaPromptDismissed] = useState(false);
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const [mediaSheetVisible, setMediaSheetVisible] = useState(false);
//   const [mediaSheetSkipApplies, setMediaSheetSkipApplies] = useState(false);
//   const [publishing, setPublishing] = useState(false);
//   const [publishPercent, setPublishPercent] = useState(0);
//   const [flowError, setFlowError] = useState<string | null>(null);
//   const generateAbortRef = useRef<AbortController | null>(null);
//   const lastJobIdRef = useRef<string>("");

//   const showRooms = kind === "rent" || kind === "sale";
//   const areaRequired = kind === "land" || kind === "sale";
//   const needsPropertyExtras = kind === "rent" || kind === "sale";

//   const {
//     cities,
//     zones,
//     quartiers,
//     citiesLoading,
//     zonesLoading,
//     quartiersLoading,
//     label: locationLabel,
//   } = useListingLocationCatalog(selectedCityId, selectedZoneId);
//   const { data: amenitiesCatalog = [] } = useAmenities();
//   const { data: rentCategories = [] } = usePropertyCategories();

//   const rentCategoryLabel = useCallback(
//     (idStr: string): string => {
//       const id = parseInt(idStr, 10);
//       if (!Number.isFinite(id)) return idStr;
//       const cat = rentCategories.find((c) => c.id === id);
//       if (!cat) return idStr;
//       const lang = (i18n.language || "en").toLowerCase();
//       if (lang.startsWith("ar") && cat.name.ar) return cat.name.ar;
//       if (lang.startsWith("fr") && cat.name.fr) return cat.name.fr;
//       return cat.name.en || cat.name.fr || cat.name.ar || idStr;
//     },
//     [rentCategories, i18n.language],
//   );

//   const detectedLang = detectListingOutputLanguage(
//     details,
//     cityName,
//     zoneName,
//     quartierName,
//   );

//   // â”€â”€ Step list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const steps: StepId[] = React.useMemo(() => {
//     const s: StepId[] = ["basics"];
//     if (needsPropertyExtras) s.push("extras");
//     s.push("city", "zone", "quartier");
//     if (kind === "land") s.push("plotNumber");
//     s.push("story", "media");
//     return s;
//   }, [needsPropertyExtras, kind]);

//   const currentStep = steps[stepIndex];
//   const isLastStep = stepIndex === steps.length - 1;

//   const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
//   const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

//   // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const clearErr = (key: string) =>
//     setErrors((e) => {
//       const n = { ...e };
//       delete n[key];
//       return n;
//     });

//   const validateStep = (): boolean => {
//     const errs: Record<string, string> = {};

//     if (currentStep === "basics") {
//       const p = parseFormattedNumber(price);
//       if (!Number.isFinite(p) || p <= 0)
//         errs.price = t(
//           "listingAi.validation.priceRequired",
//           "Enter a valid asking price.",
//         );
//       if (areaRequired) {
//         const a = parseFormattedNumber(area);
//         if (!Number.isFinite(a) || a <= 0)
//           errs.area = t(
//             "listingAi.validation.areaRequired",
//             "Enter the area in mÂ².",
//           );
//       }
//     }

//     if (currentStep === "extras") {
//       if (!propertyType)
//         errs.propertyType = t(
//           "listingAi.validation.propertyTypeRequired",
//           "Select a property type.",
//         );
//       if (kind === "sale" && !yearBuilt.trim())
//         errs.yearBuilt = t(
//           "listingAi.validation.yearBuiltRequired",
//           "Enter the year built.",
//         );
//       if (amenityIds.length === 0)
//         errs.amenities = t(
//           "listingAi.validation.amenitiesRequired",
//           "Select at least one amenity.",
//         );
//     }

//     if (currentStep === "city" && !selectedCityId)
//       errs.city = t("listingAi.validation.cityRequired", "Select a city.");
//     if (currentStep === "zone" && !selectedZoneId)
//       errs.zone = t("listingAi.validation.zoneRequired", "Select a zone.");
//     if (currentStep === "quartier" && !selectedQuartierId)
//       errs.quartier = t(
//         "listingAi.validation.quartierRequired",
//         "Select a sector.",
//       );
//     if (currentStep === "plotNumber" && kind === "land" && !plotNumber.trim())
//       errs.plotNumber = t(
//         "listingAi.validation.plotNumberRequired",
//         "Enter the cadastre plot number.",
//       );
//     if (currentStep === "story" && details.trim().length < 10)
//       errs.story = t(
//         "listingAi.validation.storyMinLength",
//         "Add a few more details (10+ characters).",
//       );

//     setErrors(errs);
//     if (currentStep === "extras")
//       setShowExtrasErrors(Object.keys(errs).length > 0);
//     return Object.keys(errs).length === 0;
//   };

//   const handleContinue = () => {
//     if (!validateStep()) return;
//     if (isLastStep) {
//       void handleGenerate();
//       return;
//     }
//     goNext();
//   };

//   // â”€â”€ Media helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const openMediaSheet = useCallback((skipApplies: boolean) => {
//     setMediaSheetSkipApplies(skipApplies);
//     setMediaSheetVisible(true);
//   }, []);
//   const closeMediaSheet = useCallback(() => setMediaSheetVisible(false), []);

//   const pickPhotos = async () => {
//     const result = await pickMultipleImagesNative({
//       allowsEditing: false,
//       base64: true,
//       quality: 0.8,
//     });
//     if (result.canceled || !result.assets?.length) return;
//     const next = result.assets
//       .map((a) => (a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri))
//       .filter(Boolean) as string[];
//     setLocalImages((prev) => [...prev, ...next].slice(0, 10));
//   };

//   const pickVideo = async () => {
//     const result = await pickVideoNative();
//     if (result.canceled || !result.assets?.[0]?.uri) return;
//     setVideo({
//       uri: result.assets[0].uri,
//       mimeType:
//         result.assets[0].mimeType ?? result.assets[0].type ?? "video/mp4",
//     });
//   };

//   const appendMediaToDraft = (imageUrls: string[], videoUrls: string[]) => {
//     setReviewDraft((d) => {
//       if (!d) return d;
//       return {
//         ...d,
//         image_urls: [...(d.image_urls ?? []), ...imageUrls].slice(0, 10),
//         video_urls: [
//           ...(d.video_urls ?? []),
//           ...videoUrls.filter((u) => !(d.video_urls ?? []).includes(u)),
//         ],
//       };
//     });
//     setMediaPromptDismissed(true);
//   };

//   const draftHasMedia = (d: ListingAiDraft | null) =>
//     Boolean(
//       d && ((d.image_urls?.length ?? 0) > 0 || (d.video_urls?.length ?? 0) > 0),
//     );

//   const pickPhotosInReview = async () => {
//     const result = await pickMultipleImagesNative({
//       allowsEditing: false,
//       base64: true,
//       quality: 0.8,
//     });
//     if (result.canceled || !result.assets?.length) return;
//     const picked = result.assets
//       .map((a) => (a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri))
//       .filter(Boolean) as string[];
//     if (!picked.length) return;
//     setUploadingMedia(true);
//     setProgress("uploading");
//     try {
//       const urls = await uploadListingAiImages(picked);
//       appendMediaToDraft(normalizeMediaUrlList(urls), []);
//     } catch (e: unknown) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         e instanceof Error
//           ? e.message
//           : t("listingAi.uploadFailed", { defaultValue: "Upload failed" }),
//       );
//     } finally {
//       setUploadingMedia(false);
//       setProgress("queued");
//     }
//   };

//   const pickVideoInReview = async () => {
//     const result = await pickVideoNative();
//     if (result.canceled || !result.assets?.[0]?.uri) return;
//     const asset = result.assets[0];
//     setUploadingMedia(true);
//     setProgress("uploading");
//     try {
//       const url = await uploadListingAiVideo({
//         uri: asset.uri,
//         mimeType: asset.mimeType ?? asset.type,
//       });
//       if (url) appendMediaToDraft([], normalizeMediaUrlList([url]));
//     } catch (e: unknown) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         e instanceof Error
//           ? e.message
//           : t("listingAi.uploadFailed", { defaultValue: "Upload failed" }),
//       );
//     } finally {
//       setUploadingMedia(false);
//       setProgress("queued");
//     }
//   };

//   // â”€â”€ Generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const mergeComposeIntoDraft = (draft: ListingAiDraft): ListingAiDraft => {
//     const yearNum = parseInt(yearBuilt.trim(), 10);
//     const categoryId =
//       kind === "rent" && propertyType
//         ? parseInt(propertyType, 10)
//         : draft.property_category_id;
//     return {
//       ...draft,
//       property_type:
//         kind === "rent" ? "entire_place" : propertyType || draft.property_type,
//       property_category_id:
//         kind === "rent" && Number.isFinite(categoryId) && categoryId! > 0
//           ? categoryId
//           : draft.property_category_id,
//       year_built:
//         kind === "sale" && Number.isFinite(yearNum) && yearNum > 0
//           ? yearNum
//           : draft.year_built,
//       amenity_ids: amenityIds.length ? amenityIds : draft.amenity_ids,
//       plot_number:
//         kind === "land"
//           ? plotNumber.trim() || draft.plot_number?.trim() || ""
//           : draft.plot_number,
//     };
//   };

//   const handleGenerate = async () => {
//     setFlowError(null);
//     setGenerating(true);
//     setProgress("queued");
//     generateAbortRef.current?.abort();
//     generateAbortRef.current = new AbortController();
//     const signal = generateAbortRef.current.signal;

//     try {
//       let imageUrls: string[] = [];
//       let videoUrls: string[] = [];
//       if (localImages.length > 0 || video) {
//         setProgress("uploading");
//         const [uploadedImages, uploadedVideo] = await Promise.all([
//           localImages.length > 0
//             ? uploadListingAiImages(localImages)
//             : Promise.resolve([] as string[]),
//           uploadListingAiVideo(video),
//         ]);
//         imageUrls = uploadedImages;
//         videoUrls = uploadedVideo ? [uploadedVideo] : [];
//       }
//       if (signal.aborted) return;

//       let detailsForAi = details.trim();
//       if (needsPropertyExtras && propertyType) {
//         const typeLabel =
//           kind === "rent" ? rentCategoryLabel(propertyType) : propertyType;
//         detailsForAi += `\n\nProperty type: ${typeLabel}`;
//         if (kind === "sale" && yearBuilt.trim())
//           detailsForAi += `\nYear built: ${yearBuilt.trim()}`;
//       }

//       const amenityNames = (
//         Array.isArray(amenitiesCatalog) ? amenitiesCatalog : []
//       )
//         .filter((a) => amenityIds.includes(a.id))
//         .map((a) => {
//           const n = a.name;
//           if (detectedLang === "ar") return n.ar || n.en || "";
//           if (detectedLang === "fr") return n.fr || n.en || "";
//           return n.en || n.fr || n.ar || "";
//         })
//         .filter(Boolean);

//       const rentCategoryId =
//         kind === "rent" && propertyType ? parseInt(propertyType, 10) : NaN;
//       const priceNum = parseFormattedNumber(price);

//       const input = {
//         kind,
//         details: detailsForAi,
//         price: priceNum,
//         currency: "MRU",
//         area: Math.round(parseFormattedNumber(area) || 0),
//         area_unit: "mÂ²",
//         city_hint: cityName.trim(),
//         zone_hint: zoneName.trim(),
//         quartier_hint: quartierName.trim(),
//         image_urls: imageUrls,
//         video_urls: videoUrls,
//         language: detectedLang,
//         ...(needsPropertyExtras && propertyType
//           ? {
//               property_type:
//                 kind === "rent"
//                   ? rentCategoryLabel(propertyType)
//                   : propertyType,
//               ...(kind === "rent" &&
//               Number.isFinite(rentCategoryId) &&
//               rentCategoryId > 0
//                 ? { property_category_id: rentCategoryId }
//                 : {}),
//             }
//           : {}),
//         ...(amenityIds.length > 0 ? { amenity_ids: amenityIds } : {}),
//         ...(amenityNames.length > 0 ? { amenity_names: amenityNames } : {}),
//         ...(bedrooms ? { bedrooms: parseInt(bedrooms, 10) } : {}),
//         ...(bathrooms ? { bathrooms: parseInt(bathrooms, 10) } : {}),
//         ...(kind === "land" && plotNumber.trim()
//           ? { plot_number: plotNumber.trim() }
//           : {}),
//       };

//       setProgress("matching_location");
//       const jobId = await startListingAiJob(input);
//       lastJobIdRef.current = jobId;
//       const draft = await pollListingAiJob(jobId, setProgress, 180_000, signal);
//       draft.image_urls = imageUrls.length
//         ? normalizeMediaUrlList(imageUrls)
//         : draft.image_urls;
//       draft.video_urls = videoUrls.length
//         ? normalizeMediaUrlList(videoUrls)
//         : draft.video_urls;

//       setProgress("done");
//       const withLocation: ListingAiDraft = {
//         ...draft,
//         city_id: selectedCityId ?? draft.city_id,
//         city_name: cityName || draft.city_name,
//         zone_id: selectedZoneId ?? draft.zone_id,
//         zone_name: zoneName || draft.zone_name,
//         quartier_id: selectedQuartierId ?? draft.quartier_id,
//         quartier_name: quartierName || draft.quartier_name,
//         plot_number:
//           plotNumber.trim() || draft.plot_number?.trim() || undefined,
//       };
//       setReviewDraft(mergeComposeIntoDraft(withLocation));
//       setPaperTypes([]);
//       setSkipPapers(false);
//       setMediaPromptDismissed(draftHasMedia(withLocation));
//       setPhase("review");
//       setFlowError(null);
//       setTimeout(() => {
//         setGenerating(false);
//         setProgress("queued");
//       }, 450);
//     } catch (e: unknown) {
//       setGenerating(false);
//       setProgress("queued");
//       generateAbortRef.current = null;
//       if (e instanceof Error && e.message.includes("cancelled")) return;
//       const msg = describeListingFlowError("generate", e);
//       setFlowError(msg);
//       logListingFlowDebug("generate-failed", { kind, message: msg });
//       Alert.alert(
//         t("listingAi.errorTitle", { defaultValue: "Something went wrong" }),
//         msg,
//         [
//           {
//             text: t("listing.common.ok", { defaultValue: "OK" }),
//             style: "cancel",
//           },
//           {
//             text: t("listingAi.retry", { defaultValue: "Try again" }),
//             onPress: () => void handleGenerate(),
//           },
//         ],
//       );
//     }
//   };

//   // â”€â”€ Publish flows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const buildFinalDraft = (): ListingAiDraft | null => {
//     if (!reviewDraft) return null;
//     return mergeComposeIntoDraft({
//       ...reviewDraft,
//       paper_types:
//         kind === "sale" || kind === "land"
//           ? skipPapers
//             ? []
//             : paperTypes
//           : undefined,
//     } as ListingAiDraft);
//   };

//   const applyReviewDraft = () => {
//     const final = buildFinalDraft();
//     if (!final) return;
//     void recordListingAiPublished(kind, lastJobIdRef.current);
//     reset();
//     onApply?.(final);
//   };

//   const publishRentFromReview = async () => {
//     const final = buildFinalDraft();
//     if (!final || !user?.accessToken || !user?.ID) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         t("listingAi.validation.loginRequired", {
//           defaultValue: "You must be logged in",
//         }),
//       );
//       return;
//     }
//     const validationError = validateListingAiDraftForRentPublish(
//       final,
//       draftHasMedia(final),
//     );
//     if (validationError) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         t(validationError),
//       );
//       return;
//     }
//     setPublishing(true);
//     setPublishPercent(0);
//     setFlowError(null);
//     try {
//       setPublishPercent(40);
//       const payload = listingAiDraftToRentPayload(final, user.ID);
//       logListingFlowDebug("rent-publish", {
//         propertyType: payload.propertyType,
//         propertyCategoryId: payload.propertyCategoryId,
//         cityId: payload.city_id,
//         images: Array.isArray(payload.images) ? payload.images.length : 0,
//       });
//       const response = await api.post("/property", payload, {
//         headers: { "Content-Type": "application/json" },
//         timeout: 60_000,
//       });
//       setPublishPercent(100);
//       if (response.status < 200 || response.status >= 300)
//         throw new Error(response.data?.error || "Publish failed");
//       const propertyId =
//         response.data?.ID ?? response.data?.id ?? response.data?.property?.id;
//       await queryClient.invalidateQueries({ queryKey: ["myProperties"] });
//       await queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
//       void recordListingAiPublished(kind, lastJobIdRef.current);
//       reset();
//       onClose();
//       if (propertyId) onPublished?.(Number(propertyId));
//       Alert.alert(
//         t("listingAi.listedTitle", { defaultValue: "Listed!" }),
//         t("listingAi.listedSub", {
//           defaultValue: "Your property is now live.",
//         }),
//       );
//     } catch (e: unknown) {
//       const msg = describeListingFlowError("rent-publish", e);
//       setFlowError(msg);
//       logListingFlowDebug("rent-publish-failed", { message: msg });
//       Alert.alert(
//         t("listingAi.publishFailedTitle", {
//           defaultValue: "Could not publish",
//         }),
//         msg,
//         [
//           {
//             text: t("listing.common.ok", { defaultValue: "OK" }),
//             style: "cancel",
//           },
//           {
//             text: t("listingAi.retry", { defaultValue: "Try again" }),
//             onPress: () => void publishRentFromReview(),
//           },
//         ],
//       );
//     } finally {
//       setPublishing(false);
//       setPublishPercent(0);
//     }
//   };

//   const publishSaleFromReview = async () => {
//     const final = buildFinalDraft();
//     if (!final || !user?.accessToken) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         t("listingAi.validation.loginRequired", {
//           defaultValue: "You must be logged in",
//         }),
//       );
//       return;
//     }
//     const validationError = validateListingAiDraftForSalePublish(
//       final,
//       draftHasMedia(final),
//     );
//     if (validationError) {
//       Alert.alert(
//         t("common.error", { defaultValue: "Error" }),
//         t(validationError),
//       );
//       return;
//     }
//     setFlowError(null);
//     try {
//       const { form, images, video } = listingAiDraftToPropertySalePublish(
//         final,
//         paperTypes,
//         skipPapers,
//       );
//       const previewUri =
//         images[0] ||
//         (video?.uri && !String(video.uri).startsWith("http") ? video.uri : undefined);
//       await startBackgroundPublish({
//         accessToken: user.accessToken,
//         form,
//         images,
//         video,
//         meta: {
//           title: form.title,
//           previewUri,
//           price: form.price,
//           city: form.city,
//           source: "ai",
//           listingAiJobId: lastJobIdRef.current,
//         },
//       });
//       reset();
//       onClose();
//       onPublished?.(0);
//     } catch (e: unknown) {
//       const msg = describeListingFlowError("sale-publish", e);
//       setFlowError(msg);
//       Alert.alert(
//         t("listingAi.publishFailedTitle", {
//           defaultValue: "Could not publish",
//         }),
//         msg,
//       );
//     }
//   };

//   const handleConfirmReview = () => {
//     if (!reviewDraft || uploadingMedia || publishing) return;
//     if (!reviewDraft.city_id) {
//       Alert.alert(
//         t("listingAi.missingLocationTitle", {
//           defaultValue: "Missing location",
//         }),
//         t("listingAi.reviewSelectCity", {
//           defaultValue: "Select a city for this listing.",
//         }),
//       );
//       return;
//     }
//     if (kind !== "rent" && !reviewDraft.zone_id) {
//       Alert.alert(
//         t("listingAi.missingLocationTitle", {
//           defaultValue: "Missing location",
//         }),
//         t("listingAi.reviewSelectZone", {
//           defaultValue: "Select a zone for this listing.",
//         }),
//       );
//       return;
//     }
//     if (kind === "land") {
//       if (!(reviewDraft.plot_number ?? plotNumber).trim()) {
//         Alert.alert(
//           t("listingAi.plotTitle", { defaultValue: "Plot number" }),
//           t("listingAi.validation.plotNumberRequired", {
//             defaultValue: "Enter the cadastre plot number.",
//           }),
//         );
//         return;
//       }
//       if (!reviewDraft.quartier_id) {
//         Alert.alert(
//           t("common.error", { defaultValue: "Error" }),
//           t("listingAi.validation.sectorRequired", {
//             defaultValue: "Select a sector.",
//           }),
//         );
//         return;
//       }
//     }
//     if (!draftHasMedia(reviewDraft) && !mediaPromptDismissed) {
//       openMediaSheet(true);
//       return;
//     }
//     if (kind === "sale") {
//       void publishSaleFromReview();
//       return;
//     }
//     if (kind === "rent") {
//       void publishRentFromReview();
//       return;
//     }
//     applyReviewDraft();
//   };

//   // â”€â”€ Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const reset = () => {
//     setPhase("compose");
//     setStepIndex(0);
//     setPrice("");
//     setArea("");
//     setBedrooms("");
//     setBathrooms("");
//     setPropertyType("");
//     setYearBuilt("");
//     setAmenityIds([]);
//     setSelectedCityId(undefined);
//     setSelectedZoneId(undefined);
//     setSelectedQuartierId(undefined);
//     setCityName("");
//     setZoneName("");
//     setQuartierName("");
//     setCitySearch("");
//     setZoneSearch("");
//     setQuartierSearch("");
//     setPlotNumber("");
//     setDetails("");
//     setLocalImages([]);
//     setVideo(null);
//     setErrors({});
//     setShowExtrasErrors(false);
//     setGenerating(false);
//     setProgress("queued");
//     setReviewDraft(null);
//     setPaperTypes([]);
//     setSkipPapers(false);
//     setMediaPromptDismissed(false);
//     setUploadingMedia(false);
//     setMediaSheetVisible(false);
//     setMediaSheetSkipApplies(false);
//     setPublishing(false);
//     setPublishPercent(0);
//     setFlowError(null);
//   };

//   const handleClose = () => {
//     if (generating || publishing) return;
//     reset();
//     onClose();
//   };

//   const kindLabel =
//     kind === "land" ? "Land" : kind === "sale" ? "Sale" : "Rental";
//   const publishLabel =
//     kind === "sale" || kind === "rent"
//       ? t("listingAi.publishListing", { defaultValue: "Publish listing" })
//       : t("listingAi.applyToListing", { defaultValue: "Apply to listing" });
//   const showGeneratingOverlay = generating && progress !== "uploading";

//   // â”€â”€ Step content map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   const stepContent: Record<
//     StepId,
//     {
//       title: string;
//       subtitle: string;
//       body: React.ReactNode;
//       footer: React.ReactNode;
//     }
//   > = {
//     basics: {
//       title: t("listingAi.basicsTitle", { defaultValue: "Price & size" }),
//       subtitle: t("listingAi.basicsSub", {
//         defaultValue:
//           kind === "land"
//             ? "Set the asking price and plot area."
//             : "Set the asking price and key figures.",
//       }),
//       body: (
//         <>
//           <ListingAiComposeHero
//             price={price}
//             onPriceChange={(v) => {
//               setPrice(v);
//               clearErr("price");
//             }}
//             area={area}
//             onAreaChange={(v) => {
//               setArea(v);
//               clearErr("area");
//             }}
//             areaRequired={areaRequired}
//             showRooms={showRooms}
//             bedrooms={bedrooms}
//             bathrooms={bathrooms}
//             onBedroomsChange={setBedrooms}
//             onBathroomsChange={setBathrooms}
//             disabled={generating}
//           />
//           {errors.price && <InlineError message={errors.price} />}
//           {errors.area && <InlineError message={errors.area} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//         />
//       ),
//     },

//     extras: {
//       title: t("listingAi.extrasTitle", { defaultValue: "Property details" }),
//       subtitle: t("listingAi.extrasSub", {
//         defaultValue:
//           "Type, year, and features help AI write an accurate description.",
//       }),
//       body: (
//         <>
//           <ListingAiComposeExtras
//             kind={kind}
//             propertyType={propertyType}
//             onPropertyTypeChange={(v) => {
//               setPropertyType(v);
//               clearErr("propertyType");
//             }}
//             yearBuilt={yearBuilt}
//             onYearBuiltChange={(v) => {
//               setYearBuilt(v);
//               clearErr("yearBuilt");
//             }}
//             amenityIds={amenityIds}
//             onAmenityIdsChange={(ids) => {
//               setAmenityIds(ids);
//               clearErr("amenities");
//             }}
//             showMissingHints={showExtrasErrors}
//             disabled={generating}
//           />
//           {errors.propertyType && <InlineError message={errors.propertyType} />}
//           {errors.yearBuilt && <InlineError message={errors.yearBuilt} />}
//           {errors.amenities && <InlineError message={errors.amenities} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//         />
//       ),
//     },

//     city: {
//       title: t("listingAi.cityTitle", { defaultValue: "Which city?" }),
//       subtitle: t("listingAi.citySub", {
//         defaultValue: "Select the city where the property is located.",
//       }),
//       body: (
//         <>
//           <ListingAiLocationPickerStep
//             items={cities}
//             selectedId={selectedCityId}
//             search={citySearch}
//             onSearchChange={setCitySearch}
//             onSelect={(item) => {
//               const name = locationLabel(item);
//               setSelectedCityId(item.id);
//               setCityName(name);
//               setSelectedZoneId(undefined);
//               setSelectedQuartierId(undefined);
//               setZoneName("");
//               setQuartierName("");
//               setZoneSearch("");
//               setQuartierSearch("");
//               clearErr("city");
//             }}
//             label={locationLabel}
//             loading={citiesLoading}
//             disabled={generating}
//           />
//           {errors.city && <InlineError message={errors.city} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//           disabled={!selectedCityId}
//         />
//       ),
//     },

//     zone: {
//       title: t("listingAi.zoneTitle", { defaultValue: "Which zone?" }),
//       subtitle: cityName
//         ? t("listingAi.zoneSub", {
//             defaultValue: "Narrow down the area within {{city}}.",
//             city: cityName,
//           })
//         : t("listingAi.zoneSubFallback", {
//             defaultValue: "Narrow down the area.",
//           }),
//       body: (
//         <>
//           <ListingAiLocationPickerStep
//             items={zones}
//             selectedId={selectedZoneId}
//             search={zoneSearch}
//             onSearchChange={setZoneSearch}
//             onSelect={(item) => {
//               const name = locationLabel(item);
//               setSelectedZoneId(item.id);
//               setZoneName(name);
//               setSelectedQuartierId(undefined);
//               setQuartierName("");
//               setQuartierSearch("");
//               clearErr("zone");
//             }}
//             label={locationLabel}
//             loading={zonesLoading}
//             disabled={generating || !selectedCityId}
//             emptyText="Select a city first"
//           />
//           {errors.zone && <InlineError message={errors.zone} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//           disabled={!selectedZoneId}
//         />
//       ),
//     },

//     quartier: {
//       title: t("listingAi.quartierTitle", { defaultValue: "Which sector?" }),
//       subtitle: zoneName
//         ? t("listingAi.quartierSub", {
//             defaultValue: "Pick the sector within {{zone}}.",
//             zone: zoneName,
//           })
//         : t("listingAi.quartierSubFallback", {
//             defaultValue: "Final location detail.",
//           }),
//       body: (
//         <>
//           <ListingAiLocationPickerStep
//             items={quartiers}
//             selectedId={selectedQuartierId}
//             search={quartierSearch}
//             onSearchChange={setQuartierSearch}
//             onSelect={(item) => {
//               setSelectedQuartierId(item.id);
//               setQuartierName(locationLabel(item));
//               clearErr("quartier");
//             }}
//             label={locationLabel}
//             loading={quartiersLoading}
//             disabled={generating || !selectedZoneId}
//             emptyText="Select a zone first"
//           />
//           {errors.quartier && <InlineError message={errors.quartier} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//           disabled={!selectedQuartierId}
//         />
//       ),
//     },

//     plotNumber: {
//       title: t("listingAi.plotTitle", { defaultValue: "Plot number" }),
//       subtitle: t("listingAi.plotSub", {
//         defaultValue: "The cadastre reference for this land parcel.",
//       }),
//       body: (
//         <>
//           <ListingAiPlotNumberStep
//             value={plotNumber}
//             onChange={(v) => {
//               setPlotNumber(v);
//               clearErr("plotNumber");
//             }}
//             sectorName={quartierName || undefined}
//             disabled={generating}
//           />
//           {errors.plotNumber && <InlineError message={errors.plotNumber} />}
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//         />
//       ),
//     },

//     story: {
//       title: t("listingAi.storyTitle", { defaultValue: "Tell us about it" }),
//       subtitle: t("listingAi.storySub", {
//         defaultValue:
//           "A few sentences â€” AI turns your notes into a polished listing.",
//       }),
//       body: (
//         <>
//           <TextInput
//             style={storyStyles.input}
//             multiline
//             placeholder={t("listingAi.storyPlaceholder", {
//               defaultValue:
//                 "Location, condition, nearby amenities, what makes it specialâ€¦",
//             })}
//             placeholderTextColor={LAI.textMuted}
//             value={details}
//             onChangeText={(v) => {
//               setDetails(v);
//               clearErr("story");
//             }}
//             editable={!generating}
//             textAlignVertical="top"
//           />
//           <View style={storyStyles.meta}>
//             <Text style={storyStyles.lang}>
//               {detectedLang === "ar"
//                 ? "Arabic"
//                 : detectedLang === "fr"
//                   ? "French"
//                   : "English"}
//             </Text>
//             <Text style={storyStyles.chars}>{details.length} characters</Text>
//           </View>
//           {errors.story && <InlineError message={errors.story} />}
//           <ListingAiSuggestionChips
//             kind={kind}
//             disabled={generating}
//             onSelect={(text) => {
//               setDetails(text);
//               clearErr("story");
//             }}
//           />
//         </>
//       ),
//       footer: (
//         <PrimaryBtn
//           label={t("common.continue", { defaultValue: "Continue" })}
//           onPress={handleContinue}
//         />
//       ),
//     },

//     media: {
//       title: t("listingAi.mediaTitle", { defaultValue: "Add photos" }),
//       subtitle: t("listingAi.mediaSub", {
//         defaultValue:
//           "Optional â€” listings with photos get far more views. You can also add them after.",
//       }),
//       body: (
//         <>
//           <TouchableOpacity
//             style={mediaStyles.row}
//             onPress={pickPhotos}
//             disabled={generating}
//             activeOpacity={0.7}
//           >
//             <View style={mediaStyles.iconBox}>
//               <Text style={mediaStyles.iconText}>âŠž</Text>
//             </View>
//             <View style={mediaStyles.rowLabel}>
//               <Text style={mediaStyles.rowTitle}>
//                 {t("listingAi.photos", { defaultValue: "Photos" })}
//               </Text>
//               <Text style={mediaStyles.rowSub}>
//                 {localImages.length > 0
//                   ? `${localImages.length} selected`
//                   : "Up to 10"}
//               </Text>
//             </View>
//             <Text style={mediaStyles.arrow}>â€º</Text>
//           </TouchableOpacity>

//           {(kind === "sale" || kind === "land") && (
//             <TouchableOpacity
//               style={mediaStyles.row}
//               onPress={pickVideo}
//               disabled={generating}
//               activeOpacity={0.7}
//             >
//               <View style={mediaStyles.iconBox}>
//                 <Text style={mediaStyles.iconText}>â–¶</Text>
//               </View>
//               <View style={mediaStyles.rowLabel}>
//                 <Text style={mediaStyles.rowTitle}>
//                   {t("listingAi.video", { defaultValue: "Video" })}
//                 </Text>
//                 <Text style={mediaStyles.rowSub}>
//                   {video ? "Added" : "Optional"}
//                 </Text>
//               </View>
//               <Text style={mediaStyles.arrow}>â€º</Text>
//             </TouchableOpacity>
//           )}

//           {localImages.length > 0 && (
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={mediaStyles.thumbRow}
//             >
//               {localImages.map((uri, i) => (
//                 <Image
//                   key={`${i}-${uri.slice(0, 16)}`}
//                   source={{ uri }}
//                   style={mediaStyles.thumb}
//                 />
//               ))}
//             </ScrollView>
//           )}
//         </>
//       ),
//       footer: (
//         <>
//           <PrimaryBtn
//             label={
//               localImages.length > 0 || video
//                 ? t("common.continue", { defaultValue: "Continue" })
//                 : t("listingAi.skipForNow", { defaultValue: "Skip for now" })
//             }
//             onPress={handleContinue}
//           />
//           {(localImages.length > 0 || video) && (
//             <GhostBtn
//               label={t("listingAi.skipForNow", {
//                 defaultValue: "Skip for now",
//               })}
//               onPress={() => {
//                 setLocalImages([]);
//                 setVideo(null);
//                 handleContinue();
//               }}
//             />
//           )}
//         </>
//       ),
//     },
//   };

//   const step = stepContent[currentStep];

//   // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
//       <View style={rootStyles.root}>
//         {/* â”€â”€ COMPOSE PHASE â”€â”€ */}
//         {phase === "compose" && step && (
//           <StepShell
//             title={step.title}
//             subtitle={step.subtitle}
//             stepIndex={stepIndex}
//             totalSteps={steps.length}
//             onBack={stepIndex > 0 ? goBack : undefined}
//             onClose={handleClose}
//             footer={step.footer}
//           >
//             {step.body}
//           </StepShell>
//         )}

//         {/* â”€â”€ REVIEW PHASE â”€â”€ */}
//         {phase === "review" && reviewDraft && (
//           <View style={rootStyles.root}>
//             {/* Review top bar */}
//             <View style={reviewStyles.topBar}>
//               <TouchableOpacity
//                 onPress={() => setPhase("compose")}
//                 style={reviewStyles.backBtn}
//                 hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//                 activeOpacity={0.6}
//                 disabled={uploadingMedia || publishing}
//               >
//                 <View style={shellStyles.backChevron} />
//               </TouchableOpacity>
//               <Text style={reviewStyles.topTitle}>
//                 {t("listingAi.reviewTitle", { defaultValue: "Review listing" })}
//               </Text>
//               <TouchableOpacity
//                 onPress={handleClose}
//                 style={shellStyles.closeBtn}
//                 hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//                 activeOpacity={0.6}
//                 disabled={publishing}
//               >
//                 <View style={shellStyles.closeLine1} />
//                 <View style={shellStyles.closeLine2} />
//               </TouchableOpacity>
//             </View>

//             <KeyboardAwareScrollView
//               style={rootStyles.scroll}
//               contentContainerStyle={reviewStyles.scrollContent}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//               enableOnAndroid
//               enableAutomaticScroll
//               extraScrollHeight={Platform.OS === "ios" ? 32 : 64}
//             >
//               <Text style={reviewStyles.sub}>
//                 {t("listingAi.reviewSub", {
//                   defaultValue:
//                     "Check the details below and edit anything before publishing.",
//                 })}
//               </Text>

//               {!mediaPromptDismissed && !draftHasMedia(reviewDraft) && (
//                 <ListingAiMediaPrompt
//                   kind={kind}
//                   imageUrls={reviewDraft.image_urls ?? []}
//                   videoUrls={reviewDraft.video_urls ?? []}
//                   uploading={uploadingMedia}
//                   onAddPhotos={() => openMediaSheet(false)}
//                   onAddVideo={
//                     kind === "sale" || kind === "land"
//                       ? () => openMediaSheet(false)
//                       : undefined
//                   }
//                   onContinueWithout={() => setMediaPromptDismissed(true)}
//                 />
//               )}

//               <ListingAiMediaThumbs imageUrls={reviewDraft.image_urls ?? []} />

//               <TouchableOpacity
//                 style={reviewStyles.addMedia}
//                 onPress={() => openMediaSheet(false)}
//                 disabled={uploadingMedia}
//               >
//                 <Text style={reviewStyles.addMediaText}>
//                   {draftHasMedia(reviewDraft)
//                     ? t("listingAi.addMorePhotos", {
//                         defaultValue: "Add more photos",
//                       })
//                     : t("listingAi.mediaPromptAddPhotos", {
//                         defaultValue: "Add photos",
//                       })}
//                 </Text>
//               </TouchableOpacity>

//               <ListingAiReviewStep
//                 kind={kind}
//                 draft={reviewDraft}
//                 onChange={setReviewDraft}
//                 paperTypes={paperTypes}
//                 onPaperTypesChange={setPaperTypes}
//                 skipPapers={skipPapers}
//                 onSkipPapersChange={setSkipPapers}
//               />
//             </KeyboardAwareScrollView>

//             {/* Review footer */}
//             <View style={shellStyles.footer}>
//               <PrimaryBtn
//                 label={publishLabel}
//                 onPress={handleConfirmReview}
//                 disabled={uploadingMedia || publishing}
//               />
//             </View>
//           </View>
//         )}

//         {/* â”€â”€ Overlays â”€â”€ */}
//         <ListingAiGeneratingOverlay
//           visible={showGeneratingOverlay}
//           progress={progress}
//         />

//         <ListingAiUploadSheet
//           visible={
//             !publishing &&
//             (uploadingMedia || (generating && progress === "uploading"))
//           }
//           variant={uploadingMedia ? "review" : "compose"}
//         />

//         {publishing && (
//           <View style={rootStyles.publishOverlay}>
//             <View style={rootStyles.publishCard}>
//               <PublishRingProgress percent={publishPercent} size={120} />
//               <Text style={rootStyles.publishLabel}>
//                 {t("listingAi.publishing", { defaultValue: "Publishingâ€¦" })}
//               </Text>
//               <Text style={rootStyles.publishSub}>
//                 {t("listingAi.pleaseWait", { defaultValue: "Please wait" })}
//               </Text>
//             </View>
//           </View>
//         )}

//         <ListingAiMediaSheet
//           visible={mediaSheetVisible}
//           kind={kind}
//           uploading={uploadingMedia}
//           skipAppliesListing={mediaSheetSkipApplies}
//           onClose={closeMediaSheet}
//           onAddPhotos={pickPhotosInReview}
//           onAddVideo={
//             kind === "sale" || kind === "land" ? pickVideoInReview : undefined
//           }
//           onContinueWithout={() => {
//             setMediaPromptDismissed(true);
//             if (mediaSheetSkipApplies) {
//               if (kind === "sale") void publishSaleFromReview();
//               else if (kind === "rent") void publishRentFromReview();
//               else applyReviewDraft();
//             }
//           }}
//         />
//       </View>
//     </Modal>
//   );
// }

// // â”€â”€â”€ Story step styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// const storyStyles = StyleSheet.create({
//   input: {
//     minHeight: 160,
//     fontSize: 16,
//     lineHeight: 24,
//     color: LAI.text,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: LAI.border,
//     borderRadius: 14,
//     padding: 16,
//     backgroundColor: LAI.surface,
//   },
//   meta: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   lang: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: LAI.brand,
//     textTransform: "uppercase",
//     letterSpacing: 0.4,
//   },
//   chars: {
//     fontSize: 12,
//     color: LAI.textMuted,
//   },
// });

// // â”€â”€â”€ Media step styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// const mediaStyles = StyleSheet.create({
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 16,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: LAI.borderLight,
//     gap: 14,
//   },
//   iconBox: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: LAI.brandSoft,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   iconText: {
//     fontSize: 18,
//     color: LAI.brand,
//   },
//   rowLabel: { flex: 1, gap: 2 },
//   rowTitle: { fontSize: 15, fontWeight: "500", color: LAI.text },
//   rowSub: { fontSize: 13, color: LAI.textMuted },
//   arrow: { fontSize: 22, color: LAI.textMuted },
//   thumbRow: {
//     flexDirection: "row",
//     gap: 10,
//     paddingTop: 16,
//     paddingBottom: 4,
//   },
//   thumb: {
//     width: 80,
//     height: 80,
//     borderRadius: 10,
//     backgroundColor: LAI.borderLight,
//   },
// });

// // â”€â”€â”€ Review styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// const reviewStyles = StyleSheet.create({
//   topBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === "ios" ? 56 : 20,
//     paddingBottom: 12,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: LAI.borderLight,
//   },
//   backBtn: {
//     width: 36,
//     height: 36,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   topTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: LAI.text,
//   },
//   scrollContent: {
//     paddingHorizontal: 24,
//     paddingTop: 20,
//     paddingBottom: 40,
//   },
//   sub: {
//     fontSize: 14,
//     color: LAI.textSecondary,
//     lineHeight: 21,
//     marginBottom: 20,
//   },
//   addMedia: {
//     alignSelf: "flex-start",
//     marginBottom: 16,
//     paddingVertical: 4,
//   },
//   addMediaText: {
//     fontSize: 15,
//     color: LAI.brand,
//     fontWeight: "600",
//     textDecorationLine: "underline",
//   },
// });

// // â”€â”€â”€ Root styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// const rootStyles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: LAI.canvas },
//   scroll: { flex: 1 },
//   publishOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.45)",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 100,
//   },
//   publishCard: {
//     backgroundColor: LAI.surface,
//     padding: 32,
//     borderRadius: 20,
//     alignItems: "center",
//     gap: 12,
//     minWidth: 220,
//   },
//   publishLabel: { fontSize: 17, fontWeight: "600", color: LAI.text },
//   publishSub: { fontSize: 14, color: LAI.textSecondary },
// });

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  pickMultipleImagesNative,
  pickVideoNative,
} from "../../utils/nativePhotoPicker";
import type { ListingAiDraft, ListingAiKind } from "../../types/listingAi";
import {
  pollListingAiJob,
  recordListingAiPublished,
  startListingAiJob,
} from "../../services/listingAiService";
import { detectListingOutputLanguage } from "../../utils/detectInputLanguage";
import { ListingAiUploadSheet } from "./ListingAiUploadSheet";
import { ListingAiComposeExtras } from "./ListingAiComposeExtras";
import { ListingAiSuggestionChips } from "./ListingAiSuggestionChips";
import { ListingAiComposeHero } from "./ListingAiComposeHero";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ListingAiLocationPickerStep } from "./ListingAiLocationPickerStep";
import { useLocationPicker } from "../../hooks/useLocationPicker";
import { isHabitatCatalogCity } from "../../hooks/useListingLocationCatalog";
import {
  describeListingFlowError,
  logListingFlowDebug,
} from "../../utils/listingAiFlowError";
import {
  listingAiLanguageLabel,
  parseFormattedNumber,
} from "./listingAiFormatters";
import { ListingAiReviewStep } from "./ListingAiReviewStep";
import { ListingAiPlotNumberStep } from "./ListingAiPlotNumberStep";
import {
  ListingAiMediaPrompt,
  ListingAiMediaThumbs,
} from "./ListingAiMediaPrompt";
import { ListingAiMediaSheet } from "./ListingAiMediaSheet";
import { PublishRingProgress } from "../PublishRingProgress";
import { useUser } from "../../hooks/useUser";
import { usePropertySalePublish } from "../../contexts/PropertySalePublishContext";
import {
  listingAiDraftToPropertySalePublish,
  validateListingAiDraftForSalePublish,
} from "../../utils/listingAiToPropertySale";
import {
  listingAiDraftToRentPayload,
  validateListingAiDraftForRentPublish,
} from "../../utils/listingAiToRent";
import { api } from "../../services/api";
import {
  useAmenities,
  usePropertyCategories,
} from "../../hooks/queries/useCategories";
import { useQueryClient } from "@tanstack/react-query";
import { LAI } from "./listingAiTheme";
import { ListingAiGeneratingOverlay } from "./ListingAiGeneratingOverlay";

// ─── Shared constant ─────────────────────────────────────────────────────────

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "compose" | "review";

type StepId =
  | "basics"
  | "extras"
  | "city"
  | "zone"
  | "quartier"
  | "plotNumber"
  | "story"
  | "media";

type Props = {
  visible: boolean;
  kind: ListingAiKind;
  onClose: () => void;
  onApply?: (draft: ListingAiDraft) => void;
  onPublished?: (propertyId: number) => void;
};

// ─── Progress bar (Airbnb-style thin linear) ──────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct =
    total > 1 ? Math.min(100, Math.round(((current + 1) / total) * 100)) : 100;
  return (
    <View style={pg.track}>
      <View style={[pg.fill, { width: `${pct}%` as any }]} />
    </View>
  );
}

const pg = StyleSheet.create({
  track: {
    flex: 1,
    height: 2,
    backgroundColor: "#E8E8E8",
    borderRadius: 1,
    overflow: "hidden",
    marginHorizontal: 12,
  },
  fill: {
    height: "100%",
    backgroundColor: LAI.brand,
    borderRadius: 1,
  },
});

// ─── Icon primitives (view-based, no deps) ────────────────────────────────────

function BackIcon() {
  return <View style={ico.chevron} />;
}

function XIcon() {
  return (
    <View style={ico.xWrap}>
      <View style={[ico.xLine, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[ico.xLine, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

const ico = StyleSheet.create({
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#1A1A1A",
    transform: [{ rotate: "45deg" }],
    marginLeft: 4,
  },
  xWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  xLine: {
    position: "absolute",
    width: 14,
    height: 1.5,
    backgroundColor: "#1A1A1A",
    borderRadius: 1,
  },
});

// ─── Step shell ───────────────────────────────────────────────────────────────
// Full-screen: [nav bar] → [heading] → [scrollable body] → [sticky footer]

function StepShell({
  title,
  subtitle,
  stepIndex,
  totalSteps,
  onBack,
  onClose,
  footer,
  children,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  onBack?: () => void;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const body = <View>{children}</View>;

  return (
    <View style={sh.root}>
      {/* ── Nav bar: back | progress | close ── */}
      <View style={sh.nav}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={sh.navBtn}
            hitSlop={HIT}
            activeOpacity={0.6}
          >
            <BackIcon />
          </TouchableOpacity>
        ) : (
          <View style={sh.navBtn} />
        )}

        <ProgressBar current={stepIndex} total={totalSteps} />

        <TouchableOpacity
          onPress={onClose}
          style={sh.navBtn}
          hitSlop={HIT}
          activeOpacity={0.6}
        >
          <XIcon />
        </TouchableOpacity>
      </View>

      {/* ── Heading ── */}
      <View style={sh.head}>
        <Text style={sh.stepLabel}>
          Step {stepIndex + 1} of {totalSteps}
        </Text>
        <Text style={sh.title}>{title}</Text>
        {subtitle ? <Text style={sh.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* ── Body ── */}
      {scrollable ? (
        <KeyboardAwareScrollView
          style={sh.scroll}
          contentContainerStyle={sh.scrollContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === "ios" ? 32 : 64}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[sh.scroll, sh.scrollContent]}>{body}</View>
      )}

      {/* ── Sticky footer ── */}
      <View style={sh.footer}>{footer}</View>
    </View>
  );
}

const sh = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  head: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B0B0B0",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#717171",
    lineHeight: 22,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EBEBEB",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
});

// ─── Buttons ──────────────────────────────────────────────────────────────────

function PrimaryBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[bt.primary, disabled && bt.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={bt.primaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function GhostBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[bt.ghost, disabled && bt.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Text style={bt.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const bt = StyleSheet.create({
  primary: {
    backgroundColor: LAI.brand,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  ghost: {
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#717171",
    textDecorationLine: "underline",
  },
  disabled: { opacity: 0.38 },
});

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 13, color: "#C0392B", lineHeight: 18 }}>
        {message}
      </Text>
    </View>
  );
}

// ─── Location skip notice ──────────────────────────────────────────────────────
// Shown when a city/zone has no sub-zones or sub-sectors in the database.

function LocationSkipNotice({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <View style={lsn.wrap}>
      <View style={lsn.circle}>
        <Text style={lsn.mark}>✓</Text>
      </View>
      <Text style={lsn.heading}>{heading}</Text>
      <Text style={lsn.body}>{body}</Text>
    </View>
  );
}

const lsn = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F9F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mark: {
    fontSize: 22,
    color: "#27AE60",
    fontWeight: "600",
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function AddWithAiFlow({
  visible,
  kind,
  onClose,
  onApply,
  onPublished,
}: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { startBackgroundPublish } = usePropertySalePublish();

  const [phase, setPhase] = useState<Phase>("compose");
  const [stepIndex, setStepIndex] = useState(0);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>();
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const [selectedQuartierId, setSelectedQuartierId] = useState<
    number | undefined
  >();
  const [cityName, setCityName] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [quartierName, setQuartierName] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");
  const [quartierSearch, setQuartierSearch] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [details, setDetails] = useState("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [video, setVideo] = useState<{ uri: string; mimeType?: string } | null>(
    null,
  );

  // ── Errors ──────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExtrasErrors, setShowExtrasErrors] = useState(false);

  // ── Flow state ──────────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("queued");
  const [reviewDraft, setReviewDraft] = useState<ListingAiDraft | null>(null);
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [skipPapers, setSkipPapers] = useState(false);
  const [mediaPromptDismissed, setMediaPromptDismissed] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaSheetVisible, setMediaSheetVisible] = useState(false);
  const [mediaSheetSkipApplies, setMediaSheetSkipApplies] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishPercent, setPublishPercent] = useState(0);
  const [flowError, setFlowError] = useState<string | null>(null);
  const generateAbortRef = useRef<AbortController | null>(null);
  const lastJobIdRef = useRef<string>("");
  const generateInFlightRef = useRef(false);
  const prevVisibleRef = useRef(visible);

  /** Opened from Add Property / manual forms — apply draft instead of publishing. */
  const embeddedInForm = Boolean(onApply);

  useEffect(() => {
    if (prevVisibleRef.current && !visible) {
      generateAbortRef.current?.abort();
      generateAbortRef.current = null;
      generateInFlightRef.current = false;
      setGenerating(false);
      setProgress("queued");
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  const showRooms = kind === "rent" || kind === "sale";
  const areaRequired = kind === "land" || kind === "sale";
  const needsPropertyExtras = kind === "rent" || kind === "sale";

  const {
    cities,
    zones,
    quartiers,
    citiesLoading,
    zonesLoading,
    quartiersLoading,
    label: locationLabel,
  } = useLocationPicker(selectedCityId, selectedZoneId);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const habitatCity = isHabitatCatalogCity(selectedCity);

  const { data: amenitiesCatalog = [] } = useAmenities();
  const { data: rentCategories = [] } = usePropertyCategories();

  // ── Location availability flags ─────────────────────────────────────────────
  // A city may have no sub-zones, and a zone may have no sub-sectors.
  // Once loading settles and the array is empty, we gracefully skip that level.
  const cityIsSelected = Boolean(selectedCityId);
  const zonesUnavailable =
    cityIsSelected && !zonesLoading && zones.length === 0;
  const quartiersUnavailable =
    cityIsSelected && !quartiersLoading && quartiers.length === 0;

  const rentCategoryLabel = useCallback(
    (idStr: string): string => {
      const id = parseInt(idStr, 10);
      if (!Number.isFinite(id)) return idStr;
      const cat = rentCategories.find((c) => c.id === id);
      if (!cat) return idStr;
      const lang = (i18n.language || "en").toLowerCase();
      if (lang.startsWith("ar") && cat.name.ar) return cat.name.ar;
      if (lang.startsWith("fr") && cat.name.fr) return cat.name.fr;
      return cat.name.en || cat.name.fr || cat.name.ar || idStr;
    },
    [rentCategories, i18n.language],
  );

  const detectedLang = detectListingOutputLanguage(
    details,
    cityName,
    zoneName,
    quartierName,
    i18n.language,
  );

  // ── Step list ───────────────────────────────────────────────────────────────
  const steps: StepId[] = React.useMemo(() => {
    const s: StepId[] = ["basics"];
    if (needsPropertyExtras) s.push("extras");
    s.push("city", "zone", "quartier");
    if (kind === "land") s.push("plotNumber");
    s.push("story", "media");
    return s;
  }, [needsPropertyExtras, kind]);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  // ── Validation ──────────────────────────────────────────────────────────────
  const clearErr = (key: string) =>
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === "basics") {
      const p = parseFormattedNumber(price);
      if (!Number.isFinite(p) || p <= 0)
        errs.price = t(
          "listingAi.validation.priceRequired",
          "Enter a valid asking price.",
        );
      if (areaRequired) {
        const a = parseFormattedNumber(area);
        if (!Number.isFinite(a) || a <= 0)
          errs.area = t(
            "listingAi.validation.areaRequired",
            "Enter the area in m².",
          );
      }
    }

    if (currentStep === "extras") {
      if (!propertyType)
        errs.propertyType = t(
          "listingAi.validation.propertyTypeRequired",
          "Select a property type.",
        );
      if (kind === "sale" && !yearBuilt.trim())
        errs.yearBuilt = t(
          "listingAi.validation.yearBuiltRequired",
          "Enter the year built.",
        );
      if (amenityIds.length === 0)
        errs.amenities = t(
          "listingAi.validation.amenitiesRequired",
          "Select at least one amenity.",
        );
    }

    if (currentStep === "city" && kind === "land" && !selectedCityId)
      errs.city = t("listingAi.validation.cityRequired", "Select a city.");

    if (
      kind === "land" &&
      currentStep === "zone" &&
      !zonesLoading &&
      zones.length > 0 &&
      !selectedZoneId
    )
      errs.zone = t("listingAi.validation.zoneRequired", "Select a zone.");

    if (
      kind === "land" &&
      currentStep === "quartier" &&
      !quartiersLoading &&
      quartiers.length > 0 &&
      !selectedQuartierId
    )
      errs.quartier = t(
        "listingAi.validation.quartierRequired",
        "Select a sector.",
      );

    if (currentStep === "plotNumber" && kind === "land" && !plotNumber.trim())
      errs.plotNumber = t(
        "listingAi.validation.plotNumberRequired",
        "Enter the cadastre plot number.",
      );

    if (currentStep === "story" && details.trim().length < 10)
      errs.story = t(
        "listingAi.validation.storyMinLength",
        "Add a few more details (10+ characters).",
      );

    setErrors(errs);
    if (currentStep === "extras")
      setShowExtrasErrors(Object.keys(errs).length > 0);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    if (isLastStep) {
      void handleGenerate();
      return;
    }
    goNext();
  };

  // ── Media helpers ────────────────────────────────────────────────────────────
  const openMediaSheet = useCallback((skipApplies: boolean) => {
    setMediaSheetSkipApplies(skipApplies);
    setMediaSheetVisible(true);
  }, []);
  const closeMediaSheet = useCallback(() => setMediaSheetVisible(false), []);

  const pickPhotos = async () => {
    const result = await pickMultipleImagesNative({
      allowsEditing: false,
      base64: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const next = result.assets.map((a) => a.uri).filter(Boolean) as string[];
    if (!next.length) return;
    setLocalImages((prev) => [...prev, ...next].slice(0, 10));
  };

  const pickVideo = async () => {
    const result = await pickVideoNative();
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setVideo({
      uri: result.assets[0].uri,
      mimeType:
        result.assets[0].mimeType ?? result.assets[0].type ?? "video/mp4",
    });
  };

  const appendMediaToDraft = (imageUrls: string[], videoUrls: string[]) => {
    setReviewDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        image_urls: [...(d.image_urls ?? []), ...imageUrls].slice(0, 10),
        video_urls: [
          ...(d.video_urls ?? []),
          ...videoUrls.filter((u) => !(d.video_urls ?? []).includes(u)),
        ],
      };
    });
    setMediaPromptDismissed(true);
  };

  const draftHasMedia = (d: ListingAiDraft | null) =>
    Boolean(
      localImages.length > 0 ||
      video?.uri ||
      (d &&
        ((d.image_urls?.length ?? 0) > 0 || (d.video_urls?.length ?? 0) > 0)),
    );

  const pickPhotosInReview = async () => {
    const result = await pickMultipleImagesNative({
      allowsEditing: false,
      base64: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const picked = result.assets.map((a) => a.uri).filter(Boolean) as string[];
    if (!picked.length) return;
    setLocalImages((prev) => [...prev, ...picked].slice(0, 10));
    appendMediaToDraft(picked, []);
  };

  const pickVideoInReview = async () => {
    const result = await pickVideoNative();
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const picked = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? asset.type ?? "video/mp4",
    };
    setVideo(picked);
    appendMediaToDraft([], [picked.uri]);
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const mergeComposeIntoDraft = (draft: ListingAiDraft): ListingAiDraft => {
    const yearNum = parseInt(yearBuilt.trim(), 10);
    const categoryId =
      kind === "rent" && propertyType
        ? parseInt(propertyType, 10)
        : draft.property_category_id;
    return {
      ...draft,
      property_type:
        kind === "rent" ? "entire_place" : propertyType || draft.property_type,
      property_category_id:
        kind === "rent" && Number.isFinite(categoryId) && categoryId! > 0
          ? categoryId
          : draft.property_category_id,
      year_built:
        kind === "sale" && Number.isFinite(yearNum) && yearNum > 0
          ? yearNum
          : draft.year_built,
      amenity_ids: amenityIds.length ? amenityIds : draft.amenity_ids,
      plot_number:
        kind === "land"
          ? plotNumber.trim() || draft.plot_number?.trim() || ""
          : draft.plot_number,
    };
  };

  const handleGenerate = async () => {
    if (generateInFlightRef.current) return;
    generateInFlightRef.current = true;
    setFlowError(null);
    setGenerating(true);
    setProgress("queued");
    generateAbortRef.current?.abort();
    generateAbortRef.current = new AbortController();
    const signal = generateAbortRef.current.signal;
    try {
      if (signal.aborted) return;

      // Fix: Assign amenityNames using amenitiesCatalog and amenityIds, then use it below.
      const amenityNames = Array.isArray(amenitiesCatalog)
        ? amenitiesCatalog
            .filter((a) => amenityIds.includes(a.id))
            .map((a) => {
              const n = a.name;
              if (detectedLang === "ar") return n.ar || n.en || "";
              if (detectedLang === "fr") return n.fr || n.en || "";
              return n.en || n.fr || n.ar || "";
            })
            .filter(Boolean)
        : [];

      const rentCategoryId =
        kind === "rent" && propertyType ? parseInt(propertyType, 10) : NaN;
      const priceNum = parseFormattedNumber(price);

      const input = {
        kind,
        details: details,
        price: priceNum,
        currency: "MRU",
        area: Math.round(parseFormattedNumber(area) || 0),
        area_unit: "m²",
        city_hint: cityName.trim(),
        zone_hint: zoneName.trim(),
        quartier_hint: quartierName.trim(),
        language: detectedLang,
        ...(needsPropertyExtras && propertyType
          ? {
              property_type:
                kind === "rent"
                  ? rentCategoryLabel(propertyType)
                  : propertyType,
              ...(kind === "rent" &&
              Number.isFinite(rentCategoryId) &&
              rentCategoryId > 0
                ? { property_category_id: rentCategoryId }
                : {}),
            }
          : {}),
        ...(amenityIds.length > 0 ? { amenity_ids: amenityIds } : {}),
        ...(amenityNames.length > 0 ? { amenity_names: amenityNames } : {}),
        ...(bedrooms ? { bedrooms: parseInt(bedrooms, 10) } : {}),
        ...(bathrooms ? { bathrooms: parseInt(bathrooms, 10) } : {}),
        ...(kind === "land" && plotNumber.trim()
          ? { plot_number: plotNumber.trim() }
          : {}),
      };

      setProgress("matching_location");
      const jobId = await startListingAiJob(input);
      lastJobIdRef.current = jobId;
      const draft = await pollListingAiJob(jobId, setProgress, 180_000, signal);

      setProgress("done");
      const withLocation: ListingAiDraft = {
        ...draft,
        image_urls: localImages.length ? localImages : draft.image_urls,
        video_urls: video?.uri ? [video.uri] : draft.video_urls,
        city_id: selectedCityId ?? draft.city_id,
        city_name: cityName || draft.city_name,
        zone_id: selectedZoneId ?? draft.zone_id,
        zone_name: zoneName || draft.zone_name,
        quartier_id: selectedQuartierId ?? draft.quartier_id,
        quartier_name: quartierName || draft.quartier_name,
        plot_number:
          plotNumber.trim() || draft.plot_number?.trim() || undefined,
      };
      setReviewDraft(mergeComposeIntoDraft(withLocation));
      setPaperTypes([]);
      setSkipPapers(false);
      setMediaPromptDismissed(draftHasMedia(withLocation));
      setGenerating(false);
      setProgress("queued");
      setPhase("review");
      setFlowError(null);
    } catch (e: unknown) {
      setGenerating(false);
      setProgress("queued");
      generateAbortRef.current = null;
      generateInFlightRef.current = false;
      if (e instanceof Error && e.message.includes("cancelled")) return;
      const msg = describeListingFlowError("generate", e);
      setFlowError(msg);
      logListingFlowDebug("generate-failed", { kind, message: msg });
      Alert.alert(
        t("listingAi.errorTitle", { defaultValue: "Something went wrong" }),
        msg,
        [
          {
            text: t("listing.common.ok", { defaultValue: "OK" }),
            style: "cancel",
          },
          {
            text: t("listingAi.retry", { defaultValue: "Try again" }),
            onPress: () => void handleGenerate(),
          },
        ],
      );
    } finally {
      generateInFlightRef.current = false;
    }
  };

  // ── Publish flows ────────────────────────────────────────────────────────────
  const buildFinalDraft = (): ListingAiDraft | null => {
    if (!reviewDraft) return null;
    return mergeComposeIntoDraft({
      ...reviewDraft,
      paper_types:
        kind === "sale" || kind === "land"
          ? skipPapers
            ? []
            : paperTypes
          : undefined,
    } as ListingAiDraft);
  };

  const applyReviewDraft = () => {
    const final = buildFinalDraft();
    if (!final) return;
    void recordListingAiPublished(kind, lastJobIdRef.current);
    reset();
    onApply?.(final);
  };

  const publishRentFromReview = async () => {
    const final = buildFinalDraft();
    if (!final || !user?.accessToken || !user?.ID) {
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t("listingAi.validation.loginRequired", {
          defaultValue: "You must be logged in",
        }),
      );
      return;
    }
    const validationError = validateListingAiDraftForRentPublish(
      final,
      draftHasMedia(final),
    );
    if (validationError) {
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t(validationError),
      );
      return;
    }
    setPublishing(true);
    setPublishPercent(0);
    setFlowError(null);
    try {
      setPublishPercent(40);
      const payload = listingAiDraftToRentPayload(final, user.ID);
      logListingFlowDebug("rent-publish", {
        propertyType: payload.propertyType,
        propertyCategoryId: payload.propertyCategoryId,
        cityId: payload.city_id,
        images: Array.isArray(payload.images) ? payload.images.length : 0,
      });
      const response = await api.post("/property", payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 60_000,
      });
      setPublishPercent(100);
      if (response.status < 200 || response.status >= 300)
        throw new Error(response.data?.error || "Publish failed");
      const propertyId =
        response.data?.ID ?? response.data?.id ?? response.data?.property?.id;
      await queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      await queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
      void recordListingAiPublished(kind, lastJobIdRef.current);
      reset();
      onClose();
      if (propertyId) onPublished?.(Number(propertyId));
      Alert.alert(
        t("listingAi.listedTitle", { defaultValue: "Listed!" }),
        t("listingAi.listedSub", {
          defaultValue: "Your property is now live.",
        }),
      );
    } catch (e: unknown) {
      const msg = describeListingFlowError("rent-publish", e);
      setFlowError(msg);
      logListingFlowDebug("rent-publish-failed", { message: msg });
      Alert.alert(
        t("listingAi.publishFailedTitle", {
          defaultValue: "Could not publish",
        }),
        msg,
        [
          {
            text: t("listing.common.ok", { defaultValue: "OK" }),
            style: "cancel",
          },
          {
            text: t("listingAi.retry", { defaultValue: "Try again" }),
            onPress: () => void publishRentFromReview(),
          },
        ],
      );
    } finally {
      setPublishing(false);
      setPublishPercent(0);
    }
  };

  const publishSaleFromReview = async () => {
    if (publishing) return;
    const final = buildFinalDraft();
    if (!final || !user?.accessToken) {
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t("listingAi.validation.loginRequired", {
          defaultValue: "You must be logged in",
        }),
      );
      return;
    }
    const validationError = validateListingAiDraftForSalePublish(
      final,
      draftHasMedia(final),
    );
    if (validationError) {
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t(validationError),
      );
      return;
    }
    setFlowError(null);
    setPublishing(true);
    try {
      const {
        form,
        images,
        video: videoAsset,
      } = listingAiDraftToPropertySalePublish(final, paperTypes, skipPapers, {
        localImages,
        localVideo: video,
      });
      const previewUri =
        localImages[0] || images[0] || video?.uri || videoAsset?.uri;
      startBackgroundPublish({
        accessToken: user.accessToken,
        form,
        images,
        video: videoAsset,
        meta: {
          title: form.title,
          previewUri,
          price: form.price,
          city: form.city,
          source: "ai",
          listingAiJobId: lastJobIdRef.current,
        },
      });
      reset();
      onClose();
      onPublished?.(0);
    } catch (e: unknown) {
      const msg = describeListingFlowError("sale-publish", e);
      setFlowError(msg);
      Alert.alert(
        t("listingAi.publishFailedTitle", {
          defaultValue: "Could not publish",
        }),
        msg,
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleConfirmReview = () => {
    if (!reviewDraft || uploadingMedia || publishing) return;
    if (kind === "land") {
      if (!reviewDraft.city_id) {
        Alert.alert(
          t("listingAi.missingLocationTitle", {
            defaultValue: "Missing location",
          }),
          t("listingAi.reviewSelectCity", {
            defaultValue: "Select a city for this listing.",
          }),
        );
        return;
      }
      if (!(reviewDraft.plot_number ?? plotNumber).trim()) {
        Alert.alert(
          t("listingAi.plotTitle", { defaultValue: "Plot number" }),
          t("listingAi.validation.plotNumberRequired", {
            defaultValue: "Enter the cadastre plot number.",
          }),
        );
        return;
      }
      if (!reviewDraft.quartier_id) {
        Alert.alert(
          t("common.error", { defaultValue: "Error" }),
          t("listingAi.validation.sectorRequired", {
            defaultValue: "Select a sector.",
          }),
        );
        return;
      }
    }
    if (!draftHasMedia(reviewDraft) && !mediaPromptDismissed) {
      openMediaSheet(true);
      return;
    }
    if (kind === "sale") {
      void publishSaleFromReview();
      return;
    }
    if (kind === "rent") {
      if (embeddedInForm) {
        applyReviewDraft();
        return;
      }
      void publishRentFromReview();
      return;
    }
    applyReviewDraft();
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setPhase("compose");
    setStepIndex(0);
    setPrice("");
    setArea("");
    setBedrooms("");
    setBathrooms("");
    setPropertyType("");
    setYearBuilt("");
    setAmenityIds([]);
    setSelectedCityId(undefined);
    setSelectedZoneId(undefined);
    setSelectedQuartierId(undefined);
    setCityName("");
    setZoneName("");
    setQuartierName("");
    setCitySearch("");
    setZoneSearch("");
    setQuartierSearch("");
    setPlotNumber("");
    setDetails("");
    setLocalImages([]);
    setVideo(null);
    setErrors({});
    setShowExtrasErrors(false);
    setGenerating(false);
    setProgress("queued");
    setReviewDraft(null);
    setPaperTypes([]);
    setSkipPapers(false);
    setMediaPromptDismissed(false);
    setUploadingMedia(false);
    setMediaSheetVisible(false);
    setMediaSheetSkipApplies(false);
    setPublishing(false);
    setPublishPercent(0);
    setFlowError(null);
  };

  const handleClose = () => {
    if (generating || publishing) return;
    reset();
    onClose();
  };

  const publishLabel = embeddedInForm
    ? t("listingAi.applyToListing", { defaultValue: "Apply to listing" })
    : kind === "sale" || kind === "rent"
      ? t("listingAi.publishListing", { defaultValue: "Publish listing" })
      : t("listingAi.applyToListing", { defaultValue: "Apply to listing" });

  const showGeneratingOverlay = generating && progress !== "uploading";

  // ── Zone / quartier disabled logic ────────────────────────────────────────────
  // Continue is disabled only while loading OR when items exist but nothing is selected.
  const zoneBtnDisabled = zonesLoading;
  const quartierBtnDisabled = quartiersLoading;
  const locationOptionalForKind = kind === "sale" || kind === "rent";

  // ── Step content map ─────────────────────────────────────────────────────────
  const stepContent: Record<
    StepId,
    {
      title: string;
      subtitle?: string;
      body: React.ReactNode;
      footer: React.ReactNode;
    }
  > = {
    // ── 1. Price & size ────────────────────────────────────────────────────────
    basics: {
      title: t("listingAi.basicsTitle", { defaultValue: "Price & size" }),
      subtitle: t("listingAi.basicsSub", {
        defaultValue:
          kind === "land"
            ? "Set the asking price and plot area."
            : "Set the asking price and key figures.",
      }),
      body: (
        <>
          <ListingAiComposeHero
            price={price}
            onPriceChange={(v) => {
              setPrice(v);
              clearErr("price");
            }}
            area={area}
            onAreaChange={(v) => {
              setArea(v);
              clearErr("area");
            }}
            areaRequired={areaRequired}
            showRooms={showRooms}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            onBedroomsChange={setBedrooms}
            onBathroomsChange={setBathrooms}
            disabled={generating}
          />
          {errors.price && <FieldError message={errors.price} />}
          {errors.area && <FieldError message={errors.area} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
        />
      ),
    },

    // ── 2. Property details (sale / rent only) ─────────────────────────────────
    extras: {
      title: t("listingAi.extrasTitle", { defaultValue: "Property details" }),
      subtitle: t("listingAi.extrasSub", {
        defaultValue:
          "Type, year, and features help AI write an accurate description.",
      }),
      body: (
        <>
          <ListingAiComposeExtras
            kind={kind}
            propertyType={propertyType}
            onPropertyTypeChange={(v) => {
              setPropertyType(v);
              clearErr("propertyType");
            }}
            yearBuilt={yearBuilt}
            onYearBuiltChange={(v) => {
              setYearBuilt(v);
              clearErr("yearBuilt");
            }}
            amenityIds={amenityIds}
            onAmenityIdsChange={(ids) => {
              setAmenityIds(ids);
              clearErr("amenities");
            }}
            showMissingHints={showExtrasErrors}
            disabled={generating}
          />
          {errors.propertyType && <FieldError message={errors.propertyType} />}
          {errors.yearBuilt && <FieldError message={errors.yearBuilt} />}
          {errors.amenities && <FieldError message={errors.amenities} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
        />
      ),
    },

    // ── 3. City ────────────────────────────────────────────────────────────────
    city: {
      title: t("listingAi.cityTitle", { defaultValue: "Which city?" }),
      subtitle: t("listingAi.citySubOptional", {
        defaultValue: "Optional — select a city or skip this step.",
      }),
      body: (
        <>
          <ListingAiLocationPickerStep
            items={cities}
            selectedId={selectedCityId}
            search={citySearch}
            onSearchChange={setCitySearch}
            onSelect={(item) => {
              const name = locationLabel(item);
              setSelectedCityId(item.id);
              setCityName(name);
              setSelectedZoneId(undefined);
              setSelectedQuartierId(undefined);
              setZoneName("");
              setQuartierName("");
              setZoneSearch("");
              setQuartierSearch("");
              clearErr("city");
            }}
            leadingOption={
              locationOptionalForKind
                ? {
                    key: "skip-city",
                    label: t("listingAi.skipCity", {
                      defaultValue: "Skip — no specific city",
                    }),
                    selected: !selectedCityId,
                    onPress: () => {
                      setSelectedCityId(undefined);
                      setCityName("");
                      setSelectedZoneId(undefined);
                      setSelectedQuartierId(undefined);
                      setZoneName("");
                      setQuartierName("");
                      clearErr("city");
                    },
                  }
                : undefined
            }
            label={locationLabel}
            loading={citiesLoading}
            disabled={generating}
          />
          {errors.city && <FieldError message={errors.city} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
          disabled={generating}
        />
      ),
    },

    // ── 4. Zone ────────────────────────────────────────────────────────────────
    // If the chosen city has no zones, we show a confirmation notice and let the
    // user continue without making a selection.
    zone: {
      title: t("listingAi.zoneTitle", { defaultValue: "Which zone?" }),
      subtitle: locationOptionalForKind
        ? t("listingAi.zoneSubOptional", {
            defaultValue: "Optional — pick a zone or continue without one.",
          })
        : habitatCity
        ? t("listingAi.zoneSubHabitat", {
            defaultValue: "Pick a district (cadastre plan) in {{city}}.",
            city: cityName,
          })
        : cityName
          ? t("listingAi.zoneSub", {
              defaultValue: "Narrow down the area within {{city}}.",
              city: cityName,
            })
          : t("listingAi.zoneSubFallback", {
              defaultValue: "Narrow down the area.",
            }),
      body:
        locationOptionalForKind && !selectedCityId ? (
          <LocationSkipNotice
            heading={t("listingAi.locationOptionalHeading", {
              defaultValue: "Location optional",
            })}
            body={t("listingAi.locationOptionalBody", {
              defaultValue:
                "No city selected. Tap Continue to skip zone and sector too.",
            })}
          />
        ) : zonesUnavailable ? (
        <LocationSkipNotice
          heading={t("listingAi.noZonesHeading", {
            defaultValue: "Location confirmed",
          })}
          body={t("listingAi.noZonesBody", {
            defaultValue: `${cityName} has no registered sub-zones. Tap Continue to proceed.`,
            city: cityName,
          })}
        />
      ) : (
        <>
          <ListingAiLocationPickerStep
            items={zones}
            selectedId={selectedZoneId}
            search={zoneSearch}
            onSearchChange={setZoneSearch}
            onSelect={(item) => {
              const name = locationLabel(item);
              setSelectedZoneId(item.id);
              setZoneName(name);
              setSelectedQuartierId(undefined);
              setQuartierName("");
              setQuartierSearch("");
              clearErr("zone");
            }}
            leadingOption={
              locationOptionalForKind
                ? {
                    key: "skip-zone",
                    label: t("listingAi.skipZone", {
                      defaultValue: "Skip — no specific zone",
                    }),
                    selected: !selectedZoneId,
                    onPress: () => {
                      setSelectedZoneId(undefined);
                      setZoneName("");
                      setSelectedQuartierId(undefined);
                      setQuartierName("");
                      clearErr("zone");
                    },
                  }
                : undefined
            }
            label={locationLabel}
            loading={zonesLoading}
            disabled={generating || !selectedCityId}
            emptyText={t("listingAi.selectCityFirst", {
              defaultValue: "Select a city first",
            })}
          />
          {errors.zone && <FieldError message={errors.zone} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
          disabled={zoneBtnDisabled}
        />
      ),
    },

    // ── 5. Quartier / sector ───────────────────────────────────────────────────
    // Same graceful skip when no quartiers exist for the selected zone.
    quartier: {
      title: t("listingAi.quartierTitle", { defaultValue: "Which sector?" }),
      subtitle: locationOptionalForKind
        ? t("listingAi.quartierSubOptional", {
            defaultValue: "Optional — pick a sector or continue without one.",
          })
        : habitatCity
        ? t("listingAi.quartierSubHabitat", {
            defaultValue: "Pick a sector within {{zone}} (cadastre).",
            zone: zoneName,
          })
        : zoneName
          ? t("listingAi.quartierSub", {
              defaultValue: "Pick the sector within {{zone}}.",
              zone: zoneName,
            })
          : t("listingAi.quartierSubFallback", {
              defaultValue: "Final location detail.",
            }),
      body:
        locationOptionalForKind && !selectedCityId && !selectedZoneId ? (
          <LocationSkipNotice
            heading={t("listingAi.locationOptionalHeading", {
              defaultValue: "Location optional",
            })}
            body={t("listingAi.locationOptionalBody", {
              defaultValue:
                "No city selected. Tap Continue to skip zone and sector too.",
            })}
          />
        ) : locationOptionalForKind && !selectedZoneId ? (
          <LocationSkipNotice
            heading={t("listingAi.locationOptionalHeading", {
              defaultValue: "Location optional",
            })}
            body={t("listingAi.sectorOptionalBody", {
              defaultValue:
                "No zone selected. Tap Continue to skip sector too.",
            })}
          />
        ) : quartiersUnavailable ? (
        <LocationSkipNotice
          heading={t("listingAi.noQuartiersHeading", {
            defaultValue: "Location confirmed",
          })}
          body={
            zoneName
              ? t("listingAi.noQuartiersBody", {
                  defaultValue: `${zoneName} has no registered sectors. Tap Continue to proceed.`,
                  zone: zoneName,
                })
              : t("listingAi.noQuartiersBodyCity", {
                  defaultValue: `${cityName} has no registered sectors. Tap Continue to proceed.`,
                  city: cityName,
                })
          }
        />
      ) : (
        <>
          <ListingAiLocationPickerStep
            items={quartiers}
            selectedId={selectedQuartierId}
            search={quartierSearch}
            onSearchChange={setQuartierSearch}
            onSelect={(item) => {
              setSelectedQuartierId(item.id);
              setQuartierName(locationLabel(item));
              clearErr("quartier");
            }}
            leadingOption={
              locationOptionalForKind
                ? {
                    key: "skip-quartier",
                    label: t("listingAi.skipQuartier", {
                      defaultValue: "Skip — no specific sector",
                    }),
                    selected: !selectedQuartierId,
                    onPress: () => {
                      setSelectedQuartierId(undefined);
                      setQuartierName("");
                      clearErr("quartier");
                    },
                  }
                : undefined
            }
            label={locationLabel}
            loading={quartiersLoading}
            disabled={generating || !selectedZoneId}
            emptyText={t("listingAi.selectZoneFirst", {
              defaultValue: "Select a zone first",
            })}
          />
          {errors.quartier && <FieldError message={errors.quartier} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
          disabled={quartierBtnDisabled}
        />
      ),
    },

    // ── 6. Plot number (land only) ─────────────────────────────────────────────
    plotNumber: {
      title: t("listingAi.plotTitle", { defaultValue: "Plot number" }),
      subtitle: t("listingAi.plotSub", {
        defaultValue: "The cadastre reference for this land parcel.",
      }),
      body: (
        <>
          <ListingAiPlotNumberStep
            value={plotNumber}
            onChange={(v) => {
              setPlotNumber(v);
              clearErr("plotNumber");
            }}
            sectorName={quartierName || undefined}
            disabled={generating}
          />
          {errors.plotNumber && <FieldError message={errors.plotNumber} />}
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
        />
      ),
    },

    // ── 7. Story ───────────────────────────────────────────────────────────────
    story: {
      title: t("listingAi.storyTitle", { defaultValue: "Tell us about it" }),
      subtitle: t("listingAi.storySub", {
        defaultValue:
          "A few sentences — AI turns your notes into a polished listing.",
      }),
      body: (
        <>
          <TextInput
            style={sy.input}
            multiline
            placeholder={t("listingAi.storyPlaceholder", {
              defaultValue:
                "Location, condition, nearby amenities, what makes it special…",
            })}
            placeholderTextColor="#B0B0B0"
            value={details}
            onChangeText={(v) => {
              setDetails(v);
              clearErr("story");
            }}
            editable={!generating}
            textAlignVertical="top"
          />
          <View style={sy.meta}>
            <Text style={sy.lang}>
              {t("listingAi.outputLanguage", {
                defaultValue: "AI will write in: {{lang}}",
                lang: listingAiLanguageLabel(detectedLang),
              })}
            </Text>
            <Text style={sy.chars}>{details.length} chars</Text>
          </View>
          {errors.story && <FieldError message={errors.story} />}
          <ListingAiSuggestionChips
            kind={kind}
            disabled={generating}
            onSelect={(text) => {
              setDetails(text);
              clearErr("story");
            }}
          />
        </>
      ),
      footer: (
        <PrimaryBtn
          label={t("common.continue", { defaultValue: "Continue" })}
          onPress={handleContinue}
        />
      ),
    },

    // ── 8. Media ───────────────────────────────────────────────────────────────
    media: {
      title: t("listingAi.mediaTitle", { defaultValue: "Add photos" }),
      subtitle: t("listingAi.mediaSub", {
        defaultValue: "Optional — listings with photos get far more views.",
      }),
      body: (
        <View>
          {/* ── Photo row ── */}
          <TouchableOpacity
            style={md.row}
            onPress={pickPhotos}
            disabled={generating}
            activeOpacity={0.7}
          >
            <View style={md.rowLeft}>
              <View style={md.iconBox}>
                <Text style={md.iconChar}>+</Text>
              </View>
              <View style={md.rowText}>
                <Text style={md.rowTitle}>
                  {t("listingAi.photos", { defaultValue: "Photos" })}
                </Text>
                <Text style={md.rowSub}>
                  {localImages.length > 0
                    ? `${localImages.length} added · tap to add more`
                    : "Up to 10 photos"}
                </Text>
              </View>
            </View>
            <Text style={md.chevron}>›</Text>
          </TouchableOpacity>

          {/* ── Video row (sale / land) ── */}
          {(kind === "sale" || kind === "land") && (
            <TouchableOpacity
              style={md.row}
              onPress={pickVideo}
              disabled={generating}
              activeOpacity={0.7}
            >
              <View style={md.rowLeft}>
                <View style={[md.iconBox, video ? md.iconBoxDone : null]}>
                  <Text style={[md.iconChar, video ? md.iconCharDone : null]}>
                    ▶
                  </Text>
                </View>
                <View style={md.rowText}>
                  <Text style={md.rowTitle}>
                    {t("listingAi.video", { defaultValue: "Video tour" })}
                  </Text>
                  <Text style={md.rowSub}>
                    {video ? "Video added" : "Optional"}
                  </Text>
                </View>
              </View>
              <Text style={md.chevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── Thumbnail strip ── */}
          {localImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={md.thumbRow}
            >
              {localImages.map((uri, i) => (
                <View key={`${i}-${uri.slice(0, 12)}`} style={md.thumbWrap}>
                  <Image source={{ uri }} style={md.thumb} />
                  {i === 0 && (
                    <View style={md.coverBadge}>
                      <Text style={md.coverLabel}>Cover</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ),
      footer: (
        <>
          <PrimaryBtn
            label={
              localImages.length > 0 || video
                ? t("listingAi.generateListing", {
                    defaultValue: "Generate listing",
                  })
                : t("listingAi.skipAndGenerate", {
                    defaultValue: "Skip & generate",
                  })
            }
            onPress={handleContinue}
          />
          {(localImages.length > 0 || video) && (
            <GhostBtn
              label={t("listingAi.skipForNow", {
                defaultValue: "Skip photos for now",
              })}
              onPress={() => {
                setLocalImages([]);
                setVideo(null);
                handleContinue();
              }}
            />
          )}
        </>
      ),
    },
  };

  const step = stepContent[currentStep];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (generating || publishing) return;
        handleClose();
      }}
    >
      <View style={rt.wrap}>
        {/* ════════ COMPOSE PHASE ════════ */}
        {phase === "compose" && step && (
          <StepShell
            title={step.title}
            subtitle={step.subtitle}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onBack={stepIndex > 0 ? goBack : undefined}
            onClose={handleClose}
            footer={step.footer}
          >
            {step.body}
          </StepShell>
        )}

        {/* ════════ REVIEW PHASE ════════ */}
        {phase === "review" && reviewDraft && (
          <View style={rt.fill}>
            {/* Nav */}
            <View style={rv.nav}>
              <TouchableOpacity
                onPress={() => setPhase("compose")}
                style={sh.navBtn}
                hitSlop={HIT}
                activeOpacity={0.6}
                disabled={uploadingMedia || publishing}
              >
                <BackIcon />
              </TouchableOpacity>
              <Text style={rv.navTitle}>
                {t("listingAi.reviewTitle", { defaultValue: "Review listing" })}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={sh.navBtn}
                hitSlop={HIT}
                activeOpacity={0.6}
                disabled={publishing}
              >
                <XIcon />
              </TouchableOpacity>
            </View>
            <View style={rv.divider} />

            {/* Body */}
            <KeyboardAwareScrollView
              style={rt.fill}
              contentContainerStyle={rv.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid
              enableAutomaticScroll
              extraScrollHeight={Platform.OS === "ios" ? 32 : 64}
            >
              <Text style={rv.sub}>
                {t("listingAi.reviewSub", {
                  defaultValue: "Check every detail before publishing.",
                })}
              </Text>

              {!mediaPromptDismissed && !draftHasMedia(reviewDraft) && (
                <ListingAiMediaPrompt
                  kind={kind}
                  imageUrls={reviewDraft.image_urls ?? []}
                  videoUrls={reviewDraft.video_urls ?? []}
                  uploading={uploadingMedia}
                  onAddPhotos={() => openMediaSheet(false)}
                  onAddVideo={
                    kind === "sale" || kind === "land"
                      ? () => openMediaSheet(false)
                      : undefined
                  }
                  onContinueWithout={() => setMediaPromptDismissed(true)}
                />
              )}

              <ListingAiMediaThumbs imageUrls={reviewDraft.image_urls ?? []} />

              <TouchableOpacity
                style={rv.addMediaBtn}
                onPress={() => openMediaSheet(false)}
                disabled={uploadingMedia}
                activeOpacity={0.6}
              >
                <Text style={rv.addMediaLabel}>
                  {draftHasMedia(reviewDraft)
                    ? t("listingAi.addMorePhotos", {
                        defaultValue: "Add more photos",
                      })
                    : t("listingAi.mediaPromptAddPhotos", {
                        defaultValue: "Add photos",
                      })}
                </Text>
              </TouchableOpacity>

              <ListingAiReviewStep
                kind={kind}
                draft={reviewDraft}
                onChange={setReviewDraft}
                paperTypes={paperTypes}
                onPaperTypesChange={setPaperTypes}
                skipPapers={skipPapers}
                onSkipPapersChange={setSkipPapers}
              />
            </KeyboardAwareScrollView>

            {/* Footer */}
            <View style={sh.footer}>
              <PrimaryBtn
                label={publishLabel}
                onPress={handleConfirmReview}
                disabled={uploadingMedia || publishing}
              />
            </View>
          </View>
        )}

        {/* ════════ OVERLAYS ════════ */}
        <ListingAiGeneratingOverlay
          visible={showGeneratingOverlay}
          progress={progress}
        />

        <ListingAiUploadSheet
          visible={
            !publishing &&
            (uploadingMedia || (generating && progress === "uploading"))
          }
          variant={uploadingMedia ? "review" : "compose"}
        />

        {publishing && (
          <View style={rt.overlay}>
            <View style={rt.overlayCard}>
              <PublishRingProgress percent={publishPercent} size={100} />
              <Text style={rt.overlayTitle}>
                {t("listingAi.publishing", { defaultValue: "Publishing…" })}
              </Text>
              <Text style={rt.overlaySub}>
                {t("listingAi.pleaseWait", { defaultValue: "Please wait" })}
              </Text>
            </View>
          </View>
        )}

        <ListingAiMediaSheet
          visible={mediaSheetVisible}
          kind={kind}
          uploading={uploadingMedia}
          skipAppliesListing={mediaSheetSkipApplies}
          onClose={closeMediaSheet}
          onAddPhotos={pickPhotosInReview}
          onAddVideo={
            kind === "sale" || kind === "land" ? pickVideoInReview : undefined
          }
          onContinueWithout={() => {
            setMediaPromptDismissed(true);
            if (mediaSheetSkipApplies) {
              if (kind === "sale") void publishSaleFromReview();
              else if (kind === "rent" && embeddedInForm) applyReviewDraft();
              else if (kind === "rent") void publishRentFromReview();
              else applyReviewDraft();
            }
          }}
        />
      </View>
    </Modal>
  );
}

// ─── Story step styles ────────────────────────────────────────────────────────

const sy = StyleSheet.create({
  input: {
    minHeight: 160,
    fontSize: 16,
    lineHeight: 24,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  lang: {
    fontSize: 12,
    fontWeight: "600",
    color: LAI.brand,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chars: { fontSize: 12, color: "#B0B0B0" },
});

// ─── Media step styles ────────────────────────────────────────────────────────

const md = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EBEBEB",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDone: { backgroundColor: LAI.brandSoft },
  iconChar: {
    fontSize: 20,
    color: "#999999",
    fontWeight: "300",
    lineHeight: 24,
  },
  iconCharDone: { color: LAI.brand },
  rowText: { gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: "500", color: "#1A1A1A" },
  rowSub: { fontSize: 13, color: "#B0B0B0" },
  chevron: { fontSize: 22, color: "#C8C8C8" },
  thumbRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 20,
    paddingBottom: 4,
  },
  thumbWrap: { position: "relative" },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

// ─── Review styles ────────────────────────────────────────────────────────────

const rv = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 14,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  sub: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 21,
    marginBottom: 20,
  },
  addMediaBtn: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 4,
  },
  addMediaLabel: {
    fontSize: 15,
    color: LAI.brand,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

// ─── Root / overlay styles ────────────────────────────────────────────────────

const rt = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#FFFFFF", position: "relative" },
  fill: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    minWidth: 200,
  },
  overlayTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  overlaySub: {
    fontSize: 14,
    color: "#717171",
  },
});
