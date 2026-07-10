// /**
//  * Map Adapter Components
//  * Wrappers that convert existing map data to BaseMap format
//  */

// import React, { useMemo, useCallback, useState, useEffect } from "react";
// import { BaseMap, BaseMapMarker, BaseMapProps } from "./BaseMap";
// import { Property } from "../types/property";
// import { Card } from "./Card";
// import { useNavigation } from "@react-navigation/native";
// import { View, Pressable, StyleSheet, Text, Image, Platform, ActivityIndicator } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";
// import { theme } from "../theme";
// import { LandmarkCard } from "./LandmarkCard";

// // ============================================================================
// // PROPERTY MAP ADAPTER
// // ============================================================================

// interface PropertyMapProps extends Omit<BaseMapProps, "markers" | "dataType"> {
//   properties: Property[];
//   selectedPropertyId?: number | null;
//   onPropertySelect?: (propertyId: number, index: number) => void;
//   isLoadingMarkers?: boolean;
// }

// export const PropertyMap: React.FC<PropertyMapProps> = ({
//   properties,
//   selectedPropertyId,
//   onPropertySelect,
//   isLoadingMarkers,
//   ...baseMapProps
// }) => {
//   const navigation = useNavigation();

//   // Convert properties to BaseMapMarker format
//   const markers: BaseMapMarker[] = useMemo(() => {
//     return properties
//       .filter((p) => {
//         // Ensure we have valid Property type (not PropertySale)
//         if (!p || typeof p !== 'object') return false;
//         // PropertySale has 'listing_price' or 'propertySaleID', Property has 'nightlyPrice' and 'ID'
//         if ('listing_price' in p || 'propertySaleID' in p) {
//           console.warn("⚠️ PropertyMap: Filtering out PropertySale data", p);
//           return false;
//         }
//         // Must have ID, lat, lng, and nightlyPrice (Property characteristics)
//         return p.ID && p.lat && p.lng && p.nightlyPrice != null;
//       })
//       .map((property) => ({
//         id: property.ID,
//         latitude: property.lat,
//         longitude: property.lng,
//         title: property.title || "Untitled Property",
//         image: property.images?.[0],
//         price: property.nightlyPrice,
//         data: property
//       }));
//   }, [properties]);

//   // Custom card component for properties - Stable function reference
//   const cardComponent = useCallback(
//     (marker: BaseMapMarker, onClose: () => void) => {
//       const property = marker.data as Property;

//       // Enhanced validation with better error messages
//       if (!property) {
//         console.warn("⚠️ MapAdapter: No property data in marker", { markerId: marker.id, marker });
//         return null;
//       }

//       if (!property.ID) {
//         console.warn("⚠️ MapAdapter: Property missing ID", { property, markerId: marker.id });
//         return null;
//       }

//       // Use ID field (Property type uses uppercase ID)
//       const propertyId = property.ID;
//       if (!propertyId) {
//         console.warn("⚠️ MapAdapter: Could not determine property ID", { property, markerId: marker.id });
//         return null;
//       }

//       // Ensure we have a valid Property type, not PropertySale
//       if ('listing_price' in property || 'propertySaleID' in property) {
//         console.error("❌ MapAdapter: PropertySale data passed to PropertyMap! This should not happen.", { property, markerId: marker.id });
//         return null;
//       }

//       // Ensure property has ID field (Card component expects property.ID)
//       const normalizedProperty = {
//         ...property,
//         ID: propertyId
//       };

//       return (
//         <View style={adapterStyles.cardWrapper}>
//           <Pressable
//             style={adapterStyles.closeButton}
//             onPress={onClose}
//             hitSlop={12}
//           >
//             <MaterialIcons name="close" size={20} color="#222" />
//           </Pressable>
//           <Card
//             property={normalizedProperty}
//             style={adapterStyles.card}
//             onPress={() => {
//               // Explicitly navigate to PropertyDetails screen
//               try {
//                 (navigation as any).navigate("PropertyDetails", {
//                   propertyID: propertyId
//                 });
//               } catch (error) {
//                 console.error("❌ Navigation error:", error);
//               }
//             }}
//           />
//         </View>
//       );
//     },
//     [navigation]
//   );

