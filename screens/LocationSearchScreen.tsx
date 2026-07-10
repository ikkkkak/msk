// // import React, { useState, useRef, useMemo, useCallback } from 'react';
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   TouchableOpacity,
// //   Dimensions,
// //   StatusBar,
// //   SafeAreaView,
// //   TextInput,
// // } from 'react-native';
// // import { 
// //   MagnifyingGlass,
// //   SlidersHorizontal,
// //   MapPin,
// //   X,
// //   MapTrifold,
// //   CaretLeft,
// //   FunnelSimple,
// //   Heart,
// //   Star,
// // } from 'phosphor-react-native';
// // import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
// // import { useNavigation } from '@react-navigation/native';
// // import MapView, { Marker } from 'react-native-maps';
// // import { Map } from '../components/Map';
// // import { PropertiesList } from '../components/PropertiesList';
// // import { FiltersModal } from '../components/FiltersModal';
// // import { usePropertiesWithFilters } from '../hooks/queries/useLocationProperties';
// // import { useSearchPropertiesQuery } from '../hooks/queries/useSearchPropertiesQuery';
// // import { useTranslation } from 'react-i18next';

// // const { width, height } = Dimensions.get('window');

// // interface LocationSearchScreenProps {
// //   route?: any;
// //   navigation?: any;
// // }

// // export const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ route, navigation }) => {
// //   const { t } = useTranslation();
// //   const nav = useNavigation();
// //   const { location, locationName, lat, lng } = route?.params || {};
  
// //   // State management
// //   const [showFilters, setShowFilters] = useState(false);
// //   const [showDots, setShowDots] = useState(true);
// //   const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
// //   const [currentSheetIndex, setCurrentSheetIndex] = useState(1); // Track sheet position
  
// //   // Bottom sheet ref
// //   const bottomSheetRef = useRef<BottomSheet>(null);
  
// //   // Snap points - 8% minimum (just under header), 50% mid, 80% max (prevent header overlap)
// //   const snapPoints = useMemo(() => ['15%', '80%'], []);

// //   // Handle sheet changes
// //   const handleSheetChanges = useCallback((index: number) => {
// //     console.log('Bottom sheet changed to index:', index);
// //     setCurrentSheetIndex(index);
// //     // Hide dots when sheet is at max position (index 2)
// //     setShowDots(index !== 2);
// //   }, []);

// //   // Show map button handler
// //   const handleShowMap = () => {
// //     bottomSheetRef.current?.snapToIndex(0); // Snap to minimum (8%)
// //   };

// //   // Filters configuration
// //   const filters = useMemo(() => ({
// //     lat: lat || 18.0731,
// //     lng: lng || -15.9582,
// //     radius: 10,
// //     minPrice: 0,
// //     maxPrice: 1000000,
// //     propertyType: 'all',
// //     amenities: [],
// //     guests: 1,
// //     bedrooms: 0,
// //     bathrooms: 0,
// //   }), [lat, lng]);

// //   // Create bounding box for search
// //   const boundingBox = useMemo(() => {
// //     const lat = filters.lat || 18.0731;
// //     const lng = filters.lng || -15.9582;
// //     const radius = filters.radius || 10;
    
// //     // Convert radius to degrees (rough approximation)
// //     const latDelta = radius / 111; // 1 degree ≈ 111 km
// //     const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));
    
// //     return [
// //       lat - latDelta,  // latLow
// //       lat + latDelta,  // latHigh
// //       lng - lngDelta,  // lngLow
// //       lng + lngDelta,  // lngHigh
// //     ];
// //   }, [filters.lat, filters.lng, filters.radius]);

// //   // Try location-specific search first
// //   const { data: locationData, isLoading: locationLoading, error: locationError } = usePropertiesWithFilters(filters);
  
// //   // Fallback to bounding box search
// //   const { data: boundingBoxData, isLoading: boundingBoxLoading, error: boundingBoxError } = useSearchPropertiesQuery(boundingBox);

// //   // Mock data for testing when both APIs fail
// //   const mockData = useMemo(() => [
// //     {
// //       id: 1,
// //       title: "Appartement moderne à Nouakchott",
// //       city: "Nouakchott",
// //       nightlyPrice: 25000,
// //       rating: 4.8,
// //       propertyType: "entire_place",
// //       bedrooms: 2,
// //       bathrooms: 1,
// //       images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500"],
// //       lat: filters.lat || 18.0731,
// //       lng: filters.lng || -15.9582,
// //     },
// //     {
// //       id: 2,
// //       title: "Villa avec piscine",
// //       city: "Nouakchott",
// //       nightlyPrice: 45000,
// //       rating: 4.9,
// //       propertyType: "entire_place",
// //       bedrooms: 3,
// //       bathrooms: 2,
// //       images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500"],
// //       lat: (filters.lat || 18.0731) + 0.01,
// //       lng: (filters.lng || -15.9582) + 0.01,
// //     },
// //     {
// //       id: 3,
// //       title: "Studio cosy centre-ville",
// //       city: "Nouakchott",
// //       nightlyPrice: 18000,
// //       rating: 4.6,
// //       propertyType: "entire_place",
// //       bedrooms: 1,
// //       bathrooms: 1,
// //       images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500"],
// //       lat: (filters.lat || 18.0731) - 0.01,
// //       lng: (filters.lng || -15.9582) - 0.01,
// //     },
// //     {
// //       id: 4,
// //       title: "Maison familiale spacieuse",
// //       city: "Nouakchott",
// //       nightlyPrice: 35000,
// //       rating: 4.7,
// //       propertyType: "entire_place",
// //       bedrooms: 4,
// //       bathrooms: 3,
// //       images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500"],
// //       lat: (filters.lat || 18.0731) + 0.02,
// //       lng: (filters.lng || -15.9582) - 0.02,
// //     },
// //     {
// //       id: 5,
// //       title: "Penthouse avec vue mer",
// //       city: "Nouakchott",
// //       nightlyPrice: 65000,
// //       rating: 5.0,
// //       propertyType: "entire_place",
// //       bedrooms: 3,
// //       bathrooms: 2,
// //       images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500"],
// //       lat: (filters.lat || 18.0731) - 0.02,
// //       lng: (filters.lng || -15.9582) + 0.02,
// //     },
// //   ], [filters.lat, filters.lng]);

