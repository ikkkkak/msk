import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  FlatList,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
  Keyboard,
  Animated as RNAnimated,
  Easing,
  AppState,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedReaction,
  runOnJS,
  interpolate,
  Extrapolate,
  useDerivedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import MapView, { Polygon } from "react-native-maps";
import { getMapProvider } from "../utils/mapProvider";
import { getPlatformMapViewConfig } from "../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "../components/map/PlatformMapTileLayer";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetHandleProps,
  useBottomSheetInternal,
} from "../components/CompatBottomSheet";
import { List as PhosphorListIcon } from "phosphor-react-native";
import LottieView from "lottie-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  MapUIStateProvider,
  useMapUIState,
} from "../contexts/MapUIStateContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../components/Screen";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../services/api";
import { habitatApi } from "../services/habitatApi";
import { endpoints } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../hooks/useUser";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";
import { useHostShareConsent } from "../hooks/useHostShareConsent";
import { MessagesTabUnreadIndicator } from "../components/MessagesTabUnreadIndicator";
import { HostShareConsentSheet } from "../components/HostShareConsentSheet";
import { HostShareConsentToast } from "../components/HostShareConsentToast";
import { hostShareConsentStorage } from "../constants/hostShareConsentStorage";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { shouldStripPlaceholderOnNewFilter } from "../utils/searchQueryPlaceholder";
import { rentDiscoveryToSearchFilters } from "../utils/rentDiscoveryFiltersKey";
import { filterPublicRentProperties } from "../utils/rentPropertyVisibility";
import { resolvePropertyImages } from "../utils/propertyImages";
import { landmarkFeedFiltersKey } from "../utils/landmarkFeedFiltersKey";
import { rentSearchFiltersKey } from "../utils/rentSearchFiltersKey";
import {
  dedupeByNumericId,
  getLandmarkId,
  getRentPropertyId,
  useStableListOrder,
} from "../hooks/useStableFilteredList";
import { onboardingStorage } from "../constants/onboardingStorage";
// Define PropertySearchFilters interface
interface PropertySearchFilters {
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  yearBuilt?: number;
}
import { Card } from "../components/Card";
import { MapLandmarks } from "../components/MapLandmarks";
import { LandmarkCard } from "../components/LandmarkCard";
import { HomeDiscoveryPropertyCard } from "../components/AirbnbHomeDiscovery";
import { useRentTabFilters } from "../hooks/useRentTabFilters";
import { MapCenterControls } from "../components/map/MapCenterControls";
import { PropertySaleFilterBar } from "../components/PropertySaleFilterBar";
import { usePropertyCategories } from "../hooks/queries/useCategories";
import {
  categoryEnglishName,
  categoryIdForSalePropertyType,
} from "../utils/localizedCategoryName";
import { LandmarkFilterBar } from "../components/LandmarkFilterBar";
import {
  CadastreFilterSheet,
  type CadastreFilterSheetRef,
} from "../components/habitat/CadastreFilterSheet";
import { SearchCadastreMapView } from "../components/habitat/SearchCadastreMapView";
import {
  useHabitatCadastre,
  showcaseCadastreOnMapOpen,
} from "../hooks/useHabitatCadastre";
import type { CadastreMapHandle } from "../utils/habitatCadastreMapRef";
import type { HabitatPlot } from "../types/habitat";
import { useMapLandmarks } from "../hooks/useMapLandmarks";
import {
  focusMapOnLandmark,
  landmarkMapPinKey,
  regionForAllLandmarks,
  type MapLandmarkRecord,
} from "../utils/landmarkMapMarkers";
import {
  formatLandClusterCount,
  LAND_CLUSTER_MAX_ZOOM,
  regionForLandCluster,
  type LandMapCluster,
} from "../utils/landmarkMapClustering";
import { PropertyDetailCard } from "../components/PropertyDetailCard";
import PropertySaleList from "./components/PropertySaleList";
import { HostOnboardingSheet } from "../components/host-onboarding/HostOnboardingSheet";
import { BecomeHostCard } from "../components/host-onboarding/BecomeHostCard";
import { crashReporting } from "../services/crashReporting";
import { instantCardStore } from "../stores/instantCardStore";
import { logElapsedSinceTap } from "../utils/debugMarkerTap";
// Translation hooks removed - backend handles all translations

/** Stable empty array for PropertySaleList favorites (avoids new [] each render). */
const EMPTY_SALE_FAVORITES: number[] = [];

// ============================================================================
// DISTRICT BOUNDARIES DATA - PLACEHOLDER
// ============================================================================
// TODO: Replace this array with your actual district boundaries data
// Format: Array of objects with { name: string, coordinates: Array<{latitude: number, longitude: number}> }
// Example:
// const DISTRICTS = [
//   {
//     name: "District Name",
//     coordinates: [
//       { latitude: 18.xxx, longitude: -15.xxx },
//       { latitude: 18.xxx, longitude: -15.xxx },
//       // ... more coordinates
//     ],
//   },
//   // ... more districts
// ];
const DISTRICTS: Array<{
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
}> = [
  {
    name: "Tevragh Zeina",
    coordinates: [
      { latitude: 18.085292626956782, longitude: -15.990862627864203 },
      { latitude: 18.085257615997904, longitude: -15.991347563451459 },
      { latitude: 18.084673022948213, longitude: -15.992762180261323 },
      { latitude: 18.084398762390567, longitude: -15.99387633597032 },
      { latitude: 18.084127426367644, longitude: -15.995232925587159 },
      { latitude: 18.084045733719776, longitude: -15.99648823136663 },
      { latitude: 18.08513930116681, longitude: -16.000785794423862 },
      { latitude: 18.09749266891977, longitude: -16.01915612630061 },
      { latitude: 18.098208493517923, longitude: -16.01951199481589 },
      { latitude: 18.110262057627466, longitude: -16.022970649814294 },
      { latitude: 18.11791092225652, longitude: -16.02277144445604 },
      { latitude: 18.128591768093084, longitude: -16.01221447897727 },
      { latitude: 18.130091372773027, longitude: -16.00344159986191 },
      { latitude: 18.133354586560703, longitude: -16.004184982532813 },
      { latitude: 18.135649643629833, longitude: -15.99596734269708 },
      { latitude: 18.132692307824033, longitude: -15.988550532839902 },
      { latitude: 18.12420958328361, longitude: -15.986748988961407 },
      { latitude: 18.12183939157068, longitude: -15.98666285939675 },
      { latitude: 18.11853649369222, longitude: -15.975230867566623 },
      { latitude: 18.120338835949454, longitude: -15.970572121411882 },
      { latitude: 18.11641814284478, longitude: -15.966971556072743 },
      { latitude: 18.11174866458607, longitude: -15.96587855628597 },
      { latitude: 18.106310749405775, longitude: -15.965658532677251 },
      { latitude: 18.101518299915075, longitude: -15.966560469661427 },
      { latitude: 18.101310469345762, longitude: -15.96448523042655 },
      { latitude: 18.097635748788264, longitude: -15.966406261008228 },
      { latitude: 18.095059957532065, longitude: -15.966139975797002 },
      { latitude: 18.094917184585967, longitude: -15.966592597507189 },
      { latitude: 18.092470124516048, longitude: -15.966212042942681 },
      { latitude: 18.092794830230606, longitude: -15.968854386013806 },
      { latitude: 18.097345889167322, longitude: -15.9680047073246 },
      { latitude: 18.09802011161695, longitude: -15.968492988206272 },
      { latitude: 18.098392556334137, longitude: -15.96899131603512 },
      { latitude: 18.099966786356447, longitude: -15.974718160977103 },
      { latitude: 18.092559872426236, longitude: -15.976019619586525 },
      { latitude: 18.09311599546412, longitude: -15.979366055505626 },
      { latitude: 18.097019691146695, longitude: -15.983174750475602 },
      { latitude: 18.095656099672038, longitude: -15.985637786943816 },
      { latitude: 18.092696587801584, longitude: -15.989753415837153 },
      { latitude: 18.092353822521996, longitude: -15.989556201480676 },
      { latitude: 18.088665535355577, longitude: -15.9900806380445 },
      { latitude: 18.085816475488944, longitude: -15.989581022733551 },
      { latitude: 18.085292626956782, longitude: -15.990862627864203 },
    ],
  },
  {
    name: "Dar Naim",
    coordinates: [
      { latitude: 18.158426870340293, longitude: -15.900444991271211 },
      { latitude: 18.15557715279435, longitude: -15.89624118674888 },
      { latitude: 18.135761982831507, longitude: -15.900439031831166 },
      { latitude: 18.121406446579105, longitude: -15.905758681916874 },
      { latitude: 18.08713085803071, longitude: -15.926735932958765 },
      { latitude: 18.081323631351516, longitude: -15.932640073200869 },
      { latitude: 18.08054673641729, longitude: -15.933866475131701 },
      { latitude: 18.074253505342206, longitude: -15.934832400860222 },
      { latitude: 18.07105659325174, longitude: -15.935837849569904 },
      { latitude: 18.079132905464743, longitude: -15.965061606025113 },
      { latitude: 18.08845976997436, longitude: -15.960957837005708 },
      { latitude: 18.130478254137273, longitude: -15.927882757493427 },
      { latitude: 18.135284591961206, longitude: -15.924554602427676 },
      { latitude: 18.158426870340293, longitude: -15.900444991271211 },
    ],
  },
  // {
  //   name: "Arafat",
  //   coordinates: [
  //     { latitude: 18.031870178121583, longitude: -15.973218473982287 },
  //     { latitude: 18.030500136852005, longitude: -15.964762199094842 },
  //     { latitude: 18.029314317842648, longitude: -15.964371062335081 },
  //     { latitude: 18.03098887925344, longitude: -15.955842023308302 },
  //     { latitude: 18.029842868857628, longitude: -15.951761770355272 },
  //     { latitude: 18.064976805946085, longitude: -15.930315853258318 },
  //     { latitude: 18.066606152928763, longitude: -15.93036080138485 },
  //     { latitude: 18.068373724797727, longitude: -15.936688133061338 },
  //     { latitude: 18.050678438076734, longitude: -15.93234900512523 },
  //     { latitude: 18.07104427350708, longitude: -15.935819623694742 },
  //     { latitude: 18.079087056893723, longitude: -15.96531771327986 },
  //     { latitude: 18.03389942678162, longitude: -15.97288166785128 },
  //     { latitude: 18.03491307185836, longitude: -15.97268586868228 },
  //     { latitude: 18.03584208856138, longitude: -15.97255959185135 },
  //     { latitude: 18.0369034601724, longitude: -15.972373833664948 },
  //     { latitude: 18.038209539798274, longitude: -15.972414261759198 },
  //     { latitude: 18.03991442227408, longitude: -15.972631158991108 },
  //     { latitude: 18.036803210952684, longitude: -15.972392242133845 },
  //     { latitude: 18.040739359448306, longitude: -15.972855286129143 },
  //     { latitude: 18.042382347821086, longitude: -15.973166172155993 },
  //     { latitude: 18.04381909077598, longitude: -15.973549357258847 },
  //     { latitude: 18.046218219106496, longitude: -15.974069910610845 },
  //     { latitude: 18.048990769744243, longitude: -15.97464436766945 },
  //     { latitude: 18.05286086679941, longitude: -15.97555533603386 },
  //     { latitude: 18.055088024351523, longitude: -15.975389048158776 },
  //     { latitude: 18.05695771507954, longitude: -15.975049242499303 },
  //     { latitude: 18.058287660995422, longitude: -15.974413059475843 },
  //     { latitude: 18.067185130499364, longitude: -15.970497733392525 },
  //     { latitude: 18.06907309361817, longitude: -15.969703087501307 },
  //     { latitude: 18.07143437252186, longitude: -15.968639859029697 },
  //     { latitude: 18.07531382017269, longitude: -15.967009896104175 },
  //     { latitude: 18.075239630440173, longitude: -15.967035909799247 },
  //     { latitude: 18.07845526947137, longitude: -15.9630437691346 },
  //   ],
  // },
  {
    name: "Bouhdida",
    coordinates: [
      { latitude: 18.089401523545757, longitude: -15.9251566212786 },
      { latitude: 18.08764790387082, longitude: -15.916488937228502 },
      { latitude: 18.086648035413795, longitude: -15.912625560669984 },
      { latitude: 18.069312765773244, longitude: -15.914428951654816 },
      { latitude: 18.06942949074133, longitude: -15.916080102820805 },
      { latitude: 18.065826464767706, longitude: -15.916378903757224 },
      { latitude: 18.060290503249306, longitude: -15.916273695079218 },
      { latitude: 18.054111475238408, longitude: -15.92077389680819 },
      { latitude: 18.05356118818423, longitude: -15.922453007980632 },
      { latitude: 18.05335568165193, longitude: -15.924164875311286 },
      { latitude: 18.056376827061953, longitude: -15.925924716674016 },
      { latitude: 18.059375480923627, longitude: -15.928182656088712 },
      { latitude: 18.061781823361272, longitude: -15.927470536335106 },
      { latitude: 18.062575051660666, longitude: -15.929924213171766 },
      { latitude: 18.06341280715819, longitude: -15.93311637958324 },
      { latitude: 18.06596802526945, longitude: -15.937385207132108 },
      { latitude: 18.068359710092835, longitude: -15.936663326357586 },
      { latitude: 18.070940198242862, longitude: -15.935671081462567 },
      { latitude: 18.08040577022384, longitude: -15.933802812038747 },
      { latitude: 18.087181321421976, longitude: -15.926528573530362 },
      { latitude: 18.089401523545757, longitude: -15.9251566212786 },
    ],
  },
  {
    name: "Toujounine",
    coordinates: [
      { latitude: 18.050711697731103, longitude: -15.932348810984712 },
      { latitude: 18.058951778393286, longitude: -15.925291478483658 },
      { latitude: 18.05462946404965, longitude: -15.899676772357946 },
      { latitude: 18.05832563032603, longitude: -15.88129194596958 },
      { latitude: 18.066190417363256, longitude: -15.880346728322442 },
      { latitude: 18.080230319976383, longitude: -15.89197213664951 },
      { latitude: 18.083535906021385, longitude: -15.899359141612827 },
      { latitude: 18.08720918310339, longitude: -15.92668743348213 },
      { latitude: 18.08044493238034, longitude: -15.933864721204062 },
      { latitude: 18.07943539713679, longitude: -15.934041070073592 },
      { latitude: 18.077425915429593, longitude: -15.934379619952121 },
      { latitude: 18.076795473780443, longitude: -15.934489590519513 },
      { latitude: 18.074659161959257, longitude: -15.934778343265249 },
      { latitude: 18.068432192631825, longitude: -15.936625638209879 },
      { latitude: 18.066679351587222, longitude: -15.930318908940306 },
      { latitude: 18.065665241311805, longitude: -15.930229283998735 },
      { latitude: 18.050711697731103, longitude: -15.932348810984712 },
    ],
  },
  {
    name: "Sebkha",
    coordinates: [
      { latitude: 18.05607051360979, longitude: -16.021471488830326 },
      { latitude: 18.062644733660054, longitude: -16.02149959808006 },
      { latitude: 18.09259321634453, longitude: -16.023153842542847 },
      { latitude: 18.09263715415042, longitude: -16.023107608059203 },
      { latitude: 18.094292397719666, longitude: -16.022938095974837 },
      { latitude: 18.096929036587003, longitude: -16.022075125394377 },
      { latitude: 18.09765686920571, longitude: -16.02135920096706 },
      { latitude: 18.097698213159415, longitude: -16.019532378952135 },
      { latitude: 18.085182993008345, longitude: -16.00088978043543 },
      { latitude: 18.084611689642887, longitude: -15.999712490976236 },
      { latitude: 18.08424386320042, longitude: -15.998444640784353 },
      { latitude: 18.08411473246082, longitude: -15.997407308814067 },
      { latitude: 18.08409125413151, longitude: -15.995476718755894 },
      { latitude: 18.084232790245984, longitude: -15.994099976312501 },
      { latitude: 18.085265111257062, longitude: -15.991141102351696 },
      { latitude: 18.08665650953456, longitude: -15.986587908644339 },
      { latitude: 18.084787763577346, longitude: -15.986123257827046 },
      { latitude: 18.081614429203935, longitude: -15.98509480698904 },
      { latitude: 18.08103045417426, longitude: -15.984762054866565 },
      { latitude: 18.080860127757894, longitude: -15.984550885250375 },
      { latitude: 18.080537723731446, longitude: -15.98441650458553 },
      { latitude: 18.08044039409765, longitude: -15.984378110109859 },
      { latitude: 18.080324815087394, longitude: -15.983981367194598 },
      { latitude: 18.079619173143396, longitude: -15.98395577087179 },
      { latitude: 18.079211602808474, longitude: -15.983667812304262 },
      { latitude: 18.078700617767858, longitude: -15.983309463864668 },
      { latitude: 18.078548538584155, longitude: -15.983059899759962 },
      { latitude: 18.07833562752703, longitude: -15.982157629581707 },
      { latitude: 18.076383551875466, longitude: -15.982682755405466 },
      { latitude: 18.075630550987, longitude: -15.983235379301 },
      { latitude: 18.07500012915526, longitude: -15.983806423890906 },
      { latitude: 18.073143873887517, longitude: -15.986882696417792 },
      { latitude: 18.066255980561532, longitude: -15.997715116163912 },
      { latitude: 18.066406206421046, longitude: -15.997796518532516 },
      { latitude: 18.06197145746385, longitude: -16.00498684668018 },
      { latitude: 18.060885581155183, longitude: -16.00704499000251 },
      { latitude: 18.060825698128102, longitude: -16.00708798724723 },
      { latitude: 18.06071412756264, longitude: -16.00744155924723 },
      { latitude: 18.060598610984357, longitude: -16.007418778121565 },
      { latitude: 18.05805833125088, longitude: -16.014336038166675 },
      { latitude: 18.056147823557428, longitude: -16.021595780436947 },
      { latitude: 18.05607051360979, longitude: -16.021471488830326 },
    ],
  },
  {
    name: "El Mina",
    coordinates: [
      { latitude: 18.053703074068014, longitude: -15.983088193901033 },
      { latitude: 18.0567912339076, longitude: -15.985334120184024 },
      { latitude: 18.057083729948356, longitude: -15.985689624571432 },
      { latitude: 18.057259227339138, longitude: -15.986209207906876 },
      { latitude: 18.06856796460798, longitude: -15.994107881632988 },
      { latitude: 18.075451333799226, longitude: -15.983248301232937 },
      { latitude: 18.076451393897344, longitude: -15.98257128475562 },
      { latitude: 18.075946413968335, longitude: -15.982008841069842 },
      { latitude: 18.070443735366446, longitude: -15.978110502576174 },
      { latitude: 18.070345364078793, longitude: -15.977953220455806 },
      { latitude: 18.06992039948297, longitude: -15.97757243216439 },
      { latitude: 18.075142720205918, longitude: -15.96941495780385 },
      { latitude: 18.075165545338134, longitude: -15.969232481666879 },
      { latitude: 18.07728406813011, longitude: -15.96606661665736 },
      { latitude: 18.058361468141648, longitude: -15.974427805262717 },
      { latitude: 18.053703074068014, longitude: -15.983088193901033 },
    ],
  },
  {
    name: "Ksar",
    coordinates: [
      { latitude: 18.11310983607658, longitude: -15.94192097831728 },
      { latitude: 18.121859335040995, longitude: -15.953651489405553 },
      { latitude: 18.105553644946394, longitude: -15.96126080397325 },
      { latitude: 18.106278009715904, longitude: -15.96560324986364 },
      { latitude: 18.10153373177229, longitude: -15.96658444438109 },
      { latitude: 18.10143129713639, longitude: -15.964416169261069 },
      { latitude: 18.100602556477007, longitude: -15.964459009406717 },
      { latitude: 18.097666467613013, longitude: -15.966393730119009 },
      { latitude: 18.094946256634362, longitude: -15.966198809905437 },
      { latitude: 18.095298334003626, longitude: -15.9642079293354 },
      { latitude: 18.092811772341857, longitude: -15.96354816076663 },
      { latitude: 18.088289660520278, longitude: -15.961846652360828 },
      { latitude: 18.11310983607658, longitude: -15.94192097831728 },
    ],
  },
  {
    name: "F-Nord",
    coordinates: [
      { latitude: 18.1062915748894, longitude: -15.966588121988213 },
      { latitude: 18.10721505463928, longitude: -15.97168442936897 },
      { latitude: 18.10756998795354, longitude: -15.973060596496415 },
      { latitude: 18.10755375423479, longitude: -15.972500385932827 },
      { latitude: 18.111467193339017, longitude: -15.972111431619604 },
      { latitude: 18.125605145711265, longitude: -15.978761192396911 },
      { latitude: 18.131422740156108, longitude: -15.961606054202655 },
      { latitude: 18.128866539181026, longitude: -15.960832473034747 },
      { latitude: 18.123583177708074, longitude: -15.968156469976877 },
      { latitude: 18.11623849686876, longitude: -15.96507060837455 },
      { latitude: 18.1062915748894, longitude: -15.966588121988213 },
    ],
  },
  {
    name: "Centre Émetteur",
    coordinates: [
      { latitude: 18.10797963614303, longitude: -15.998920143804078 },
      { latitude: 18.12715947890807, longitude: -16.002764556905298 },
      { latitude: 18.12906653497688, longitude: -15.992996737222999 },
      { latitude: 18.118349131196904, longitude: -15.992786889867393 },
      { latitude: 18.111353319418004, longitude: -15.99017818749232 },
      { latitude: 18.10797963614303, longitude: -15.998920143804078 },
    ],
  },
  {
    name: "Premier",
    coordinates: [
      { latitude: 18.113265998547664, longitude: -15.941649026477622 },
      { latitude: 18.122126153940503, longitude: -15.953588193424096 },
      { latitude: 18.133611916712542, longitude: -15.947960645327322 },
      { latitude: 18.14673385432958, longitude: -15.940488442758411 },
      { latitude: 18.13548650428224, longitude: -15.924023779377935 },
      { latitude: 18.113265998547664, longitude: -15.941649026477622 },
    ],
  },
  {
    name: "Ain Ettalh",
    coordinates: [
      { latitude: 18.155759795956595, longitude: -15.938952142456378 },
      { latitude: 18.151685265497335, longitude: -15.932002006796672 },
      { latitude: 18.15674105936339, longitude: -15.928139636552926 },
      { latitude: 18.154478178115323, longitude: -15.925583678368929 },
      { latitude: 18.14958549677565, longitude: -15.92551922258818 },
      { latitude: 18.146931460213292, longitude: -15.92854396787552 },
      { latitude: 18.139936187897572, longitude: -15.919491541465423 },
      { latitude: 18.136043089856717, longitude: -15.923290011303992 },
      { latitude: 18.13538276800793, longitude: -15.923914794553074 },
      { latitude: 18.131130826450477, longitude: -15.92747146824076 },
      { latitude: 18.144017494054168, longitude: -15.944464534577993 },
      { latitude: 18.148606027357808, longitude: -15.943198563776336 },
      { latitude: 18.152253495554433, longitude: -15.941217006748495 },
      { latitude: 18.155759795956595, longitude: -15.938952142456378 },
    ],
  },
  {
    name: "Melleh",
    coordinates: [
      { latitude: 18.026529282447584, longitude: -15.95844435625494 },
      { latitude: 18.033551919545715, longitude: -15.954149360782251 },
      { latitude: 18.039080181480948, longitude: -15.952263753054124 },
      { latitude: 18.055763522590883, longitude: -15.943097604271172 },
      { latitude: 18.066768680543962, longitude: -15.9397454127545 },
      { latitude: 18.06269003357943, longitude: -15.931092627856081 },
      { latitude: 18.048817355990558, longitude: -15.935684569634363 },
      { latitude: 18.036249397012423, longitude: -15.942465193977567 },
      { latitude: 18.02592504478243, longitude: -15.953666098819115 },
      { latitude: 18.02506805553947, longitude: -15.955597289286617 },
      { latitude: 18.026529282447584, longitude: -15.95844435625494 },
    ],
  },
  {
    name: "Etterhil",
    coordinates: [
      { latitude: 18.00304363138721, longitude: -15.937944623179042 },
      { latitude: 18.0116462111408, longitude: -15.93853778151135 },
      { latitude: 18.016017853211235, longitude: -15.944691799294631 },
      { latitude: 18.01813312486628, longitude: -15.944246930545402 },
      { latitude: 18.022976463413393, longitude: -15.95123425529603 },
      { latitude: 18.028564843517113, longitude: -15.950827303448571 },
      { latitude: 18.03881609178016, longitude: -15.941219599449067 },
      { latitude: 18.048047130049607, longitude: -15.936041739711191 },
      { latitude: 18.05328608463591, longitude: -15.93413727132495 },
      { latitude: 18.052413051092326, longitude: -15.930556154651507 },
      { latitude: 18.05319877982623, longitude: -15.928857419048514 },
      { latitude: 18.052849567489186, longitude: -15.924863094792833 },
      { latitude: 18.052762264296526, longitude: -15.924771271246723 },
      { latitude: 18.05140905926603, longitude: -15.923302094509001 },
      { latitude: 18.047436687560708, longitude: -15.927801448268276 },
      { latitude: 18.044817492289457, longitude: -15.929454272098214 },
      { latitude: 18.043682495557583, longitude: -15.92738824231079 },
      { latitude: 18.045415781652224, longitude: -15.926202643067565 },
      { latitude: 18.045227068594276, longitude: -15.924680999990251 },
      { latitude: 18.041024206314745, longitude: -15.916890868275186 },
      { latitude: 18.041800071270064, longitude: -15.915404631329835 },
      { latitude: 18.04019295520718, longitude: -15.911324801464631 },
      { latitude: 18.03667387393738, longitude: -15.91246132599738 },
      { latitude: 18.020583528366007, longitude: -15.925794281892447 },
      { latitude: 18.017978570642203, longitude: -15.926377114730338 },
      { latitude: 18.014126487986186, longitude: -15.929874111810607 },
      { latitude: 18.009359765652928, longitude: -15.932380293013544 },
      { latitude: 18.009549125169176, longitude: -15.932360340335933 },
      { latitude: 18.00304363138721, longitude: -15.937944623179042 },
    ],
  },
  {
    name: "Elvelouja",
    coordinates: [
      { latitude: 18.068473570137147, longitude: -15.945968113944867 },
      { latitude: 18.067861343948007, longitude: -15.943327737592481 },
      { latitude: 18.066760059934673, longitude: -15.93955350668458 },
      { latitude: 18.055911204547183, longitude: -15.942960755567679 },
      { latitude: 18.057661015976382, longitude: -15.948971331339282 },
      { latitude: 18.06290650616435, longitude: -15.94998083624824 },
      { latitude: 18.064190628733385, longitude: -15.94712979978161 },
      { latitude: 18.068473570137147, longitude: -15.945968113944867 },
    ],
  },
  {
    name: "Riyadh",
    coordinates: [
      { latitude: 18.037799901807805, longitude: -15.98930852698714 },
      { latitude: 18.038795951471474, longitude: -15.985326352330924 },
      { latitude: 18.038750682389256, longitude: -15.985311600182182 },
      { latitude: 18.038634640464025, longitude: -15.98519894739232 },
      { latitude: 18.038586183373422, longitude: -15.985113116708735 },
      { latitude: 18.038562592416575, longitude: -15.984926032640612 },
      { latitude: 18.038561317230666, longitude: -15.984925362076817 },
      { latitude: 18.038581082627285, longitude: -15.98485026022868 },
      { latitude: 18.038690748659338, longitude: -15.984774487822445 },
      { latitude: 18.038760883877373, longitude: -15.984610873074793 },
      { latitude: 18.038868637021668, longitude: -15.984487491460412 },
      { latitude: 18.039016558387367, longitude: -15.984447928879698 },
      { latitude: 18.03941194550187, longitude: -15.98287671906444 },
      { latitude: 18.041288228491776, longitude: -15.972919919036588 },
      { latitude: 18.03881355256704, longitude: -15.97240191821631 },
      { latitude: 18.036701867379673, longitude: -15.972403947101515 },
      { latitude: 18.031918884526988, longitude: -15.973261161726587 },
      { latitude: 18.030464637354598, longitude: -15.964698590342712 },
      { latitude: 18.02932241323138, longitude: -15.964313975036326 },
      { latitude: 18.031076798137736, longitude: -15.955496188076413 },
      { latitude: 18.033425930361027, longitude: -15.954100810060645 },
      { latitude: 18.031300943813367, longitude: -15.95064707803179 },
      { latitude: 18.02276773187385, longitude: -15.957509665144892 },
      { latitude: 18.014500151767006, longitude: -15.959142359803398 },
      { latitude: 18.01003977299785, longitude: -15.95957389232133 },
      { latitude: 17.99330778264045, longitude: -15.958585236118294 },
      { latitude: 17.980142175702518, longitude: -15.962233015914265 },
      { latitude: 17.973162716926247, longitude: -15.962365441915257 },
      { latitude: 17.971467525526524, longitude: -15.97202027123565 },
      { latitude: 17.98067408655697, longitude: -15.97879915607084 },
      { latitude: 18.003188004597263, longitude: -15.983009799910413 },
      { latitude: 18.005047962173762, longitude: -15.992222901121204 },
      { latitude: 18.005161475377726, longitude: -15.992003630539587 },
      { latitude: 18.005416560959, longitude: -15.991825934196786 },
      { latitude: 18.006060206747218, longitude: -15.9919201180014 },
      { latitude: 18.006427518102477, longitude: -15.991762149301314 },
      { latitude: 18.00673281462242, longitude: -15.991719691202768 },
      { latitude: 18.00729638433602, longitude: -15.99247838587325 },
      { latitude: 18.007091042661667, longitude: -15.992933690854942 },
      { latitude: 18.00726242525679, longitude: -15.993590307993793 },
      { latitude: 18.01395196931046, longitude: -15.994542359628714 },
      { latitude: 18.02186525262257, longitude: -15.991753267641656 },
      { latitude: 18.037799901807805, longitude: -15.98930852698714 },
    ],
  },
];
import StoriesInbox, { StoryInboxItem } from "../components/StoriesInbox";
import StoryViewer, { StoryClip } from "../components/StoryViewer";
import { NotificationPermissionAutoShow } from "../components/NotificationPermissionAutoShow";
import { useHostMode } from "../contexts/HostModeContext";