//   return (
//     <BaseMap
//       {...baseMapProps}
//       markers={markers}
//       dataType="properties"
//       selectedMarkerId={selectedPropertyId}
//       onMarkerSelect={(markerId, index) => {
//         onPropertySelect?.(Number(markerId), index);
//       }}
//       cardComponent={cardComponent}
//       isLoadingMarkers={isLoadingMarkers}
//     />
//   );
// };

// // ============================================================================
// // PROPERTY SALE MAP ADAPTER
// // ============================================================================

// interface PropertySale {
//   id: number;
//   title?: string;
//   listing_price?: number;
//   price?: number;
//   lat?: number;
//   lng?: number;
//   latitude?: number;
//   longitude?: number;
//   images?: string[];
//   property_type?: string;
//   bedrooms?: number;
//   bathrooms?: number;
//   surface_area?: number;
//   [key: string]: any;
// }

// interface PropertySaleMapProps extends Omit<BaseMapProps, "markers" | "dataType"> {
//   propertySales: PropertySale[];
//   selectedPropertySaleId?: number | null;
//   onPropertySaleSelect?: (propertySaleId: number, index: number) => void;
//   useExternalCard?: boolean;
//   isLoadingMarkers?: boolean;
// }

// export const PropertySaleMap: React.FC<PropertySaleMapProps> = ({
//   propertySales,
//   selectedPropertySaleId,
//   onPropertySaleSelect,
//   useExternalCard = false,
//   isLoadingMarkers,
//   ...baseMapProps
// }) => {
//   const navigation = useNavigation();

//   // Convert property sales to BaseMapMarker format
//   const markers: BaseMapMarker[] = useMemo(() => {
//     return propertySales
//       .filter((ps) => {
//         const lat = ps.latitude ?? ps.lat;
//         const lng = ps.longitude ?? ps.lng;
//         return lat && lng;
//       })
//       .map((propertySale) => ({
//         id: propertySale.id,
//         latitude: propertySale.latitude ?? propertySale.lat ?? 0,
//         longitude: propertySale.longitude ?? propertySale.lng ?? 0,
//         title: propertySale.title,
//         image: propertySale.images?.[0],
//         price: propertySale.listing_price ?? propertySale.price,
//         data: propertySale
//       }));
//   }, [propertySales]);

//   // Preload images for ALL markers immediately (aggressive caching)
//   useEffect(() => {
//     const imageUrls = markers
//       .map((m) => m.image)
//       .filter((url): url is string => Boolean(url));

//     // Prefetch all images in parallel for instant display
//     Promise.all(
//       imageUrls.map((url) =>
//         Image.prefetch(url).catch(() => null)
//       )
//     ).catch(() => {
//       // Silently fail
//     });
//   }, [markers]);

//   // Property Sale Card Component - optimized for instant display
//   const PropertySaleCard = React.memo(({
//     propertySale,
//     onClose,
//     onNavigate
//   }: {
//     propertySale: PropertySale;
//     onClose: () => void;
//     onNavigate: () => void;
//   }) => {
//     const [imageError, setImageError] = useState(false);
//     const imageUrl = propertySale.images?.[0];

//     // Image is already prefetched in useEffect above, so show immediately

//     const formatPrice = (p: number) => {
//       if (p >= 1000000) return `${(p / 1000000).toFixed(1)}M MRU`;
//       if (p >= 1000) return `${(p / 1000).toFixed(0)}K MRU`;
//       return `${p.toLocaleString()} MRU`;
//     };