// //   // Use location data if available, otherwise fallback to bounding box, then mock data
// //   const data = locationData || boundingBoxData || mockData;
// //   const error = locationError && boundingBoxError ? locationError : null;
// //   const isLoading = (locationLoading || boundingBoxLoading) && !data;

// //   const properties = data || [];

// //   // Debug logging
// //   console.log('LocationSearchScreen Debug:', {
// //     locationData: locationData?.length || 0,
// //     boundingBoxData: boundingBoxData?.length || 0,
// //     mockData: mockData?.length || 0,
// //     finalProperties: properties?.length || 0,
// //     isLoading,
// //     error: error?.message || 'No error',
// //   });

// //   // Handle property press
// //   const handlePropertyPress = (propertyId: number) => {
// //     setSelectedPropertyId(propertyId);
// //     // Snap to mid position when property is selected
// //     bottomSheetRef.current?.snapToIndex(1);
// //   };

// //   // Handle marker press
// //   const handleMarkerPress = (propertyId: number) => {
// //     setSelectedPropertyId(propertyId);
// //     handlePropertyPress(propertyId);
// //   };

// //   // Handle map press
// //   const handleMapPress = () => {
// //     setSelectedPropertyId(null);
// //   };

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
// //       {/* Airbnb-style Header */}
// //       <View style={styles.header}>
// //         <TouchableOpacity 
// //           style={styles.backButton}
// //           onPress={() => nav.goBack()}
// //         >
// //           <CaretLeft size={24} color="#222222" weight="bold" />
// //         </TouchableOpacity>
        
// //         <View style={styles.searchContainer}>
// //           <View style={styles.searchBar}>
// //             <MagnifyingGlass size={20} color="#717171" weight="bold" />
// //             <TextInput
// //               style={styles.searchInput}
// //               placeholder={locationName || "Où allez-vous ?"}
// //               placeholderTextColor="#717171"
// //               editable={false}
// //             />
// //           </View>
// //         </View>
        
// //         <TouchableOpacity 
// //           style={styles.filtersButton}
// //           onPress={() => setShowFilters(true)}
// //         >
// //           <SlidersHorizontal size={20} color="#222222" weight="bold" />
// //         </TouchableOpacity>
// //       </View>

// //       {/* Map Container */}
// //       <View style={styles.mapContainer}>
// //         <Map
// //           properties={properties}
// //           onPropertySelect={handleMarkerPress}
// //           onMapPress={handleMapPress}
// //           selectedPropertyId={selectedPropertyId}
// //           showDots={showDots}
// //           showSearchAreaButton={false}
// //           style={styles.map}
// //         />
// //       </View>

// //       {/* Bottom Sheet with @gorhom/bottom-sheet */}
// //       <BottomSheet
// //         ref={bottomSheetRef}
// //         index={1} // Start at middle position
// //         snapPoints={snapPoints}
// //         onChange={handleSheetChanges}
// //         enablePanDownToClose={false}
// //         enableContentPanningGesture={false}
// //         backgroundStyle={styles.bottomSheetBackground}
// //         handleIndicatorStyle={styles.bottomSheetIndicator}
// //       >
// //         <BottomSheetView style={styles.bottomSheetContent}>
// //           {/* Airbnb-style Results Header */}
// //           <View style={styles.resultsHeader}>
// //             <View style={styles.resultsTitleRow}>
// //               <Text style={styles.resultsTitle}>
// //                 {properties.length} {properties.length > 1 ? t('search.properties') : t('search.property')}
// //               </Text>
// //               <Text style={styles.resultsLocation}>
// //                 {locationName || 'Nouakchott, Mauritanie'}
// //               </Text>
// //             </View>
// //           </View>

// //           {/* Properties List Component */}
// //           <PropertiesList
// //             properties={properties}
// //             isLoading={isLoading}
// //             error={error}
// //             onPropertyPress={handlePropertyPress}
// //           />
// //         </BottomSheetView>
// //       </BottomSheet>

// //       {/* Floating Show Map Button - Only show when sheet is UP */}
// //       {currentSheetIndex > 0 && (
// //         <TouchableOpacity 
// //           style={styles.floatingMapButton}
// //           onPress={handleShowMap}
// //           activeOpacity={0.8}
// //         >
// //           <MapTrifold size={20} color="#FFFFFF" weight="duotone" />
// //           <Text style={styles.floatingMapButtonText}>{t('search.showMap')}</Text>
// //         </TouchableOpacity>
// //       )}

// //       {/* Filters Modal */}
// //       <FiltersModal
// //         visible={showFilters}
// //         onClose={() => setShowFilters(false)}
// //         onApply={(newFilters) => {
// //           console.log('Applied filters:', newFilters);
// //           setShowFilters(false);
// //         }}
// //         currentFilters={filters}
// //       />
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#FFFFFF',
// //   },
  
