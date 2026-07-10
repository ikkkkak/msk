import {
  Pressable,
  ViewStyle,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
  Text,
  Image,
  ScrollView,
  Animated
} from "react-native";
import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Property } from "../types/property";
// Local inline carousel (no external component)
import { CardInformation } from "./CardInformation";
import { LISTMARGIN, queryKeys } from "../constants";
import { theme } from "../theme";
import { endpoints } from "../constants";
import { useLoading } from "../hooks/useLoading";
import { useDeletePropertyMutation } from "../hooks/mutations/useDeletePropertyMutation";
import { CollectionModal } from "./CollectionModal";
import { useRemovePropertyFromAllCollectionsMutation } from "../hooks/mutations/useCollectionMutations";
import { useUser } from "../hooks/useUser";

export const Card = ({
  property,
  onPress,
  myProperty,
  style
}: {
  property?: Property;
  onPress?: () => void;
  myProperty?: boolean;
  style?: ViewStyle;
}) => {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isLiked, setIsLiked] = useState(property?.liked || false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  const deleteProperty = useDeletePropertyMutation();
  const removeFromAllCollections =
    useRemovePropertyFromAllCollectionsMutation();
  const { user, setSavedProperties } = useUser();

  // Keep local liked state in sync with global savedProperties
  useEffect(() => {
    if (!property) return;
    const likedNow = !!user?.savedProperties?.includes(property.ID);
    if (likedNow !== isLiked) setIsLiked(likedNow);
  }, [user?.savedProperties, property?.ID]);

  const handleEditProperty = () => {
    if (property) {
      navigation.navigate("EditProperty", { propertyID: property.ID });
      closeModal();
    }
  };

  const handleDeleteProperty = () => {
    if (property) {
      deleteProperty.mutate({ propertyID: property.ID });
      closeModal();
    }
  };

  const toggleLike = () => {
    if (!myProperty) {
      if (isLiked) {
        // If already liked, remove from wishlist
        handleRemoveFromWishlist();
      } else {
        // If not liked, show collection modal to add to collection
        setShowCollectionModal(true);
      }
    } else {
      // For owner properties, just toggle like state
      setIsLiked(!isLiked);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!property) return;

    try {
      await removeFromAllCollections.mutateAsync(property.ID);

      // Update user's saved properties in frontend state
      if (user && user.savedProperties?.includes(property.ID)) {
        const newSavedProperties = user.savedProperties.filter(
          (id) => id !== property.ID
        );
        setSavedProperties(newSavedProperties);
      }

      setIsLiked(false);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      // Still update the UI state even if API call fails
      setIsLiked(false);
    }
  };

  const formatPrice = (price: number, currency: string = "MRU") => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case "entire_place":
        return "Logement entier";
      case "private_room":
        return "Chambre privée";
      case "shared_room":
        return "Chambre partagée";
      default:
        return type;
    }
  };

  const getHostName = () => {
    if (property?.host?.firstName || property?.host?.lastName) {
      return `${property.host.firstName || ""} ${
        property.host.lastName || ""
      }`.trim();
    }
    return "Hôte";
  };

  const getImages = () => {
    if (!property?.images) return [];
    if (Array.isArray(property.images)) {
      // Normalize to array of URLs (handle objects with url field)
      return property.images
        .map((it: any) => (typeof it === "string" ? it : it?.url))
        .filter(Boolean);
    }
    if (typeof property.images === "string") {
      try {
        return JSON.parse(property.images);
      } catch {
        return [];
      }
    }
    return [];
  };

  if (!property || !property.ID) {
    console.warn("⚠️ Card: Invalid property data", property);
    return null;
  }

  // Ensure this is a Property, not a PropertySale
  if ('listing_price' in property || 'propertySaleID' in property) {
    console.error("❌ Card: PropertySale data passed to Card component! Use PropertySaleCard instead.");
    return null;
  }

  // Local carousel state
  const images = getImages();
  const width = 340;
  const height = 140;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useState(new Animated.Value(0))[0];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(x / width));
  };

  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      {/* Image Section */}
      <View style={[styles.imageContainer, { width, height }]}>
        {/* Inline local carousel */}
        {images && images.length > 0 ? (
          <>
            <Animated.ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={onMomentumEnd}
              scrollEventThrottle={16}
              style={{ width, height }}
              snapToInterval={width}
              decelerationRate="fast"
              removeClippedSubviews={false}
            >
              {images.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={{ width, height }}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.9}
                    onPress={onPress}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width,
                        height,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.ScrollView>
            {/* Dots */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, i) => {
                  const inputRange = [
                    (i - 1) * width,
                    i * width,
                    (i + 1) * width
                  ];
                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: "clamp"
                  });
                  const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [6, 18, 6],
                    extrapolate: "clamp"
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[styles.dot, { width: dotWidth, opacity }]}
                    />
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View
            style={{
              width,
              height,
              backgroundColor: "#EFEFEF",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12
            }}
          />
        )}

        {/* Like Button */}
        <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
          <MaterialCommunityIcons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF385C" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Property Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {getPropertyTypeText(property.propertyType)}
          </Text>
        </View>

        {/* My Property Menu */}
        {myProperty && (
          <TouchableOpacity onPress={openModal} style={styles.menuButton}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              color="#FFFFFF"
              size={24}
            />
          </TouchableOpacity>
        )}

        {/* Host avatar overlay bottom-right */}
        {property.host?.avatarURL ? (
          <Image
            source={{ uri: property.host.avatarURL }}
            style={styles.overlayHostAvatar}
          />
        ) : null}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Title + Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title || "Untitled Property"}
          </Text>
          {property.rating != null && property.rating > 0 ? (
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={14} color="#222222" />
              <Text style={styles.rating}>{property.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Meta */}
        <Text style={styles.meta} numberOfLines={1}>
          {[property.city, property.state].filter(Boolean).join(", ") || "Location"}
          {property.bedrooms != null && ` • ${property.bedrooms} bd`}
          {property.beds != null && ` • ${property.beds} beds`}
          {property.bathrooms != null && ` • ${property.bathrooms} bath`}
        </Text>

        {/* Price */}
        {property.nightlyPrice != null && property.nightlyPrice > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(property.nightlyPrice, property.currency || "MRU")}
            </Text>
            <Text style={styles.priceUnit}> per night</Text>
          </View>
        )}
      </View>

      {/* Modal for My Properties */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Button
              status="info"
              appearance="ghost"
              onPress={handleEditProperty}
              style={styles.modalButton}
            >
              Modifier la propriété
            </Button>
            <Button
              status="danger"
              appearance="ghost"
              onPress={handleDeleteProperty}
              style={styles.modalButton}
            >
              Supprimer la propriété
            </Button>
            <Button
              appearance="ghost"
              onPress={closeModal}
              style={styles.modalButton}
            >
              Annuler
            </Button>
          </View>
        </View>
      </Modal>

      {/* Collection Modal */}
      <CollectionModal
        visible={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        propertyID={property.ID}
        onSuccess={() => {
          // Ensure immediate UI feedback
          setIsLiked(true);
        }}
      />

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVerificationModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Large Verification Badge */}
              <View style={styles.largeVerifiedBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.largeVerifiedText}>Verified Host</Text>
              </View>

              {/* Explanation */}
              <Text style={styles.verificationTitle}>Identity Verified</Text>
              <Text style={styles.verificationDescription}>
                This host has completed our identity verification process.
                They've provided government-issued ID and confirmed their
                identity, giving you extra confidence in your booking.
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text style={styles.closeButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: LISTMARGIN,
    marginVertical: 8,
    borderRadius: 12,
    width: 340,
    marginBottom: 106,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0"
  },
  imageContainer: {
    position: "relative"
  },
  likeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  },
  typeBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  },
  menuButton: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1
  },
  contentContainer: {
    padding: 16
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  location: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500",
    flex: 1
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  rating: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600"
  },
  title: {
    fontSize: 13,
    color: "#222222",
    fontWeight: "600",
    lineHeight: 22
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  meta: {
    fontSize: 11,
    color: "#717171",
    marginBottom: 8
  },
  hostRow: {
    marginBottom: 8
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  hostAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  overlayHostAvatar: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFF"
  },
  hostName: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500"
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A699",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2
  },
  verifiedText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600"
  },
  // Verification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "50%"
  },
  modalContent: {
    alignItems: "center"
  },
  largeVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A699",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 24
  },
  largeVerifiedText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700"
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
    textAlign: "center"
  },
  verificationDescription: {
    fontSize: 16,
    color: "#717171",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10
  },
  closeButton: {
    backgroundColor: "#222222",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120
  },
  closeButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center"
  },
  detailsRow: {},
  details: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline"
  },
  price: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "700"
  },
  priceUnit: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 4
  },
  modalButton: {
    marginVertical: 4
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  dot: {
    height: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    marginHorizontal: 3
  }
});
