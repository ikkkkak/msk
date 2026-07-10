// import React, { useState, useCallback } from "react";
// import {
//   View,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   RefreshControl,
//   SafeAreaView,
// } from "react-native";
// import { Text } from "@ui-kitten/components";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import { useTranslation } from "react-i18next";
// import { Bed, Bathtub, MapPin, Heart } from "phosphor-react-native";

// import { Screen } from "../components/Screen";
// import { SignUpAndSignInButtons } from "../components/SignUpAndSignInButtons";
// import { useUser } from "../hooks/useUser";
// import { useSavedPropertiesQuery } from "../hooks/queries/useSavedPropertiesQuery";
// import { useRemoveFromWishlistMutation } from "../hooks/mutations/useWishlistMutations";
// import Toast from "../components/CustomToast";

// // Minimal placeholder card for loading
// const PropertySkeletonCard = () => (
//   <View style={styles.skeletonCard}>
//     <View style={styles.skeletonImage} />
//     <View style={styles.skeletonTextLine} />
//     <View style={styles.skeletonTextSmall} />
//   </View>
// );

// const SavedCard = ({ item, onRemove, onPress, t }) => {
//   let propertyImages = [];
//   try {
//     propertyImages =
//       item.images ||
//       (typeof item.Images === "string"
//         ? JSON.parse(item.Images)
//         : Array.isArray(item.Images)
//         ? item.Images
//         : []);
//   } catch {
//     propertyImages = [];
//   }

//   const propertyId = item.ID || item.id;
//   const title = item.title || item.Title || t("property.details.titlePlaceholder");
//   const city = item.city || item.City || "";
//   const state = item.state || item.State || "";
//   const price = item.nightlyPrice || item.NightlyPrice || 0;
//   const bedrooms = item.bedrooms || item.Bedrooms || 0;
//   const bathrooms = item.bathrooms || item.Bathrooms || 0;
//   const beds = item.beds || item.Beds || 0;
//   const locationText = state ? `${city}, ${state}` : city;

//   return (
//     <TouchableOpacity style={styles.card} activeOpacity={0.93} onPress={() => onPress(propertyId)}>
//       <View>
//         {propertyImages[0] ? (
//           <Image source={{ uri: propertyImages[0] }} style={styles.image} />
//         ) : (
//           <View style={[styles.image, styles.placeholderImg]} />
//         )}
//         <TouchableOpacity style={styles.heartBtn} onPress={() => onRemove(propertyId)}>
//           <Heart size={18} color="#FF385C" weight="fill" />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.cardDesc}>
//         <Text style={styles.price}>{price} MRU <Text appearance="hint" style={styles.night}>{t("common.night","/night")}</Text></Text>
//         <Text style={styles.title} numberOfLines={1}>{title}</Text>
//         <View style={styles.inlineRow}>
//           <MapPin size={12} color="#717171" />
//           <Text style={styles.location} numberOfLines={1}>{locationText || t("property.details.locationPlaceholder")}</Text>
//         </View>
//         <View style={styles.statRow}>
//           {bedrooms ? (
//             <View style={styles.statItem}>
//               <Bed size={13} color="#717171" weight="duotone" />
//               <Text style={styles.statText}>{bedrooms}</Text>
//             </View>
//           ) : null}
//           {bathrooms ? (
//             <View style={styles.statItem}>
//               <Bathtub size={13} color="#717171" weight="duotone" />
//               <Text style={styles.statText}>{bathrooms}</Text>
//             </View>
//           ) : null}
//           {beds && !bedrooms ? (
//             <View style={styles.statItem}>
//               <Bed size={13} color="#717171" weight="duotone" />
//               <Text style={styles.statText}>{beds}</Text>
//             </View>
//           ) : null}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// export const SavedScreen = () => {
//   const [refreshing, setRefreshing] = useState(false);
//   const [showToast, setShowToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const [toastType, setToastType] = useState("success");

//   const { user, setSavedProperties } = useUser();
//   const navigation = useNavigation();
//   const savedProperties = useSavedPropertiesQuery();
//   const removeFromWishlist = useRemoveFromWishlistMutation();
//   const { t } = useTranslation();

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await savedProperties.refetch?.();
//     setRefreshing(false);
//   };