//     return (
//       <View style={adapterStyles.cardWrapper}>
//         <Pressable style={adapterStyles.closeButton} onPress={onClose} hitSlop={12}>
//           <MaterialIcons name="close" size={20} color="#222" />
//         </Pressable>
//         <Pressable
//           style={adapterStyles.propertySaleCard}
//           onPress={onNavigate}
//         >
//           {imageUrl && !imageError ? (
//             <View style={adapterStyles.propertySaleCardImageContainer}>
//               <Image
//                 source={{ uri: imageUrl, cache: 'force-cache' }}
//                 style={adapterStyles.propertySaleCardImage}
//                 resizeMode="cover"
//                 onError={() => setImageError(true)}
//               />
//             </View>
//           ) : (
//             <View style={adapterStyles.propertySaleCardImagePlaceholder}>
//               <MaterialIcons name="home" size={32} color="#AB0003" />
//             </View>
//           )}
//             <View style={adapterStyles.propertySaleCardContent}>
//               <Text style={adapterStyles.propertySaleCardTitle} numberOfLines={1}>
//                 {propertySale.title || "Property Sale"}
//               </Text>
//               {(propertySale.listing_price || propertySale.price) && (
//                 <Text style={adapterStyles.propertySaleCardPrice}>
//                   {formatPrice(propertySale.listing_price ?? propertySale.price ?? 0)}
//                 </Text>
//               )}
//               <View style={adapterStyles.propertySaleCardDetails}>
//                 {propertySale.bedrooms && (
//                   <Text style={adapterStyles.propertySaleCardDetail}>
//                     {propertySale.bedrooms} bed
//                   </Text>
//                 )}
//                 {propertySale.bathrooms && (
//                   <Text style={adapterStyles.propertySaleCardDetail}>
//                     {propertySale.bathrooms} bath
//                   </Text>
//                 )}
//                 {propertySale.surface_area && (
//                   <Text style={adapterStyles.propertySaleCardDetail}>
//                     {propertySale.surface_area} m²
//                   </Text>
//                 )}
//               </View>
//             </View>
//           </Pressable>
//         </View>
//     );
//   });

//   // Custom card component for property sales - Stable function reference
//   const cardComponent = useCallback(
//     (marker: BaseMapMarker, onClose: () => void) => {
//       const propertySale = marker.data as PropertySale;
//       if (!propertySale) return null;

//       return (
//         <PropertySaleCard
//           propertySale={propertySale}
//           onClose={onClose}
//           onNavigate={() =>
//             (navigation as any).navigate("PropertySaleDetails", {
//               propertySaleID: propertySale.id
//             })
//           }
//         />
//       );
//     },
//     [navigation]
//   );

//   return (
//     <BaseMap
//       {...baseMapProps}
//       markers={markers}
//       dataType="propertySales"
//       selectedMarkerId={selectedPropertySaleId}
//       cardComponent={useExternalCard ? undefined : cardComponent}
//       useExternalCard={useExternalCard}
//       onMarkerSelect={(markerId, index) => {
//         onPropertySaleSelect?.(Number(markerId), index);
//       }}
//       isLoadingMarkers={isLoadingMarkers}
//     />
//   );
// };

// // ============================================================================
// // LANDMARK MAP ADAPTER
// // ============================================================================

// interface Landmark {
//   id: number;
//   title?: string;
//   name?: string;
//   price?: number;
//   surface_area?: number;
//   area?: number;
//   area_unit?: string;
//   point1_lat?: number;
//   point1_lng?: number;
//   point2_lat?: number;
//   point2_lng?: number;
//   point3_lat?: number;
//   point3_lng?: number;
//   point4_lat?: number;
//   point4_lng?: number;
//   lat?: number;
//   lng?: number;
//   images?: string[];
//   zone_name?: string;
//   city_name?: string;
//   land_type?: string;
//   zoning?: string;
//   organization?: { name?: string };
//   [key: string]: any;
// }

// interface LandmarkMapProps extends Omit<BaseMapProps, "markers" | "dataType"> {
//   landmarks: Landmark[];
//   selectedLandmarkId?: number | null;
//   onLandmarkSelect?: (landmarkId: number, index: number) => void;
// }

// export const LandmarkMap: React.FC<LandmarkMapProps> = ({
//   landmarks,
//   selectedLandmarkId,
//   onLandmarkSelect,
//   ...baseMapProps
// }) => {
//   const navigation = useNavigation();

