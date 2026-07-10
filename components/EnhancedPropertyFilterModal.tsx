// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Dimensions,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   X,
//   FunnelSimple,
//   Check,
//   WifiHigh,
//   Car,
//   Waves,
//   Barbell,
//   Shield,
//   Snowflake,
//   Coffee,
//   House,
//   Building,
//   HouseLine,
//   Key,
//   MapPin,
//   Bed,
//   Bathtub,
//   Drop,
//   Tree,
//   Fire,
//   Television,
//   Airplane,
//   SwimmingPool,
//   GameController,
//   MusicNote,
//   PawPrint,
//   Baby,
//   Wheelchair,
//   Lock,
//   Elevator,
//   Sun,
//   Moon,
//   CloudSnow,
//   Thermometer,
//   Fan,
//   Lightbulb,
//   Plug,
//   WashingMachine,
//   Toilet,
//   Shower,
//   Dress,
//   Backpack,
//   Suitcase,
//   Camera,
//   Phone,
//   Printer,
//   HardDrive,
//   Clock,
//   Calendar,
//   Compass,
//   Globe,
//   Flag,
//   Star,
//   Heart,
//   ThumbsUp,
//   Users,
//   User,
//   UserPlus,
//   UserMinus,
//   UserCheck,
//   Eye,
//   EyeSlash,
//   Bell,
//   BellSlash,
//   Microphone,
//   MicrophoneSlash,
//   Video,
//   Image,
//   File,
//   Folder,
//   Download,
//   Upload,
//   Share,
//   Copy,
//   Scissors,
//   Trash,
//   Archive,
//   Bookmark,
//   BookmarkSimple,
//   Tag,
//   Hash,
//   At,
//   Link,
//   LinkBreak,
//   Paperclip,
//   PaperPlane,
//   Envelope,
//   EnvelopeOpen,
//   Mailbox,
//   Chat,
//   ChatCircle,
//   ChatDots,
//   ChatText,
//   ChatTeardrop,
//   ChatTeardropDots,
//   ChatTeardropText,
//   PhoneCall,
//   PhoneIncoming,
//   PhoneOutgoing,
//   PhoneSlash,
//   PhoneX,
//   VideoCamera,
//   VideoCameraSlash,
//   Webcam,
//   WebcamSlash,
//   Monitor,
//   MonitorPlay,
//   Presentation,
//   PresentationChart,
//   TrendUp,
//   TrendDown,
//   Pulse,
//   Heartbeat,
//   ThermometerHot,
//   ThermometerCold,
//   Wind,
//   Cloud,
//   CloudRain,
//   CloudLightning,
//   Planet,
//   Rocket,
//   Binoculars,
//   Microscope,
//   Flask,
//   Atom,
//   TestTube,
//   GraduationCap,
//   Book,
//   BookOpen,
//   Books,
//   Calculator,
//   Ruler,
//   Triangle,
//   Square,
//   Hexagon,
//   Pentagon,
//   Octagon,
//   Diamond,
//   Plus,
//   Minus,
//   Equals,
//   Warning,
//   Info,
//   Question,
//   WarningCircle,
//   Flashlight,
//   Lamp,
//   ExclamationMarkIcon
// } from 'phosphor-react-native';
// import { useTranslation } from 'react-i18next';
// import { useQuery } from '@tanstack/react-query';
// import { api } from '../services/api';
// import BottomSheetForm from './FormSheet';
// import { CustomPriceRangeSlider } from './CustomPriceRangeSlider';
// import { getIconFromDatabase } from '../utils/iconInterpreter';

// const { width } = Dimensions.get('window');

// interface EnhancedPropertyFilterModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onApply: (filters: PropertyFilters) => void;
//   initialFilters?: PropertyFilters;
// }

// export interface PropertyFilters {
//   priceRange: [number, number];
//   propertyType: string;
//   bedrooms: number;
//   bathrooms: number;
//   amenities: string[];
//   location: string;
//   sortBy: string;
// }

// interface Amenity {
//   id: number;
//   name: {
//     en: string;
//     fr: string;
//     ar: string;
//   };
//   icon: string;
//   category: string;
// }

