// /**
//  * NearbyPlaceCard — reusable card for a single nearby place (school, hospital, restaurant, etc.).
//  * Handles all place types via config; clean, professional layout with optional rating.
//  */

// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Image,
//   TouchableOpacity,
// } from "react-native";
// import { Linking } from "react-native";
// import {
//   CaretRight,
//   Phone,
//   GraduationCap,
//   FirstAid,
//   ForkKnife,
//   MapPin,
//   Star,
//   Info,
// } from "phosphor-react-native";

// export type NearbyPlaceType = "schools" | "hospitals" | "restaurants" | string;

// export interface NearbyPlaceData {
//   name?: string;
//   address?: string;
//   phone?: string;
//   photo?: string;
//   image?: string;
//   rating?: number;
//   reviews?: number;
//   distance_km?: number;
//   distance_m?: number;
//   website?: string;
//   latitude?: number;
//   longitude?: number;
// }

// const PLACE_TYPE_CONFIG: Record<
//   string,
//   { icon: React.ComponentType<any>; color: string; defaultLabel: string }
// > = {
//   schools: {
//     icon: GraduationCap,
//     color: "#0066CC",
//     defaultLabel: "School",
//   },
//   hospitals: {
//     icon: FirstAid,
//     color: "#DC2626",
//     defaultLabel: "Hospital",
//   },
//   restaurants: {
//     icon: ForkKnife,
//     color: "#F59E0B",
//     defaultLabel: "Restaurant",
//   },
// };

// function getConfig(placeType: NearbyPlaceType) {
//   return (
//     PLACE_TYPE_CONFIG[placeType] ?? {
//       icon: MapPin,
//       color: "#6B7280",
//       defaultLabel: "Place",
//     }
//   );
// }

// function formatDistance(p: NearbyPlaceData): string {
//   if (p.distance_km != null) return `${Number(p.distance_km).toFixed(1)} km`;
//   if (p.distance_m != null) return `${p.distance_m} m`;
//   return "—";
// }

// const STAR_COLOR_FILL = "#EAB308";
// const STAR_COLOR_EMPTY = "#D1D5DB";

// interface NearbyPlaceCardProps {
//   place: NearbyPlaceData;
//   placeType: NearbyPlaceType;
//   onPress: () => void;
// }

// export function NearbyPlaceCard({
//   place,
//   placeType,
//   onPress,
// }: NearbyPlaceCardProps) {
//   const config = getConfig(placeType);
//   const Icon = config.icon;
//   const color = config.color;
//   const name = place.name || config.defaultLabel;
//   const photoUri = place.photo || place.image;

//   return (
//     <Pressable style={styles.card} onPress={onPress}>
//       {photoUri ? (
//         <Image source={{ uri: photoUri }} style={styles.image} />
//       ) : (
//         <View style={[styles.image, styles.imageEmpty]}>
//           <Icon size={28} color={color} weight="fill" />
//         </View>
//       )}
//       <View style={styles.content}>
//         <View style={styles.nameRow}>
//           <Icon size={16} color={color} weight="regular" style={styles.icon} />
//           <Text style={styles.name} numberOfLines={2}>
//             {name}
//           </Text>
//           {place.phone ? (
//             <TouchableOpacity
//               style={styles.callBtn}
//               onPress={(e) => {
//                 e?.stopPropagation?.();
//                 Linking.openURL(`tel:${place.phone}`);
//               }}
//             >
//               <Phone size={16} color={color} />
//             </TouchableOpacity>
//           ) : null}
//           <CaretRight size={20} color="#9CA3AF" style={styles.arrow} />
//         </View>
//         <View style={styles.metaRow}>
//           <Text style={styles.distance}>{formatDistance(place)}</Text>
//           {place.rating != null && (
//             <View style={styles.ratingRow}>
//               <Star size={12} color={STAR_COLOR_FILL} weight="fill" />
//               <Text style={styles.ratingText}>
//                 {Number(place.rating).toFixed(1)}
//                 {place.reviews != null ? ` (${place.reviews})` : ""}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//     minHeight: 56,
//   },
//   image: {
//     width: 56,
//     height: 56,
//     borderRadius: 8,
//     marginRight: 12,
//   },
//   imageEmpty: {
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F0F0F0",
//   },
//   content: {
//     flex: 1,
//     minWidth: 0,
//   },
//   nameRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 6,
//     flex: 1,
//   },
//   icon: {
//     marginTop: 2,
//     flexShrink: 0,
//   },
//   name: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#222",
//     lineHeight: 20,
//     flex: 1,
//   },
//   callBtn: {
//     padding: 6,
//     marginLeft: 4,
//   },
//   arrow: {
//     marginLeft: 4,
//     flexShrink: 0,
//   },
//   metaRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     flexWrap: "wrap",
//     gap: 8,
//     marginTop: 2,
//   },
//   distance: {
//     fontSize: 12,
//     color: "#717171",
//   },
//   ratingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   ratingText: {
//     fontSize: 12,
//     color: "#374151",
//     fontWeight: "500",
//   },
// });