//   // Helper to get landmark center
//   const getLandmarkCenter = (landmark: Landmark) => {
//     const points = [
//       { lat: landmark.point1_lat, lng: landmark.point1_lng },
//       { lat: landmark.point2_lat, lng: landmark.point2_lng },
//       { lat: landmark.point3_lat, lng: landmark.point3_lng },
//       { lat: landmark.point4_lat, lng: landmark.point4_lng }
//     ].filter((p) => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));

//     if (points.length === 0) {
//       // Fallback to lat/lng if polygon points not available
//       if (landmark.lat && landmark.lng) {
//         return { latitude: landmark.lat, longitude: landmark.lng };
//       }
//       return null;
//     }

//     const avgLat = points.reduce((sum, p) => sum + (p.lat || 0), 0) / points.length;
//     const avgLng = points.reduce((sum, p) => sum + (p.lng || 0), 0) / points.length;

//     return { latitude: avgLat, longitude: avgLng };
//   };

//   // Helper to get polygon coordinates
//   const getPolygonCoordinates = (landmark: Landmark) => {
//     const coords = [
//       { latitude: landmark.point1_lat || 0, longitude: landmark.point1_lng || 0 },
//       { latitude: landmark.point2_lat || 0, longitude: landmark.point2_lng || 0 },
//       { latitude: landmark.point3_lat || 0, longitude: landmark.point3_lng || 0 },
//       { latitude: landmark.point4_lat || 0, longitude: landmark.point4_lng || 0 }
//     ];

//     const isValid = coords.every(
//       (c) => c.latitude !== 0 && c.longitude !== 0 && !isNaN(c.latitude) && !isNaN(c.longitude)
//     );

//     return isValid ? coords : null;
//   };

//   // Convert landmarks to BaseMapMarker format
//   const markers: BaseMapMarker[] = useMemo(() => {
//     const validMarkers: BaseMapMarker[] = [];

//     landmarks.forEach((landmark) => {
//       const center = getLandmarkCenter(landmark);
//       const polygonCoords = getPolygonCoordinates(landmark);

//       if (!center) return;

//       validMarkers.push({
//         id: String(landmark.id), // Convert to string to match BaseMapMarker type
//         latitude: center.latitude,
//         longitude: center.longitude,
//         title: landmark.title || landmark.name,
//         image: Array.isArray(landmark.images) ? landmark.images[0] : undefined,
//         price: landmark.price,
//         polygonCoordinates: polygonCoords || undefined,
//         data: landmark
//       });
//     });

//     return validMarkers;
//   }, [landmarks]);

//   // Custom card component for landmarks - video autoplay, Excel table, clean layout
//   const cardComponent = useCallback(
//     (marker: BaseMapMarker, onClose: () => void) => {
//       const landmark = marker.data as Landmark;
//       if (!landmark) return null;

//       return (
//         <View style={adapterStyles.cardWrapper}>
//           <Pressable style={adapterStyles.closeButton} onPress={onClose} hitSlop={12}>
//             <MaterialIcons name="close" size={18} color="#222" />
//           </Pressable>
//           <LandmarkCard
//             landmark={landmark}
//             variant="map"
//             onPress={() =>
//               (navigation as any).navigate("LandmarkDetails", {
//                 landmark,
//                 landmarkId: landmark.id,
//               })
//             }
//           />
//         </View>
//       );
//     },
//     [navigation]
//   );

//   return (
//     <BaseMap
//       {...baseMapProps}
//       markers={markers}
//       dataType="landmarks"
//       selectedMarkerId={selectedLandmarkId}
//       onMarkerSelect={(markerId, index) => {
//         onLandmarkSelect?.(Number(markerId), index);
//       }}
//       cardComponent={cardComponent}
//       mapType={baseMapProps.mapType || "satellite"} // Default to satellite for landmarks
//     />
//   );
// };

// // ============================================================================
// // STYLES
// // ============================================================================

// const adapterStyles = StyleSheet.create({
//   cardWrapper: {
//     position: "relative"
//   },
//   closeButton: {
//     position: "absolute",
//     top: -48,
//     left: 0,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#FFF",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 100,