// ============================================
// CUSTOM SHEET HANDLE COMPONENT
// Shows fixed grabber (always visible)
// ====================andb ========================
interface CustomSheetHandleProps {
  isCollapsed?: boolean;
  onShowList?: () => void;
  t?: any; // TFunction from react-i18next
  listLabel?: string;
  hideGrabber?: boolean; // Deprecated - grabber is always visible now
}

const CustomSheetHandle: React.FC<CustomSheetHandleProps> = ({
  isCollapsed,
  onShowList,
  t,
  listLabel,
  hideGrabber = false,
}) => {
  return (
    <View style={sheetHandleStyles.container}>
      {/* Grabber Handle - Always visible */}
      <View style={sheetHandleStyles.grabberContainer}>
        <View style={sheetHandleStyles.grabber} />
      </View>
    </View>
  );
};

const sheetHandleStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    // No border radius - sheet slides under header seamlessly
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  grabberContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  showListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  showListText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

// ============================================
// AIRBNB-STYLE MAP CONTROLS OVERLAY
// Clean, professional, floating controls
// ============================================
// Professional Drawing Controls Component
const MapControlsOverlay = ({
  sheetIndex,
  snapPoints,
  isDrawing,
  setIsDrawing,
  mapType,
  setMapType,
  polygonPoints,
  setPolygonPoints,
  onApplyPolygon,
  t,
}: {
  sheetIndex: number;
  snapPoints: number[];
  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
  mapType: "standard" | "satellite";
  setMapType: (value: "standard" | "satellite") => void;
  polygonPoints: { latitude: number; longitude: number }[];
  setPolygonPoints: (points: { latitude: number; longitude: number }[]) => void;
  onApplyPolygon: (polygon: { latitude: number; longitude: number }[]) => void;
  t: any;
}) => {
  const handleUndoPoint = useCallback(() => {
    setPolygonPoints(polygonPoints.slice(0, -1));
  }, [polygonPoints, setPolygonPoints]);

  const handleClearPolygon = useCallback(() => {
    setPolygonPoints([]);
  }, [setPolygonPoints]);

  const handleApplyPolygon = useCallback(() => {
    onApplyPolygon(polygonPoints);
    setIsDrawing(false);
  }, [polygonPoints, onApplyPolygon, setIsDrawing]);

  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true);
  }, [setIsDrawing]);

  const handleStopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, [setIsDrawing]);

  const handleToggleMapType = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapType(mapType === "standard" ? "satellite" : "standard");
  }, [mapType, setMapType]);

  return (
    <>
      {/* Drawing controls are now built into Map component - no separate controls needed */}
    </>
  );
};

// Airbnb-style map control styles
const mapControlStyles = StyleSheet.create({
  // Top containers
  topLeftContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 100,
  },
  topRightContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 100,
  },

  // Floating button (Draw Area)
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  floatingButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Circle button (Map Type)
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },

  // Drawing Pill Bar
  drawingPillContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    gap: 12,
  },
  drawingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  pillItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  pillItemApply: {
    backgroundColor: "#00A699",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  pillDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  // Drawing Hint
  drawingHint: {
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  drawingHintText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
});

// Airbnb-style Property Card Component
interface AirbnbPropertyCardProps {
  property: any;
  onPress: () => void;
  onShare?: () => void;
}