// // ——— Detail sheet content (used inside Gorhom BottomSheetScrollView) ———

// const SHEET_STAR_FILL = "#EAB308";
// const SHEET_STAR_EMPTY = "#E5E7EB";

// export interface NearbyPlaceWithType extends NearbyPlaceData {
//   placeType: NearbyPlaceType;
// }

// export function NearbyPlaceDetailContent({
//   place,
//   onClose,
//   onCall,
//   onOpenWebsite,
//   credibilityText,
//   websiteText,
//   closeText,
//   reviewsLabel = "reviews",
// }: {
//   place: NearbyPlaceWithType;
//   onClose: () => void;
//   onCall: (phone: string) => void;
//   onOpenWebsite: (url: string) => void;
//   credibilityText: string;
//   websiteText: string;
//   closeText: string;
//   reviewsLabel?: string;
// }) {
//   const config = getConfig(place.placeType);
//   const Icon = config.icon;
//   const color = config.color;
//   const name = place.name || config.defaultLabel;
//   const photoUri = place.photo || place.image;
//   const rating = place.rating != null ? Number(place.rating) : null;
//   const reviews = place.reviews != null ? place.reviews : null;

//   return (
//     <View style={sheetStyles.content}>
//       {photoUri ? (
//         <Image source={{ uri: photoUri }} style={sheetStyles.heroImage} />
//       ) : (
//         <View style={[sheetStyles.heroImage, sheetStyles.heroImageEmpty]}>
//           <Icon size={48} color={color} weight="fill" />
//         </View>
//       )}
//       <Text style={sheetStyles.name}>{name}</Text>

//       <View style={sheetStyles.metaRow}>
//         {(place.distance_km != null || place.distance_m != null) && (
//           <Text style={sheetStyles.metaText}>{formatDistance(place)} away</Text>
//         )}
//         {rating != null && (
//           <View style={sheetStyles.ratingRow}>
//             {[1, 2, 3, 4, 5].map((i) => (
//               <Star
//                 key={i}
//                 size={18}
//                 color={
//                   i <= Math.round(rating) ? SHEET_STAR_FILL : SHEET_STAR_EMPTY
//                 }
//                 weight={i <= Math.round(rating) ? "fill" : "regular"}
//                 style={sheetStyles.star}
//               />
//             ))}
//             <Text style={sheetStyles.ratingValue}>
//               {rating.toFixed(1)}
//               {reviews != null ? ` (${reviews} ${reviewsLabel})` : ""}
//             </Text>
//           </View>
//         )}
//       </View>

//       {place.address ? (
//         <View style={sheetStyles.row}>
//           <MapPin size={18} color="#6B7280" style={sheetStyles.rowIcon} />
//           <Text style={sheetStyles.address} numberOfLines={3}>
//             {place.address}
//           </Text>
//         </View>
//       ) : null}

//       {place.phone ? (
//         <TouchableOpacity
//           style={sheetStyles.action}
//           onPress={() => onCall(place.phone!)}
//           activeOpacity={0.7}
//         >
//           <Phone size={20} color="#111827" />
//           <Text style={sheetStyles.actionText}>{place.phone}</Text>
//           <CaretRight size={18} color="#9CA3AF" />
//         </TouchableOpacity>
//       ) : null}

//       {place.website ? (
//         <TouchableOpacity
//           style={sheetStyles.action}
//           onPress={() => onOpenWebsite(place.website!)}
//           activeOpacity={0.7}
//         >
//           <Info size={20} color="#111827" />
//           <Text style={sheetStyles.actionText} numberOfLines={1}>
//             {websiteText}
//           </Text>
//           <CaretRight size={18} color="#9CA3AF" />
//         </TouchableOpacity>
//       ) : null}