//   },
//   card: {
//     borderRadius: 16,
//     overflow: "hidden"
//   },
//   // Property Sale Card
//   propertySaleCard: {
//     flexDirection: "row",
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     overflow: "hidden",
//     minHeight: 120,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.15,
//         shadowRadius: 12
//       },
//       android: {
//         elevation: 8
//       }
//     })
//   },
//   propertySaleCardImageContainer: {
//     width: 140,
//     height: 120,
//     backgroundColor: "#F0F0F0",
//     position: "relative"
//   },
//   propertySaleCardImage: {
//     width: 140,
//     height: 120,
//     backgroundColor: "#F0F0F0"
//   },
//   propertySaleCardImagePlaceholder: {
//     width: 140,
//     height: 120,
//     backgroundColor: "#F0F0F0",
//     alignItems: "center",
//     justifyContent: "center"
//   },
//   imageLoadingContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F0F0F0",
//     zIndex: 1
//   },
//   imageHidden: {
//     opacity: 0
//   },
//   propertySaleCardContent: {
//     flex: 1,
//     padding: 14,
//     justifyContent: "space-between"
//   },
//   propertySaleCardTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#222",
//     marginBottom: 6
//   },
//   propertySaleCardPrice: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: "#222",
//     marginBottom: 8
//   },
//   propertySaleCardDetails: {
//     flexDirection: "row",
//     gap: 12,
//     flexWrap: "wrap"
//   },
//   propertySaleCardDetail: {
//     fontSize: 13,
//     color: "#717171",
//     fontWeight: "500"
//   },
//   // Landmark Card
//   landmarkCard: {
//     flexDirection: "row",
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     overflow: "hidden",
//     minHeight: 120,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.15,
//         shadowRadius: 12
//       },
//       android: {
//         elevation: 8
//       }
//     })
//   },
//   landmarkCardImageContainer: {
//     width: 140,
//     height: 120,
//     backgroundColor: "#F0F0F0"
//   },
//   landmarkCardImage: {
//     width: "100%",
//     height: "100%"
//   },
//   landmarkCardImagePlaceholder: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#E8F5F3"
//   },
//   landmarkCardContent: {
//     flex: 1,
//     padding: 14,
//     justifyContent: "space-between"
//   },
//   landmarkCardTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#222",
//     marginBottom: 6,
//     lineHeight: 20
//   },
//   landmarkCardPrice: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: "#222",
//     marginBottom: 8,
//     letterSpacing: -0.3
//   },
//   landmarkCardDetailsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     alignItems: "center"
//   },
//   landmarkCardDetailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4
//   },
//   landmarkCardDetailText: {
//     fontSize: 13,
//     color: "#717171",
//     fontWeight: "500"
//   }
// });