const AirbnbPropertyCard: React.FC<AirbnbPropertyCardProps> = ({
  property,
  onPress,
  onShare,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Use backend-translated fields directly (no frontend translation needed)
  const propertyTitle = property.title || property.name || "Property";
  const propertyDescription =
    property.description ||
    property.Description ||
    property.summary ||
    property.Summary ||
    "";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const images = useMemo(() => resolvePropertyImages(property), [property]);
  const hasMultipleImages = images.length > 1;

  return (
    <TouchableOpacity
      style={styles.airbnbCard}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Image Container */}
      <View style={styles.airbnbImageContainer}>
        {images.length > 0 ? (
          <Image
            source={{ uri: images[imageIndex] }}
            style={styles.airbnbImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.airbnbImagePlaceholder}>
            <MaterialIcons name="home" size={48} color="#DDDDDD" />
          </View>
        )}

        {/* Image Indicators */}
        {hasMultipleImages && (
          <View style={styles.imageIndicators}>
            {images.slice(0, 3).map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === imageIndex && styles.activeIndicator,
                ]}
              />
            ))}
            {images.length > 3 && (
              <Text style={styles.moreImagesText}>+{images.length - 3}</Text>
            )}
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.airbnbFavoriteButton}
          onPress={handleFavorite}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={isFavorite ? "favorite" : "favorite-border"}
            size={20}
            color={isFavorite ? "#FF385C" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Share Button */}
        {onShare && (
          <TouchableOpacity
            style={styles.airbnbShareButton}
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Share size={20} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.airbnbContent}>
        {/* Title and Rating */}
        <View style={styles.airbnbTitleRow}>
          <Text style={styles.airbnbTitle} numberOfLines={1}>
            {propertyTitle}
          </Text>

          {typeof property.rating === "number" &&
          Number.isFinite(property.rating) &&
          property.rating > 0 ? (
            <View style={styles.airbnbRating}>
              <MaterialIcons name="star" size={14} color="#222222" />
              <Text style={styles.airbnbRatingText}>
                {property.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
        {/* PRICE */}
        <View style={styles.airbnbDetailItem}>
          <Text style={styles.airbnbTitle}>{property.nightlyPrice} MRU</Text>
        </View>

        {/* Location */}
        <Text style={styles.airbnbLocation} numberOfLines={1}>
          {property.city || property.location || "Mauritania"}
        </Text>

        {/* Property Details */}
        <View style={styles.airbnbDetails}>
          <View style={styles.airbnbDetailItem}>
            <MaterialIcons name="bed" size={16} color="#717171" />
            <Text style={styles.airbnbDetailText}>
              {property.bedrooms || property.beds || "?"}
            </Text>
          </View>
          <View style={styles.airbnbDetailItem}>
            <MaterialIcons name="bathtub" size={16} color="#717171" />
            <Text style={styles.airbnbDetailText}>
              {property.bathrooms || "?"}
            </Text>
          </View>
          {property.area && (
            <View style={styles.airbnbDetailItem}>
              <MaterialIcons name="square-foot" size={16} color="#717171" />
              <Text style={styles.airbnbDetailText}>{property.area} m²</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
import { PublicExperiencesSection } from "../components/PublicExperiencesSection";
import {
  EnhancedPropertyFilterModal,
  PropertyFilters,
} from "../components/EnhancedPropertyFilterModal";
import { PropertySaleFilters } from "../screens/PropertySaleFilterScreen";
import { FilterButton } from "../components/FilterButton";
import { FilterBar } from "../components/FilterBar";
import { usePropertyFilters } from "../hooks/usePropertyFilters";
import { usePropertySaleFilters } from "../hooks/usePropertySaleFilters";
import { useElementMeasurement } from "../hooks/useElementMeasurement";
import {
  BellIcon,
  CaretDownIcon,
  ListIcon,
  MapTrifoldIcon,
  Share,
  Sparkle,
} from "phosphor-react-native";
import { theme } from "../theme";
import Toast from "../components/CustomToast";
import ShareSheet from "../components/ShareSheet";
import { FloatingVideoWindow } from "../components/FloatingVideoWindow";
import {
  ZillowStylePropertyCard,
  ZillowStylePropertyCardSkeleton,
} from "../components/ZillowStylePropertyCard";
import { prefetchPropertySaleImages, prefetchFeedListingImages } from "../services/imagePrefetch";
import { warmPropertySaleDetailNavigation } from "../services/propertySaleFetch";
import {
  usePublicPropertySalesInfiniteQuery,
  PROPERTY_SALE_PAGE_LIMIT,
  saleFeedFiltersKey,
} from "../hooks/queries/usePublicPropertySalesInfiniteQuery";
import { useSearchPropertiesInfiniteQuery } from "../hooks/queries/useSearchPropertiesInfiniteQuery";
// Import icons from MaterialIcons instead
// import { BellIcon, MapTrifoldIcon, ListIcon, XIcon } from "react-native-heroicons/outline";

// Property types for filtering
const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Studio",
  "Townhouse",
  "Duplex",
];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SearchScreenParams {
  lat?: string;
  lon?: string;
  /** Deep link from video feed: switch Home (Search) tab */
  openHomeTab?: "properties" | "sell" | "landmarks";
}

// Internal SearchScreen component (uses MapUIState)
const SearchScreenInternal = ({
  route = { params: {} },
}: {
  route?: { params?: SearchScreenParams };
} = {}) => {
  // ============================================================================
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP - NO EXCEPTIONS

  // Centralized UI state controller
  const mapUIState = useMapUIState();
  const cardVisible = mapUIState.state.cardVisible;
  const cardProperty = mapUIState.state.cardProperty;
  // ============================================================================

  // 1. Translation and Navigation Hooks
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { currentLanguage, isLanguageReady } = useLanguage();
  const langParam = useMemo(
    () => (currentLanguage || "en").toLowerCase(),
    [currentLanguage],
  );
  const insets = useSafeAreaInsets();

  // 2. Custom Hooks (must be called before they're used in other hooks)
  const propertyFilters = usePropertyFilters();
  const saleFilters = usePropertySaleFilters();
  const { data: propertyCategories = [] } = usePropertyCategories();
  const salePropertyCategoryId = useMemo(() => {
    const pt = (saleFilters.filters as { propertyType?: string }).propertyType;
    const id = categoryIdForSalePropertyType(propertyCategories, pt);
    return id != null && id > 0 ? String(id) : undefined;
  }, [saleFilters.filters, propertyCategories]);
  const propertyFiltersForOnboardingRef = useRef(propertyFilters.filters);
  propertyFiltersForOnboardingRef.current = propertyFilters.filters;
  const { measureElement } = useElementMeasurement();
  const { user } = useUser();
  const { unreadCount } = useUnreadMessageCount();
  const { isHostMode } = useHostMode();
  const isLoggedIn = Boolean(user?.ID);
  const hostShareConsent = useHostShareConsent(isLoggedIn);
  const hostShareSheetRef = useRef<BottomSheetModal>(null);
  const [showHostShareToast, setShowHostShareToast] = useState(false);
  const [showMessagesHint, setShowMessagesHint] = useState(false);
  const unreadCountRef = useRef(0);
  const hideMessagesHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const openHostShareSheet = useCallback(() => {
    hostShareSheetRef.current?.present();
  }, []);

  const dismissHostShareToast = useCallback(async () => {
    if (user?.ID) {
      await hostShareConsentStorage.setToastDismissed(user.ID, true);
    }
    setShowHostShareToast(false);
  }, [user?.ID]);

  const handleHostShareAccept = useCallback(async () => {
    try {
      await hostShareConsent.setConsent(true);
      setShowHostShareToast(false);
      hostShareSheetRef.current?.dismiss();
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "hostShareConsent.saveError",
          "Could not save your choice. Please try again.",
        ),
      );
    }
  }, [hostShareConsent, t]);

  const handleHostShareDecline = useCallback(async () => {
    try {
      await hostShareConsent.setConsent(false);
      setShowHostShareToast(false);
      hostShareSheetRef.current?.dismiss();
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "hostShareConsent.saveError",
          "Could not save your choice. Please try again.",
        ),
      );
    }
  }, [hostShareConsent, t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let showTimer: ReturnType<typeof setTimeout> | null = null;

      const maybeShowToast = async () => {
        if (
          !isLoggedIn ||
          isHostMode ||
          hostShareConsent.loading ||
          hostShareConsent.hasDecided ||
          !user?.ID
        ) {
          if (active) setShowHostShareToast(false);
          return;
        }
        const dismissed = await hostShareConsentStorage.isToastDismissed(
          user.ID,
        );
        if (!active || dismissed) return;

        // Wait for home UI to settle, then mount toast (it slides down on its own).
        showTimer = setTimeout(() => {
          if (active) setShowHostShareToast(true);
        }, 280);
      };

      setShowHostShareToast(false);
      maybeShowToast();

      return () => {
        active = false;
        if (showTimer) clearTimeout(showTimer);
        setShowHostShareToast(false);
      };
    }, [
      isLoggedIn,
      isHostMode,
      hostShareConsent.loading,
      hostShareConsent.hasDecided,
      user?.ID,
    ]),
  );

  useEffect(() => {
    const previousUnread = unreadCountRef.current;
    const increased = unreadCount > previousUnread;
    unreadCountRef.current = unreadCount;

    if (hideMessagesHintTimerRef.current) {
      clearTimeout(hideMessagesHintTimerRef.current);
      hideMessagesHintTimerRef.current = null;
    }

    if (increased && unreadCount > 0) {
      setShowMessagesHint(true);
      hideMessagesHintTimerRef.current = setTimeout(() => {
        setShowMessagesHint(false);
      }, 4000);
      return;
    }

    if (unreadCount <= 0) {
      setShowMessagesHint(false);
    }
  }, [unreadCount]);

  useEffect(() => {
    return () => {
      if (hideMessagesHintTimerRef.current) {
        clearTimeout(hideMessagesHintTimerRef.current);
        hideMessagesHintTimerRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // CRASH REPORTING: Log component mount and critical operations
  // ============================================================================
  useEffect(() => {
    try {
      crashReporting.logInfo("SearchScreen mounted", {
        routeParams: route?.params,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      });
    } catch (error: any) {
      console.error("Failed to log SearchScreen mount:", error);
    }

    return () => {
      try {
        crashReporting.logInfo("SearchScreen unmounting", {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error("Failed to log SearchScreen unmount:", error);
      }
    };
  }, []);

  // 3. ALL useState Hooks (grouped together)
  const [tabContainerHeight, setTabContainerHeight] = useState(50);
  const [mapShown, setMapShown] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<
    "properties" | "experiences" | "cars" | "sell" | "landmarks"
  >("sell");
  // Prevent onboarding preference effect from overriding a user's manual tab choice.
  const hasUserChosenTabRef = useRef(false);
  /** Open Home tab when navigating from video feed discovery CTA */
  useFocusEffect(
    useCallback(() => {
      const tab = route?.params?.openHomeTab;
      if (!tab) return;
      setActiveTab(tab);
      hasUserChosenTabRef.current = true;
      try {
        (navigation as any).setParams({ openHomeTab: undefined });
      } catch {
        /* tab navigator may not support setParams on this route */
      }
    }, [route?.params?.openHomeTab, navigation]),
  );
  // Rotation key that changes on each focus/reload to force fresh data
  const [rotationKey, setRotationKey] = useState(() => Date.now());
  const [polygonFilter, setPolygonFilter] = useState<
    { latitude: number; longitude: number }[] | null
  >(null);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [selectedMapLand, setSelectedMapLand] =
    useState<MapLandmarkRecord | null>(null);
  const landMapFocusGenRef = useRef(0);
  const landPanelDismissRef = useRef<(() => void) | null>(null);
  const [landPinRestoreGen, setLandPinRestoreGen] = useState(0);
  // Start collapsed (index 0) and slide up to full on first mount for a more professional feel
  const [propertiesSheetIndex, setPropertiesSheetIndex] = useState(0);
  const [sellSheetIndex, setSellSheetIndex] = useState(0); // Index 0 = collapsed, 2 = full (under filter bar)

  // Direct list view (no sheet): true = list, false = map — default list for flat UX
  const [listViewModeProperties, setListViewModeProperties] = useState(true);
  const [listViewModeSell, setListViewModeSell] = useState(true);
  const [listViewModeLandmarks, setListViewModeLandmarks] = useState(true);

  // Animated sheet position for real-time "Show Map" / "Show list" button
  const propertiesAnimatedIndex = useSharedValue(0); // Track properties sheet position
  const sellAnimatedIndex = useSharedValue(0); // Track sell sheet position
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "sentinel">("satellite");
  const [landmarksMapType, setLandmarksMapType] = useState<
    "standard" | "satellite" | "sentinel"
  >("satellite"); // Landmarks default to satellite
  const [polygonPoints, setPolygonPoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null,
  );

  // REMOVED: All card/sheet state now managed by MapUIStateContext
  // Using centralized state from mapUIState

  // Animation for sliding controls down when drawing
  const controlsSlideAnim = useRef(new RNAnimated.Value(0)).current;
  const [showVideoPromo, setShowVideoPromo] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [sheetScrollY, setSheetScrollY] = useState(0);
  const [currentSearchTextIndex, setCurrentSearchTextIndex] = useState(0);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [storiesInbox, setStoriesInbox] = useState<StoryInboxItem[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{
    username: string;
    avatarURL: string;
    clips: StoryClip[];
    origin: { x: number; y: number; size: number };
  } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const welcomeToastScheduledRef = useRef(false);

  // Ensure property/sell sheets slide in on first mount instead of appearing fixed
  const hasAnimatedSheetsOnMountRef = useRef(false);

  // 4. ALL useRef Hooks (grouped together)
  const mapRef = useRef<CadastreMapHandle | null>(null);
  const landmarkSheetRef = useRef<any>(null);
  const landmarksMapRef = useRef<CadastreMapHandle | null>(null);
  const landsMapFitDoneRef = useRef(false);
  const habitatCadastreFilterRef = useRef<CadastreFilterSheetRef>(null);
  const habitatCadastre = useHabitatCadastre();
  const hostOnboardingSheetRef = useRef<BottomSheetModal | null>(null);
  const openHostOnboarding = useCallback(() => {
    hostOnboardingSheetRef.current?.present();
  }, []);
  const propertiesSheetRef = useRef<any>(null);
  const propertiesScrollViewRef = useRef<any>(null);
  const propertiesFlatListRef = useRef<any>(null);
  const propertiesSheetProgrammaticChangeRef = useRef<boolean>(false);
  const sellSheetRef = useRef<any>(null);
  const sellSheetProgrammaticChangeRef = useRef<boolean>(false);
  const snappedForTapRef = useRef<boolean>(false);
  const experiencesScrollRef = useRef<ScrollView>(null);
  // NOTE: sell sheet uses BottomSheetFlatList (virtualized) - no ScrollView ref needed
  const lastScrollY = useRef<number>(0);
  // Static header: no animated values for header/search bar to keep UI clean and declarative

  // 5. Animated styles for real-time "Show Map" button appearance
  // Button appears smoothly as sheet slides towards top position (60 FPS)
  const [showMapButtonVisible, setShowMapButtonVisible] = useState(false);
  const [showMapButtonVisibleSell, setShowMapButtonVisibleSell] =
    useState(false);

  const showMapButtonVisibleRef = useRef(false);
  const showMapButtonVisibleSellRef = useRef(false);
  const setShowMapButtonVisibleGuarded = useCallback((next: boolean) => {
    if (showMapButtonVisibleRef.current === next) return;
    showMapButtonVisibleRef.current = next;
    setShowMapButtonVisible(next);
  }, []);
  const setShowMapButtonVisibleSellGuarded = useCallback((next: boolean) => {
    if (showMapButtonVisibleSellRef.current === next) return;
    showMapButtonVisibleSellRef.current = next;
    setShowMapButtonVisibleSell(next);
  }, []);
  const snapPropertiesSheetToFull = useCallback(() => {
    setPropertiesSheetIndex((prev) => (prev === 2 ? prev : 2));
  }, []);
  const snapSellSheetToFull = useCallback(() => {
    setSellSheetIndex((prev) => (prev === 2 ? prev : 2));
  }, []);

  // Track when "Show map" vs "Show list" (on JS thread): list full = index >= 1.8
  useAnimatedReaction(
    () => propertiesAnimatedIndex.value >= 1.8,
    (listFull, prev) => {
      if (listFull !== prev) {
        runOnJS(setShowMapButtonVisibleGuarded)(listFull);
      }
    },
    [propertiesAnimatedIndex],
  );

  useAnimatedReaction(
    () => sellAnimatedIndex.value >= 1.8,
    (listFull, prev) => {
      if (listFull !== prev) {
        runOnJS(setShowMapButtonVisibleSellGuarded)(listFull);
      }
    },
    [sellAnimatedIndex],
  );

  // Sync sheet index from animated value so "Show map" button reappears when user drags sheet up
  useAnimatedReaction(
    () => propertiesAnimatedIndex.value >= 1.8,
    (listFull, prev) => {
      if (listFull && !prev) runOnJS(snapPropertiesSheetToFull)();
    },
    [propertiesAnimatedIndex],
  );
  useAnimatedReaction(
    () => sellAnimatedIndex.value >= 1.8,
    (listFull, prev) => {
      if (listFull && !prev) runOnJS(snapSellSheetToFull)();
    },
    [sellAnimatedIndex],
  );

  const showMapButtonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      propertiesAnimatedIndex.value,
      [1.3, 1.6, 2],
      [0, 0.6, 1],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      propertiesAnimatedIndex.value,
      [1.3, 2],
      [25, 0],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      propertiesAnimatedIndex.value,
      [1.3, 2],
      [0.85, 1],
      Extrapolate.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const showMapButtonStyleSell = useAnimatedStyle(() => {
    const opacity = interpolate(
      sellAnimatedIndex.value,
      [1.3, 1.6, 2],
      [0, 0.6, 1],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      sellAnimatedIndex.value,
      [1.3, 2],
      [25, 0],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      sellAnimatedIndex.value,
      [1.3, 2],
      [0.85, 1],
      Extrapolate.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  // 6. ALL useMemo Hooks (grouped together)
  const searchPlaceholders = useMemo(
    () => [
      t("search.searchPlaceholder"),
      t("search.searchPlaceholders.apartments"),
      t("search.searchPlaceholders.houses"),
      t("search.searchPlaceholders.villas"),
      t("search.searchPlaceholders.studios"),
      t("search.searchPlaceholders.properties"),
    ],
    [t],
  );

  const stableFilterKey = useMemo(() => {
    const f = saleFilters.filters || {};
    const key = saleFeedFiltersKey(f);
    console.log("🔍 stableFilterKey (API slice) updated:", key);
    console.log("🔍 Filters object:", f);
    console.log("🔍 city_id:", (f as any).city_id);
    console.log("🔍 zone_id:", (f as any).zone_id);
    console.log("🔍 salePriceRange:", (f as any).salePriceRange);
    return key;
  }, [saleFilters.filters]);

  // Apply onboarding preferences (city, zone, intent) when arriving from onboarding.
  // Deps must be stable callbacks only — the old `propertyFilters` object in the
  // dependency array changed every render and re-fired this effect, spamming
  // getPreferences and risking races with the property-sales query.
  useEffect(() => {
    let cancelled = false;
    onboardingStorage.getPreferences().then((prefs) => {
      if (cancelled || !prefs) return;
      // If the user already selected a tab manually, don't override it.
      if (hasUserChosenTabRef.current) {
        onboardingStorage.clearPreferences();
        return;
      }
      const tab =
        prefs.intent === "rent"
          ? "properties"
          : prefs.intent === "buy"
            ? "sell"
            : prefs.intent === "land"
              ? "landmarks"
              : "sell";
      setActiveTab(tab);

      // Apply onboarding filters to BOTH feeds (best-effort):
      // - Sale feed uses ids (city_id/zone_id/quartier_id) and propertyType.
      // - Rent feed uses a different filter model; we map city/zone/type into the
      //   closest available fields so the user sees their choices reflected.
      if (
        prefs.cityId != null ||
        prefs.zoneId != null ||
        prefs.quartierId != null ||
        prefs.cityName ||
        prefs.zoneName ||
        prefs.quartierName ||
        prefs.propertyType
      ) {
        (saleFilters.updateFilters as (u: any) => void)({
          city_id: prefs.cityId ?? undefined,
          zone_id: prefs.zoneId ?? undefined,
          city_name: prefs.cityName || undefined,
          zone_name: prefs.zoneName || undefined,
          quartier_id: prefs.quartierId ?? undefined,
          quartier_name: prefs.quartierName || undefined,
          propertyType: prefs.propertyType || undefined,
        });

        // Rent feed filter model doesn't use ids; map to friendly strings.
        try {
          const nextRent: any = {
            ...(propertyFiltersForOnboardingRef.current as any),
          };
          if (prefs.propertyType) nextRent.propertyType = prefs.propertyType;
          const loc =
            prefs.quartierName || prefs.zoneName || prefs.cityName || "";
          if (loc) nextRent.location = loc;
          propertyFilters.applyFilters(nextRent);
        } catch {}
      }
      onboardingStorage.clearPreferences();
    });
    return () => {
      cancelled = true;
    };
  }, [saleFilters.updateFilters, propertyFilters.applyFilters]);

  // Calculate header height (tabs + filter container + safe area)
  const [actualHeaderHeight, setActualHeaderHeight] = useState(0);
  const headerRef = useRef<View>(null);

  const headerHeight = useMemo(() => {
    if (actualHeaderHeight > 0) {
      return actualHeaderHeight;
    }
    // Fallback calculation
    const estimatedTabHeight = tabContainerHeight || 60;
    let filterContainerHeight = 0;
    if (activeTab === "properties") {
      filterContainerHeight = 48; // Search bar container
    } else if (activeTab === "sell") {
      filterContainerHeight = 48; // Quick filters container
    }
    return estimatedTabHeight + filterContainerHeight + insets.top;
  }, [insets.top, tabContainerHeight, actualHeaderHeight, activeTab]);

  // Snap points: DYNAMIC based on card animation state
  // When card is animating: [1%, 40%, 88%]
  // Property Rent snap points - accounts for Filter Bar FIXED at top
  // CRITICAL: Dynamic snap points based on card visibility
  // - When cardVisible: [1%, 40%, 88%] - card needs space
  // - When !cardVisible: [12%, 40%, 88%] - prevent accidental collapse
  const FILTER_BAR_HEIGHT = 64;
  const [filterBarHeight, setFilterBarHeight] = useState(FILTER_BAR_HEIGHT);
  const propertiesSnapPoints = useMemo(() => {
    try {
      // Safety check: Ensure SCREEN_HEIGHT is valid
      if (!SCREEN_HEIGHT || SCREEN_HEIGHT <= 0 || !isFinite(SCREEN_HEIGHT)) {
        console.warn("⚠️ Invalid SCREEN_HEIGHT, using fallback");
        return ["12%", "40%", "88%"];
      }

      // Calculate proper snap points for properties tab
      const tabsAndSafeArea = (tabContainerHeight || 60) + (insets.top || 0);
      // 1. Minimum: 1% ONLY when card is visible, otherwise 12% to prevent accidental hide
      const minimum = cardVisible
        ? Math.max(1, Math.round(SCREEN_HEIGHT * 0.01)) // Card visible: allow 1% for card space, min 1px
        : Math.max(1, Math.round(SCREEN_HEIGHT * 0.12)); // No card: minimum 12% (prevents accidental hide), min 1px
      // 2. Default: 40% of screen (shows more map by default)
      const defaultHeight = Math.max(1, Math.round(SCREEN_HEIGHT * 0.4));
      // 3. Full: Stop BELOW the Filter Bar (tabs + safe area + filter bar + padding)
      const full = Math.max(
        defaultHeight + 1,
        Math.round(SCREEN_HEIGHT - tabsAndSafeArea - filterBarHeight - 1),
      );

      // Validate all snap points are valid numbers
      const snapPoints = [minimum, defaultHeight, full];
      if (
        snapPoints.some((sp) => !isFinite(sp) || sp <= 0 || sp > SCREEN_HEIGHT)
      ) {
        console.warn("⚠️ Invalid snap points calculated, using fallback");
        return ["12%", "40%", "88%"];
      }

      return snapPoints;
    } catch (error) {
      console.error("❌ Error calculating propertiesSnapPoints:", error);
      return ["12%", "40%", "88%"];
    }
  }, [tabContainerHeight, insets.top, filterBarHeight, cardVisible]);

  // No sheet mount animation — list view is default (direct FlatList)

  // Property Sales snap points - accounts for Filter Bar FIXED at top
  // CRITICAL: Dynamic snap points based on card visibility
  // - When cardVisible: [1%, 40%, 88%] - card needs space
  // - When !cardVisible: [12%, 40%, 88%] - prevent accidental collapse
  const sellSnapPoints = useMemo(() => {
    try {
      // Safety check: Ensure SCREEN_HEIGHT is valid
      if (!SCREEN_HEIGHT || SCREEN_HEIGHT <= 0 || !isFinite(SCREEN_HEIGHT)) {
        console.warn("⚠️ Invalid SCREEN_HEIGHT, using fallback");
        return ["12%", "40%", "88%"];
      }

      // Calculate proper snap points for sell tab
      const tabsAndSafeArea = (tabContainerHeight || 60) + (insets.top || 0);
      // 1. Minimum: 1% ONLY when card is visible, otherwise 12% to prevent accidental hide
      const minimum = cardVisible
        ? Math.max(1, Math.round(SCREEN_HEIGHT * 0.01)) // Card visible: allow 1% for card space, min 1px
        : Math.max(1, Math.round(SCREEN_HEIGHT * 0.12)); // No card: minimum 12% (prevents accidental hide), min 1px
      // 2. Default: 40% of screen (shows more map by default)
      const defaultHeight = Math.max(1, Math.round(SCREEN_HEIGHT * 0.4));
      // 3. Full: Stop BELOW the Filter Bar (tabs + safe area + filter bar + padding)
      const full = Math.max(
        defaultHeight + 1,
        Math.round(SCREEN_HEIGHT - tabsAndSafeArea - filterBarHeight - 1),
      );

      // Validate all snap points are valid numbers
      const snapPoints = [minimum, defaultHeight, full];
      if (
        snapPoints.some((sp) => !isFinite(sp) || sp <= 0 || sp > SCREEN_HEIGHT)
      ) {
        console.warn("⚠️ Invalid snap points calculated, using fallback");
        return ["12%", "40%", "88%"];
      }

      return snapPoints;
    } catch (error) {
      console.error("❌ Error calculating sellSnapPoints:", error);
      return ["12%", "40%", "88%"];
    }
  }, [tabContainerHeight, insets.top, filterBarHeight, cardVisible]);

  // Sheet 100% up by default: force snap to index 2 once refs are ready (properties + sell)
  useEffect(() => {
    const id = setTimeout(() => {
      propertiesSheetRef.current?.snapToIndex(2);
      sellSheetRef.current?.snapToIndex(2);
    }, 200);
    return () => clearTimeout(id);
  }, []);

  // Sheet sync: collapse when card visible, restore when dismissed.
  // Skip snap when we already snapped in handlePropertySelected (avoids double snap + jank).
  useLayoutEffect(() => {
    const sheetRef = activeTab === "sell" ? sellSheetRef : propertiesSheetRef;
    if (!sheetRef.current) return;
    const programmaticRef =
      activeTab === "sell"
        ? sellSheetProgrammaticChangeRef
        : propertiesSheetProgrammaticChangeRef;
    if (cardVisible) {
      if (snappedForTapRef.current) {
        snappedForTapRef.current = false;
        return;
      }
      programmaticRef.current = true;
      sheetRef.current.snapToIndex(0);
      programmaticRef.current = false;
    } else {
      const targetIndex =
        mapUIState.state.bottomSheetState === "expanded" ? 2 : 1;
      programmaticRef.current = true;
      sheetRef.current.snapToIndex(targetIndex);
      programmaticRef.current = false;
    }
  }, [cardVisible, activeTab, mapUIState.state.bottomSheetState]);

  /** Rent tab — persisted city / zone / quartier + price filters. */
  const rentTabFilters = useRentTabFilters();

  const [landmarkFilters, setLandmarkFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    city?: string;
    country_id?: number;
    city_id?: number;
    zone_id?: number;
    quartier_id?: number;
    investmentOnly?: boolean;
  }>({});

  const debouncedRentDiscoveryFilters = useDebouncedValue(
    rentTabFilters.discoveryFilters,
    400,
  );

  const rentSearchApiFilters = useMemo(
    () => ({
      ...(propertyFilters.filters as any),
      ...rentDiscoveryToSearchFilters(debouncedRentDiscoveryFilters),
    }),
    [propertyFilters.filters, debouncedRentDiscoveryFilters],
  );

  const rentListSessionKey = useMemo(
    () => rentSearchFiltersKey(rentSearchApiFilters),
    [rentSearchApiFilters],
  );

  const searchProperties = useSearchPropertiesInfiniteQuery({
    enabled: activeTab === "properties",
    lang: langParam,
    filters: rentSearchApiFilters,
    polygonFilter,
  });

  const normalizedRentItems = useMemo(() => {
    if (activeTab !== "properties") return [];
    const pages = searchProperties.data?.pages ?? [];
    const flat = filterPublicRentProperties(
      pages.flatMap((p: any) => p.items ?? []),
    );
    return dedupeByNumericId(flat, getRentPropertyId);
  }, [searchProperties.data, activeTab]);

  const rentMapItems = useMemo(() => {
    if (activeTab !== "properties") return [];
    if (shouldStripPlaceholderOnNewFilter(searchProperties)) return [];
    return normalizedRentItems;
  }, [activeTab, normalizedRentItems, searchProperties]);

  const flattenedSearchProperties = useStableListOrder(
    rentMapItems,
    rentListSessionKey,
    getRentPropertyId,
  );

  const rentFiltersActive =
    rentTabFilters.hydrated && rentTabFilters.filtersActive;

  // High-efficiency prefetch for rental property images on the first screen
  useEffect(() => {
    if (activeTab !== "properties") return;
    prefetchFeedListingImages(flattenedSearchProperties || []);
  }, [activeTab, flattenedSearchProperties]);

  /** Debounce API params so rapid filter taps coalesce into one request (land tab uses same pattern). */
  const debouncedSaleFilters = useDebouncedValue(saleFilters.filters, 400);

  const publicPropertySales = usePublicPropertySalesInfiniteQuery({
    enabled: activeTab === "sell",
    lang: langParam,
    filters: debouncedSaleFilters,
    limit: PROPERTY_SALE_PAGE_LIMIT,
  });

  /** Must match usePublicPropertySalesInfiniteQuery query key fragment (API params only). */
  const saleFiltersSessionKey = useMemo(
    () => saleFeedFiltersKey(debouncedSaleFilters),
    [debouncedSaleFilters],
  );

  const debouncedLandmarkFilters = useDebouncedValue(landmarkFilters, 400);
  const landmarkFiltersSessionKey = useMemo(
    () => landmarkFeedFiltersKey(debouncedLandmarkFilters),
    [debouncedLandmarkFilters],
  );
  const searchListEndReachedRef = useRef(false);
  const landmarkQueryKey = useMemo(
    () =>
      [
        "publicLandmarks",
        user?.ID,
        langParam,
        landmarkFiltersSessionKey,
      ] as const,
    [user?.ID, langParam, landmarkFiltersSessionKey],
  );
  const publicLandmarks = useQuery({
    queryKey: landmarkQueryKey,
    enabled: activeTab === "landmarks",
    placeholderData: (previousData) => previousData,
    queryFn: async ({ signal }) => {
      const params: any = { lang: langParam };
      const f = debouncedLandmarkFilters;
      if (Number(f.minPrice) > 0) params.min_price = Number(f.minPrice);
      if (Number(f.maxPrice) > 0) params.max_price = Number(f.maxPrice);
      // Landmarks endpoint is id-based for location filters; avoid sending city text.
      if (Number(f.country_id) > 0) params.country_id = Number(f.country_id);
      if (Number(f.city_id) > 0) params.city_id = Number(f.city_id);
      if (Number(f.zone_id) > 0) params.zone_id = Number(f.zone_id);
      if (Number(f.quartier_id) > 0) params.quartier_id = Number(f.quartier_id);
      if (Number(f.minArea) > 0) params.min_area = Number(f.minArea);
      if (Number(f.maxArea) > 0) params.max_area = Number(f.maxArea);
      if (f.investmentOnly) params.investment_opportunity = "true";
      try {
        const res = await api.get("/landmarks/public", { params, signal });
        return res.data?.landmarks ?? [];
      } catch (error: any) {
        crashReporting.logError(error, {
          phase: "landmarks_fetch",
          screen: "SearchScreen",
        });
        console.error("Error fetching landmarks:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 12_000),
  });
  // Memoize sale items normalization - must be after publicPropertySales query
  // Dedupe by id to avoid duplicate listings when pagination or refetch overlaps
  const normalizedSaleItems = useMemo(() => {
    if (activeTab !== "sell") {
      return [];
    }
    const pages = publicPropertySales.data?.pages ?? [];
    const flat = pages.flatMap((p: any) => p.items || p.properties || []);
    const seen = new Set<string | number>();
    return flat.filter((item: any) => {
      const idRaw = item?.id ?? item?.ID ?? item?.Id;
      const idNum =
        typeof idRaw === "string" ? parseInt(idRaw, 10) : Number(idRaw);
      if (!Number.isFinite(idNum) || idNum <= 0) return false;
      if (seen.has(idNum)) return false;
      seen.add(idNum);
      return true;
    });
  }, [publicPropertySales.data, activeTab]);

  const rawLandListItems = useMemo(() => {
    if (activeTab !== "landmarks") return [];
    if (shouldStripPlaceholderOnNewFilter(publicLandmarks)) return [];
    const list = Array.isArray(publicLandmarks.data)
      ? publicLandmarks.data
      : [];
    const filtered = list.filter((lm: any) => {
      const status = (lm.status || "").toLowerCase();
      return (
        lm.is_verified === true &&
        (lm.is_published === true || status === "verified")
      );
    });
    return dedupeByNumericId(filtered, getLandmarkId);
  }, [
    publicLandmarks.data,
    activeTab,
    publicLandmarks.isPlaceholderData,
    publicLandmarks.isFetching,
    publicLandmarks.isRefetching,
  ]);

  const landListItems = useStableListOrder(
    rawLandListItems,
    landmarkFiltersSessionKey,
    getLandmarkId,
  );

  const landListIsLoading =
    activeTab === "landmarks" &&
    (publicLandmarks.isPending ||
      publicLandmarks.isLoading ||
      (publicLandmarks.isFetching && landListItems.length === 0));

  const cadastreMapOpen = useMemo(
    () =>
      (activeTab === "landmarks" && !listViewModeLandmarks) ||
      (activeTab === "sell" && !listViewModeSell) ||
      (activeTab === "properties" && !listViewModeProperties),
    [
      activeTab,
      listViewModeLandmarks,
      listViewModeSell,
      listViewModeProperties,
    ],
  );

  const mapLandmarksQuery = useMapLandmarks(cadastreMapOpen, langParam);
  const mapLandmarks = mapLandmarksQuery.data ?? [];

  // Helper function for coordinates - must be defined before useMemo that uses it
  const getCoords = (
    p: any,
  ): { latitude: number; longitude: number } | null => {
    if (!p) return null;
    const loc =
      p.coordinates || p.location || p.coords || p.geo || p.position || null;
    if (
      Array.isArray(p?.geometry?.coordinates) &&
      p.geometry.coordinates.length >= 2
    ) {
      const [lng, lat] = p.geometry.coordinates;
      const latN = parseFloat(String(lat));
      const lngN = parseFloat(String(lng));
      if (isFinite(latN) && isFinite(lngN))
        return { latitude: latN, longitude: lngN };
    }
    if (Array.isArray(loc) && loc.length >= 2) {
      const [a, b] = loc;
      let lat1 = parseFloat(String(a));
      let lng1 = parseFloat(String(b));
      if (isFinite(lat1) && isFinite(lng1))
        return { latitude: lat1, longitude: lng1 };
      let lng2 = parseFloat(String(a));
      let lat2 = parseFloat(String(b));
      if (isFinite(lat2) && isFinite(lng2))
        return { latitude: lat2, longitude: lng2 };
    }
    const lat = p.lat ?? p.latitude ?? loc?.lat ?? loc?.latitude;
    const lng =
      p.lng ?? p.lon ?? p.longitude ?? loc?.lng ?? loc?.lon ?? loc?.longitude;
    const latN = parseFloat(String(lat));
    const lngN = parseFloat(String(lng));
    if (isFinite(latN) && isFinite(lngN))
      return { latitude: latN, longitude: lngN };
    return null;
  };

  // Memoize center region - must be after normalizedSaleItems
  const centerRegion = useMemo(() => {
    if (!normalizedSaleItems || normalizedSaleItems.length === 0) {
      return null;
    }
    const firstCoord = normalizedSaleItems.find((p: any) => !!getCoords(p));
    return firstCoord ? getCoords(firstCoord) : null;
  }, [normalizedSaleItems]);

  const [saleMapRegion, setSaleMapRegion] = useState<any | null>(null);

  /**
   * Sale list rows — server-filtered only.
   * Drop placeholder pages when the filter session changes so we never stack
   * wrong properties under a new filter (pull-to-refresh keeps rows via isRefetching).
   */
  const saleListItems = useMemo(() => {
    if (activeTab !== "sell") return [];
    if (shouldStripPlaceholderOnNewFilter(publicPropertySales)) return [];
    return normalizedSaleItems;
  }, [activeTab, normalizedSaleItems, publicPropertySales]);

  const filteredPropertySales = useMemo(() => {
    if (activeTab !== "sell") {
      return { data: [] as any[], error: null as Error | null };
    }
    return {
      data: saleListItems,
      error: publicPropertySales.error as Error | null,
    };
  }, [saleListItems, activeTab, publicPropertySales.error]);

  useEffect(() => {
    if (activeTab !== "sell" || saleListItems.length === 0) return;
    prefetchFeedListingImages(saleListItems);
  }, [activeTab, saleListItems]);

  /**
   * PropertySaleList loading: TanStack v5 `isLoading` is only true when isPending && isFetching.
   * When the query is disabled (other tab), isFetching is false so isLoading is false even with no data.
   * Treat "fetching with zero rows" as loading so skeletons show until the first page arrives.
   */
  const propertySaleListIsLoading =
    activeTab === "sell" &&
    (publicPropertySales.isPending ||
      publicPropertySales.isLoading ||
      (publicPropertySales.isFetching && saleListItems.length === 0));

  const fetchNextSalePageRef = useRef(publicPropertySales.fetchNextPage);
  fetchNextSalePageRef.current = publicPropertySales.fetchNextPage;
  const handleSaleListEndReached = useCallback(() => {
    void fetchNextSalePageRef.current();
  }, []);

  const refetchSaleListRef = useRef(publicPropertySales.refetch);
  refetchSaleListRef.current = publicPropertySales.refetch;
  const handleSaleListRefresh = useCallback(() => {
    void refetchSaleListRef.current();
  }, []);

  const handleSaleListDiscoverLandPress = useCallback(
    (lm: any) => {
      Haptics.selectionAsync().catch(() => {});
      (navigation as any).navigate("LandmarkDetails", {
        landmark: lm,
        landmarkId:
          lm?.id ?? lm?.ID ?? (typeof lm?.Id === "number" ? lm.Id : undefined),
      });
    },
    [navigation],
  );

  const handleSaleListDiscoverLandsViewAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab("landmarks");
    hasUserChosenTabRef.current = true;
  }, []);

  const handleSaleListPress = useCallback(
    (id: number, initialImageIndex?: number) => {
      const nid = Number(id);
      const item = saleListItems.find(
        (p: any) => Number(p?.id ?? p?.ID ?? 0) === nid,
      );
      if (item) prefetchPropertySaleImages(item);
      if (Number.isFinite(nid) && nid > 0) {
        warmPropertySaleDetailNavigation(queryClient, nid, langParam, item);
        (navigation as any).navigate("PropertySaleDetails", {
          propertyId: nid,
          initialImageIndex: initialImageIndex ?? 0,
        });
      }
    },
    [navigation, saleListItems, queryClient, langParam],
  );

  const handleSaleListCall = useCallback((phone: string | undefined) => {
    if (phone) Linking.openURL(`tel:${phone}`).catch(() => {});
  }, []);

  const handleSaleListEmail = useCallback((website: string | undefined) => {
    if (website) Linking.openURL(website).catch(() => {});
  }, []);

  // Animate controls sliding down when drawing mode is active
  useEffect(() => {
    RNAnimated.spring(controlsSlideAnim, {
      toValue: isDrawing ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isDrawing, controlsSlideAnim]);

  // Smooth undo handler - removes last point
  const handleUndoPoint = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setPolygonPoints((prev) => {
      if (prev.length === 0) return prev;
      const newPoints = prev.slice(0, -1);
      return newPoints;
    });
  }, []);

  // Smooth clear handler - wipes out drawn area completely
  const handleClearPolygon = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Clear both the drawing points and any applied filter immediately
    setPolygonPoints([]);
    setPolygonFilter(null);
  }, []);

  // 8. ALL useCallback Hooks (grouped together)
  // Airbnb-like search bar scroll behavior - smooth shrink on scroll
  const handleSearchBarScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setSheetScrollY(scrollY);
    const shouldShrink = scrollY > 30; // Trigger earlier for smoother transition
    const targetShrink = shouldShrink ? 0 : 1;
    const targetProgress = shouldShrink ? 1 : 0;
    // No animations: keep header static. We update sheetScrollY above and rely on CSS/layout.
  }, []);

  const handleSearchBarScrollToTop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const filtersActive = propertyFilters.getActiveFiltersCount?.() > 0;
    if (filtersActive && propertiesFlatListRef.current?.scrollToOffset) {
      propertiesFlatListRef.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    } else if (
      propertiesScrollViewRef.current &&
      "scrollTo" in propertiesScrollViewRef.current
    ) {
      propertiesScrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [propertyFilters]);

  const handleClearAllPropertyFilters = useCallback(() => {
    try {
      propertyFilters.clearAllFilters();
      rentTabFilters.setPropertyCategory(undefined);
      setMapShown(false);
      queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
      queryClient.refetchQueries({ queryKey: ["searchProperties"] });
    } catch (e) {
      console.warn("Clear all filters failed:", e);
    }
  }, [propertyFilters, rentTabFilters, queryClient]);

  const sanitizeFilters = useCallback((raw: any) => {
    const next: any = { ...raw };
    if (!next || typeof next !== "object") return {};
    if (!next.propertyType || String(next.propertyType).toLowerCase() === "all")
      delete next.propertyType;
    if (!next.location || String(next.location).toLowerCase() === "all")
      delete next.location;
    if (!(Number(next.bedrooms) > 0)) delete next.bedrooms;
    if (!(Number(next.bathrooms) > 0)) delete next.bathrooms;
    const pr = Array.isArray(next.priceRange) ? next.priceRange : [];
    const minP = Number(pr[0] ?? 0);
    const maxP = Number(pr[1] ?? 50000000);
    if (!(minP > 0) && !(maxP < 50000000)) delete next.priceRange;
    if (!Array.isArray(next.amenities) || next.amenities.length === 0)
      delete next.amenities;
    const y = String(next.yearBuilt ?? "").trim();
    if (y === "" || y.toLowerCase() === "any" || isNaN(parseInt(y, 10)))
      delete next.yearBuilt;
    if (!(Number(next.city_id) > 0)) delete next.city_id;
    if (!(Number(next.zone_id) > 0)) delete next.zone_id;
    if (!next.city_name) delete next.city_name;
    if (!next.zone_name) delete next.zone_name;
    return next;
  }, []);

  // 9. ALL useEffect Hooks (grouped together)
  useEffect(() => {
    let cancelled = false;
    const fetchInbox = async () => {
      try {
        setStoriesLoading(true);
        const res = await axios.get(`${endpoints.baseURL}/stories/inbox`);
        if (!cancelled) {
          const list = (res.data?.inbox || []).map((it: any) => ({
            userId: it.user_id,
            username: it.username,
            avatarURL:
              typeof it.avatar_url === "string" ? it.avatar_url.trim() : "",
            hasUnseen: !!it.has_unseen,
            firstThumb:
              typeof it.first_thumb === "string"
                ? it.first_thumb.trim()
                : undefined,
          })) as StoryInboxItem[];
          setStoriesInbox(list);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setStoriesLoading(false);
        }
      }
    };
    fetchInbox();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasCityOrZone = !!(
    (saleFilters.filters as any)?.city_name ||
    (saleFilters.filters as any)?.zone_name
  );
  // No animations: simply rely on boolean `hasCityOrZone` to control presentation.

  useEffect(() => {
    // Rotate placeholder text every 3 seconds without animation
    const interval = setInterval(() => {
      setCurrentSearchTextIndex(
        (prev: number) => (prev + 1) % searchPlaceholders.length,
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  useEffect(() => {
    if (!isLanguageReady || welcomeToastScheduledRef.current) return;
    welcomeToastScheduledRef.current = true;
    setShowToast(true);
  }, [isLanguageReady]);

  useEffect(() => {
    if (!cadastreMapOpen) {
      landsMapFitDoneRef.current = false;
      return;
    }
    if (landsMapFitDoneRef.current || !mapLandmarks.length) return;

    const mapHandle =
      activeTab === "landmarks" && !listViewModeLandmarks
        ? landmarksMapRef.current
        : mapRef.current;
    if (!mapHandle) return;

    const region = regionForAllLandmarks(mapLandmarks);
    if (region) {
      mapHandle.animateToRegion(region, 620);
      landsMapFitDoneRef.current = true;
    }
  }, [
    cadastreMapOpen,
    mapLandmarks,
    activeTab,
    listViewModeLandmarks,
  ]);

  // 10. useFocusEffect (must be last)
  // Only invalidate on actual app reload, not on tab switch
  useFocusEffect(
    useCallback(() => {
      // Only reset rotation key and refetch if coming from outside the app
      // Don't refetch when just switching tabs - use cached data
      return () => {};
    }, []),
  );

  // Only invalidate queries when app comes to foreground from background (not on tab switch)
  useEffect(() => {
    let appState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Only refetch if app was in background and is now active
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // Reset rotation key to force completely fresh data
        setRotationKey(Date.now());
        // App came to foreground from background - invalidate queries for fresh rotation
        queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
        queryClient.invalidateQueries({ queryKey: ["locationProperties"] });
        queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
        queryClient.invalidateQueries({ queryKey: ["publicLandmarks"] });
      }
      appState = nextAppState;
    });
    return () => subscription.remove();
  }, [queryClient]);

  // OPTIMIZED: Simplified sheet restoration - removed complex useEffect
  // Sheet restoration is now handled directly in handleDismissPropertyCard
  // This eliminates race conditions and reduces re-renders

  // Prevent stale floating property card in list mode.
  // The instant card should only live while user is in map mode.
  useEffect(() => {
    const isMapMode =
      (activeTab === "sell" && !listViewModeSell) ||
      (activeTab === "properties" && !listViewModeProperties);
    if (!isMapMode) {
      instantCardStore.hide();
      setSelectedPropertyId(null);
    }
  }, [activeTab, listViewModeSell, listViewModeProperties]);

  // ============================================================================
  // END OF HOOKS - ALL BUSINESS LOGIC BELOW
  // ============================================================================

  // Constants
  const SCROLL_THRESHOLD = 50;
  const BUTTON_WIDTH = 40;
  const BUTTON_SLIDE_DISTANCE = 50;
  const CITY_ZONE_MIN_W = SCREEN_WIDTH * 0.28;
  const CITY_ZONE_MAX_W = SCREEN_WIDTH * 0.75;
  // Map height ratio (fraction of screen height) when compressed
  const MAP_HEIGHT_RATIO = 0.35; // 35% of screen height
  // Static city/zone width - choose min when collapsed, full when expanded. We don't animate.
  const cityZoneWidth = CITY_ZONE_MIN_W;
  // sellSnapPoints is now calculated in useMemo above

  // Helper functions
  const formatPriceShort = (value: any): string => {
    const n = Number(value);
    if (!isFinite(n) || n <= 0) return "";
    if (n >= 1_000_000)
      return `${(n / 1_000_000)
        .toFixed(n % 1_000_000 === 0 ? 0 : 2)
        .replace(/\.00$/, "")}M`;
    if (n >= 1_000)
      return `${(n / 1_000)
        .toFixed(n % 1_000 === 0 ? 0 : 1)
        .replace(/\.0$/, "")}K`;
    return String(n);
  };

  const handleOpenUserStories = async (userId: number) => {
    try {
      const res = await axios.get(`${endpoints.baseURL}/stories/${userId}`);
      const clips = (res.data?.stories || []).map((s: any) => ({
        id: s.id,
        type: s.type,
        mediaURL: s.media_url,
        thumbURL: s.thumb_url,
        durationSeconds: s.duration_seconds,
        caption: s.caption,
      })) as StoryClip[];
      const meta = storiesInbox.find((s) => s.userId === userId);
      setViewerData({
        username: meta?.username || "Story",
        avatarURL: meta?.avatarURL?.trim() || "",
        clips,
        origin: { x: 80, y: 100, size: 64 },
      });
      setViewerOpen(true);
    } catch {
      // ignore
    }
  };

  const handleHide = useCallback(() => {
    setShowToast(false);
  }, []);

  // Dismiss card - INSTANT: store.hide() first (card re-renders immediately via useSyncExternalStore)
  const handleDismissPropertyCard = useCallback(
    (_opts?: { force?: boolean } | boolean) => {
      instantCardStore.hide();
      mapUIState.dismissCard();
      navigation.setOptions({ tabBarStyle: { display: "flex" } });
      Haptics.selectionAsync().catch(() => {});
    },
    [mapUIState, navigation],
  );

  const handleHabitatPlotPress = useCallback(
    (plot: HabitatPlot) => {
      handleDismissPropertyCard({ force: true });
      setSelectedMapLand(null);
      const cadastreMapRef =
        activeTab === "landmarks" ? landmarksMapRef : mapRef;
      habitatCadastre.selectPlot(plot, cadastreMapRef);
    },
    [
      handleDismissPropertyCard,
      habitatCadastre,
      activeTab,
      mapRef,
      landmarksMapRef,
    ],
  );

  const handleMapLandPress = useCallback(
    (land: MapLandmarkRecord) => {
      handleDismissPropertyCard({ force: true });
      habitatCadastre.setSelectedPlot(null);
      setSelectedMapLand(land);
      const gen = ++landMapFocusGenRef.current;
      const mapHandle =
        activeTab === "landmarks" && !listViewModeLandmarks
          ? landmarksMapRef.current
          : mapRef.current;
      void focusMapOnLandmark(
        mapHandle,
        land,
        habitatCadastre.region,
      ).then(() => {
        if (gen !== landMapFocusGenRef.current) return;
      });
    },
    [
      handleDismissPropertyCard,
      habitatCadastre,
      activeTab,
      listViewModeLandmarks,
      mapRef,
      landmarksMapRef,
    ],
  );

  const handleMapLandClose = useCallback(() => {
    landMapFocusGenRef.current += 1;
    setSelectedMapLand(null);
    setLandPinRestoreGen((g) => g + 1);
  }, []);

  const requestMapLandClose = useCallback(() => {
    if (landPanelDismissRef.current) {
      landPanelDismissRef.current();
      return;
    }
    handleMapLandClose();
  }, [handleMapLandClose]);

  const lastLandMapDeltaRef = useRef<number | null>(null);
  useEffect(() => {
    const delta = habitatCadastre.region.longitudeDelta;
    if (
      selectedMapLand &&
      lastLandMapDeltaRef.current != null &&
      delta > lastLandMapDeltaRef.current * 1.15
    ) {
      requestMapLandClose();
    }
    lastLandMapDeltaRef.current = delta;
  }, [
    habitatCadastre.region.longitudeDelta,
    selectedMapLand,
    requestMapLandClose,
  ]);

  const handleMapLandClusterPress = useCallback(
    async (cluster: LandMapCluster) => {
      const badgeLabel = formatLandClusterCount(cluster.count);
      const matchedLands = mapLandmarks.filter((lm) =>
        cluster.landmarkIds.includes(lm.id),
      );

      console.log("[LandMapCluster] tap", {
        badgeLabel,
        clusterCount: cluster.count,
        uniquePlotCount: new Set(
          matchedLands.map((lm) => landmarkMapPinKey(lm)),
        ).size,
        landmarkIds: cluster.landmarkIds,
        landsFound: matchedLands.length,
        lands: matchedLands.map((lm) => ({
          id: lm.id,
          title: lm.title ?? lm.name,
          habitat_plot_id: lm.habitat_plot_id,
          centroid_lat: lm.centroid_lat,
          centroid_lng: lm.centroid_lng,
        })),
        countMatchesFound: cluster.count === matchedLands.length,
        mapZoom: habitatCadastre.zoom,
        clusterCenter: cluster.coordinate,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      handleDismissPropertyCard({ force: true });
      habitatCadastre.setSelectedPlot(null);
      setSelectedMapLand(null);

      const region = regionForLandCluster(mapLandmarks, cluster.landmarkIds);
      if (!region) return;

      console.log("[LandMapCluster] zoom target", {
        revealZoom: LAND_CLUSTER_MAX_ZOOM,
        targetLongitudeDelta: region.longitudeDelta,
        targetLatitudeDelta: region.latitudeDelta,
      });

      const mapHandle =
        activeTab === "landmarks" && !listViewModeLandmarks
          ? landmarksMapRef.current
          : mapRef.current;
      mapHandle?.animateToRegion(region, 520);
    },
    [
      handleDismissPropertyCard,
      habitatCadastre,
      mapLandmarks,
      activeTab,
      listViewModeLandmarks,
      mapRef,
      landmarksMapRef,
    ],
  );

  const handleMapLandViewDetails = useCallback(
    (land: MapLandmarkRecord) => {
      (navigation as any).navigate("LandmarkDetails", { landmarkId: land.id });
    },
    [navigation],
  );

  const handleCadastrePlotViewAllDetails = useCallback(
    async (plot: HabitatPlot) => {
      if (!plot?.id || plot.is_for_sale !== true) return;
      try {
        const landmarkId = await habitatApi.getForSaleLandmarkByPlot(
          Number(plot.id),
        );
        if (!landmarkId) {
          Alert.alert(
            t("common.error", "Error"),
            t(
              "habitatCadastre.card.forSaleDetailsNotFound",
              "For-sale details are not available for this plot yet.",
            ),
          );
          return;
        }
        (navigation as any).navigate("LandmarkDetails", { landmarkId });
      } catch {
        Alert.alert(
          t("common.error", "Error"),
          t(
            "habitatCadastre.card.forSaleDetailsNotFound",
            "For-sale details are not available for this plot yet.",
          ),
        );
      }
    },
    [navigation, t],
  );

  const dismissHabitatPlot = useCallback(() => {
    habitatCadastre.setSelectedPlot(null);
  }, [habitatCadastre]);

  const handleCadastreMapBackgroundPress = useCallback(() => {
    if (habitatCadastre.selectedPlot) {
      dismissHabitatPlot();
      return;
    }
    if (selectedMapLand) {
      requestMapLandClose();
    }
  }, [
    habitatCadastre.selectedPlot,
    dismissHabitatPlot,
    selectedMapLand,
    requestMapLandClose,
  ]);

  const showLandMapPanel =
    !!selectedMapLand &&
    ((activeTab === "landmarks" && !listViewModeLandmarks) ||
      (activeTab === "sell" && !listViewModeSell) ||
      (activeTab === "properties" && !listViewModeProperties));

  const showCadastrePlotPanel =
    !!habitatCadastre.selectedPlot &&
    habitatCadastre.selectedSectorId != null &&
    ((activeTab === "sell" && !listViewModeSell) ||
      (activeTab === "landmarks" && !listViewModeLandmarks) ||
      (activeTab === "properties" && !listViewModeProperties));

  // Keep mapRef resolution stable to reduce needless renders in the cadastre filter UI.
  const activeTabRef = useRef(activeTab);
  const listViewModeLandmarksRef = useRef(listViewModeLandmarks);
  useEffect(() => {
    activeTabRef.current = activeTab;
    listViewModeLandmarksRef.current = listViewModeLandmarks;
  }, [activeTab, listViewModeLandmarks]);

  const getCadastreMapRef = useCallback(() => {
    if (
      activeTabRef.current === "landmarks" &&
      !listViewModeLandmarksRef.current
    ) {
      return landmarksMapRef;
    }
    return mapRef;
  }, []);

  const openCadastreZones = useCallback(() => {
    habitatCadastreFilterRef.current?.openZones();
  }, []);

  const openCadastreQuartiers = useCallback(() => {
    habitatCadastreFilterRef.current?.openQuartiers();
  }, []);

  const openCadastreSubSectors = useCallback(() => {
    habitatCadastreFilterRef.current?.openSubSectors();
  }, []);

  const [cadastreInlinePlotNumber, setCadastreInlinePlotNumber] = useState("");
  const [cadastreInlinePlotSearching, setCadastreInlinePlotSearching] =
    useState(false);

  const clearCadastreFilter = useCallback(() => {
    setCadastreInlinePlotNumber("");
    habitatCadastre.clearCadastreFilter(getCadastreMapRef());
  }, [habitatCadastre, getCadastreMapRef]);

  const runInlineCadastrePlotSearch = useCallback(async () => {
    const q = cadastreInlinePlotNumber.trim();
    if (!q || cadastreInlinePlotSearching) return;
    Keyboard.dismiss();
    const sectorId = habitatCadastre.selectedSectorId;
    if (!sectorId) {
      if (habitatCadastre.selectedPlanId != null) {
        habitatCadastreFilterRef.current?.openQuartiers();
      } else {
        habitatCadastreFilterRef.current?.openZones();
      }
      return;
    }
    try {
      setCadastreInlinePlotSearching(true);
      // Scope to the pinned sub-sector (Ilot) when one is selected — without
      // this, a sector that has sub-sectors can return a same-numbered plot
      // from a different sub-sector than the one being browsed.
      const { plot } = await habitatApi.lookupPlotInSector(
        sectorId,
        q,
        habitatCadastre.selectedSubSectorId,
      );
      if (!plot) return;
      await handleHabitatPlotPress(plot);
      Keyboard.dismiss();
      setCadastreInlinePlotNumber("");
    } finally {
      setCadastreInlinePlotSearching(false);
    }
  }, [
    cadastreInlinePlotNumber,
    cadastreInlinePlotSearching,
    habitatCadastre.selectedSectorId,
    habitatCadastre.selectedSubSectorId,
    habitatCadastre.selectedPlanId,
    handleHabitatPlotPress,
  ]);

  /**
   * Map | MeskenyGPT bar visibility (mapFabOverlay + MapCenterControls):
   * - Rendered when activeTab is sell | landmarks | properties (see JSX below).
   * - Must subscribe to instantCardStore — getSnapshot() alone does not re-render
   *   SearchScreen, so the bar could stay hidden after closing a property card.
   * - We keep the bar visible and lift it with bottomOffset when overlays cover the bottom.
   */
  const instantCardVisible = useSyncExternalStore(
    instantCardStore.subscribe,
    () => instantCardStore.getSnapshot().visible,
  );

  // Hide map / MeskenyGPT bar when lot card is open; lift for property sale card only
  const mapCenterControlsHidden = showCadastrePlotPanel;

  const mapControlsBottomOffset = useMemo(() => {
    if (showCadastrePlotPanel) return 0;
    if (activeTab === "sell" && !listViewModeSell && instantCardVisible) {
      return 130;
    }
    return 0;
  }, [showCadastrePlotPanel, activeTab, listViewModeSell, instantCardVisible]);

  const openMeskenyGPT = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    (navigation as any).navigate("MeskenyGPTLanding");
  }, [navigation]);

  const activeListViewMode =
    activeTab === "sell"
      ? listViewModeSell
      : activeTab === "landmarks"
        ? listViewModeLandmarks
        : listViewModeProperties;

  const handleBackToListFromMap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    dismissHabitatPlot();
    if (activeTab === "properties") {
      setListViewModeProperties(true);
      mapUIState.setBottomSheetState("expanded");
      return;
    }
    if (activeTab === "sell") {
      setListViewModeSell(true);
      mapUIState.setBottomSheetState("expanded");
      return;
    }
    if (activeTab === "landmarks") {
      setListViewModeLandmarks(true);
    }
  }, [activeTab, dismissHabitatPlot, mapUIState]);

  const handleTopTabPress = useCallback(
    (tab: "properties" | "sell" | "landmarks") => {
      Haptics.selectionAsync().catch(() => {});
      hasUserChosenTabRef.current = true;

      const mapOpen =
        (tab === "sell" && !listViewModeSell) ||
        (tab === "properties" && !listViewModeProperties) ||
        (tab === "landmarks" && !listViewModeLandmarks);

      if (activeTab === tab && mapOpen) {
        handleDismissPropertyCard({ force: true });
        handleBackToListFromMap();
        return;
      }

      setActiveTab(tab);
    },
    [
      activeTab,
      listViewModeSell,
      listViewModeProperties,
      listViewModeLandmarks,
      handleBackToListFromMap,
      handleDismissPropertyCard,
    ],
  );

  const handleMapFabToggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (activeTab === "properties") {
      const enteringMap = listViewModeProperties;
      setListViewModeProperties((v) => !v);
      if (enteringMap) {
        mapUIState.setBottomSheetState("collapsed");
        dismissHabitatPlot();
        if (mapLandmarks.length === 0) {
          void showcaseCadastreOnMapOpen(habitatCadastre, mapRef, DISTRICTS);
        }
      } else {
        mapUIState.setBottomSheetState("expanded");
      }
      return;
    }
    if (activeTab === "sell") {
      const enteringMap = listViewModeSell;
      setListViewModeSell((v) => !v);
      if (enteringMap) {
        mapUIState.setBottomSheetState("collapsed");
        dismissHabitatPlot();
        if (mapLandmarks.length === 0) {
          void showcaseCadastreOnMapOpen(habitatCadastre, mapRef, DISTRICTS);
        }
      } else {
        mapUIState.setBottomSheetState("expanded");
      }
      return;
    }
    if (activeTab === "landmarks") {
      const enteringMap = listViewModeLandmarks;
      setListViewModeLandmarks((v) => !v);
      if (enteringMap) {
        dismissHabitatPlot();
        if (mapLandmarks.length === 0) {
          void showcaseCadastreOnMapOpen(
            habitatCadastre,
            landmarksMapRef,
            DISTRICTS,
          );
        }
      }
    }
  }, [
    activeTab,
    listViewModeProperties,
    listViewModeSell,
    listViewModeLandmarks,
    mapUIState,
    habitatCadastre,
    dismissHabitatPlot,
    mapLandmarks.length,
  ]);

  // Handle property selection: SHEET SNAP FIRST (instant), then card, then state.
  // 1. snapToIndex(0) immediately → sheet slides down instantly.
  // 2. instantCardStore.show → card appears with slide-up animation.
  // 3. Defer mapUIState + setSelectedPropertyId to rAF.
  const handlePropertySelected = useCallback(
    (propertyId: number, propertyData: any) => {
      snappedForTapRef.current = true;
      const sheetRef = activeTab === "sell" ? sellSheetRef : propertiesSheetRef;
      const programmaticRef =
        activeTab === "sell"
          ? sellSheetProgrammaticChangeRef
          : propertiesSheetProgrammaticChangeRef;
      if (sheetRef.current) {
        programmaticRef.current = true;
        sheetRef.current.snapToIndex(0);
        programmaticRef.current = false;
      }
      instantCardStore.show(propertyData);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      navigation.setOptions({ tabBarStyle: { display: "none" } });
      if (__DEV__)
        logElapsedSinceTap(
          "handlePropertySelected UI done (snap+store+haptics)",
        );
      requestAnimationFrame(() => {
        mapUIState.selectMarker(propertyId, propertyData);
        setSelectedPropertyId(propertyId);
        if (__DEV__)
          logElapsedSinceTap("handlePropertySelected state deferred");
      });
    },
    [mapUIState, navigation, activeTab],
  );

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = scrollY > lastScrollY.current;
    const isScrollingUp = scrollY < lastScrollY.current;
    if (isScrollingDown && scrollY > 100) {
      if (!showScrollToTop) {
        setShowScrollToTop(true);
      }
    } else if (isScrollingUp && scrollY < 50) {
      if (showScrollToTop) {
        setShowScrollToTop(false);
      }
    }
    lastScrollY.current = scrollY;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LottieView
        source={require("../assets/lotties/SearchScreen.json")}
        autoPlay
        loop
        style={styles.emptyAnimation}
      />
      <Text style={styles.emptyTitle}>No properties found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search criteria or check back later for new listings.
      </Text>
    </View>
  );

  const renderCityZoneContent = () => {
    const cityName = (saleFilters.filters as any)?.city_name;
    const zoneName = (saleFilters.filters as any)?.zone_name;
    if (!cityName && !zoneName) {
      return (
        <Text style={[styles.quickFilterText, { width: cityZoneWidth }]}>
          {t("filters.cityZone")}
        </Text>
      );
    }
    return (
      <View
        style={{
          flexDirection: "row",
          gap: 6,
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        {cityName ? (
          <View style={styles.quickChip}>
            <Text style={styles.quickChipText} numberOfLines={1}>
              {cityName}
            </Text>
          </View>
        ) : null}
        {zoneName ? (
          <View style={styles.quickChip}>
            <Text style={styles.quickChipText} numberOfLines={1}>
              {zoneName}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderQuickFilters = () => (
    <View
      style={styles.quickFiltersWrapper}
      onLayout={(event) => {
        // Update header height when quick filters container is measured (sell tab)
        if (activeTab === "sell") {
          const filterHeight = event.nativeEvent.layout.height;
          const totalHeight = tabContainerHeight + filterHeight + insets.top;
          setActualHeaderHeight(totalHeight);
        }
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.quickFiltersScroll}
        style={styles.quickFiltersScrollView}
      >
        <View style={styles.quickFiltersContainer}>
          <TouchableOpacity
            style={styles.quickFilterButton}
            onPress={() =>
              (navigation as any).navigate("RoomsFilter", {
                initialBedrooms: propertyFilters.filters.bedrooms,
                initialBathrooms: propertyFilters.filters.bathrooms,
                onApply: ({
                  bedrooms,
                  bathrooms,
                }: {
                  bedrooms: number;
                  bathrooms: number;
                }) => {
                  propertyFilters.applyFilters({
                    ...propertyFilters.filters,
                    bedrooms,
                    bathrooms,
                  });
                },
              })
            }
          >
            <Text style={styles.quickFilterText}>
              {(propertyFilters.filters.bedrooms || 0) > 0 ||
              (propertyFilters.filters.bathrooms || 0) > 0
                ? `${propertyFilters.filters.bedrooms || 0} ${t(
                    "filters.bedroomsShort",
                  )} · ${propertyFilters.filters.bathrooms || 0} ${t(
                    "filters.bathroomsShort",
                  )}`
                : t("filters.rooms")}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickFilterButton}
            onPress={() =>
              (navigation as any).navigate("YearBuiltFilter", {
                initialYearBuilt: (saleFilters.filters as any).yearBuilt,
                onApply: (yearBuilt: string) => {
                  saleFilters.applyFilters({
                    ...(saleFilters.filters as any),
                    yearBuilt,
                  } as any);
                },
              })
            }
          >
            <Text style={styles.quickFilterText}>
              {(saleFilters.filters as any).yearBuilt
                ? (saleFilters.filters as any).yearBuilt
                : t("filters.yearBuilt")}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterButton, { flexShrink: 0 }]}
            onPress={() =>
              (navigation as any).navigate("CityZoneFilter", {
                initialCityId: (saleFilters.filters as any).city_id || null,
                initialZoneId: (saleFilters.filters as any).zone_id || null,
                onApply: ({
                  cityId,
                  cityName,
                  zoneId,
                  zoneName,
                }: {
                  cityId: number | null;
                  cityName?: string;
                  zoneId: number | null;
                  zoneName?: string;
                }) => {
                  const next: any = { ...(saleFilters.filters as any) };
                  next.city_id = cityId || undefined;
                  next.zone_id = zoneId || undefined;
                  next.city_name = cityName;
                  next.zone_name = zoneName;
                  saleFilters.applyFilters(next as any);
                },
              })
            }
          >
            {renderCityZoneContent()}
            <MaterialIcons
              name="keyboard-arrow-down"
              size={18}
              color="#666"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // Wrap render in try-catch for crash reporting
  try {
    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <StatusBar barStyle={"dark-content"} />
          <View style={styles.container}>
            {/* Header Container - Used for magnet snap point calculation */}
            <View
              ref={headerRef}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setTabContainerHeight(height);
                // Calculate total header height including safe area and filter containers
                let filterHeight = 0;
                if (activeTab === "properties") {
                  filterHeight = 48; // Search bar container
                } else if (activeTab === "sell") {
                  filterHeight = 48; // Quick filters container
                }
                const totalHeight = height + filterHeight + insets.top;
                setActualHeaderHeight(totalHeight);
              }}
            >
              {/* Tab Navigation + MeskenyGPT entry — collapsed while the
                  cadastre map is open so the map is full-bleed (uses the same
                  hide pattern as the other headers; the map's own overlay +
                  "Back to list" button drive navigation there). */}
              <View
                style={[
                  styles.tabContainer,
                  cadastreMapOpen && {
                    height: 0,
                    opacity: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                  },
                ]}
              >
                <View style={styles.tabRow}>
                  {/* Sell Tab - First */}
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "sell" && styles.activeTab,
                    ]}
                    onPress={() => handleTopTabPress("sell")}
                  >
                    <Image
                      source={require("../assets/sell.jpg")}
                      style={{
                        width: 30,
                        height: 30,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "sell" && styles.activeTabText,
                      ]}
                    >
                      {t("search.sell")}
                    </Text>
                  </TouchableOpacity>
                  {/* Properties Tab - Second */}
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "properties" && styles.activeTab,
                    ]}
                    onPress={() => handleTopTabPress("properties")}
                  >
                    <Image
                      source={require("../assets/hosue.jpg")}
                      style={{
                        width: 30,
                        height: 30,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "properties" && styles.activeTabText,
                      ]}
                    >
                      {t("search.properties")}
                    </Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity
            style={[styles.tab, activeTab === 'experiences' && styles.activeTab]}
            onPress={() => setActiveTab('experiences')}
          >
            <Text style={[styles.tabText, activeTab === 'experiences' && styles.activeTabText]}>
              {t('search.experiences')}
            </Text>
          </TouchableOpacity> */}
                  {/* Landmarks Tab - Third */}
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "landmarks" && styles.activeTab,
                    ]}
                    onPress={() => handleTopTabPress("landmarks")}
                  >
                    <Image
                      source={require("../assets/land.jpg")}
                      style={{
                        width: 25,
                        height: 25,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "landmarks" && styles.activeTabText,
                      ]}
                    >
                      {t("search.lands")}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* MeskenyGPT — professional AI entry */}
                {/* <TouchableOpacity
                  style={styles.meskenyGPTButton}
                  onPress={() => {
                    Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    ).catch(() => {});
                    (navigation as any).navigate("MeskenyGPTLanding");
                  }}
                  activeOpacity={0.8}
                >
                  <Sparkle size={16} color="#FFF" weight="duotone" />
                  <Text style={styles.meskenyGPTButtonText}>MeskenyGPT</Text>
                </TouchableOpacity> */}
              </View>
            </View>

            {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}> */}
            {showToast && (
              <Toast
                message={t("search.SearchScreenSmartWelcomeMessage")} // Airbnb-like success msg
                duration={3000}
                type="success" // Or 'error' for red icon
                onHide={handleHide}
              />
            )}

            {/* Header Based on Tab - Always render all headers to prevent hook issues */}
            {/* TEMPORARY COMMENTED Properties Tab Header - Always rendered, hidden when inactive */}
            {/* <View
              style={[
                styles.filterContainer,
                {
                  opacity: activeTab === "properties" ? 1 : 0,
                  position:
                    activeTab === "properties" ? "relative" : "absolute",
                  width: "100%",
                  height: activeTab === "properties" ? "auto" : 0,
                  overflow: "hidden",
                  pointerEvents: activeTab === "properties" ? "auto" : "none",
                },
              ]}
            >
              <View style={styles.searchBarWrapper}>
                {/* Search Bar - Shrinks smoothly when scrolling */}
            {/* <View style={styles.searchBarAnimatedWrapper}>
                  <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() =>
                      (navigation as any).navigate("Filter", {
                        initialFilters: propertyFilters.filters,
                        onApply: (filters: any) =>
                          propertyFilters.applyFilters(filters),
                      })
                    }
                    onPressIn={() => {
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons name="search" size={20} color="#717171" />
                    <View style={styles.searchTextContainer}>
                      <Text style={styles.searchText}>
                        {location || searchPlaceholders[currentSearchTextIndex]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View> 
            */}

            {/* Experiences/Cars Tab Header - Always rendered, hidden when inactive */}
            <View
              style={[
                styles.singleLineContainer,
                {
                  opacity:
                    activeTab === "experiences" || activeTab === "cars" ? 1 : 0,
                  position:
                    activeTab === "experiences" || activeTab === "cars"
                      ? "relative"
                      : "absolute",
                  width: "100%",
                  height:
                    activeTab === "experiences" || activeTab === "cars"
                      ? "auto"
                      : 0,
                  overflow: "hidden",
                  pointerEvents:
                    activeTab === "experiences" || activeTab === "cars"
                      ? "auto"
                      : "none",
                },
              ]}
            >
              <View style={styles.searchBar}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                  onPress={() =>
                    (navigation as any).navigate("Filter", {
                      initialFilters: propertyFilters.filters,
                      onApply: (filters: any) => {
                        propertyFilters.applyFilters(filters);
                        const pt = filters?.propertyType;
                        const n = Number(pt);
                        if (
                          Number.isFinite(n) &&
                          String(pt ?? "").trim() !== "" &&
                          n > 0
                        ) {
                          rentTabFilters.setPropertyCategory(Math.trunc(n));
                        } else if (!pt || String(pt).toLowerCase() === "all") {
                          rentTabFilters.setPropertyCategory(undefined);
                        }
                      },
                    })
                  }
                  onPressIn={() => {
                    Haptics.selectionAsync().catch(() => {});
                  }}
                >
                  <MaterialIcons name="search" size={18} color="#717171" />
                  <View style={styles.searchTextContainer}>
                    <Text style={styles.searchText}>
                      {location || searchPlaceholders[currentSearchTextIndex]}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Content Based on Tab */}
            {/* CRITICAL FIX: Always render all tabs to prevent hook order issues on Android */}
            <View style={{ flex: 1 }}>
              {/* Properties Tab - Always rendered, hidden when inactive */}
              <View
                style={{
                  flex: 1,
                  opacity: activeTab === "properties" ? 1 : 0,
                  position:
                    activeTab === "properties" ? "relative" : "absolute",
                  width: "100%",
                  height: activeTab === "properties" ? "auto" : 0,
                  overflow: "hidden",
                  pointerEvents: activeTab === "properties" ? "auto" : "none",
                }}
              >
                <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
                  {listViewModeProperties && endpoints?.baseURL ? (
                    <PropertySaleFilterBar
                      variant="rent"
                      selectedListingType={rentTabFilters.listingType}
                      onListingTypeChange={(v) =>
                        rentTabFilters.setListingType(v ?? "all")
                      }
                      selectedPropertyType={
                        rentTabFilters.propertyCategoryId != null &&
                        rentTabFilters.propertyCategoryId > 0
                          ? String(rentTabFilters.propertyCategoryId)
                          : undefined
                      }
                      onPropertyTypeChange={(v) => {
                        const id = v ? parseInt(v, 10) : undefined;
                        const categoryId =
                          id != null && !isNaN(id) && id > 0 ? id : undefined;
                        rentTabFilters.setPropertyCategory(categoryId);
                        propertyFilters.updateFilters({
                          ...(propertyFilters.filters as any),
                          propertyType:
                            categoryId != null ? String(categoryId) : "all",
                        });
                      }}
                      selectedCountryId={rentTabFilters.countryId}
                      selectedCityId={rentTabFilters.cityId}
                      selectedZoneId={rentTabFilters.zoneId}
                      selectedQuartierId={rentTabFilters.quartierId}
                      selectedPriceRange={rentTabFilters.priceRange}
                      onCountryChange={(countryId, countryName) => {
                        rentTabFilters.setCountry(countryId, countryName);
                      }}
                      onCityChange={(cityId, cityName) => {
                        rentTabFilters.setCity(cityId, cityName);
                      }}
                      onZoneChange={(zoneId, zoneName) => {
                        rentTabFilters.setZone(zoneId, zoneName);
                      }}
                      onQuartierChange={(quartierId, quartierName) => {
                        rentTabFilters.setQuartier(quartierId, quartierName);
                      }}
                      onPriceChange={(minPrice, maxPrice) => {
                        rentTabFilters.setPriceRange(minPrice, maxPrice);
                      }}
                      onClearAll={() => {
                        rentTabFilters.clearAll();
                        propertyFilters.updateFilters({
                          ...(propertyFilters.filters as any),
                          propertyType: "all",
                        });
                      }}
                    />
                  ) : null}
                  {listViewModeProperties ? (
                    <View
                      style={[
                        styles.professionalSheetScrollView,
                        { flex: 1, minHeight: 0 },
                      ]}
                    >
                      <FlatList
                        ref={propertiesScrollViewRef as any}
                        data={flattenedSearchProperties}
                        keyExtractor={(item: any, index) =>
                          String(
                            item?.ID ??
                              item?.id ??
                              item?.Id ??
                              `rent-${index}`,
                          )
                        }
                        contentContainerStyle={{
                          paddingHorizontal: 16,
                          paddingBottom: 24,
                          paddingTop: 8,
                          gap: 16,
                        }}
                        ListEmptyComponent={
                          searchProperties.isLoading ||
                          searchProperties.isFetching ? (
                            <ActivityIndicator
                              style={{ marginTop: 32 }}
                              color="#222"
                            />
                          ) : (
                            <Text
                              style={{
                                textAlign: "center",
                                color: "#717171",
                                marginTop: 32,
                              }}
                            >
                              {t(
                                rentFiltersActive
                                  ? "search.noRentMatches"
                                  : "homeDiscovery.empty",
                                rentFiltersActive
                                  ? "No rentals match these filters."
                                  : "No properties found.",
                              )}
                            </Text>
                          )
                        }
                        renderItem={({
                          item,
                          index,
                        }: {
                          item: any;
                          index: number;
                        }) => {
                          if (!item || typeof item !== "object") return null;
                          return (
                            <HomeDiscoveryPropertyCard
                              property={item}
                              delay={Math.min(index, 8) * 50}
                            />
                          );
                        }}
                        initialNumToRender={6}
                        maxToRenderPerBatch={4}
                        windowSize={7}
                        removeClippedSubviews={Platform.OS === "android"}
                        onEndReached={() => {
                          if (
                            searchProperties.hasNextPage &&
                            !searchProperties.isFetchingNextPage
                          ) {
                            void searchProperties.fetchNextPage();
                          }
                        }}
                        onEndReachedThreshold={0.4}
                      />
                    </View>
                  ) : activeTab === "properties" ? (
                    <View style={{ flex: 1 }}>
                      <SearchCadastreMapView
                        mapRef={mapRef}
                        cadastre={habitatCadastre}
                        districtFallback={DISTRICTS}
                        onOpenZones={openCadastreZones}
                        onOpenQuartiers={openCadastreQuartiers}
                        onOpenSubSectors={openCadastreSubSectors}
                        plotNumberValue={cadastreInlinePlotNumber}
                        onPlotNumberChange={setCadastreInlinePlotNumber}
                        onPlotSearch={() => {
                          void runInlineCadastrePlotSearch();
                        }}
                        plotSearching={cadastreInlinePlotSearching}
                        onClearFilter={clearCadastreFilter}
                        mapType={mapType}
                        onMapTypeChange={setMapType}
                        initialRegion={
                          route?.params?.lat != null &&
                          route?.params?.lon != null
                            ? {
                                latitude: Number(route.params.lat),
                                longitude: Number(route.params.lon),
                                latitudeDelta: 0.08,
                                longitudeDelta: 0.08,
                              }
                            : habitatCadastre.initialRegion
                        }
                        onPlotPress={handleHabitatPlotPress}
                        onMapBackgroundPress={() => {
                          mapUIState.handleMapInteraction();
                          handleCadastreMapBackgroundPress();
                          if (selectedPropertyId !== null) {
                            setSelectedPropertyId(null);
                            navigation.setOptions({
                              tabBarStyle: { display: "flex" },
                            });
                          }
                        }}
                        showPlotPanel={showCadastrePlotPanel}
                        onPlotFound={handleHabitatPlotPress}
                        onPlotViewAllDetails={handleCadastrePlotViewAllDetails}
                        onBackToList={handleBackToListFromMap}
                        landsForSale={mapLandmarks}
                        selectedLand={selectedMapLand}
                        onLandPress={handleMapLandPress}
                        onLandClusterPress={handleMapLandClusterPress}
                        onLandClose={handleMapLandClose}
                        onLandViewDetails={handleMapLandViewDetails}
                        showLandPanel={showLandMapPanel}
                        landPinRestoreGeneration={landPinRestoreGen}
                        landPanelDismissRef={landPanelDismissRef}
                      />
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Experiences Tab - Always rendered, hidden when inactive */}
              {/* <View
              style={{
                flex: 1,
                opacity: activeTab === "experiences" ? 1 : 0,
                position: activeTab === "experiences" ? "relative" : "absolute",
                width: "100%",
                height: activeTab === "experiences" ? "auto" : 0,
                overflow: "hidden",
                pointerEvents: activeTab === "experiences" ? "auto" : "none"
              }}
            >
              <PublicExperiencesSection
                onSeeAll={() => {
                  (navigation as any).navigate("Experiences");
                }}
                onPress={(experienceId) => {
                  (navigation as any).navigate("ExperienceDetails", {
                    experienceId
                  });
                }}
              />
            </View> */}

              {/* Landmarks Tab — list (listings) or cadastre map (Plan → Sector → Plot) */}
              <View
                style={{
                  flex: 1,
                  opacity: activeTab === "landmarks" ? 1 : 0,
                  position: activeTab === "landmarks" ? "relative" : "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#FFFFFF",
                  pointerEvents: activeTab === "landmarks" ? "auto" : "none",
                }}
              >
                {listViewModeLandmarks ? (
                  <>
                    <LandmarkFilterBar
                      filters={landmarkFilters}
                      onFiltersChange={setLandmarkFilters}
                    />
                    {landListIsLoading ? (
                      <View style={styles.landmarksSkeletonWrap}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <LandmarkSkeletonCard key={`lm-skeleton-${i}`} />
                        ))}
                      </View>
                    ) : publicLandmarks.error ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                          {t("landmark.error.loadFailed")}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          {t(
                            "common.tryAgain",
                            "Please try again in a moment.",
                          )}
                        </Text>
                      </View>
                    ) : landListItems.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                          {t("landmark.empty.title")}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          {Object.keys(debouncedLandmarkFilters).some((k) => {
                            const f = debouncedLandmarkFilters as Record<
                              string,
                              unknown
                            >;
                            if (k === "investmentOnly") return f[k] === true;
                            const v = f[k];
                            return v != null && v !== "" && v !== 0;
                          })
                            ? t("filters.emptyWithFilters", {
                                defaultValue:
                                  "No lands match these filters. Try adjusting or clearing filters.",
                              })
                            : t("landmark.empty.subtitle")}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flex: 1, paddingHorizontal: 5 }}>
                        <FlatList
                          data={landListItems}
                          extraData={landmarkFiltersSessionKey}
                          keyExtractor={(item: any, index: number) => {
                            const stableId = item?.id ?? item?.ID ?? item?.key;
                            return stableId != null
                              ? `landmark-${String(stableId)}`
                              : `landmark-fallback-${index}`;
                          }}
                          renderItem={({
                            item: landmark,
                          }: {
                            item: any;
                            index: number;
                          }) => (
                            <View style={{ marginBottom: 12 }}>
                              <LandmarkCard
                                landmark={landmark}
                                onPress={() => {
                                  (navigation as any).navigate(
                                    "LandmarkDetails",
                                    {
                                      landmark,
                                    },
                                  );
                                }}
                              />
                            </View>
                          )}
                          initialNumToRender={8}
                          maxToRenderPerBatch={6}
                          windowSize={6}
                          removeClippedSubviews={Platform.OS === "android"}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{
                            paddingBottom: 24,
                          }}
                        />
                      </View>
                    )}
                  </>
                ) : activeTab === "landmarks" ? (
                  <View style={{ flex: 1 }}>
                    <SearchCadastreMapView
                      mapRef={landmarksMapRef}
                      cadastre={habitatCadastre}
                      districtFallback={DISTRICTS}
                      onOpenZones={openCadastreZones}
                      onOpenQuartiers={openCadastreQuartiers}
                      onOpenSubSectors={openCadastreSubSectors}
                      plotNumberValue={cadastreInlinePlotNumber}
                      onPlotNumberChange={setCadastreInlinePlotNumber}
                      onPlotSearch={() => {
                        void runInlineCadastrePlotSearch();
                      }}
                      plotSearching={cadastreInlinePlotSearching}
                      onClearFilter={clearCadastreFilter}
                      mapType={landmarksMapType}
                      onMapTypeChange={setLandmarksMapType}
                      onPlotPress={handleHabitatPlotPress}
                      onMapBackgroundPress={handleCadastreMapBackgroundPress}
                      showPlotPanel={showCadastrePlotPanel}
                      onPlotFound={handleHabitatPlotPress}
                      onPlotViewAllDetails={handleCadastrePlotViewAllDetails}
                      onBackToList={handleBackToListFromMap}
                      landsForSale={mapLandmarks}
                      selectedLand={selectedMapLand}
                      onLandPress={handleMapLandPress}
                      onLandClusterPress={handleMapLandClusterPress}
                      onLandClose={handleMapLandClose}
                      onLandViewDetails={handleMapLandViewDetails}
                      showLandPanel={showLandMapPanel}
                      landPinRestoreGeneration={landPinRestoreGen}
                      landPanelDismissRef={landPanelDismissRef}
                    />
                  </View>
                ) : null}
              </View>

              {/* Sell Tab - Always rendered, hidden when inactive */}
              <View
                style={{
                  flex: 1,
                  opacity: activeTab === "sell" ? 1 : 0,
                  position: activeTab === "sell" ? "relative" : "absolute",
                  width: "100%",
                  height: activeTab === "sell" ? "auto" : 0,
                  overflow: "hidden",
                  pointerEvents: activeTab === "sell" ? "auto" : "none",
                }}
              >
                {/* Property Sale Filter Bar - FIXED at top, NOT in sheet */}
                <View
                  onLayout={(event) => {
                    const height = event.nativeEvent.layout.height;
                    if (height > 0) {
                      setFilterBarHeight(height);
                    }
                  }}
                >
                  {listViewModeSell && endpoints?.baseURL && (
                    <PropertySaleFilterBar
                      selectedPropertyType={salePropertyCategoryId}
                      onPropertyTypeChange={(categoryId) => {
                        const cat = categoryId
                          ? propertyCategories.find(
                              (c) => String(c.id) === categoryId,
                            )
                          : undefined;
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          propertyType: cat
                            ? categoryEnglishName(cat) || "all"
                            : "all",
                        } as any);
                      }}
                      selectedArea={
                        (saleFilters.filters as any)?.minArea ||
                        (saleFilters.filters as any)?.maxArea
                          ? {
                              min: (saleFilters.filters as any)?.minArea,
                              max: (saleFilters.filters as any)?.maxArea,
                            }
                          : undefined
                      }
                      selectedCountryId={
                        (saleFilters.filters as any)?.country_id
                      }
                      selectedCityId={(saleFilters.filters as any)?.city_id}
                      selectedZoneId={(saleFilters.filters as any)?.zone_id}
                      selectedQuartierId={
                        (saleFilters.filters as any)?.quartier_id
                      }
                      selectedPriceRange={
                        (saleFilters.filters as any)?.salePriceRange
                          ? {
                              min: (saleFilters.filters as any)
                                ?.salePriceRange[0],
                              max: (saleFilters.filters as any)
                                ?.salePriceRange[1],
                            }
                          : undefined
                      }
                      onAreaChange={(minArea, maxArea) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          minArea,
                          maxArea,
                        } as any);
                      }}
                      onCountryChange={(countryId, countryName) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          country_id: countryId,
                          country_name: countryName,
                          city_id: undefined,
                          city_name: undefined,
                          zone_id: undefined,
                          zone_name: undefined,
                          quartier_id: undefined,
                          quartier_name: undefined,
                        } as any);
                      }}
                      onPriceChange={(
                        minPrice: number | undefined,
                        maxPrice: number | undefined,
                      ) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          salePriceRange: [minPrice ?? 0, maxPrice ?? 50000000],
                        } as any);
                      }}
                      onCityChange={(cityId, cityName) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          city_id: cityId,
                          city_name: cityName,
                          zone_id: undefined,
                          zone_name: undefined,
                        } as any);
                      }}
                      onZoneChange={(zoneId, zoneName) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          zone_id: zoneId,
                          zone_name: zoneName,
                          quartier_id: undefined,
                        } as any);
                      }}
                      onQuartierChange={(quartierId, quartierName) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          quartier_id: quartierId,
                          quartier_name: quartierName,
                        } as any);
                      }}
                      selectedYearBuilt={(saleFilters.filters as any).yearBuilt}
                      onYearBuiltChange={(year) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          yearBuilt: year,
                        } as any);
                      }}
                      investmentOnly={
                        (saleFilters.filters as any).investmentOnly === true
                      }
                      onInvestmentChange={(enabled) => {
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          investmentOnly: enabled,
                        } as any);
                      }}
                      onClearAll={() => {
                        // Completely reset all filters
                        saleFilters.clearAllFilters();
                        // Also explicitly clear individual filter states
                        saleFilters.applyFilters({
                          ...(saleFilters.filters as any),
                          minArea: undefined,
                          maxArea: undefined,
                          country_id: undefined,
                          country_name: undefined,
                          city_id: undefined,
                          city_name: undefined,
                          zone_id: undefined,
                          zone_name: undefined,
                          quartier_id: undefined,
                          quartier_name: undefined,
                          salePriceRange: [0, 50000000],
                          yearBuilt: undefined,
                          investmentOnly: false,
                          propertyType: "all",
                        } as any);
                      }}
                    />
                  )}
                </View>

                {/* Direct list or map — no sheet; flat list for 60fps scroll */}
                {listViewModeSell ? (
                  <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
                    <PropertySaleList
                      data={filteredPropertySales.data}
                      isLoading={propertySaleListIsLoading}
                      fetchSessionKey={saleFiltersSessionKey}
                      isFetchingNextPage={
                        publicPropertySales.isFetchingNextPage
                      }
                      hasNextPage={publicPropertySales.hasNextPage}
                      error={publicPropertySales.error}
                      onEndReached={handleSaleListEndReached}
                      onRefresh={handleSaleListRefresh}
                      isRefreshing={
                        publicPropertySales.isFetching &&
                        !publicPropertySales.isFetchingNextPage &&
                        saleListItems.length > 0
                      }
                      onDiscoverLandPress={handleSaleListDiscoverLandPress}
                      onDiscoverLandsViewAll={
                        handleSaleListDiscoverLandsViewAll
                      }
                      onBecomeHostPress={openHostOnboarding}
                      onPress={handleSaleListPress}
                      onCall={handleSaleListCall}
                      onEmail={handleSaleListEmail}
                      favorites={EMPTY_SALE_FAVORITES}
                    />
                  </View>
                ) : activeTab === "sell" ? (
                  <View style={{ flex: 1 }}>
                    <SearchCadastreMapView
                      mapRef={mapRef}
                      cadastre={habitatCadastre}
                      districtFallback={DISTRICTS}
                      onOpenZones={openCadastreZones}
                      onOpenQuartiers={openCadastreQuartiers}
                      onOpenSubSectors={openCadastreSubSectors}
                      plotNumberValue={cadastreInlinePlotNumber}
                      onPlotNumberChange={setCadastreInlinePlotNumber}
                      onPlotSearch={() => {
                        void runInlineCadastrePlotSearch();
                      }}
                      plotSearching={cadastreInlinePlotSearching}
                      onClearFilter={clearCadastreFilter}
                      mapType={mapType}
                      onMapTypeChange={setMapType}
                      initialRegion={
                        centerRegion
                          ? {
                              latitude: centerRegion.latitude,
                              longitude: centerRegion.longitude,
                              latitudeDelta: 0.08,
                              longitudeDelta: 0.08,
                            }
                          : habitatCadastre.initialRegion
                      }
                      onPlotPress={handleHabitatPlotPress}
                      onMapBackgroundPress={() => {
                        handleCadastreMapBackgroundPress();
                        handleDismissPropertyCard({ force: true });
                      }}
                      showPlotPanel={showCadastrePlotPanel}
                      onPlotFound={handleHabitatPlotPress}
                      onPlotViewAllDetails={handleCadastrePlotViewAllDetails}
                      onBackToList={handleBackToListFromMap}
                      landsForSale={mapLandmarks}
                      selectedLand={selectedMapLand}
                      onLandPress={handleMapLandPress}
                      onLandClusterPress={handleMapLandClusterPress}
                      onLandClose={handleMapLandClose}
                      onLandViewDetails={handleMapLandViewDetails}
                      showLandPanel={showLandMapPanel}
                      landPinRestoreGeneration={landPinRestoreGen}
                      landPanelDismissRef={landPanelDismissRef}
                    />
                  </View>
                ) : null}
              </View>
            </View>

            {/* Filter UI now lives in FilterScreen (formSheet) */}
          </View>

          {/* Landmark Info Bottom Sheet - Flexible with gesture handler */}
          <BottomSheet
            ref={landmarkSheetRef}
            index={-1}
            snapPoints={["25%", "50%", "90%"]}
            enablePanDownToClose={false}
            enableOverDrag={false}
            enableHandlePanningGesture={true}
            enableContentPanningGesture={true}
            animateOnMount={Platform.OS !== "android"} // Android: instant appearance (no slide-in), iOS: smooth animation
            animationConfigs={[
              {
                type: "timing",
                config: {
                  duration: Platform.OS === "android" ? 0 : 200, // Smooth animation
                  easing:
                    Platform.OS === "android"
                      ? undefined
                      : Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth bezier curve
                },
              },
            ]}
            backgroundStyle={styles.consistentSheetBackground}
            handleIndicatorStyle={styles.consistentSheetIndicator}
          >
            <BottomSheetScrollView style={pillStyles.bottomSheetContent}>
              {selectedLandmark && selectedLandmark.is_verified && (
                <>
                  <View style={pillStyles.landmarkSheetHeader}>
                    <Text style={pillStyles.landmarkSheetTitle}>
                      {selectedLandmark.title}
                    </Text>
                    <Text style={pillStyles.landmarkSheetOrganization}>
                      {selectedLandmark.organization?.name}
                    </Text>
                  </View>

                  {selectedLandmark.description && (
                    <View style={pillStyles.landmarkSheetSection}>
                      <Text style={pillStyles.landmarkSheetSectionTitle}>
                        {t("landmark.sections.description")}
                      </Text>
                      <Text style={pillStyles.landmarkSheetDescription}>
                        {selectedLandmark.description}
                      </Text>
                    </View>
                  )}

                  <View style={pillStyles.landmarkSheetSection}>
                    <Text style={pillStyles.landmarkSheetSectionTitle}>
                      {t("landmark.sections.landDetails")}
                    </Text>
                    <View style={pillStyles.landmarkSheetDetails}>
                      <View style={pillStyles.landmarkSheetDetailRow}>
                        <Text style={pillStyles.landmarkSheetDetailLabel}>
                          {t("landmark.labels.area")}:
                        </Text>
                        <Text style={pillStyles.landmarkSheetDetailValue}>
                          {selectedLandmark.area} {selectedLandmark.area_unit}
                        </Text>
                      </View>
                      <View style={pillStyles.landmarkSheetDetailRow}>
                        <Text style={pillStyles.landmarkSheetDetailLabel}>
                          {t("landmark.labels.type")}:
                        </Text>
                        <Text style={pillStyles.landmarkSheetDetailValue}>
                          {selectedLandmark.land_type}
                        </Text>
                      </View>
                      {selectedLandmark.zoning && (
                        <View style={pillStyles.landmarkSheetDetailRow}>
                          <Text style={pillStyles.landmarkSheetDetailLabel}>
                            {t("landmark.labels.zoning")}:
                          </Text>
                          <Text style={pillStyles.landmarkSheetDetailValue}>
                            {selectedLandmark.zoning}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={pillStyles.landmarkSheetSection}>
                    <Text style={pillStyles.landmarkSheetSectionTitle}>
                      {t("landmark.sections.location")}
                    </Text>
                    <View style={pillStyles.landmarkSheetMapContainer}>
                      <MapView
                        provider={getMapProvider()}
                        style={pillStyles.landmarkSheetMap}
                        mapType={getPlatformMapViewConfig("standard").mapType}
                        initialRegion={{
                          latitude:
                            (selectedLandmark.point1_lat +
                              selectedLandmark.point3_lat) /
                            2,
                          longitude:
                            (selectedLandmark.point1_lng +
                              selectedLandmark.point3_lng) /
                            2,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        showsPointsOfInterest={false}
                        showsBuildings={false}
                        showsTraffic={false}
                        showsIndoors={false}
                        showsCompass={false}
                        showsScale={false}
                        toolbarEnabled={false}
                      >
                        <PlatformMapTileLayer mapStyle="standard" />
                        <Polygon
                          coordinates={[
                            {
                              latitude: selectedLandmark.point1_lat,
                              longitude: selectedLandmark.point1_lng,
                            },
                            {
                              latitude: selectedLandmark.point2_lat,
                              longitude: selectedLandmark.point2_lng,
                            },
                            {
                              latitude: selectedLandmark.point3_lat,
                              longitude: selectedLandmark.point3_lng,
                            },
                            {
                              latitude: selectedLandmark.point4_lat,
                              longitude: selectedLandmark.point4_lng,
                            },
                          ]}
                          fillColor="rgba(0, 166, 153, 0.3)"
                          strokeColor="#A1A1A1"
                          strokeWidth={2}
                        />
                      </MapView>
                    </View>
                  </View>

                  {selectedLandmark.is_verified && (
                    <View style={pillStyles.landmarkSheetSection}>
                      <View style={pillStyles.verifiedSection}>
                        <MaterialIcons
                          name="verified"
                          size={20}
                          color="#00A699"
                        />
                        <Text style={pillStyles.verifiedSectionText}>
                          {t("landmark.labels.verifiedProperty")}
                        </Text>
                      </View>
                      {selectedLandmark.verification_notes && (
                        <Text style={pillStyles.verificationNotes}>
                          {selectedLandmark.verification_notes}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </BottomSheetScrollView>
          </BottomSheet>

          {/* Share Sheet Modal */}
          <ShareSheet
            visible={shareSheetVisible}
            onClose={() => setShareSheetVisible(false)}
            property={selectedProperty}
          />

          {isLoggedIn ? (
            <>
              <HostShareConsentToast
                visible={
                  showHostShareToast &&
                  !isHostMode &&
                  !hostShareConsent.hasDecided
                }
                onOpenSheet={openHostShareSheet}
                onDismiss={dismissHostShareToast}
              />
              <HostShareConsentSheet
                sheetRef={hostShareSheetRef}
                saving={hostShareConsent.saving}
                hasDecided={hostShareConsent.hasDecided}
                accepted={hostShareConsent.accepted}
                maxBuyersPerProperty={hostShareConsent.maxBuyersPerProperty}
                errorKey={hostShareConsent.error}
                onAccept={handleHostShareAccept}
                onDecline={handleHostShareDecline}
                onClose={() => hostShareSheetRef.current?.dismiss()}
              />
            </>
          ) : null}

        {/* Map | MeskenyGPT — last child so it stacks above lists/maps */}
        <View
          style={[
            styles.mapFabOverlay,
            mapCenterControlsHidden && styles.mapFabOverlayHidden,
          ]}
          pointerEvents={mapCenterControlsHidden ? "none" : "box-none"}
        >
          {activeTab === "sell" ||
          activeTab === "landmarks" ||
          activeTab === "properties" ? (
            <MapCenterControls
              hidden={mapCenterControlsHidden}
              listViewMode={activeListViewMode}
              bottomOffset={mapControlsBottomOffset}
              onMeskenyPress={openMeskenyGPT}
              onToggleView={handleMapFabToggleView}
            />
          ) : null}
        </View>

        <HostOnboardingSheet
          sheetRef={hostOnboardingSheetRef}
          modalName="hostOnboardingSearch"
        />

        <CadastreFilterSheet
          sheetRef={habitatCadastreFilterRef}
          cadastre={habitatCadastre}
          getMapRef={getCadastreMapRef}
          districtFallback={DISTRICTS}
          onPlotFound={handleHabitatPlotPress}
        />

        {/* Auto-show NotificationPermissionScreen on app mount */}
        <NotificationPermissionAutoShow />

        {/* Floating mini video should live in the discovery/view feed, not over Properties list. */}
        {/* FloatingVideoWindow disabled — re-enable when feed video is ready */}
        {/* {activeTab === "sell" && !listViewModeSell ? (
          <FloatingVideoWindow sheetIndex={propertiesSheetIndex} />
        ) : null} */}

        {/* Property Detail Card - render only in map mode */}
        {((activeTab === "sell" && !listViewModeSell) ||
          (activeTab === "properties" && !listViewModeProperties)) && (
          <PropertyDetailCard
            onClose={handleDismissPropertyCard}
            onCardPress={() => {
              const p = instantCardStore.getSnapshot().property;
              const pid =
                p?.id ?? p?.ID ?? p?.property_id ?? selectedPropertyId;
              if (!pid) return;
              prefetchPropertySaleImages(p || {});
              warmPropertySaleDetailNavigation(
                queryClient,
                Number(pid),
                langParam,
                p || undefined,
              );
              handleDismissPropertyCard?.({ force: true });
              navigation.navigate("PropertySaleDetails", {
                propertyId: Number(pid),
              } as any);
            }}
          />
        )}

        {/* New messages hint — pill only (no sheet/overlay visuals) */}
        {showMessagesHint && unreadCount > 0 ? (
          <MessagesTabUnreadIndicator
            count={unreadCount}
            screenWidth={SCREEN_WIDTH}
            insetsBottom={insets.bottom || 0}
            onPress={() => {
              setShowMessagesHint(false);
              (navigation as any).navigate("Inbox");
            }}
          />
        ) : null}
        </View>
    );
  } catch (error: any) {
    crashReporting.logError(error, {
      phase: "render",
      screen: "SearchScreen",
    });
    // Return a fallback UI
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#DC2626",
            marginBottom: 12,
          }}
        >
          ⚠️ Error rendering SearchScreen
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
          Please restart the app
        </Text>
      </View>
    );
  }
};

// NOTE: This screen is extremely large; we keep styles typed as `any` to avoid
// TS inference issues causing false \"property does not exist\" errors.
const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  storiesContainer: {
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: "15%",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
  },
  meskenyGPTButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "#0A0A0B",
    marginLeft: 8,
  },
  meskenyGPTButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FAFAFA",
    letterSpacing: -0.2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#222222",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#717171",
  },
  activeTabText: {
    color: "#222222",
    fontWeight: "600",
  },
  // Consistent Sheet Styles for all tabs
  consistentSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  // Sheet that slides UNDER header - no radius to hide seamlessly
  sheetBackgroundNoRadius: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 50,
    zIndex: 50,
    // No shadow - clean slide under header
  },
  consistentSheetIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  // Map Controls for Lands tab - ON the map, below filter bar
  mapControlsStackLands: {
    position: "absolute",
    top: 120, // Below filter bar, visible ON the map
    right: 16,
    flexDirection: "column",
    gap: 10,
    zIndex: 1, // Low z-index so controls stay BEHIND the sheet
  },
  // Map Controls for Property Sales - Similar to Property Rent style
  mapControlsStackSales: {
    position: "absolute",
    top: 120, // Below filter bar, visible ON the map
    right: 16,
    flexDirection: "column",
    gap: 10,
    zIndex: 1, // Low z-index so controls stay BEHIND the sheet
    alignItems: "center",
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  airbnbSheetBackground: {
    backgroundColor: "#FFFFFF",
    // Remove top corner radius so the map never peeks through left/right corners
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  airbnbHandleIndicator: {
    backgroundColor: "#D1D5DB",
    width: 48,
    height: 4,
    borderRadius: 2,
    marginTop: 0,
    marginBottom: 0,
  },
  // Fully hidden handle used when the sheet is clipped under the header
  hiddenHandleIndicator: {
    width: 48,
    height: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  sheetContentContainer: {
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 0,
    flexGrow: 1,
    width: "100%",
  },
  sheetContentPadding: {},
  filtersSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sheetInner: {
    paddingTop: 8,
  },
  clearFiltersButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: "#222222",
    fontSize: 13,
    fontWeight: "600",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#717171",
  },
  emptyAnimation: {
    width: 180,
    height: 180,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  experiencesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  experiencesTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    textAlign: "center",
  },
  experiencesSubtitle: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  landmarksSkeletonWrap: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  landmarksSkeletonCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    marginBottom: 12,
  },
  landmarksSkeletonImage: {
    height: 150,
    backgroundColor: "#ECEFF3",
  },
  landmarksSkeletonBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  landmarksSkeletonLineLg: {
    height: 14,
    width: "78%",
    borderRadius: 8,
    backgroundColor: "#ECEFF3",
  },
  landmarksSkeletonLineMd: {
    height: 12,
    width: "56%",
    borderRadius: 8,
    backgroundColor: "#ECEFF3",
  },
  landmarksSkeletonLineSm: {
    height: 12,
    width: "34%",
    borderRadius: 8,
    backgroundColor: "#ECEFF3",
  },
  loadingText: {
    fontSize: 16,
    color: "#717171",
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#222222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  propertiesGrid: {
    gap: 12,
  },
  // Airbnb-style Card Styles
  airbnbCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  airbnbImageContainer: {
    position: "relative",
    height: 240,
    backgroundColor: "#F5F5F5",
  },
  airbnbImage: {
    width: "100%",
    height: "100%",
  },
  airbnbImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeIndicator: {
    backgroundColor: "#FFFFFF",
  },
  moreImagesText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  airbnbFavoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  airbnbShareButton: {
    position: "absolute",
    top: 12,
    right: 52,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyTypeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propertyTypeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  airbnbContent: {
    padding: 16,
  },
  translationIconContainer: {
    position: "absolute",
    top: -8,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  airbnbTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  airbnbTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
    marginRight: 8,
  },
  airbnbRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  airbnbRatingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
  },
  airbnbLocation: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 12,
  },
  airbnbDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  airbnbDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  airbnbDetailText: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500",
  },
  airbnbPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  airbnbPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  airbnbPerNight: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "400",
  },
  singleLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    borderColor: "#F0F0F0",
    borderWidth: 0.6,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 0,
    marginRight: 0, // No margin by default - full width
  },
  searchTextContainer: {
    flex: 1,
    marginLeft: 8,
    overflow: "hidden",
    height: 20, // Fixed height to prevent layout shifts
    minWidth: 0, // Allow shrinking
  },
  scrollToTopButtonContainer: {
    display: "none", // Hidden
  },
  scrollToTopButtonHeader: {
    display: "none", // Hidden
  },
  searchText: {
    fontSize: 13,
    color: "#717171",
  },
  singleLineButton: {
    width: 120,
    height: 40,
    flexDirection: "row",
    gap: 10,
    borderRadius: 30,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  card: {
    marginVertical: 8,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Clean Filter Styles
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  searchBarAnimatedWrapper: {
    flex: 1,
    minWidth: 0,
  },
  mapToggleButton: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  mapToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
  },
  zoneToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 6,
    marginLeft: 8,
  },
  zoneToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    letterSpacing: 0.1,
  },
  zoneToggleTextInactive: {
    color: "#717171",
  },
  zoneToggleContainer: {
    position: "absolute",
    top: "45%",
    right: 16,
    zIndex: 1, // Low z-index so stays BEHIND sheet
  },
  mapControlsStack: {
    position: "absolute",
    top: 120, // Below filter bar, visible ON the map
    right: 16,
    zIndex: 1, // Low z-index so controls stay BEHIND the sheet
    alignItems: "center",
    gap: 10,
  },
  zoneToggleButtonAbsolute: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },

  // Map Styles
  sellMapContainer: {
    flex: 1,
    position: "relative",
  },
  sellMap: {
    flex: 1,
    borderRadius: 12,
    margin: 16,
  },
  mapMarker: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  mapMarkerText: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "700",
  },
  mapMarkerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    alignSelf: "center",
    marginTop: -2,
    // slight outline to match bubble border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  // Zoom-out dot marker for sale properties
  saleZoomDotMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme["color-temporary-primary"],
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  showListButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 40,
    marginBottom: 10,
    borderRadius: 20,
    elevation: 3,
    flexDirection: "row",
  },
  showListButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  floatingMapButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 40,
    borderRadius: 25,
    elevation: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingMapButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Sell Tab Filter Styles
  sellFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sellFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    gap: 8,
  },
  sellFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
  },
  sellFilterBadge: {
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sellFilterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  // Quick Filter Dropdowns Styles
  quickFiltersWrapper: {
    height: 48,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  quickFiltersScrollView: {
    height: 48,
  },
  quickFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 48,
    gap: 10,
  },
  quickFiltersScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
    height: 48,
  },
  quickFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    gap: 6,
    minWidth: 0,
    flexShrink: 0, // Changed from 1 to 0 to prevent shrinking
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111",
    flexShrink: 1,
    paddingHorizontal: 2,
    lineHeight: 18,
  },

  // Filter Modal Styles
  filterModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "60%",
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  filterModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexShrink: 0, // Prevent chips from shrinking
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  priceSeparator: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  roomInputs: {
    flexDirection: "row",
    gap: 12,
  },
  roomInputContainer: {
    flex: 1,
  },
  roomInputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 6,
  },
  roomInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  yearInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  cityInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  filterModalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  applyFiltersButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    height: "auto",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Floating Video Promo Styles
  floatingVideoPromoContainer: {
    position: "absolute",
    bottom: 64, // leave space for bottom center action button
    alignSelf: "center",
    zIndex: 1000,
  },
  floatingVideoPromo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"],
    width: 170, // Fixed small width
  },
  floatingVideoPromoContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  floatingVideoPromoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  floatingVideoPromoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 6,
    flex: 1,
  },
  floatingVideoPromoArrow: {
    position: "absolute",
    bottom: -8,
    left: "50%", // Center the arrow
    marginLeft: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomOverlayContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  bottomCenterActionContainer: {
    alignItems: "center",
  },
  bottomCenterActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 120,
    gap: 8,
  },
  bottomCenterActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollToTopContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  scrollToTopButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"],
    width: 60, // Smaller width like video button
    height: 40, // Smaller height
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom Sheet Overlay Container (Full Screen)
  bottomSheetOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      android: {
        elevation: 1000,
      },
    }),
  },
  // Bottom Sheet Safe Area Wrapper
  bottomSheetSafeArea: {
    flex: 1,
  },
  // Properties and Sell Bottom Sheet Styles
  propertiesBottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 50,
    zIndex: 50,
  },
  propertiesBottomSheetIndicator: {
    backgroundColor: "#D1D5DB",
    width: 40,
  },
  propertiesBottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomSheetScrollContent: {
    paddingBottom: 16, // Minimal padding to prevent white space
    flexGrow: 0,
  },
  clearFiltersPrimary: {
    backgroundColor: "#222222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    alignSelf: "center",
  },
  clearFiltersPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  propertiesListContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Map Controls Styles (Legacy - keeping for compatibility)
  mapControlsLeft: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 10,
  },
  mapControlsRight: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 10,
  },
  mapControlButtonApply: {
    backgroundColor: "#00A699",
    borderColor: "#00A699",
  },
  mapControlText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },
});