// //   // Airbnb-style Header
// //   header: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     paddingHorizontal: 16,
// //     paddingVertical: 12,
// //     backgroundColor: '#FFFFFF',
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#E0E0E0',
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 1,
// //     },
// //     shadowOpacity: 0.05,
// //     shadowRadius: 2,
// //     elevation: 2,
// //   },
// //   backButton: {
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     backgroundColor: '#F7F7F7',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginRight: 12,
// //   },
// //   searchContainer: {
// //     flex: 1,
// //   },
// //   searchBar: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#F7F7F7',
// //     borderRadius: 12,
// //     paddingHorizontal: 16,
// //     paddingVertical: 12,
// //     borderWidth: 1,
// //     borderColor: '#E0E0E0',
// //   },
// //   searchInput: {
// //     flex: 1,
// //     fontSize: 16,
// //     color: '#222222',
// //     marginLeft: 12,
// //     fontWeight: '500',
// //   },
// //   filtersButton: {
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     backgroundColor: '#F7F7F7',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginLeft: 12,
// //   },

// //   // Map Container
// //   mapContainer: {
// //     flex: 1,
// //     backgroundColor: '#F5F5F5',
// //   },
// //   map: {
// //     width: '100%',
// //     height: '100%',
// //   },

// //   // Bottom Sheet Styles
// //   bottomSheetBackground: {
// //     backgroundColor: '#FFFFFF',
// //     borderTopLeftRadius: 20,
// //     borderTopRightRadius: 20,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: -4,
// //     },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 12,
// //     elevation: 8,
// //   },
// //   bottomSheetIndicator: {
// //     backgroundColor: '#E0E0E0',
// //     width: 40,
// //     height: 4,
// //   },
// //   bottomSheetContent: {
// //     flex: 1,
// //     paddingTop: 8,
// //     marginTop: 20, // Add margin to prevent going under header
// //   },

// //   // Airbnb-style Results Header
// //   resultsHeader: {
// //     paddingHorizontal: 20,
// //     paddingBottom: 16,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F0F0',
// //   },
// //   resultsTitleRow: {
// //     marginBottom: 12,
// //   },
// //   resultsTitle: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     color: '#222222',
// //     marginBottom: 4,
// //   },
// //   resultsLocation: {
// //     fontSize: 16,
// //     color: '#717171',
// //     fontWeight: '500',
// //   },
// //   // Floating Map Button
// //   floatingMapButton: {
// //     position: 'absolute',
// //     bottom: 30,
// //     left: 20,
// //     right: 20,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     backgroundColor: '#222222',
// //     paddingHorizontal: 20,
// //     paddingVertical: 16,
// //     borderRadius: 12,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 4,
// //     },
// //     shadowOpacity: 0.2,
// //     shadowRadius: 8,
// //     elevation: 8,
// //   },
// //   floatingMapButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 16,
// //     fontWeight: '600',
// //     marginLeft: 8,
// //   },

// //   // Filters Modal Styles
// //   modalContainer: {
// //     flex: 1,
// //     backgroundColor: '#FFFFFF',
// //   },
// //   modalHeader: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     paddingHorizontal: 20,
// //     paddingVertical: 16,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#E0E0E0',
// //   },
// //   modalTitle: {
// //     fontSize: 20,
// //     fontWeight: '600',
// //     color: '#222222',
// //   },
// //   modalCloseButton: {
// //     width: 32,
// //     height: 32,
// //     borderRadius: 16,
// //     backgroundColor: '#F7F7F7',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   modalContent: {
// //     flex: 1,
// //     paddingHorizontal: 20,
// //     paddingTop: 20,
// //   },
// //   filterSection: {
// //     marginBottom: 32,
// //   },
// //   filterTitle: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     color: '#222222',
// //     marginBottom: 16,
// //   },
// //   filterRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     paddingVertical: 12,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F0F0',
// //   },
// //   filterLabel: {
// //     fontSize: 16,
// //     color: '#222222',
// //     fontWeight: '500',
// //   },
// //   filterValue: {
// //     fontSize: 16,
// //     color: '#717171',
// //   },
// //   modalFooter: {
// //     flexDirection: 'row',
// //     paddingHorizontal: 20,
// //     paddingVertical: 16,
// //     borderTopWidth: 1,
// //     borderTopColor: '#E0E0E0',
// //     backgroundColor: '#FFFFFF',
// //   },
// //   clearButton: {
// //     flex: 1,
// //     paddingVertical: 16,
// //     borderRadius: 8,
// //     borderWidth: 1,
// //     borderColor: '#E0E0E0',
// //     alignItems: 'center',
// //     marginRight: 12,
// //   },
// //   clearButtonText: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#222222',
// //   },
// //   applyButton: {
// //     flex: 1,
// //     paddingVertical: 16,
// //     borderRadius: 8,
// //     backgroundColor: '#222222',
// //     alignItems: 'center',
// //   },
// //   applyButtonText: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#FFFFFF',
// //   },
// // });
  

// import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
//   TextInput,
//   Animated,
//   Platform,
// } from 'react-native';
// import { 
//   MagnifyingGlass,
//   SlidersHorizontal,
//   MapPin,
//   X,
//   MapTrifold,
//   CaretLeft,
// } from 'phosphor-react-native';
// import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
// import { useNavigation } from '@react-navigation/native';
// import { Map } from '../components/Map';
// import { FiltersModal } from '../components/FiltersModal';
// import { usePropertiesWithFilters } from '../hooks/queries/useLocationProperties';
// import { useSearchPropertiesQuery } from '../hooks/queries/useSearchPropertiesQuery';
// import { useTranslation } from 'react-i18next';

// const { width, height } = Dimensions.get('window');

// interface LocationSearchScreenProps {
//   route?: any;
//   navigation?: any;
// }

// export const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ route, navigation }) => {
//   const { t } = useTranslation();
//   const nav = useNavigation();
//   const { location, locationName, lat, lng } = route?.params || {};
  
//   // State management
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
//   const [currentSheetIndex, setCurrentSheetIndex] = useState(1);
  
