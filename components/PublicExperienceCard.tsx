import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { Experience } from "../types/experience";
import { useUser } from "../hooks/useUser";
import { useRemoveExperienceFromAllCollectionsMutation } from "../hooks/mutations/useExperienceCollectionMutations";
import { useUserExperienceCollectionsQuery } from "../hooks/queries/useExperienceCollectionQueries";
import { ExperienceCollectionModal } from "./ExperienceCollectionModal";

const { width } = Dimensions.get("window");
const cardWidth = (width - 30) / 2; // Perfect 2-column grid with 20px padding on each side + 20px gap

interface PublicExperienceCardProps {
  experience: Experience;
  isFirst?: boolean;
  isLast?: boolean;
}

export const PublicExperienceCard: React.FC<PublicExperienceCardProps> = ({
  experience,
  isFirst,
  isLast
}) => {
  const navigation = useNavigation();
  const [isLiked, setIsLiked] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const videoRef = useRef<Video>(null);
  const { user, setSavedExperiences } = useUser();
  const removeFromAllCollections =
    useRemoveExperienceFromAllCollectionsMutation();

  // Preload collections to improve modal performance
  useUserExperienceCollectionsQuery();

  useEffect(() => {
    if (!experience) return;
    const likedNow = !!user?.savedExperiences?.includes(
      experience.ID || experience.id || 0
    );
    if (likedNow !== isLiked) setIsLiked(likedNow);
  }, [user?.savedExperiences, experience?.ID, experience?.id]);

  const handlePress = () => {
    (navigation as any).navigate("ExperienceDetails", {
      experienceId: experience.ID || experience.id
    });
  };

  const handleLike = () => {
    if (isLiked) {
      handleRemoveFromWishlist();
    } else {
      setShowCollectionModal(true);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!experience) return;

    try {
      await removeFromAllCollections.mutateAsync({
        experienceID: experience.ID || experience.id || 0
      });

      if (
        user &&
        user.savedExperiences?.includes(experience.ID || experience.id || 0)
      ) {
        const newSavedExperiences = user.savedExperiences.filter(
          (id) => id !== (experience.ID || experience.id || 0)
        );
        setSavedExperiences(newSavedExperiences);
      }

      setIsLiked(false);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setIsLiked(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MR", {
      style: "currency",
      currency: "MRU",
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "60min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case "light":
        return "#00A699";
      case "moderate":
        return "#FFB400";
      case "extreme":
        return "#FF5A5F";
      case "strenuous":
        return "#C13584";
      default:
        return "#717171";
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "live":
        return { color: "#00A699", text: "Disponible", show: true };
      case "approved":
        return { color: "#00A699", text: "Approuvé", show: true };
      case "pending":
        return { color: "#FFB400", text: "En attente", show: false };
      case "rejected":
        return { color: "#FF5A5F", text: "Rejeté", show: false };
      case "draft":
        return { color: "#717171", text: "Brouillon", show: false };
      default:
        return { color: "#717171", text: status, show: false };
    }
  };

  const getActivityLevelText = (level: string) => {
    switch (level) {
      case "light":
        return "Léger";
      case "moderate":
        return "Modéré";
      case "extreme":
        return "Extrême";
      case "strenuous":
        return "Intense";
      default:
        return level;
    }
  };

  // Parse photos from JSON string or array
  const getPhotos = () => {
    // Handle both Photos and photos fields
    const photosData = experience.Photos || experience.photos;

    if (photosData && Array.isArray(photosData)) {
      return photosData;
    }
    if (photosData && typeof photosData === "string") {
      try {
        return JSON.parse(photosData);
      } catch {
        return [];
      }
    }
    return [];
  };

  const photos = getPhotos();
  const mainPhoto = photos[0];

  return (
    <TouchableOpacity
      style={[
        styles.experienceCard,
        isFirst && styles.firstCard,
        isLast && styles.lastCard
      ]}
      onPress={handlePress}
    >
      {/* Media Section - Split Layout */}
      <View style={styles.mediaContainer}>
        {/* Left Side - Images */}
        <View style={styles.imagesContainer}>
          {photos.length > 0 ? (
            <>
              {/* Top Image */}
              <View style={styles.topImageContainer}>
                <Image
                  source={{ uri: photos[0].url }}
                  style={styles.topImage}
                  resizeMode="cover"
                />
              </View>
              {/* Bottom Image (if available) */}
              {photos.length > 1 && (
                <View style={styles.bottomImageContainer}>
                  <Image
                    source={{ uri: photos[1].url }}
                    style={styles.bottomImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="explore" size={40} color="#E0E0E0" />
            </View>
          )}
        </View>

        {/* Right Side - Video */}
        <View style={styles.videoContainer}>
          {experience.VideoURL || (experience as any).videoURL ? (
            <Video
              ref={videoRef}
              source={{
                uri: experience.VideoURL || (experience as any).videoURL
              }}
              style={styles.videoPlayer}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              useNativeControls={false}
              onError={(error) => {
                console.log("Video Error:", error);
              }}
              onLoad={() => {
                console.log("Video Loaded Successfully");
              }}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <MaterialIcons name="videocam" size={40} color="#FFFFFF" />
              <Text style={styles.videoPlaceholderText}>No Video</Text>
            </View>
          )}
        </View>
      </View>

      {/* Overlay Elements */}
      <View style={styles.overlayContainer}>
        {/* Activity Level Badge */}
        {/* <View style={[
          styles.activityBadge, 
          { backgroundColor: getActivityLevelColor(experience.ActivityLevel || experience.activityLevel || 'light') }
        ]}>
          <Text style={styles.activityBadgeText}>
            {getActivityLevelText(experience.ActivityLevel || experience.activityLevel || 'light')}
          </Text>
        </View> */}

        {/* Status Badge - Only show for live/approved experiences */}
        {/* {getStatusInfo(experience.Status || experience.status || 'draft').show && (
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusInfo(experience.Status || experience.status || 'draft').color }
          ]}>
            <Text style={styles.statusBadgeText}>
              {getStatusInfo(experience.Status || experience.status || 'draft').text}
            </Text>
          </View>
        )} */}

        {/* Heart Button */}
        {/* <TouchableOpacity 
          style={styles.heartButton}
          onPress={handleLike}
        >
          <MaterialIcons 
            name={isLiked ? "favorite" : "favorite-border"} 
            size={20} 
            color={isLiked ? "#FF385C" : "#FFFFFF"} 
          />
        </TouchableOpacity> */}

        {/* Price Overlay */}
        {/* <View style={styles.priceOverlay}>
          <Text style={styles.priceText}>
            {formatPrice(experience.PricePerPerson || experience.pricePerPerson || 0)}
          </Text>
          <Text style={styles.priceUnit}>par personne</Text>
        </View> */}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Title and Location */}
        <Text style={styles.experienceTitle} numberOfLines={2}>
          {experience.Title || experience.title}
        </Text>

        <Text style={styles.locationText}>
          {experience.City || experience.city} •{" "}
          {experience.Language || experience.language}
        </Text>
        <Text
          style={[
            styles.locationText,
            {
              marginBottom: 8
            }
          ]}
        >
          {experience.pricePerPerson} MRU / person
        </Text>

        {/* Host Info */}
        <View style={styles.hostInfo}>
          <View style={styles.hostAvatar}>
            {experience.Host?.AvatarURL || experience.host?.avatarURL ? (
              <Image
                source={{
                  uri: experience.Host?.AvatarURL || experience.host?.avatarURL
                }}
                style={styles.hostAvatarImage}
              />
            ) : (
              <MaterialIcons name="person" size={16} color="#717171" />
            )}
          </View>
          <Text style={styles.hostName}>
            {experience.Host?.FirstName || experience.host?.firstName || "Hôte"}{" "}
            {experience.Host?.LastName || experience.host?.lastName || ""}
          </Text>
          {(experience.Host?.IdentityVerified ||
            experience.host?.isVerified) && (
            <MaterialIcons name="verified" size={16} color="#00A699" />
          )}
        </View>

        {/* Experience Details */}
        {/* <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#717171" />
            <Text style={styles.detailText}>
              {formatDuration(experience.Duration || experience.duration || 60)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialIcons name="group" size={16} color="#717171" />
            <Text style={styles.detailText}>
              Jusqu'à {experience.GroupSize || experience.groupSize} personnes
            </Text>
          </View>
        </View> */}

        {/* Focus and Difficulty */}
        {/* <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{experience.Focus || experience.focus}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {experience.DifficultyLevel || experience.difficultyLevel}
            </Text>
          </View>
        </View> */}
      </View>

      <ExperienceCollectionModal
        visible={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        experienceID={experience.ID || experience.id || 0}
        onSuccess={() => setIsLiked(true)}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  experienceCard: {
    width: cardWidth,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  firstCard: {
    marginLeft: 0
  },
  lastCard: {
    marginRight: 0
  },
  mediaContainer: {
    flexDirection: "row",
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden"
  },
  imagesContainer: {
    flex: 1,
    flexDirection: "column",
    height: "100%"
  },
  topImageContainer: {
    height: "50%", // Slightly less than half to account for gap
    marginBottom: 4,
    backgroundColor: "#E0E0E0" // Temporary background to see if container is visible
  },
  topImage: {
    width: "100%",
    height: "100%"
  },
  bottomImageContainer: {
    height: "50%", // Slightly less than half to account for gap
    marginTop: 0,
    backgroundColor: "#F0F0F0" // Temporary background to see if container is visible
  },
  bottomImage: {
    width: "100%",
    height: "100%"
  },
  videoContainer: {
    flex: 1,
    height: "100%",
    marginLeft: 4,
    position: "relative",
    backgroundColor: "#000000" // Add background to see if container is visible
  },
  videoPlayer: {
    width: "100%",
    height: "100%"
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center"
  },
  videoPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 8
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 1
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  activityBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  activityBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600"
  },
  heartButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F5F5F5"
  },
  priceOverlay: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  priceUnit: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.9
  },
  contentContainer: {
    // padding: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 4
  },

  experienceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
    lineHeight: 18,
    letterSpacing: -0.1
  },
  locationText: {
    fontSize: 12,
    color: "#717171",
    // marginBottom: 8,
    fontWeight: "400"
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 6
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)"
  },
  hostAvatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10
  },
  hostName: {
    fontSize: 11,
    color: "#717171",
    fontWeight: "500",
    flex: 1
  },
  detailsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  detailText: {
    fontSize: 15,
    color: "#717171",
    fontWeight: "600"
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  tag: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)"
  },
  tagText: {
    fontSize: 13,
    color: "#717171",
    fontWeight: "600",
    textTransform: "capitalize"
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  ratingText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "700"
  },
  ratingCount: {
    fontSize: 15,
    color: "#717171",
    fontWeight: "500"
  }
});