/**
 * Map Adapter Components
 * Compact cards — Airbnb / Redfin / Perplexity aesthetic.
 * Card height: 76px. Image: 76×76. Clean typography, minimal chrome.
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { BaseMap, BaseMapMarker, BaseMapProps } from "./BaseMap";
import { Property } from "../types/property";
import { Card } from "./Card";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  Image,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { LandmarkCard } from "./LandmarkCard";

// ============================================================================
// PROPERTY MAP ADAPTER
// ============================================================================

interface PropertyMapProps extends Omit<BaseMapProps, "markers" | "dataType"> {
  properties: Property[];
  selectedPropertyId?: number | null;
  onPropertySelect?: (propertyId: number, index: number) => void;
  isLoadingMarkers?: boolean;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedPropertyId,
  onPropertySelect,
  isLoadingMarkers,
  ...baseMapProps
}) => {
  const navigation = useNavigation();

  const markers: BaseMapMarker[] = useMemo(() => {
    return properties
      .filter((p) => {
        if (!p || typeof p !== "object") return false;
        if ("listing_price" in p || "propertySaleID" in p) {
          console.warn("⚠️ PropertyMap: Filtering out PropertySale data", p);
          return false;
        }
        return p.ID && p.lat && p.lng && p.nightlyPrice != null;
      })
      .map((property) => ({
        id: property.ID,
        latitude: property.lat,
        longitude: property.lng,
        title: property.title || "Untitled Property",
        image: property.images?.[0],
        price: property.nightlyPrice,
        data: property
      }));
  }, [properties]);

  const cardComponent = useCallback(
    (marker: BaseMapMarker, onClose: () => void) => {
      const property = marker.data as Property;

      if (!property?.ID) {
        console.warn("⚠️ MapAdapter: Property missing ID", { marker });
        return null;
      }
      if ("listing_price" in property || "propertySaleID" in property) {
        console.error("❌ MapAdapter: PropertySale passed to PropertyMap", {
          marker
        });
        return null;
      }

      const normalizedProperty = { ...property, ID: property.ID };

      return (
        <View style={adapterStyles.cardWrapper}>
          <Pressable
            style={adapterStyles.dismissBtn}
            onPress={onClose}
            hitSlop={14}
          >
            <MaterialIcons name="close" size={16} color="#444" />
          </Pressable>
          <Card
            property={normalizedProperty}
            style={adapterStyles.card}
            onPress={() => {
              try {
                (navigation as any).navigate("PropertyDetails", {
                  propertyID: property.ID
                });
              } catch (e) {
                console.error("❌ Navigation error:", e);
              }
            }}
          />
        </View>
      );
    },
    [navigation]
  );

  return (
    <BaseMap
      {...baseMapProps}
      markers={markers}
      dataType="properties"
      selectedMarkerId={selectedPropertyId}
      onMarkerSelect={(markerId, index) => {
        onPropertySelect?.(Number(markerId), index);
      }}
      cardComponent={cardComponent}
      isLoadingMarkers={isLoadingMarkers}
    />
  );
};

// ============================================================================
// PROPERTY SALE MAP ADAPTER
// ============================================================================

interface PropertySale {
  id: number;
  title?: string;
  listing_price?: number;
  price?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  [key: string]: any;
}

interface PropertySaleMapProps extends Omit<
  BaseMapProps,
  "markers" | "dataType"
> {
  propertySales: PropertySale[];
  selectedPropertySaleId?: number | null;
  onPropertySaleSelect?: (propertySaleId: number, index: number) => void;
  useExternalCard?: boolean;
  isLoadingMarkers?: boolean;
}

// Compact horizontal card — 76px fixed height
const PropertySaleCard = React.memo(
  ({
    propertySale,
    onClose,
    onNavigate
  }: {
    propertySale: PropertySale;
    onClose: () => void;
    onNavigate: () => void;
  }) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = propertySale.images?.[0];

    const formatPrice = (p: number) => {
      if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M MRU`;
      if (p >= 1_000) return `${Math.round(p / 1_000)}K MRU`;
      return `${p.toLocaleString()} MRU`;
    };

    const price = propertySale.listing_price ?? propertySale.price;
    const details = [
      propertySale.bedrooms && `${propertySale.bedrooms} bd`,
      propertySale.bathrooms && `${propertySale.bathrooms} ba`,
      propertySale.surface_area && `${propertySale.surface_area} m²`
    ].filter(Boolean);

    return (
      <View style={adapterStyles.cardWrapper}>
        {/* Dismiss pill — sits above card, left-anchored */}
        <Pressable
          style={adapterStyles.dismissBtn}
          onPress={onClose}
          hitSlop={14}
        >
          <MaterialIcons name="close" size={16} color="#444" />
        </Pressable>

        <Pressable
          style={adapterStyles.compactCard}
          onPress={onNavigate}
          android_ripple={{ color: "#f0f0f0" }}
        >
          {/* Thumbnail */}
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl, cache: "force-cache" }}
              style={adapterStyles.thumb}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={adapterStyles.thumbPlaceholder}>
              <MaterialIcons name="home" size={24} color="#D4D4D4" />
            </View>
          )}

          {/* Info */}
          <View style={adapterStyles.info}>
            <Text style={adapterStyles.title} numberOfLines={1}>
              {propertySale.title || "Property for sale"}
            </Text>
            {price != null && (
              <Text style={adapterStyles.price}>{formatPrice(price)}</Text>
            )}
            {details.length > 0 && (
              <Text style={adapterStyles.meta} numberOfLines={1}>
                {details.join("  ·  ")}
              </Text>
            )}
          </View>

          {/* Chevron */}
          <MaterialIcons
            name="chevron-right"
            size={20}
            color="#C0C0C0"
            style={adapterStyles.chevron}
          />
        </Pressable>
      </View>
    );
  }
);
PropertySaleCard.displayName = "PropertySaleCard";