// interface Category {
//   id: number;
//   type: string;
//   name: {
//     en: string;
//     fr: string;
//     ar: string;
//   };
//   icon: string;
// }

// interface Location {
//   key: string;
//   name: {
//     en: string;
//     fr: string;
//     ar: string;
//   };
//   coordinates: {
//     latitude: number;
//     longitude: number;
//   };
// }

// const DEFAULT_FILTERS: PropertyFilters = {
//   priceRange: [0, 50000],
//   propertyType: 'all',
//   bedrooms: 0,
//   bathrooms: 0,
//   amenities: [],
//   location: 'all',
//   sortBy: 'relevance',
// };

// // Use the icon interpreter for amenities
// const getAmenityIcon = (iconName: string) => {
//   return getIconFromDatabase(iconName);
// };

// // Use the icon interpreter for property types
// const getPropertyTypeIcon = (iconName: string) => {
//   return getIconFromDatabase(iconName);
// };

// const SORT_OPTIONS = [
//   { value: 'relevance', label: 'Relevance' },
//   { value: 'price_low', label: 'Price: Low to High' },
//   { value: 'price_high', label: 'Price: High to Low' },
//   { value: 'newest', label: 'Newest First' },
//   { value: 'rating', label: 'Highest Rated' },
// ];

// export const EnhancedPropertyFilterModal: React.FC<EnhancedPropertyFilterModalProps> = ({
//   visible,
//   onClose,
//   onApply,
//   initialFilters = DEFAULT_FILTERS,
// }) => {
//   const { t, i18n } = useTranslation();
//   const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
//   const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities);

//   // Fetch categories
//   const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
//     'categories',
//     () => api.get('/categories?type=property').then(res => res.data),
//     { enabled: visible }
//   );

//   // Fetch amenities
//   const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery(
//     'amenities',
//     () => api.get('/categories/amenities').then(res => res.data),
//     { enabled: visible }
//   );

//   // Fetch locations
//   const { data: locationsData, isLoading: locationsLoading } = useQuery(
//     'locations',
//     () => api.get('/location/locations').then(res => res.data),
//     { enabled: visible }
//   );

//   // Extract arrays from API responses
//   const categoriesList = Array.isArray(categoriesData) ? categoriesData :
//     Array.isArray(categoriesData?.data) ? categoriesData.data :
//     Array.isArray(categoriesData?.categories) ? categoriesData.categories : [];

//   const amenitiesList = Array.isArray(amenitiesData) ? amenitiesData :
//     Array.isArray(amenitiesData?.data) ? amenitiesData.data :
//     Array.isArray(amenitiesData?.amenities) ? amenitiesData.amenities : [];

//   const locationsList = Array.isArray(locationsData) ? locationsData :
//     Array.isArray(locationsData?.data) ? locationsData.data :
//     Array.isArray(locationsData?.locations) ? locationsData.locations : [];

//   useEffect(() => {
//     if (visible) {
//       setFilters(initialFilters);
//       setSelectedAmenities(initialFilters.amenities);
//     }
//   }, [visible, initialFilters]);

//   const handleApply = () => {
//     const updatedFilters = {
//       ...filters,
//       amenities: selectedAmenities,
//     };
//     onApply(updatedFilters);
//     onClose();
//   };

//   const handleReset = () => {
//     setFilters(DEFAULT_FILTERS);
//     setSelectedAmenities([]);
//   };

//   const toggleAmenity = (amenityId: string) => {
//     setSelectedAmenities(prev =>
//       prev.includes(amenityId)
//         ? prev.filter(id => id !== amenityId)
//         : [...prev, amenityId]
//     );
//   };

//   const getActiveFiltersCount = () => {
//     let count = 0;
//     if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) count++;
//     if (filters.propertyType !== 'all') count++;
//     if (filters.bedrooms > 0) count++;
//     if (filters.bathrooms > 0) count++;
//     if (selectedAmenities.length > 0) count++;
//     if (filters.location !== 'all') count++;
//     if (filters.sortBy !== 'relevance') count++;
//     return count;
//   };