//   // Animation values
//   const mapButtonOpacity = useRef(new Animated.Value(0)).current;
//   const mapButtonScale = useRef(new Animated.Value(0.8)).current;
  
//   // Bottom sheet ref
//   const bottomSheetRef = useRef<BottomSheet>(null);
  
//   // Snap points - Airbnb exact style
//   const snapPoints = useMemo(() => ['8%', '50%', '92%'], []);

//   // Filters configuration
//   const filters = useMemo(() => ({
//     lat: lat || 18.0731,
//     lng: lng || -15.9582,
//     radius: 10,
//     minPrice: 0,
//     maxPrice: 1000000,
//     propertyType: 'all',
//     amenities: [],
//     guests: 1,
//     bedrooms: 0,
//     bathrooms: 0,
//   }), [lat, lng]);

//   // Create bounding box for search
//   const boundingBox = useMemo(() => {
//     const latitude = filters.lat || 18.0731;
//     const longitude = filters.lng || -15.9582;
//     const radius = filters.radius || 10;
    
//     const latDelta = radius / 111;
//     const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
//     return [
//       latitude - latDelta,
//       latitude + latDelta,
//       longitude - lngDelta,
//       longitude + lngDelta,
//     ];
//   }, [filters.lat, filters.lng, filters.radius]);

//   // Data fetching
//   const { data: locationData, isLoading: locationLoading, error: locationError } = usePropertiesWithFilters(filters);
//   const { data: boundingBoxData, isLoading: boundingBoxLoading, error: boundingBoxError } = useSearchPropertiesQuery(boundingBox);

//   // Mock data fallback
//   const mockData = useMemo(() => [
//     {
//       id: 1,
//       title: "Appartement moderne à Nouakchott",
//       city: "Nouakchott",
//       nightlyPrice: 25000,
//       rating: 4.8,
//       propertyType: "entire_place",
//       bedrooms: 2,
//       bathrooms: 1,
//       images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
//       lat: filters.lat || 18.0731,
//       lng: filters.lng || -15.9582,
//     },
//     {
//       id: 2,
//       title: "Villa avec piscine",
//       city: "Nouakchott",
//       nightlyPrice: 45000,
//       rating: 4.9,
//       propertyType: "entire_place",
//       bedrooms: 3,
//       bathrooms: 2,
//       images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
//       lat: (filters.lat || 18.0731) + 0.01,
//       lng: (filters.lng || -15.9582) + 0.01,
//     },
//     {
//       id: 3,
//       title: "Studio cosy centre-ville",
//       city: "Nouakchott",
//       nightlyPrice: 18000,
//       rating: 4.6,
//       propertyType: "entire_place",
//       bedrooms: 1,
//       bathrooms: 1,
//       images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
//       lat: (filters.lat || 18.0731) - 0.01,
//       lng: (filters.lng || -15.9582) - 0.01,
//     },
//     {
//       id: 4,
//       title: "Maison familiale spacieuse",
//       city: "Nouakchott",
//       nightlyPrice: 35000,
//       rating: 4.7,
//       propertyType: "entire_place",
//       bedrooms: 4,
//       bathrooms: 3,
//       images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"],
//       lat: (filters.lat || 18.0731) + 0.02,
//       lng: (filters.lng || -15.9582) - 0.02,
//     },
//     {
//       id: 5,
//       title: "Penthouse avec vue mer",
//       city: "Nouakchott",
//       nightlyPrice: 65000,
//       rating: 5.0,
//       propertyType: "entire_place",
//       bedrooms: 3,
//       bathrooms: 2,
//       images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],
//       lat: (filters.lat || 18.0731) - 0.02,
//       lng: (filters.lng || -15.9582) + 0.02,
//     },
//   ], [filters.lat, filters.lng]);

//   const data = locationData || boundingBoxData || mockData;
//   const error = locationError && boundingBoxError ? locationError : null;
//   const isLoading = (locationLoading || boundingBoxLoading) && !data;
//   const properties = data || [];

//   // Handle sheet changes with animations
//   const handleSheetChanges = useCallback((index: number) => {
//     setCurrentSheetIndex(index);
    
//     // Animate map button
//     if (index === 0) {
//       // Hide button when at minimum
//       Animated.parallel([
//         Animated.timing(mapButtonOpacity, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(mapButtonScale, {
//           toValue: 0.8,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     } else {
//       // Show button when sheet is up
//       Animated.parallel([
//         Animated.timing(mapButtonOpacity, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.timing(mapButtonScale, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [mapButtonOpacity, mapButtonScale]);

//   // Show map button handler
//   const handleShowMap = useCallback(() => {
//     bottomSheetRef.current?.snapToIndex(0);
//   }, []);

//   // Handle property press
//   const handlePropertyPress = useCallback((propertyId: number) => {
//     setSelectedPropertyId(propertyId);
//     bottomSheetRef.current?.snapToIndex(1);
//   }, []);

//   // Handle marker press
//   const handleMarkerPress = useCallback((propertyId: number) => {
//     setSelectedPropertyId(propertyId);
//     handlePropertyPress(propertyId);
//   }, [handlePropertyPress]);

//   // Handle map press
//   const handleMapPress = useCallback(() => {
//     setSelectedPropertyId(null);
//   }, []);

//   // Navigate to property details
//   const navigateToProperty = useCallback((propertyId: number) => {
//     (nav as any).navigate('PropertyDetails', { propertyID: propertyId });
//   }, [nav]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
//       {/* Airbnb Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => nav.goBack()}
//           activeOpacity={0.7}
//         >
//           <CaretLeft size={24} color="#222222" weight="bold" />
//         </TouchableOpacity>
        