export const PropertySaleMap: React.FC<PropertySaleMapProps> = ({
  propertySales,
  selectedPropertySaleId,
  onPropertySaleSelect,
  useExternalCard = false,
  isLoadingMarkers,
  ...baseMapProps
}) => {
  const navigation = useNavigation();

  const markers: BaseMapMarker[] = useMemo(() => {
    return propertySales
      .filter((ps) => {
        const lat = ps.latitude ?? ps.lat;
        const lng = ps.longitude ?? ps.lng;
        return lat && lng;
      })
      .map((ps) => ({
        id: ps.id,
        latitude: ps.latitude ?? ps.lat ?? 0,
        longitude: ps.longitude ?? ps.lng ?? 0,
        title: ps.title,
        image: ps.images?.[0],
        price: ps.listing_price ?? ps.price,
        data: ps
      }));
  }, [propertySales]);

  // Prefetch images for fast display
  useEffect(() => {
    const urls = markers
      .map((m) => m.image)
      .filter((u): u is string => Boolean(u));
    Promise.all(urls.map((url) => Image.prefetch(url).catch(() => null))).catch(
      () => {}
    );
  }, [markers]);

  const cardComponent = useCallback(
    (marker: BaseMapMarker, onClose: () => void) => {
      const ps = marker.data as PropertySale;
      if (!ps) return null;
      return (
        <PropertySaleCard
          propertySale={ps}
          onClose={onClose}
          onNavigate={() =>
            (navigation as any).navigate("PropertySaleDetails", {
              propertySaleID: ps.id
            })
          }
        />
      );
    },
    [navigation]
  );

  return (
    <BaseMap
      {...baseMapProps}
      markers={markers}
      dataType="propertySales"
      selectedMarkerId={selectedPropertySaleId}
      cardComponent={useExternalCard ? undefined : cardComponent}
      useExternalCard={useExternalCard}
      onMarkerSelect={(markerId, index) => {
        onPropertySaleSelect?.(Number(markerId), index);
      }}
      isLoadingMarkers={isLoadingMarkers}
    />
  );
};

// ============================================================================
// LANDMARK MAP ADAPTER
// ============================================================================

interface Landmark {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  surface_area?: number;
  area?: number;
  area_unit?: string;
  point1_lat?: number;
  point1_lng?: number;
  point2_lat?: number;
  point2_lng?: number;
  point3_lat?: number;
  point3_lng?: number;
  point4_lat?: number;
  point4_lng?: number;
  lat?: number;
  lng?: number;
  images?: string[];
  zone_name?: string;
  city_name?: string;
  land_type?: string;
  zoning?: string;
  organization?: { name?: string };
  [key: string]: any;
}

interface LandmarkMapProps extends Omit<BaseMapProps, "markers" | "dataType"> {
  landmarks: Landmark[];
  selectedLandmarkId?: number | null;
  onLandmarkSelect?: (landmarkId: number, index: number) => void;
}