//   const formatPrice = (price: number) => {
//     if (price === 0) return '0 MRU';
//     if (price >= 1000) return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K MRU`;
//     return `${price} MRU`;
//   };

//   return (
//     <BottomSheetForm
//       visible={visible}
//       onClose={onClose}
//       title="Filter Properties"
//       height={Dimensions.get('window').height * 0.9}
//     >
//       <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//         {/* Price Range Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Price Range</Text>
//           <Text style={styles.sectionSubtitle}>
//             {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
//           </Text>
//           <CustomPriceRangeSlider
//             min={0}
//             max={50000}
//             value={filters.priceRange}
//             onChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
//             step={1000}
//             formatValue={formatPrice}
//           />
//         </View>

//         {/* Property Type Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Property Type</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
//             <TouchableOpacity
//               style={[
//                 styles.propertyTypeChip,
//                 filters.propertyType === 'all' && styles.propertyTypeChipActive
//               ]}
//               onPress={() => setFilters(prev => ({ ...prev, propertyType: 'all' }))}
//             >
//               <House size={20} color={filters.propertyType === 'all' ? '#FFFFFF' : '#222222'} />
//               <Text style={[
//                 styles.propertyTypeChipText,
//                 filters.propertyType === 'all' && styles.propertyTypeChipTextActive
//               ]}>
//                 All Types
//               </Text>
//             </TouchableOpacity>

//             {categoriesList.map((category: Category) => {
//               const IconComponent = getPropertyTypeIcon(category.icon);
//               return (
//                 <TouchableOpacity
//                   key={category.id}
//                   style={[
//                     styles.propertyTypeChip,
//                     filters.propertyType === category.id.toString() && styles.propertyTypeChipActive
//                   ]}
//                   onPress={() => setFilters(prev => ({ ...prev, propertyType: category.id.toString() }))}
//                 >
//                   <IconComponent size={20} color={filters.propertyType === category.id.toString() ? '#FFFFFF' : '#222222'} />
//                   <Text style={[
//                     styles.propertyTypeChipText,
//                     filters.propertyType === category.id.toString() && styles.propertyTypeChipTextActive
//                   ]}>
//                     {category.name[i18n.language as keyof typeof category.name] || category.name.en}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </ScrollView>
//         </View>

//         {/* Rooms Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Rooms</Text>
//           <View style={styles.roomsContainer}>
//             <View style={styles.roomInputContainer}>
//               <Text style={styles.roomLabel}>Bedrooms</Text>
//               <View style={styles.roomInputRow}>
//                 <TouchableOpacity
//                   style={styles.roomButton}
//                   onPress={() => setFilters(prev => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))}
//                 >
//                   <Minus size={16} color="#222222" />
//                 </TouchableOpacity>
//                 <Text style={styles.roomValue}>{filters.bedrooms}</Text>
//                 <TouchableOpacity
//                   style={styles.roomButton}
//                   onPress={() => setFilters(prev => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
//                 >
//                   <Plus size={16} color="#222222" />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             <View style={styles.roomInputContainer}>
//               <Text style={styles.roomLabel}>Bathrooms</Text>
//               <View style={styles.roomInputRow}>
//                 <TouchableOpacity
//                   style={styles.roomButton}
//                   onPress={() => setFilters(prev => ({ ...prev, bathrooms: Math.max(0, prev.bathrooms - 1) }))}
//                 >
//                   <Minus size={16} color="#222222" />
//                 </TouchableOpacity>
//                 <Text style={styles.roomValue}>{filters.bathrooms}</Text>
//                 <TouchableOpacity
//                   style={styles.roomButton}
//                   onPress={() => setFilters(prev => ({ ...prev, bathrooms: prev.bathrooms + 1 }))}
//                 >
//                   <Plus size={16} color="#222222" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Location Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Location</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
//             <TouchableOpacity
//               style={[
//                 styles.locationChip,
//                 filters.location === 'all' && styles.locationChipActive
//               ]}
//               onPress={() => setFilters(prev => ({ ...prev, location: 'all' }))}
//             >
//               <MapPin size={16} color={filters.location === 'all' ? '#FFFFFF' : '#222222'} />
//               <Text style={[
//                 styles.locationChipText,
//                 filters.location === 'all' && styles.locationChipTextActive
//               ]}>
//                 All Locations
//               </Text>
//             </TouchableOpacity>