//   useFocusEffect(
//     useCallback(() => {
//       savedProperties.refetch?.();
//     }, [savedProperties])
//   );

//   const handleRemove = async (propertyId) => {
//     try {
//       await removeFromWishlist.mutateAsync(propertyId);
//       if (user?.savedProperties?.includes(propertyId)) {
//         setSavedProperties(user.savedProperties.filter((id) => id !== propertyId));
//       }
//       setToastMessage(t("account.saved.removed", "Property removed from wishlist"));
//       setToastType("success");
//       setShowToast(true);
//     } catch {
//       setToastMessage(t("account.saved.failedRemove", "Failed to remove from wishlist"));
//       setToastType("error");
//       setShowToast(true);
//     }
//   };

//   const onPropertyPress = (propertyID) => {
//     navigation.navigate("PropertyDetails", { propertyID });
//   };

//   const renderHeader = () => (
//     <SafeAreaView style={styles.headerSafe}>
//       <View style={styles.headerBar}>
//         <Text style={styles.headerTitle}>{t('account.saved.title', 'Wishlist')}</Text>
//       </View>
//     </SafeAreaView>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Heart size={50} color="#E0E0E0" weight="duotone" />
//       <Text style={styles.emptyTitle}>{t('account.saved.noProperties', 'No saved properties')}</Text>
//       <Text style={styles.emptySubtitle}>{t('account.saved.noPropertiesSubtitle', 'Properties you save will appear here')}</Text>
//     </View>
//   );

//   const renderNotLoggedIn = () => (
//     <View style={styles.emptyContainer}>
//       <Heart size={50} color="#E0E0E0" weight="duotone" />
//       <Text style={styles.emptyTitle}>{t('account.saved.loginRequired', 'Login Required')}</Text>
//       <Text style={styles.emptySubtitle}>{t('account.saved.loginRequiredSubtitle', 'Please log in to view your saved properties')}</Text>
//       <SignUpAndSignInButtons />
//     </View>
//   );

//   if (!user) {
//     return (
//       <Screen style={styles.bg}>
//         {renderHeader()}
//         {renderNotLoggedIn()}
//       </Screen>
//     );
//   }

//   return (
//     <Screen style={styles.bg}>
//       {renderHeader()}
//       {savedProperties.isLoading ? (
//         <FlatList
//           data={[1, 2]}
//           renderItem={() => <PropertySkeletonCard />}
//           keyExtractor={(_, i) => `skeleton-${i}`}
//           contentContainerStyle={styles.flatListContent}
//         />
//       ) : savedProperties.data && savedProperties.data.length ? (
//         <FlatList
//           data={savedProperties.data}
//           renderItem={({ item }) => (
//             <SavedCard
//               item={item}
//               onRemove={handleRemove}
//               onPress={onPropertyPress}
//               t={t}
//             />
//           )}
//           keyExtractor={(item) => `property-${item.ID || item.id}`}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor="#FF385C"
//               colors={["#FF385C"]}
//             />
//           }
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.flatListContent}
//           ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//         />
//       ) : (
//         <View style={styles.emptyContainer}>{renderEmptyState()}</View>
//       )}

//       {showToast && (
//         <Toast
//           message={toastMessage}
//           type={toastType}
//           duration={2400}
//           onHide={() => setShowToast(false)}
//         />
//       )}
//     </Screen>
//   );
// };