//       <Text style={sheetStyles.credibility}>{credibilityText}</Text>

//       <TouchableOpacity
//         style={sheetStyles.closeBtn}
//         onPress={onClose}
//         activeOpacity={0.7}
//       >
//         <Text style={sheetStyles.closeBtnText}>{closeText}</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const sheetStyles = StyleSheet.create({
//   content: {
//     paddingHorizontal: 20,
//     paddingBottom: 32,
//   },
//   heroImage: {
//     width: "100%",
//     height: 180,
//     borderRadius: 12,
//     backgroundColor: "#F3F4F6",
//     marginBottom: 16,
//   },
//   heroImageEmpty: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   name: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 10,
//   },
//   metaRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     alignItems: "center",
//     gap: 16,
//     marginBottom: 14,
//   },
//   metaText: {
//     fontSize: 14,
//     color: "#6B7280",
//   },
//   ratingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   star: {
//     marginRight: 2,
//   },
//   ratingValue: {
//     fontSize: 14,
//     color: "#374151",
//     fontWeight: "600",
//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginBottom: 12,
//   },
//   rowIcon: {
//     marginRight: 8,
//     marginTop: 2,
//   },
//   address: {
//     flex: 1,
//     fontSize: 14,
//     color: "#374151",
//     lineHeight: 20,
//   },
//   action: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     gap: 10,
//     marginBottom: 8,
//   },
//   actionText: {
//     flex: 1,
//     fontSize: 15,
//     color: "#111827",
//     fontWeight: "500",
//   },
//   credibility: {
//     fontSize: 11,
//     color: "#9CA3AF",
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   closeBtn: {
//     paddingVertical: 14,
//     alignItems: "center",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 12,
//   },
//   closeBtnText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#374151",
//   },
// });

/**
 * NearbyPlaceCard — Clean, reusable card for nearby places (school, hospital, restaurant, etc.).
 * Professional layout with optional rating, distance, and quick-call support.
 * Includes detail sheet content for bottom-sheet usage.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
} from "react-native";
import { Linking } from "react-native";
import {
  CaretRight,
  Phone,
  GraduationCap,
  FirstAid,
  ForkKnife,
  MapPin,
  Star,
  Info,
} from "phosphor-react-native";

export type NearbyPlaceType = "schools" | "hospitals" | "restaurants" | string;

export interface NearbyPlaceData {
  name?: string;
  address?: string;
  phone?: string;
  photo?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  distance_km?: number;
  distance_m?: number;
  website?: string;
  latitude?: number;
  longitude?: number;
}

const PLACE_TYPE_CONFIG: Record<
  string,
  { icon: React.ComponentType<any>; color: string; defaultLabel: string }
> = {
  schools: {
    icon: GraduationCap,
    color: "#0066CC",
    defaultLabel: "School",
  },
  hospitals: {
    icon: FirstAid,
    color: "#DC2626",
    defaultLabel: "Hospital",
  },
  restaurants: {
    icon: ForkKnife,
    color: "#F59E0B",
    defaultLabel: "Restaurant",
  },
};

function getConfig(placeType: NearbyPlaceType) {
  return (
    PLACE_TYPE_CONFIG[placeType] ?? {
      icon: MapPin,
      color: "#6B7280",
      defaultLabel: "Place",
    }
  );
}

function formatDistance(place: NearbyPlaceData): string {
  if (place.distance_km != null)
    return `${Number(place.distance_km).toFixed(1)} km`;
  if (place.distance_m != null) return `${place.distance_m} m`;
  return "—";
}

const STAR_FILL = "#EAB308";
const STAR_EMPTY = "#D1D5DB";

interface NearbyPlaceCardProps {
  place: NearbyPlaceData;
  placeType: NearbyPlaceType;
  onPress: () => void;
}

export function NearbyPlaceCard({
  place,
  placeType,
  onPress,
}: NearbyPlaceCardProps) {
  const config = getConfig(placeType);
  const Icon = config.icon;
  const color = config.color;
  const name = place.name || config.defaultLabel;
  const photoUri = place.photo || place.image;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageEmpty]}>
          <Icon size={28} color={color} weight="fill" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Icon size={16} color={color} weight="regular" style={styles.icon} />
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>

          {place.phone && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                Linking.openURL(`tel:${place.phone}`);
              }}
            >
              <Phone size={16} color={color} />
            </TouchableOpacity>
          )}

          <CaretRight size={20} color="#9CA3AF" style={styles.arrow} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.distance}>{formatDistance(place)}</Text>

          {place.rating != null && (
            <View style={styles.ratingRow}>
              <Star size={12} color={STAR_FILL} weight="fill" />
              <Text style={styles.ratingText}>
                {Number(place.rating).toFixed(1)}
                {place.reviews != null ? ` (${place.reviews})` : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ————————————————————————————————————————————————
// DETAIL SHEET CONTENT (for Gorhom BottomSheet)
// ————————————————————————————————————————————————

const SHEET_STAR_FILL = "#EAB308";
const SHEET_STAR_EMPTY = "#E5E7EB";

export interface NearbyPlaceWithType extends NearbyPlaceData {
  placeType: NearbyPlaceType;
}

interface NearbyPlaceDetailContentProps {
  place: NearbyPlaceWithType;
  onClose: () => void;
  onCall: (phone: string) => void;
  onOpenWebsite: (url: string) => void;
  credibilityText: string;
  websiteText: string;
  closeText: string;
  reviewsLabel?: string;
}

export function NearbyPlaceDetailContent({
  place,
  onClose,
  onCall,
  onOpenWebsite,
  credibilityText,
  websiteText,
  closeText,
  reviewsLabel = "reviews",
}: NearbyPlaceDetailContentProps) {
  const config = getConfig(place.placeType);
  const Icon = config.icon;
  const color = config.color;
  const name = place.name || config.defaultLabel;
  const photoUri = place.photo || place.image;
  const rating = place.rating != null ? Number(place.rating) : null;
  const reviews = place.reviews ?? null;

  return (
    <View style={sheetStyles.content}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={sheetStyles.heroImage} />
      ) : (
        <View style={[sheetStyles.heroImage, sheetStyles.heroImageEmpty]}>
          <Icon size={48} color={color} weight="fill" />
        </View>
      )}

      <Text style={sheetStyles.name}>{name}</Text>

      <View style={sheetStyles.metaRow}>
        {(place.distance_km != null || place.distance_m != null) && (
          <Text style={sheetStyles.metaText}>{formatDistance(place)} away</Text>
        )}

        {rating != null && (
          <View style={sheetStyles.ratingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={18}
                color={
                  i <= Math.round(rating) ? SHEET_STAR_FILL : SHEET_STAR_EMPTY
                }
                weight={i <= Math.round(rating) ? "fill" : "regular"}
                style={sheetStyles.star}
              />
            ))}
            <Text style={sheetStyles.ratingValue}>
              {rating.toFixed(1)}
              {reviews != null ? ` (${reviews} ${reviewsLabel})` : ""}
            </Text>
          </View>
        )}
      </View>

      {place.address && (
        <View style={sheetStyles.row}>
          <MapPin size={18} color="#6B7280" style={sheetStyles.rowIcon} />
          <Text style={sheetStyles.address} numberOfLines={3}>
            {place.address}
          </Text>
        </View>
      )}

      {place.phone && (
        <TouchableOpacity
          style={sheetStyles.action}
          onPress={() => onCall(place.phone!)}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#111827" />
          <Text style={sheetStyles.actionText}>{place.phone}</Text>
          <CaretRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {place.website && (
        <TouchableOpacity
          style={sheetStyles.action}
          onPress={() => onOpenWebsite(place.website!)}
          activeOpacity={0.7}
        >
          <Info size={20} color="#111827" />
          <Text style={sheetStyles.actionText} numberOfLines={1}>
            {websiteText}
          </Text>
          <CaretRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      <Text style={sheetStyles.credibility}>{credibilityText}</Text>

      <TouchableOpacity
        style={sheetStyles.closeBtn}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Text style={sheetStyles.closeBtnText}>{closeText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 56,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  imageEmpty: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flex: 1,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    lineHeight: 20,
    flex: 1,
  },
  callBtn: {
    padding: 6,
    marginLeft: 4,
  },
  arrow: {
    marginLeft: 4,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: "#717171",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});

const sheetStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  heroImageEmpty: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  metaText: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  star: {
    marginRight: 2,
  },
  ratingValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  rowIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  credibility: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
    marginBottom: 16,
  },
  closeBtn: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