//             {locationsList.map((location: Location) => (
//               <TouchableOpacity
//                 key={location.key}
//                 style={[
//                   styles.locationChip,
//                   filters.location === location.key && styles.locationChipActive
//                 ]}
//                 onPress={() => setFilters(prev => ({ ...prev, location: location.key }))}
//               >
//                 <MapPin size={16} color={filters.location === location.key ? '#FFFFFF' : '#222222'} />
//                 <Text style={[
//                   styles.locationChipText,
//                   filters.location === location.key && styles.locationChipTextActive
//                 ]}>
//                   {location.name[i18n.language as keyof typeof location.name] || location.name.en}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         {/* Amenities Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Amenities</Text>
//           <Text style={styles.sectionSubtitle}>Select the amenities you want</Text>

//           {amenitiesLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#222222" />
//               <Text style={styles.loadingText}>Loading amenities...</Text>
//             </View>
//           ) : (
//             <View style={styles.amenitiesGrid}>
//               {amenitiesList.map((amenity: Amenity) => {
//                 const IconComponent = getAmenityIcon(amenity.icon);
//                 const isSelected = selectedAmenities.includes(amenity.id.toString());

//                 return (
//                   <TouchableOpacity
//                     key={amenity.id}
//                     style={[
//                       styles.amenityChip,
//                       isSelected && styles.amenityChipActive
//                     ]}
//                     onPress={() => toggleAmenity(amenity.id.toString())}
//                   >
//                     <IconComponent
//                       size={20}
//                       color={isSelected ? '#FFFFFF' : '#222222'}
//                     />
//                     <Text style={[
//                       styles.amenityChipText,
//                       isSelected && styles.amenityChipTextActive
//                     ]}>
//                       {amenity.name[i18n.language as keyof typeof amenity.name] || amenity.name.en}
//                     </Text>
//                     {isSelected && (
//                       <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
//                     )}
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           )}
//         </View>

//         {/* Sort Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Sort By</Text>
//           <View style={styles.sortContainer}>
//             {SORT_OPTIONS.map((option) => (
//               <TouchableOpacity
//                 key={option.value}
//                 style={[
//                   styles.sortOption,
//                   filters.sortBy === option.value && styles.sortOptionActive
//                 ]}
//                 onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
//               >
//                 <Text style={[
//                   styles.sortOptionText,
//                   filters.sortBy === option.value && styles.sortOptionTextActive
//                 ]}>
//                   {option.label}
//                 </Text>
//                 {filters.sortBy === option.value && (
//                   <Check size={16} color="#222222" />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.actionButtons}>
//           <TouchableOpacity
//             style={styles.resetButton}
//             onPress={handleReset}
//           >
//             <Text style={styles.resetButtonText}>Reset</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.applyButton}
//             onPress={handleApply}
//           >
//             <Text style={styles.applyButtonText}>
//               Apply Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </BottomSheetForm>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     // flex: 1,
//     paddingHorizontal: 20,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#222222',
//     marginBottom: 4,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     color: '#717171',
//     marginBottom: 16,
//   },
//   horizontalScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   propertyTypeChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 24,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   propertyTypeChipActive: {
//     backgroundColor: '#222222',
//     borderColor: '#222222',
//   },
//   propertyTypeChipText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//     marginLeft: 8,
//   },
//   propertyTypeChipTextActive: {
//     color: '#FFFFFF',
//   },
//   roomsContainer: {
//     flexDirection: 'row',
//     gap: 20,
//   },
//   roomInputContainer: {
//     flex: 1,
//   },
//   roomLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//     marginBottom: 8,
//   },
//   roomInputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#F7F7F7',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   roomButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   roomValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#222222',
//     minWidth: 24,
//     textAlign: 'center',
//   },
//   locationChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 24,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   locationChipActive: {
//     backgroundColor: '#222222',
//     borderColor: '#222222',
//   },
//   locationChipText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//     marginLeft: 8,
//   },
//   locationChipTextActive: {
//     color: '#FFFFFF',
//   },
//   amenitiesGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   amenityChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     minWidth: '45%',
//     position: 'relative',
//   },
//   amenityChipActive: {
//     backgroundColor: '#222222',
//     borderColor: '#222222',
//   },
//   amenityChipText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//     marginLeft: 8,
//     flex: 1,
//   },
//   amenityChipTextActive: {
//     color: '#FFFFFF',
//   },
//   checkIcon: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//   },
//   sortContainer: {
//     gap: 8,
//   },
//   sortOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   sortOptionActive: {
//     backgroundColor: '#F0F0F0',
//     borderColor: '#222222',
//   },
//   sortOptionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   sortOptionTextActive: {
//     color: '#222222',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   loadingText: {
//     fontSize: 14,
//     color: '#717171',
//     marginLeft: 8,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 12,
//     marginTop: 20,
//     marginBottom: 40,
//   },
//   resetButton: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   resetButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   applyButton: {
//     flex: 2,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     backgroundColor: '#222222',
//   },
//   applyButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
// });

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { X, Check, House, MapPin, Plus, Minus } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import BottomSheetForm from "./FormSheet";
import { getIconFromDatabase } from "../utils/iconInterpreter";

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;
const HAPTIC_STEP = 1000;