// const styles = StyleSheet.create({
//   bg: {
//     flex: 1,
//     backgroundColor: "#FFF",
//   },
//   headerSafe: {
//     backgroundColor: "#FFF",
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: "#E5E5E5",
//   },
//   headerBar: {
//     alignItems: "center",
//     justifyContent: "center",
//     height: 48,
//   },
//   headerTitle: {
//     fontSize: 19,
//     fontWeight: "700",
//     color: "#222",
//     letterSpacing: 0.15,
//   },
//   flatListContent: {
//     paddingTop: 10,
//     paddingHorizontal: 12,
//     paddingBottom: 18,
//   },
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     overflow: "hidden",
//     flexDirection: "row",
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//     minHeight: 88,
//   },
//   image: {
//     width: 86,
//     height: 86,
//     borderRadius: 8,
//     backgroundColor: "#e7e7e7",
//   },
//   placeholderImg: {
//     alignItems: "center", justifyContent: "center",
//   },
//   heartBtn: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     backgroundColor: "#fff",
//     borderRadius: 15,
//     width: 28,
//     height: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     elevation: 3,
//     zIndex: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.13,
//     shadowRadius: 5,
//     shadowOffset: { width: 0, height: 1 },
//   },
//   cardDesc: {
//     flex: 1,
//     marginLeft: 10,
//     justifyContent: "center",
//     minHeight: 74,
//   },
//   price: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#222",
//   },
//   night: {
//     fontSize: 12,
//     color: "#717171",
//     fontWeight: "400",
//   },
//   title: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#262626",
//     marginVertical: 2,
//     lineHeight: 17,
//   },
//   inlineRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 2,
//   },
//   location: {
//     fontSize: 12,
//     color: "#888",
//     marginLeft: 3,
//     flex: 1,
//   },
//   statRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   statItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginRight: 10,
//     gap: 2,
//   },
//   statText: {
//     fontSize: 12,
//     color: "#777",
//     fontWeight: "500",
//     marginLeft: 2,
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 50,
//     paddingHorizontal: 24,
//   },
//   emptyTitle: {
//     fontSize: 17,
//     fontWeight: "700",
//     color: "#222",
//     marginTop: 12,
//     marginBottom: 5,
//     textAlign: "center",
//   },
//   emptySubtitle: {
//     fontSize: 13,
//     color: "#767676",
//     textAlign: "center",
//     lineHeight: 20,
//     marginBottom: 18,
//   },
//   skeletonCard: {
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     marginBottom: 10,
//     flexDirection: "row",
//     padding: 10,
//     alignItems: "center",
//     minHeight: 88,
//   },
//   skeletonImage: {
//     width: 76,
//     height: 76,
//     borderRadius: 8,
//     backgroundColor: "#eceaea",
//   },
//   skeletonTextLine: {
//     height: 15,
//     width: 84,
//     backgroundColor: "#eceaea",
//     borderRadius: 4,
//     marginLeft: 18,
//     marginBottom: 10,
//   },
//   skeletonTextSmall: {
//     height: 10,
//     width: 52,
//     backgroundColor: "#eceaea",
//     borderRadius: 4,
//     marginLeft: 18,
//   },
// });

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bed, Bathtub, MapPin, Heart, Ruler } from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { SignUpAndSignInButtons } from "../components/SignUpAndSignInButtons";
import { useUser } from "../hooks/useUser";
import { useSavedPropertiesQuery } from "../hooks/queries/useSavedPropertiesQuery";
import { useSavedPropertySalesQuery } from "../hooks/queries/useSavedPropertySalesQuery";
import { useSavedLandmarksQuery } from "../hooks/queries/useSavedLandmarksQuery";
import { useRemoveFromWishlistMutation } from "../hooks/mutations/useWishlistMutations";
import { useRemovePropertySaleFromWishlistMutation } from "../hooks/mutations/usePropertySaleWishlistMutations";
import { useRemoveLandmarkFromWishlistMutation } from "../hooks/mutations/useLandmarkWishlistMutations";
import Toast from "../components/CustomToast";
import { useMemo } from "react";
import { getLandmarkPrimaryImageUrl } from "../utils/landmarkMedia";
import { useLanguage } from "../contexts/LanguageContext";
import { warmPropertySaleDetailNavigation } from "../services/propertySaleFetch";

// Minimal skeleton card
const PropertySkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineSmall} />
    </View>
  </View>
);