//         <View style={styles.searchContainer}>
//           <TouchableOpacity 
//             style={styles.searchBar}
//             activeOpacity={0.8}
//             onPress={() => {/* Navigate to search */}}
//           >
//             <MagnifyingGlass size={20} color="#717171" weight="bold" />
//             <Text style={styles.searchText}>
//               {locationName || "Où allez-vous ?"}
//             </Text>
//           </TouchableOpacity>
//         </View>
        
//         <TouchableOpacity 
//           style={styles.filtersButton}
//           onPress={() => setShowFilters(true)}
//           activeOpacity={0.7}
//         >
//           <SlidersHorizontal size={20} color="#222222" weight="bold" />
//         </TouchableOpacity>
//       </View>

//       {/* Map Container */}
//       <View style={styles.mapContainer}>
//         <Map
//           properties={properties}
//           onPropertySelect={handleMarkerPress}
//           onMapPress={handleMapPress}
//           selectedPropertyId={selectedPropertyId}
//           showDots={currentSheetIndex === 0}
//           showSearchAreaButton={false}
//           style={styles.map}
//         />
//       </View>

//       {/* Bottom Sheet */}
//       <BottomSheet
//         ref={bottomSheetRef}
//         index={1}
//         snapPoints={snapPoints}
//         onChange={handleSheetChanges}
//         enablePanDownToClose={false}
//         enableContentPanningGesture={true}
//         backgroundStyle={styles.bottomSheetBackground}
//         handleIndicatorStyle={styles.bottomSheetIndicator}
//         style={styles.bottomSheet}
//       >
//         {/* Results Header */}
//         <View style={styles.resultsHeader}>
//           <Text style={styles.resultsCount}>
//             {properties.length} {properties.length === 1 ? 'logement' : 'logements'}
//           </Text>
//           <Text style={styles.resultsLocation}>
//             {locationName || 'Nouakchott'}
//           </Text>
//         </View>

//         {/* Properties List */}
//         <BottomSheetFlatList
//           data={properties}
//           renderItem={({ item, index }) => (
//             <PropertyCard
//               property={item}
//               onPress={() => navigateToProperty(item.id || item.ID)}
//               isFirst={index === 0}
//             />
//           )}
//           keyExtractor={(item, index) => (item.id || item.ID || index).toString()}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContent}
//           initialNumToRender={3}
//           maxToRenderPerBatch={5}
//           windowSize={10}
//           removeClippedSubviews={Platform.OS === 'android'}
//           updateCellsBatchingPeriod={50}
//         />
//       </BottomSheet>

//       {/* Floating Map Button */}
//       {currentSheetIndex > 0 && (
//         <Animated.View
//           style={[
//             styles.floatingMapButton,
//             {
//               opacity: mapButtonOpacity,
//               transform: [{ scale: mapButtonScale }],
//             },
//           ]}
//         >
//           <TouchableOpacity 
//             style={styles.mapButtonInner}
//             onPress={handleShowMap}
//             activeOpacity={0.9}
//           >
//             <MapTrifold size={18} color="#FFFFFF" weight="duotone" />
//             <Text style={styles.mapButtonText}>Carte</Text>
//           </TouchableOpacity>
//         </Animated.View>
//       )}

//       {/* Filters Modal */}
//       <FiltersModal
//         visible={showFilters}
//         onClose={() => setShowFilters(false)}
//         onApply={(newFilters) => {
//           console.log('Applied filters:', newFilters);
//           setShowFilters(false);
//         }}
//         currentFilters={filters}
//       />
//     </SafeAreaView>
//   );
// };

// // Property Card Component
// interface PropertyCardProps {
//   property: any;
//   onPress: () => void;
//   isFirst?: boolean;
// }

// const PropertyCard: React.FC<PropertyCardProps> = React.memo(({ property, onPress, isFirst }) => {
//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('fr-FR', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(price);
//   };

//   return (
//     <TouchableOpacity
//       style={[styles.propertyCard, isFirst && styles.firstCard]}
//       activeOpacity={0.95}
//       onPress={onPress}
//     >
//       {/* Image */}
//       <View style={styles.imageContainer}>
//         {property.images?.[0] ? (
//           <Animated.Image
//             source={{ uri: property.images[0] }}
//             style={styles.propertyImage}
//             resizeMode="cover"
//           />
//         ) : (
//           <View style={styles.imagePlaceholder} />
//         )}
        
//         {/* Favorite Button */}
//         <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
//           <View style={styles.favoriteIcon} />
//         </TouchableOpacity>
//       </View>

//       {/* Content */}
//       <View style={styles.cardContent}>
//         {/* Title Row */}
//         <View style={styles.titleRow}>
//           <Text style={styles.propertyTitle} numberOfLines={1}>
//             {property.title || property.Title}
//           </Text>
//         </View>

//         {/* Rating */}
//         <View style={styles.ratingRow}>
//           <Text style={styles.ratingText}>★ {(property.rating || 4.8).toFixed(1)}</Text>
//         </View>

//         {/* Details */}
//         <Text style={styles.propertyDetails} numberOfLines={1}>
//           {property.bedrooms || 1} chambre · {property.bathrooms || 1} salle de bain
//         </Text>

//         {/* Price */}
//         <View style={styles.priceRow}>
//           <Text style={styles.price}>{formatPrice(property.nightlyPrice || 25000)} MRU</Text>
//           <Text style={styles.perNight}> / nuit</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// });

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
  
//   // Header Styles
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#EBEBEB',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 2,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   backButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F7F7F7',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   searchContainer: {
//     flex: 1,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F7F7F7',
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderWidth: 1,
//     borderColor: '#DDDDDD',
//   },
//   searchText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#222222',
//     marginLeft: 10,
//     fontWeight: '600',
//   },
//   filtersButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F7F7F7',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 12,
//     borderWidth: 1,
//     borderColor: '#DDDDDD',
//   },