interface EnhancedPropertyFilterModalProps {
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
  locationCriteria: string[];
  sortBy: string;
}

interface Amenity {
  id: number;
  name: { en: string; fr: string; ar: string };
  icon: string;
  category: string;
}

interface Category {
  id: number;
  type: string;
  name: { en: string; fr: string; ar: string };
  icon: string;
}

interface Location {
  key: string;
  name: { en: string; fr: string; ar: string };
  coordinates: { latitude: number; longitude: number };
}

const DEFAULT_FILTERS: PropertyFilters = {
  priceRange: [0, 50000],
  propertyType: "all",
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  location: "all",
  locationCriteria: [],
  sortBy: "relevance"
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" }
];

// Premium Custom Range Slider Component
const PremiumRangeSlider: React.FC<{
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step: number;
}> = ({ min, max, value, onChange, step }) => {
  const leftThumb = useSharedValue((value[0] / max) * SLIDER_WIDTH);
  const rightThumb = useSharedValue((value[1] / max) * SLIDER_WIDTH);
  const leftScale = useSharedValue(1);
  const rightScale = useSharedValue(1);

  const [lastHapticLeft, setLastHapticLeft] = useState(value[0]);
  const [lastHapticRight, setLastHapticRight] = useState(value[1]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const snapToStep = (val: number) => {
    "worklet";
    const rawValue = (val / SLIDER_WIDTH) * max;
    const snapped = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, snapped));
  };

  const leftGesture = Gesture.Pan()
    .onStart(() => {
      leftScale.value = withSpring(1.3, { damping: 15, stiffness: 300 });
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      const targetVal = Math.max(
        0,
        Math.min(
          (value[0] / max) * SLIDER_WIDTH + event.translationX,
          rightThumb.value - 20
        )
      );
      leftThumb.value = targetVal;

      const currentValue = snapToStep(targetVal);
      if (Math.abs(currentValue - lastHapticLeft) >= HAPTIC_STEP) {
        runOnJS(setLastHapticLeft)(currentValue);
        runOnJS(triggerHaptic)();
      }

      // Update price in real-time
      const rightVal = snapToStep(rightThumb.value);
      runOnJS(onChange)([currentValue, rightVal]);
    })
    .onEnd(() => {
      leftScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      const leftVal = snapToStep(leftThumb.value);
      const rightVal = snapToStep(rightThumb.value);
      leftThumb.value = withTiming((leftVal / max) * SLIDER_WIDTH, {
        duration: 200
      });
      runOnJS(onChange)([leftVal, rightVal]);
      runOnJS(triggerHaptic)();
    });

  const rightGesture = Gesture.Pan()
    .onStart(() => {
      rightScale.value = withSpring(1.3, { damping: 15, stiffness: 300 });
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      const targetVal = Math.max(
        leftThumb.value + 20,
        Math.min(
          (value[1] / max) * SLIDER_WIDTH + event.translationX,
          SLIDER_WIDTH
        )
      );
      rightThumb.value = targetVal;

      const currentValue = snapToStep(targetVal);
      if (Math.abs(currentValue - lastHapticRight) >= HAPTIC_STEP) {
        runOnJS(setLastHapticRight)(currentValue);
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      rightScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      const leftVal = snapToStep(leftThumb.value);
      const rightVal = snapToStep(rightThumb.value);
      rightThumb.value = withTiming((rightVal / max) * SLIDER_WIDTH, {
        duration: 200
      });
      runOnJS(onChange)([leftVal, rightVal]);
      runOnJS(triggerHaptic)();
    });

  const trackStyle = useAnimatedStyle(() => ({
    left: leftThumb.value,
    width: rightThumb.value - leftThumb.value
  }));

  const leftThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftThumb.value }, { scale: leftScale.value }]
  }));

  const rightThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightThumb.value }, { scale: rightScale.value }]
  }));

  const leftLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      leftScale.value,
      [1, 1.3],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [
        { translateX: leftThumb.value },
        { translateY: withSpring(leftScale.value === 1.3 ? -40 : -30) },
        { scale: leftScale.value }
      ]
    };
  });

  const rightLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      rightScale.value,
      [1, 1.3],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [
        { translateX: rightThumb.value },
        { translateY: withSpring(rightScale.value === 1.3 ? -40 : -30) },
        { scale: rightScale.value }
      ]
    };
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "0";
    if (price >= 1000)
      return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K`;
    return `${price}`;
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.trackContainer}>
        <View style={sliderStyles.trackBackground} />
        <Animated.View style={[sliderStyles.trackActive, trackStyle]} />

        <GestureDetector gesture={leftGesture}>
          <Animated.View style={[sliderStyles.thumb, leftThumbStyle]}>
            <View style={sliderStyles.thumbInner} />
          </Animated.View>
        </GestureDetector>

        <GestureDetector gesture={rightGesture}>
          <Animated.View style={[sliderStyles.thumb, rightThumbStyle]}>
            <View style={sliderStyles.thumbInner} />
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[sliderStyles.floatingLabel, leftLabelStyle]}>
          <Text style={sliderStyles.floatingLabelText}>
            {formatPrice(value[0])}
          </Text>
        </Animated.View>

        <Animated.View style={[sliderStyles.floatingLabel, rightLabelStyle]}>
          <Text style={sliderStyles.floatingLabelText}>
            {formatPrice(value[1])}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

export const EnhancedPropertyFilterModal: React.FC<
  EnhancedPropertyFilterModalProps
> = ({ visible, onClose, onApply, initialFilters = DEFAULT_FILTERS }) => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    filters.amenities
  );
  const [selectedLocationCriteria, setSelectedLocationCriteria] = useState<
    string[]
  >(filters.locationCriteria);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories?type=property").then((res) => res.data),
    enabled: visible
  });

  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => api.get("/categories/amenities").then((res) => res.data),
    enabled: visible
  });

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get("/location/locations").then((res) => res.data),
    enabled: visible
  });

  const { data: locationCriteriaData } = useQuery({
    queryKey: ["locationCriteria"],
    queryFn: () =>
      api.get("/location-discovery/criteria").then((res) => res.data.data),
    enabled: visible
  });

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

  const locationCriteriaList = Array.isArray(locationCriteriaData)
    ? locationCriteriaData
    : [];

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      setSelectedAmenities(initialFilters.amenities);
      setSelectedLocationCriteria(initialFilters.locationCriteria);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply({
      ...filters,
      amenities: selectedAmenities,
      locationCriteria: selectedLocationCriteria
    });
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedAmenities([]);
    setSelectedLocationCriteria([]);
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const toggleLocationCriteria = (criteriaId: string) => {
    setSelectedLocationCriteria((prev) =>
      prev.includes(criteriaId)
        ? prev.filter((id) => id !== criteriaId)
        : [...prev, criteriaId]
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) count++;
    if (filters.propertyType !== "all") count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (selectedAmenities.length > 0) count++;
    if (filters.location !== "all") count++;
    if (selectedLocationCriteria.length > 0) count++;
    return count;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "0 MRU";
    if (price >= 1000)
      return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K MRU`;
    return `${price} MRU`;
  };

  return (
    <BottomSheetForm
      visible={visible}
      onClose={onClose}
      title="Filters"
      height={Dimensions.get("window").height * 0.85}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price range</Text>
          <View style={styles.priceDisplay}>
            <Text style={styles.priceText}>
              {formatPrice(filters.priceRange[0])}
            </Text>
            <View style={styles.priceSeparator} />
            <Text style={styles.priceText}>
              {formatPrice(filters.priceRange[1])}
            </Text>
          </View>
          <PremiumRangeSlider
            min={0}
            max={50000}
            value={filters.priceRange}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, priceRange: value }))
            }
            step={1000}
          />
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type of place</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
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
                Any type
              </Text>
            </TouchableOpacity>
            {categoriesList.map((cat: Category) => {
              const Icon = getIconFromDatabase(cat.icon);
              const isActive = filters.propertyType === cat.id.toString();
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      propertyType: cat.id.toString()
                    }))
                  }
                >
                  <Icon
                    size={18}
                    color={isActive ? "#000" : "#717171"}
                    weight="regular"
                  />
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {cat.name[i18n.language as keyof typeof cat.name] ||
                      cat.name.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Rooms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms and beds</Text>
          <View style={styles.roomRow}>
            <Text style={styles.roomLabel}>Bedrooms</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={[
                  styles.counterBtn,
                  filters.bedrooms === 0 && styles.counterBtnDisabled
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    bedrooms: Math.max(0, prev.bedrooms - 1)
                  }))
                }
                disabled={filters.bedrooms === 0}
              >
                <Minus
                  size={16}
                  color={filters.bedrooms === 0 ? "#EBEBEB" : "#717171"}
                  weight="bold"
                />
              </TouchableOpacity>
              <Text style={styles.counterValue}>
                {filters.bedrooms === 0 ? "Any" : filters.bedrooms}
              </Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    bedrooms: prev.bedrooms + 1
                  }))
                }
              >
                <Plus size={16} color="#717171" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.roomRow}>
            <Text style={styles.roomLabel}>Bathrooms</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={[
                  styles.counterBtn,
                  filters.bathrooms === 0 && styles.counterBtnDisabled
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    bathrooms: Math.max(0, prev.bathrooms - 1)
                  }))
                }
                disabled={filters.bathrooms === 0}
              >
                <Minus
                  size={16}
                  color={filters.bathrooms === 0 ? "#EBEBEB" : "#717171"}
                  weight="bold"
                />
              </TouchableOpacity>
              <Text style={styles.counterValue}>
                {filters.bathrooms === 0 ? "Any" : filters.bathrooms}
              </Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    bathrooms: prev.bathrooms + 1
                  }))
                }
              >
                <Plus size={16} color="#717171" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                filters.location === "all" && styles.chipActive
              ]}
              onPress={() =>
                setFilters((prev) => ({ ...prev, location: "all" }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  filters.location === "all" && styles.chipTextActive
                ]}
              >
                Anywhere
              </Text>
            </TouchableOpacity>
            {locationsList.map((loc: Location) => {
              const isActive = filters.location === loc.key;
              return (
                <TouchableOpacity
                  key={loc.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, location: loc.key }))
                  }
                >
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {loc.name[i18n.language as keyof typeof loc.name] ||
                      loc.name.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          {amenitiesLoading ? (
            <ActivityIndicator
              size="small"
              color="#222"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={styles.amenitiesGrid}>
              {amenitiesList.map((amenity: Amenity) => {
                const Icon = getIconFromDatabase(amenity.icon);
                const isSelected = selectedAmenities.includes(
                  amenity.id.toString()
                );
                return (
                  <TouchableOpacity
                    key={amenity.id}
                    style={[
                      styles.amenityItem,
                      isSelected && styles.amenityItemActive
                    ]}
                    onPress={() => toggleAmenity(amenity.id.toString())}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? "#000" : "#717171"}
                      weight="regular"
                    />
                    <Text
                      style={[
                        styles.amenityText,
                        isSelected && styles.amenityTextActive
                      ]}
                    >
                      {amenity.name[
                        i18n.language as keyof typeof amenity.name
                      ] || amenity.name.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Location Criteria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Areas</Text>
          {locationCriteriaList.length === 0 ? (
            <ActivityIndicator
              size="small"
              color="#222"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={styles.amenitiesGrid}>
              {locationCriteriaList.map((criteria: any) => {
                const isSelected = selectedLocationCriteria.includes(
                  criteria.id.toString()
                );
                return (
                  <TouchableOpacity
                    key={criteria.id}
                    style={[
                      styles.amenityItem,
                      isSelected && styles.amenityItemActive
                    ]}
                    onPress={() =>
                      toggleLocationCriteria(criteria.id.toString())
                    }
                  >
                    <Text
                      style={[
                        styles.amenityText,
                        isSelected && styles.amenityTextActive
                      ]}
                    >
                      {criteria.displayName || criteria.name}
                    </Text>
                    <Text
                      style={[
                        styles.amenitySubtext,
                        isSelected && styles.amenitySubtextActive
                      ]}
                    >
                      {criteria.propertyCount || 0} properties
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleReset}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.showBtn} onPress={handleApply}>
          <Text style={styles.showText}>
            Show
            {getActiveFiltersCount() > 0
              ? ` (${getActiveFiltersCount()})`
              : " results"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetForm>
  );
};

const sliderStyles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8
  },
  trackContainer: {
    height: 60,
    justifyContent: "center",
    position: "relative"
  },
  trackBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    backgroundColor: "#DDDDDD",
    borderRadius: TRACK_HEIGHT / 2
  },
  trackActive: {
    position: "absolute",
    height: TRACK_HEIGHT,
    backgroundColor: "#222222",
    borderRadius: TRACK_HEIGHT / 2
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center"
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#222222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  floatingLabel: {
    position: "absolute",
    backgroundColor: "#222222",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: -20
  },
  floatingLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  }
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20
  },
  section: {
    marginTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12
  },
  priceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  priceText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#222222"
  },
  priceSeparator: {
    width: 12,
    height: 1,
    backgroundColor: "#222222",
    marginHorizontal: 8
  },
  chipScroll: {
    paddingRight: 24
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    marginRight: 8,
    backgroundColor: "#FFFFFF"
  },
  chipActive: {
    backgroundColor: "#F7F7F7",
    borderColor: "#222222",
    borderWidth: 2
  },
  chipText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#717171",
    marginLeft: 6
  },
  chipTextActive: {
    color: "#222222",
    fontWeight: "600"
  },
  roomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16
  },
  roomLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#222222"
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    alignItems: "center",
    justifyContent: "center"
  },
  counterBtnDisabled: {
    borderColor: "#EBEBEB"
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "400",
    color: "#222222",
    minWidth: 36,
    textAlign: "center"
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB"
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -2,
    marginTop: -4
  },
  amenityItem: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    margin: 3,
    backgroundColor: "#FFFFFF",
    minWidth: 75,
    maxWidth: 90
  },
  amenityItemActive: {
    backgroundColor: "#F7F7F7",
    borderColor: "#222222",
    borderWidth: 2
  },
  amenityText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#717171",
    textAlign: "center",
    marginTop: 4
  },
  amenityTextActive: {
    color: "#222222",
    fontWeight: "600"
  },
  amenitySubtext: {
    fontSize: 10,
    color: "#717171",
    marginTop: 2,
    textAlign: "center"
  },
  amenitySubtextActive: {
    color: "#222222",
    fontWeight: "500"
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    backgroundColor: "#FFFFFF",
    gap: 10,
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    zIndex: 10
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  clearText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    textDecorationLine: "underline"
  },
  showBtn: {
    flex: 1,
    backgroundColor: "#222222",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  showText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