export const LandmarkMap: React.FC<LandmarkMapProps> = ({
  landmarks,
  selectedLandmarkId,
  onLandmarkSelect,
  ...baseMapProps
}) => {
  const navigation = useNavigation();

  const getLandmarkCenter = (landmark: Landmark) => {
    const points = [
      { lat: landmark.point1_lat, lng: landmark.point1_lng },
      { lat: landmark.point2_lat, lng: landmark.point2_lng },
      { lat: landmark.point3_lat, lng: landmark.point3_lng },
      { lat: landmark.point4_lat, lng: landmark.point4_lng }
    ].filter((p) => p.lat && p.lng && !isNaN(p.lat!) && !isNaN(p.lng!));

    if (points.length === 0) {
      if (landmark.lat && landmark.lng)
        return { latitude: landmark.lat, longitude: landmark.lng };
      return null;
    }

    const avgLat = points.reduce((s, p) => s + (p.lat || 0), 0) / points.length;
    const avgLng = points.reduce((s, p) => s + (p.lng || 0), 0) / points.length;
    return { latitude: avgLat, longitude: avgLng };
  };

  const getPolygonCoordinates = (landmark: Landmark) => {
    const coords = [
      {
        latitude: landmark.point1_lat || 0,
        longitude: landmark.point1_lng || 0
      },
      {
        latitude: landmark.point2_lat || 0,
        longitude: landmark.point2_lng || 0
      },
      {
        latitude: landmark.point3_lat || 0,
        longitude: landmark.point3_lng || 0
      },
      {
        latitude: landmark.point4_lat || 0,
        longitude: landmark.point4_lng || 0
      }
    ];
    const isValid = coords.every(
      (c) =>
        c.latitude !== 0 &&
        c.longitude !== 0 &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude)
    );
    return isValid ? coords : null;
  };

  const markers: BaseMapMarker[] = useMemo(() => {
    const valid: BaseMapMarker[] = [];
    landmarks.forEach((landmark) => {
      const center = getLandmarkCenter(landmark);
      const polygonCoords = getPolygonCoordinates(landmark);
      if (!center) return;
      valid.push({
        id: String(landmark.id),
        latitude: center.latitude,
        longitude: center.longitude,
        title: landmark.title || landmark.name,
        image: Array.isArray(landmark.images) ? landmark.images[0] : undefined,
        price: landmark.price,
        polygonCoordinates: polygonCoords || undefined,
        data: landmark
      });
    });
    return valid;
  }, [landmarks]);

  const cardComponent = useCallback(
    (marker: BaseMapMarker, onClose: () => void) => {
      const landmark = marker.data as Landmark;
      if (!landmark) return null;
      return (
        <View style={adapterStyles.cardWrapper}>
          <Pressable
            style={adapterStyles.dismissBtn}
            onPress={onClose}
            hitSlop={14}
          >
            <MaterialIcons name="close" size={16} color="#444" />
          </Pressable>
          <LandmarkCard
            landmark={landmark}
            variant="map"
            onPress={() =>
              (navigation as any).navigate("LandmarkDetails", {
                landmark,
                landmarkId: landmark.id
              })
            }
          />
        </View>
      );
    },
    [navigation]
  );

  return (
    <BaseMap
      {...baseMapProps}
      markers={markers}
      dataType="landmarks"
      selectedMarkerId={selectedLandmarkId}
      onMarkerSelect={(markerId, index) => {
        onLandmarkSelect?.(Number(markerId), index);
      }}
      cardComponent={cardComponent}
      mapType={baseMapProps.mapType || "satellite"}
    />
  );
};

// ============================================================================
// STYLES
// ============================================================================

const CARD_HEIGHT = 76;
const THUMB_SIZE = CARD_HEIGHT; // square thumbnail = card height

const adapterStyles = StyleSheet.create({
  // ── Outer wrapper (positions dismiss button above card) ───────────────────
  cardWrapper: {
    // no extra styling — let cardContainer in BaseMap handle position
  },

  // ── Dismiss button — small pill above card, top-left ─────────────────────
  dismissBtn: {
    position: "absolute",
    top: -40,
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: { elevation: 3 }
    })
  },

  // ── Compact horizontal card ───────────────────────────────────────────────
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    height: CARD_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14
      },
      android: { elevation: 6 }
    })
  },

  // ── Thumbnail — flush left, full height ───────────────────────────────────
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE
  },
  thumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center"
  },

  // ── Text content ──────────────────────────────────────────────────────────
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    gap: 2
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: -0.1
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.4,
    marginTop: 1
  },
  meta: {
    fontSize: 12,
    color: "#9B9B9B",
    fontWeight: "400",
    marginTop: 2,
    letterSpacing: 0
  },

  // ── Chevron ───────────────────────────────────────────────────────────────
  chevron: {
    marginRight: 10
  },

  // ── Legacy property card wrapper (uses existing <Card> component) ─────────
  card: {
    borderRadius: 14,
    overflow: "hidden"
  }
});