//   // Map Styles
//   mapContainer: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//   },

//   // Bottom Sheet Styles
//   bottomSheet: {
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 16,
//       },
//       android: {
//         elevation: 16,
//       },
//     }),
//   },
//   bottomSheetBackground: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//   },
//   bottomSheetIndicator: {
//     backgroundColor: '#DDDDDD',
//     width: 40,
//     height: 4,
//   },
//   resultsHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   resultsCount: {
//     fontSize: 22,
//     fontWeight: '600',
//     color: '#222222',
//     marginBottom: 4,
//   },
//   resultsLocation: {
//     fontSize: 14,
//     color: '#717171',
//     fontWeight: '400',
//   },
//   listContent: {
//     paddingHorizontal: 24,
//     paddingTop: 16,
//     paddingBottom: 100,
//   },

//   // Property Card Styles
//   propertyCard: {
//     marginBottom: 32,
//   },
//   firstCard: {
//     marginTop: 0,
//   },
//   imageContainer: {
//     position: 'relative',
//     width: '100%',
//     aspectRatio: 1,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#F0F0F0',
//   },
//   propertyImage: {
//     width: '100%',
//     height: '100%',
//   },
//   imagePlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#E0E0E0',
//   },
//   favoriteButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: 'rgba(0, 0, 0, 0.4)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   favoriteIcon: {
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: '#FFFFFF',
//   },
//   cardContent: {
//     paddingTop: 12,
//   },
//   titleRow: {
//     marginBottom: 4,
//   },
//   propertyTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#222222',
//     lineHeight: 20,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   ratingText: {
//     fontSize: 14,
//     color: '#222222',
//     fontWeight: '400',
//   },
//   propertyDetails: {
//     fontSize: 14,
//     color: '#717171',
//     marginBottom: 6,
//     fontWeight: '400',
//   },
//   priceRow: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//   },
//   price: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   perNight: {
//     fontSize: 14,
//     fontWeight: '400',
//     color: '#717171',
//   },

//   // Floating Map Button
//   floatingMapButton: {
//     position: 'absolute',
//     bottom: 100,
//     alignSelf: 'center',
//   },
//   mapButtonInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#222222',
//     paddingHorizontal: 20,
//     paddingVertical: 14,
//     borderRadius: 24,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   mapButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });


import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { 
  MagnifyingGlass,
  SlidersHorizontal,
  MapPin,
  X,
  MapTrifold,
  CaretLeft,
} from 'phosphor-react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { Map } from '../components/Map';
import { FiltersModal } from '../components/FiltersModal';
import { usePropertiesWithFilters } from '../hooks/queries/useLocationProperties';
import { useLocationProperties } from '../hooks/queries/useLocationDiscovery';
import { useSearchPropertiesQuery } from '../hooks/queries/useSearchPropertiesQuery';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Calculate header height including safe area
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80; // Adjust based on your actual header

interface LocationSearchScreenProps {
  route?: any;
  navigation?: any;
}