const SavedCard = ({
  item,
  onRemove,
  onPress,
  t,
  type = "rent",
}: {
  item: any;
  onRemove: (id: number) => void;
  onPress: (id: number) => void;
  t: (key: string, fallback?: string) => string;
  type?: "rent" | "sale" | "landmark";
}) => {
  const isPropertySale = type === "sale";
  const isLandmark = type === "landmark";

  let propertyImages: string[] = [];
  if (isLandmark) {
    const primary = getLandmarkPrimaryImageUrl(item);
    if (primary) propertyImages = [primary];
    else {
      try {
        const raw = item.images ?? item.Images;
        propertyImages = Array.isArray(raw)
          ? raw.filter(Boolean)
          : typeof raw === "string"
            ? JSON.parse(raw)
            : [];
      } catch {
        propertyImages = [];
      }
    }
  } else {
    try {
      propertyImages =
        item.images ||
        (typeof item.Images === "string"
          ? JSON.parse(item.Images)
          : Array.isArray(item.Images)
            ? item.Images
            : []);
    } catch {
      propertyImages = [];
    }
  }

  const propertyId = item.ID || item.id;
  const title =
    item.title || item.Title || t("property.details.titlePlaceholder");
  const city =
    item.city ||
    item.City ||
    item.city_name ||
    item.region ||
    "";
  const state = item.state || item.State || item.zone_name || "";
  const price = isLandmark
    ? item.price ?? item.listing_price ?? 0
    : isPropertySale
      ? item.listing_price || item.listingPrice || 0
      : item.nightlyPrice || item.NightlyPrice || 0;
  const bedrooms = item.bedrooms || item.Bedrooms || 0;
  const bathrooms = item.bathrooms || item.Bathrooms || 0;
  const beds = item.beds || item.Beds || 0;
  const area = item.area ?? item.surface_area ?? 0;
  const areaUnit = item.area_unit || t("common.areaUnitM2", "m²");
  const locationText = state ? `${city}, ${state}` : city;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(propertyId)}
    >
      <View style={styles.imageContainer}>
        {propertyImages[0] ? (
          <Image source={{ uri: propertyImages[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImg]} />
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onRemove(propertyId)}
          activeOpacity={0.8}
        >
          <Heart size={16} color="#FF385C" weight="fill" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={11} color="#6B7280" weight="fill" />
          <Text style={styles.location} numberOfLines={1}>
            {locationText || t("property.details.locationPlaceholder")}
          </Text>
        </View>

        <View style={styles.statsRow}>
          {isLandmark && area > 0 ? (
            <View style={styles.stat}>
              <Ruler size={12} color="#9CA3AF" weight="fill" />
              <Text style={styles.statText}>
                {area} {areaUnit}
              </Text>
            </View>
          ) : null}
          {!isLandmark && bedrooms > 0 && (
            <View style={styles.stat}>
              <Bed size={12} color="#9CA3AF" weight="fill" />
              <Text style={styles.statText}>{bedrooms}</Text>
            </View>
          )}
          {!isLandmark && bathrooms > 0 && (
            <View style={styles.stat}>
              <Bathtub size={12} color="#9CA3AF" weight="fill" />
              <Text style={styles.statText}>{bathrooms}</Text>
            </View>
          )}
          {!isLandmark && beds > 0 && !bedrooms && (
            <View style={styles.stat}>
              <Bed size={12} color="#9CA3AF" weight="fill" />
              <Text style={styles.statText}>{beds}</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>
          {price} MRU
          {!isPropertySale && !isLandmark && (
            <Text style={styles.priceLabel}>{t("common.night", "/night")}</Text>
          )}
        </Text>
        {isLandmark ? (
          <Text style={styles.typePill}>
            {t("account.saved.landType", "Land")}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const SavedScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const { user, setSavedProperties } = useUser();
  const navigation = useNavigation();
  const savedProperties = useSavedPropertiesQuery();
  const savedPropertySales = useSavedPropertySalesQuery();
  const savedLandmarks = useSavedLandmarksQuery();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const removePropertySaleFromWishlist =
    useRemovePropertySaleFromWishlistMutation();
  const removeLandmarkFromWishlist = useRemoveLandmarkFromWishlistMutation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const langParam = (currentLanguage ?? "en").toLowerCase();

  const allSavedItems = useMemo(() => {
    const rentals = (savedProperties.data || []).map((item) => ({
      ...item,
      _type: "rent" as const,
    }));
    const sales = (savedPropertySales.data || []).map((item) => ({
      ...item,
      _type: "sale" as const,
    }));
    const landmarks = (savedLandmarks.data || []).map((item) => ({
      ...item,
      _type: "landmark" as const,
    }));
    return [...rentals, ...sales, ...landmarks];
  }, [savedProperties.data, savedPropertySales.data, savedLandmarks.data]);

  const isLoading =
    savedProperties.isLoading ||
    savedPropertySales.isLoading ||
    savedLandmarks.isLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      savedProperties.refetch?.(),
      savedPropertySales.refetch?.(),
      savedLandmarks.refetch?.(),
    ]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      savedProperties.refetch?.();
      savedPropertySales.refetch?.();
      savedLandmarks.refetch?.();
    }, [savedProperties, savedPropertySales, savedLandmarks]),
  );

  const handleRemove = async (
    propertyId: number,
    type: "rent" | "sale" | "landmark",
  ) => {
    try {
      if (type === "sale") {
        await removePropertySaleFromWishlist.mutateAsync(propertyId);
      } else if (type === "landmark") {
        await removeLandmarkFromWishlist.mutateAsync(propertyId);
      } else {
        await removeFromWishlist.mutateAsync(propertyId);
        if (user?.savedProperties?.includes(propertyId)) {
          setSavedProperties(
            user.savedProperties.filter((id) => id !== propertyId),
          );
        }
      }
      setToastMessage(
        t("account.saved.removed", "Property removed from wishlist"),
      );
      setToastType("success");
      setShowToast(true);
    } catch {
      setToastMessage(
        t("account.saved.failedRemove", "Failed to remove from wishlist"),
      );
      setToastType("error");
      setShowToast(true);
    }
  };

  const onPropertyPress = (
    propertyID: number,
    type: "rent" | "sale" | "landmark",
    item?: any,
  ) => {
    if (type === "sale") {
      warmPropertySaleDetailNavigation(
        queryClient,
        propertyID,
        langParam,
        item,
      );
      navigation.navigate("PropertySaleDetails", { propertyId: propertyID });
    } else if (type === "landmark") {
      (navigation as any).navigate("LandmarkDetails", {
        landmarkId: propertyID,
        landmark: item,
      });
    } else {
      navigation.navigate("PropertyDetails", { propertyID });
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {t("account.saved.title", "Wishlist")}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Heart size={64} color="#D1D5DB" weight="duotone" />
      <Text style={styles.emptyTitle}>
        {t("account.saved.noProperties", "No saved properties")}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t(
          "account.saved.noPropertiesSubtitle",
          "Properties you save will appear here",
        )}
      </Text>
    </View>
  );

  const renderNotLoggedIn = () => (
    <View style={styles.emptyContainer}>
      <Heart size={64} color="#D1D5DB" weight="duotone" />
      <Text style={styles.emptyTitle}>
        {t("account.saved.loginRequired", "Login Required")}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t(
          "account.saved.loginRequiredSubtitle",
          "Please log in to view your saved properties",
        )}
      </Text>
      <View style={styles.loginButtonContainer}>
        <SignUpAndSignInButtons />
      </View>
    </View>
  );

  if (!user) {
    return (
      <Screen style={styles.container}>
        {renderHeader()}
        {renderNotLoggedIn()}
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          marginTop: "15%",
        }}
      >
        {renderHeader()}
        {isLoading ? (
          <FlatList
            key="skeleton-list"
            data={[1, 2, 3]}
            renderItem={() => <PropertySkeletonCard />}
            keyExtractor={(_, i) => `skeleton-${i}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
        ) : allSavedItems && allSavedItems.length > 0 ? (
          <FlatList
            key="properties-list"
            data={allSavedItems}
            renderItem={({ item }) => (
              <SavedCard
                item={item}
                onRemove={(id) => handleRemove(id, item._type)}
                onPress={(id) => onPropertyPress(id, item._type, item)}
                t={t}
                type={item._type}
              />
            )}
            keyExtractor={(item) => `${item._type}-${item.ID || item.id}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF385C"
                colors={["#FF385C"]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
        ) : (
          renderEmptyState()
        )}

        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            duration={2400}
            onHide={() => setShowToast(false)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    width: "48.5%",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
  },
  placeholderImg: {
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  location: {
    fontSize: 11,
    color: "#717171",
    marginLeft: 3,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  statText: {
    fontSize: 11,
    color: "#717171",
    marginLeft: 3,
    fontWeight: "500",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: "#717171",
  },
  typePill: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20,
  },
  loginButtonContainer: {
    marginTop: 24,
    width: "100%",
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    width: "48.5%",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  skeletonImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F5F5F5",
  },
  skeletonContent: {
    padding: 10,
  },
  skeletonLine: {
    height: 12,
    width: "80%",
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLineSmall: {
    height: 10,
    width: "50%",
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  bgImage: {
    width: 234,
    height: 304,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