/** Landmarks tab loading skeleton — placed after `styles` so it can reference skeleton styles safely. */
const LandmarkSkeletonCard = React.memo(function LandmarkSkeletonCard() {
  const shimmer = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const tx = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 320],
  });
  return (
    <View style={styles.landmarksSkeletonCard}>
      <View style={styles.landmarksSkeletonImage}>
        <RNAnimated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}
        >
          <RNAnimated.View
            style={{
              width: 140,
              height: "100%",
              opacity: 0.42,
              transform: [{ translateX: tx }],
            }}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.88)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </RNAnimated.View>
        </RNAnimated.View>
      </View>
      <View style={styles.landmarksSkeletonBody}>
        <View style={styles.landmarksSkeletonLineLg} />
        <View style={styles.landmarksSkeletonLineMd} />
        <View style={styles.landmarksSkeletonLineSm} />
      </View>
    </View>
  );
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  clearChip: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
    marginLeft: 6,
  },
});

const pillStyles = StyleSheet.create({
  translationIconContainer: {
    position: "absolute",
    top: -8,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  pill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  pillText: {
    fontSize: 11,
    color: "#111827",
    fontWeight: "600",
  },
  // Landmark styles
  landmarkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 250,
  },
  heroImageWrapper: {
    position: "relative",
    width: "100%",
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  leftImage: {
    width: 110,
    height: 250,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  overlayBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  overlayBadgeText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
  },
  overlayPill: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  landmarkThumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  landmarkThumbPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  landmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  landmarkName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  landmarkOrganization: {
    fontSize: 14,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  landmarkDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 8,
  },
  landmarkCoords: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
  },
  landmarkCoordText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  landmarkDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  landmarkDetailText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: "#00A699",
    fontWeight: "600",
  },
  miniMap: {
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  miniMapRight: {
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: "#D1D5DB",
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  landmarkSheetHeader: {
    marginBottom: 20,
  },
  landmarkSheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  landmarkSheetOrganization: {
    fontSize: 14,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  landmarkSheetSection: {
    marginBottom: 24,
  },
  landmarkSheetSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  landmarkSheetDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  landmarkSheetDetails: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  landmarkSheetDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  landmarkSheetDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  landmarkSheetDetailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  landmarkSheetMapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  landmarkSheetMap: {
    flex: 1,
  },
  verifiedSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifiedSectionText: {
    fontSize: 16,
    color: "#00A699",
    fontWeight: "600",
  },
  verificationNotes: {
    fontSize: 14,
    color: "#374151",
    marginTop: 8,
    fontStyle: "italic",
  },
  scrollToTopContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  scrollToTopButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"],
    width: 60, // Smaller width like video button
    height: 40, // Smaller height
    alignItems: "center",
    justifyContent: "center",
  },

  // Professional Property Sales Sheet Styles
  professionalSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 50,
    zIndex: 50,
  },
  mapFabOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10050,
    elevation: 10050,
    pointerEvents: "box-none",
  },
  mapFabOverlayHidden: {
    opacity: 0,
  },
  showMapButtonCenterContainer: {
    position: "absolute",
    left: 0,
    backgroundColor: "#FF00FF",
    right: 0,
    top: "50%",
    marginTop: -28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  showMapButtonPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    minHeight: 52,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  showMapButtonPillText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  professionalSheetScrollView: {
    width: "100%",
    flex: 1,
  },
  professionalSheetContent: {
    width: "100%",
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 24,
    paddingHorizontal: 0,
  },
  professionalHeaderContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  professionalHeaderContent: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  professionalMainTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 8,
  },
  professionalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  professionalContentWrapper: {
    width: "100%",
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 16,
  },
  professionalTextContainer: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  professionalBigText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -1,
    lineHeight: 56,
    marginBottom: 16,
    textAlign: "left",
  },
  professionalDescriptionText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#4B5563",
    letterSpacing: -0.3,
    lineHeight: 28,
    textAlign: "left",
  },
  professionalFiltersSection: {
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  professionalCenterContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  professionalErrorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
  professionalErrorSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  professionalEmptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  professionalEmptySubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  // Add missing styles that are referenced but not defined
  consistentSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  consistentSheetIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  consistentSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

// Public screen export used by navigator.
// Wraps the internal implementation with the centralized Map UI state provider.
export const SearchScreen = (props: {
  route?: { params?: SearchScreenParams };
}) => {
  return (
    <MapUIStateProvider>
      <SearchScreenInternal {...props} />
    </MapUIStateProvider>
  );
};