export const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { location, locationName, lat, lng, criteriaId, radiusKm, filterByLocationCriteria } = route?.params || {};
  
  // Debug route params
  console.log('🔍 LocationSearchScreen - Route params:', {
    route: route,
    params: route?.params,
    location,
    locationName,
    lat,
    lng,
    criteriaId,
    radiusKm,
    filterByLocationCriteria
  });

  // Debug the hook call
  console.log('🔍 LocationSearchScreen - Hook call:', {
    criteriaIdForHook: filterByLocationCriteria && criteriaId ? criteriaId : 0,
    filterByLocationCriteria,
    criteriaId
  });
  const mapRef = useRef<any>(null);
  
  // Calculate actual header height with safe area
  const actualHeaderHeight = HEADER_HEIGHT + insets.top;
  
  // State management
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(1);
  
  // Animation values
  const mapButtonOpacity = useRef(new Animated.Value(1)).current;
  const mapButtonScale = useRef(new Animated.Value(1)).current;
  
  // Bottom sheet ref
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Snap points - Calculate to stay UNDER the header
  const snapPoints = useMemo(() => {
    const screenHeight = height - 10;
    const minSnap = 100; // Minimum peek height
    const midSnap = screenHeight * 0.5; // 50% of screen
    const maxSnap = screenHeight - actualHeaderHeight - 2; // Full screen minus header and small gap
    
    return [minSnap, midSnap, maxSnap];
  }, [actualHeaderHeight]);

  // Filters configuration
  const filters = useMemo(() => ({
    lat: lat || 18.0731,
    lng: lng || -15.9582,
    radius: radiusKm || 10,
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: 'all',
    amenities: [],
    guests: 1,
    bedrooms: 0,
    bathrooms: 0,
  }), [lat, lng, radiusKm]);

  // Create bounding box for search
  const boundingBox = useMemo(() => {
    const latitude = filters.lat || 18.0731;
    const longitude = filters.lng || -15.9582;
    const radius = filters.radius || 10;
    
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    return [
      latitude - latDelta,
      latitude + latDelta,
      longitude - lngDelta,
      longitude + lngDelta,
    ];
  }, [filters.lat, filters.lng, filters.radius]);

  // Data fetching
  const { data: locationData, isLoading: locationLoading, error: locationError } = usePropertiesWithFilters(filters);
  
  // Always call the hook, but disable it when not needed
  const { data: criteriaData, isLoading: criteriaLoading, error: criteriaError } = useLocationProperties(
    filterByLocationCriteria && criteriaId ? criteriaId : 0, 
    100
  );

  // Debug criteria data
  console.log('🔍 LocationSearchScreen - Criteria data:', {
    criteriaData,
    criteriaLoading,
    criteriaError,
    criteriaDataProperties: criteriaData?.properties,
    criteriaDataLength: criteriaData?.properties?.length
  });
  
  const { data: boundingBoxData, isLoading: boundingBoxLoading, error: boundingBoxError } = useSearchPropertiesQuery(boundingBox);

  // Mock data fallback
  const mockData = useMemo(() => [
    {
      id: 1,
      title: "Appartement moderne à Nouakchott",
      city: "Nouakchott",
      nightlyPrice: 25000,
      rating: 4.8,
      propertyType: "entire_place",
      bedrooms: 2,
      bathrooms: 1,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
      lat: filters.lat || 18.0731,
      lng: filters.lng || -15.9582,
    },
    {
      id: 2,
      title: "Villa avec piscine",
      city: "Nouakchott",
      nightlyPrice: 45000,
      rating: 4.9,
      propertyType: "entire_place",
      bedrooms: 3,
      bathrooms: 2,
      images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
      lat: (filters.lat || 18.0731) + 0.01,
      lng: (filters.lng || -15.9582) + 0.01,
    },
    {
      id: 3,
      title: "Studio cosy centre-ville",
      city: "Nouakchott",
      nightlyPrice: 18000,
      rating: 4.6,
      propertyType: "entire_place",
      bedrooms: 1,
      bathrooms: 1,
      images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
      lat: (filters.lat || 18.0731) - 0.01,
      lng: (filters.lng || -15.9582) - 0.01,
    },
    {
      id: 4,
      title: "Maison familiale spacieuse",
      city: "Nouakchott",
      nightlyPrice: 35000,
      rating: 4.7,
      propertyType: "entire_place",
      bedrooms: 4,
      bathrooms: 3,
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"],
      lat: (filters.lat || 18.0731) + 0.02,
      lng: (filters.lng || -15.9582) - 0.02,
    },
    {
      id: 5,
      title: "Penthouse avec vue mer",
      city: "Nouakchott",
      nightlyPrice: 65000,
      rating: 5.0,
      propertyType: "entire_place",
      bedrooms: 3,
      bathrooms: 2,
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],
      lat: (filters.lat || 18.0731) - 0.02,
      lng: (filters.lng || -15.9582) + 0.02,
    },
  ], [filters.lat, filters.lng]);

  const scopedByCriteria: any[] = (criteriaData?.properties || criteriaData) || [];
  
  // When filtering by location criteria, ONLY use criteria data - don't fall back to other sources
  const data = filterByLocationCriteria && criteriaId && criteriaId > 0
    ? scopedByCriteria  // Only use criteria data when filtering by criteria
    : locationData || boundingBoxData || mockData;  // Use other sources only when NOT filtering by criteria
    
  const error = (filterByLocationCriteria && criteriaId && criteriaId > 0 && criteriaError) || (locationError && boundingBoxError ? locationError : null);
  const isLoading = ((filterByLocationCriteria && criteriaId && criteriaId > 0 ? criteriaLoading : false) || locationLoading || boundingBoxLoading) && !data;
  const properties: any[] = (data as any) || [];

  // Debug logging for location criteria filtering
  console.log('🔍 LocationSearchScreen Debug:', {
    filterByLocationCriteria,
    criteriaId,
    criteriaDataLength: criteriaData?.properties?.length || criteriaData?.length || 0,
    scopedByCriteriaLength: scopedByCriteria.length,
    dataLength: (data as any)?.length || 0,
    propertiesLength: properties.length,
    locationName,
    lat,
    lng
  });

  // Enforce strict radius filter around provided center to avoid showing entire inventory
  const toNumber = (v: any): number | undefined => (typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : undefined));
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const centerLat = toNumber(lat) ?? filters.lat;
  const centerLng = toNumber(lng) ?? filters.lng;
  const maxRadiusKm = radiusKm ?? filters.radius;

  const finalProperties: any[] = (filterByLocationCriteria && centerLat !== undefined && centerLng !== undefined)
    ? properties.filter((p: any) => {
        const plat = toNumber(p.lat ?? p.latitude ?? p.Latitude);
        const plng = toNumber(p.lng ?? p.longitude ?? p.Longitude);
        if (plat === undefined || plng === undefined) return false;
        return haversineKm(centerLat, centerLng, plat, plng) <= maxRadiusKm;
      })
    : properties;

  // Handle sheet changes with animations
  const handleSheetChanges = useCallback((index: number) => {
    setCurrentSheetIndex(index);
    
    // Animate map button
    if (index === 0) {
      // Hide button when at minimum
      Animated.parallel([
        Animated.timing(mapButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(mapButtonScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show button when sheet is up
      Animated.parallel([
        Animated.timing(mapButtonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mapButtonScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mapButtonOpacity, mapButtonScale]);

  // Show map button handler
  const handleShowMap = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Handle property press
  const handlePropertyPress = useCallback((propertyId: number) => {
    setSelectedPropertyId(propertyId);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback((propertyId: number) => {
    setSelectedPropertyId(propertyId);
    handlePropertyPress(propertyId);
  }, [handlePropertyPress]);

  // Handle map press
  const handleMapPress = useCallback(() => {
    setSelectedPropertyId(null);
  }, []);

  // Navigate to property details
  const navigateToProperty = useCallback((propertyId: number) => {
    (nav as any).navigate('PropertyDetails', { propertyID: propertyId });
  }, [nav]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Airbnb Header - Fixed at top */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => nav.goBack()}
            activeOpacity={0.7}
          >
            <CaretLeft size={24} color="#222222" weight="bold" />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={styles.searchBar}
              activeOpacity={0.8}
              onPress={() => {/* Navigate to search */}}
            >
              <MagnifyingGlass size={20} color="#717171" weight="bold" />
              <Text style={styles.searchText}>
                {locationName || t('search.whereTo')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.filtersButton}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={20} color="#222222" weight="bold" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Map Container - Fills space between header and bottom sheet */}
      <View style={styles.mapContainer}>
        <Map
          mapRef={mapRef}
          properties={finalProperties}
          onPropertySelect={handleMarkerPress}
          onMapPress={handleMapPress}
          selectedPropertyId={selectedPropertyId}
          location={locationName || ''}
          setLocation={() => {}}
        />
      </View>

      {/* Bottom Sheet - Constrained to stay under header */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={
          ["10%", "50%", "80%"]
        }
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        enableContentPanningGesture={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        style={styles.bottomSheet}
        topInset={actualHeaderHeight} // This is KEY - keeps sheet under header
        animateOnMount={true}
      >
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {finalProperties.length} {finalProperties.length === 1 ? t('search.property') : t('search.properties')}
          </Text>
          <Text style={styles.resultsLocation}>
            {locationName || t('search.defaultCity')}
          </Text>
        </View>

        {/* Properties List */}
        <BottomSheetFlatList
          data={finalProperties}
          renderItem={({ item, index }: any) => (
            <PropertyCard
              property={item}
              onPress={() => navigateToProperty(item.id || item.ID)}
              isFirst={index === 0}
            />
          )}
          keyExtractor={(item: any, index: number) => (item.id || item.ID || index).toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
        />
      </BottomSheet>

      {/* Floating Map Button */}
      {currentSheetIndex > 0 && (
        <Animated.View
          style={[
            styles.floatingMapButton,
            {
              opacity: mapButtonOpacity,
              transform: [{ scale: mapButtonScale }],
            },
          ]}
          pointerEvents={currentSheetIndex > 0 ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={styles.mapButtonInner}
            onPress={handleShowMap}
            activeOpacity={0.9}
          >
            <MapTrifold size={18} color="#FFFFFF" weight="duotone" />
            <Text style={styles.mapButtonText}>{t('search.showMap')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Filters Modal */}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          console.log('Applied filters:', newFilters);
          setShowFilters(false);
        }}
        currentFilters={filters}
      />
    </View>
  );
};

// Property Card Component
interface PropertyCardProps {
  property: any;
  onPress: () => void;
  isFirst?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = React.memo(({ property, onPress, isFirst }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const images: string[] = Array.isArray(property.images) ? property.images : [];

  const handleScroll = (e: any) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent || {};
    const w = layoutMeasurement?.width || 1;
    const x = contentOffset?.x || 0;
    const idx = Math.round(x / w);
    if (Number.isFinite(idx) && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  };

  const getVisibleDots = () => {
    const total = Math.max(images.length, 0);
    const MAX_VISIBLE = 5;
    if (total <= MAX_VISIBLE) {
      return Array.from({ length: total }, (_, i) => ({
        index: i,
        distance: Math.abs(i - currentIndex),
      }));
    }
    const candidates = [currentIndex - 2, currentIndex - 1, currentIndex, currentIndex + 1, currentIndex + 2]
      .filter(i => i >= 0 && i < total)
      .sort((a, b) => a - b);
    return candidates.map(i => ({ index: i, distance: Math.abs(i - currentIndex) }));
  };

  const getDotStyle = (distance: number) => {
    switch (distance) {
      case 0:
        return { size: 8, opacity: 1, color: '#FFFFFF' };
      case 1:
        return { size: 6, opacity: 0.6, color: '#D1D1D1' };
      case 2:
      default:
        return { size: 4, opacity: 0.3, color: '#D1D1D1' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity
      style={[styles.propertyCard, isFirst && styles.firstCard]}
      activeOpacity={0.95}
      onPress={onPress}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.carousel}
            >
              {images.map((uri, idx) => (
                <Image
                  key={`${property.id || property.ID || 'img'}-${idx}`}
                  source={{ uri }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.paginationDotsContainer}>
                {getVisibleDots().map(({ index, distance }) => {
                  const { size, opacity, color } = getDotStyle(distance);
                  return (
                    <View
                      key={`dot-${index}`}
                      style={[
                        styles.paginationDot,
                        {
                          width: size,
                          height: size,
                          opacity,
                          backgroundColor: color,
                          borderRadius: size / 2,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
          <View style={styles.favoriteIcon} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {property.title || property.Title}
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>★ {(property.rating || 0).toFixed(1)}</Text>
        </View>

        {/* Details */}
        <Text style={styles.propertyDetails} numberOfLines={1}>
          {property.bedrooms || 1} chambre · {property.bathrooms || 1} salle de bain
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(property.nightlyPrice || 25000)} MRU</Text>
          <Text style={styles.perNight}> / nuit</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
    marginLeft: 10,
    fontWeight: '600',
  },
  filtersButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },

  // Map Styles
  mapContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Bottom Sheet Styles
  bottomSheet: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bottomSheetIndicator: {
    backgroundColor: '#DDDDDD',
    width: 40,
    height: 4,
  },
  resultsHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultsCount: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  resultsLocation: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Property Card Styles
  propertyCard: {
    marginBottom: 32,
  },
  firstCard: {
    marginTop: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  carouselImage: {
    width: width - 48, // account for horizontal paddings in listContent
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginHorizontal: 12,
  },
  paginationDot: {
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingTop: 12,
  },
  titleRow: {
    marginBottom: 4,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#222222',
    fontWeight: '400',
  },
  propertyDetails: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 6,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  perNight: {
    fontSize: 14,
    fontWeight: '400',
    color: '#717171',
  },

  // Floating Map Button
  floatingMapButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 50,
  },
  mapButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});