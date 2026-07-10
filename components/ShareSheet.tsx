import * as React from "react";
import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  Share,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  X,
  Share as ShareIcon,
  Heart,
  MapPin,
  Bed,
  Bathtub,
  Square,
  Star,
  Calendar,
  User,
  Phone,
  Globe,
  Download,
  Copy,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { captureRef } from "react-native-view-shot";
import { theme } from "../theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const templateWidth = screenWidth * 0.85; // 85% of screen width for smaller card
const templateHeight = screenHeight * 0.6; // 60% of screen height

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  property: any;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  onClose,
  property,
}) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRef = useRef<View>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get the actual price from various possible field names
  const getPropertyPrice = () => {
    const price =
      property.nightly_price ||
      property.nightlyPrice ||
      property.NightlyPrice ||
      property.price ||
      property.Price ||
      property.nightly_rate ||
      property.NightlyRate ||
      0;

    return price;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (!property) return;

    try {
      setIsGenerating(true);
      console.log("ShareSheet: Starting share process...");

      // Capture the template as an image in high quality
      console.log("ShareSheet: Capturing template...");
      const uri = await captureRef(templateRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      console.log("ShareSheet: Template captured successfully:", uri);

      // Share the image
      console.log("ShareSheet: Starting share...");
      await Share.share({
        url: uri,
        title: `${property.title || property.name} - ${t("search.property")}`,
      });

      console.log("ShareSheet: Share completed successfully");
    } catch (error) {
      console.error("ShareSheet: Error sharing:", error);
      Alert.alert(t("common.error"), t("common.shareError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!property) return;

    try {
      setIsGenerating(true);
      console.log("ShareSheet: Starting download process...");

      const uri = await captureRef(templateRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      console.log("ShareSheet: Template captured for download:", uri);

      // For now, we'll share it as a download
      await Share.share({
        url: uri,
        title: `${property.title || property.name} - Download`,
      });

      console.log("ShareSheet: Download completed successfully");
    } catch (error) {
      console.error("ShareSheet: Error downloading:", error);
      Alert.alert(t("common.error"), t("common.downloadError"));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!property) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("common.share")}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Property Template */}
          <View
            ref={templateRef}
            style={[
              styles.template,
              { width: templateWidth, maxHeight: templateHeight },
            ]}
          >
            {/* Header with App Logo and Price */}
            <View style={styles.templateHeader}>
              <View style={styles.appLogo}>
                <Text style={styles.appName}>Meskeny</Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.headerPrice}>
                  <Text style={styles.headerPriceText}>
                    {getPropertyPrice() > 0
                      ? `${formatPrice(getPropertyPrice())} MRU`
                      : t("common.priceOnRequest")}
                  </Text>
                  <Text style={styles.headerPriceSubtext}>
                    / {t("common.night")}
                  </Text>
                </View>
                <View style={styles.shareDate}>
                  <Calendar size={14} color="#666666" weight="regular" />
                  <Text style={styles.dateText}>{formatDate()}</Text>
                </View>
              </View>
            </View>

            {/* Property Image */}
            <View style={[styles.imageContainer, { height: 200 }]}>
              {property.images && property.images.length > 0 ? (
                <Image
                  source={{ uri: property.images[0] }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="home" size={48} color="#DDDDDD" />
                </View>
              )}

              {/* Property Type Badge */}
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {property.property_type === "entire_place"
                    ? t("propertyTypes.entirePlace")
                    : property.property_type === "private_room"
                      ? t("propertyTypes.privateRoom")
                      : property.property_type || t("search.property")}
                </Text>
              </View>

              {/* Price Badge */}
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {getPropertyPrice() > 0
                    ? `${formatPrice(getPropertyPrice())} MRU`
                    : t("common.priceOnRequest")}
                </Text>
                <Text style={styles.perNight}>/ {t("common.night")}</Text>
              </View>
            </View>

            {/* Property Details */}
            <View style={styles.detailsContainer}>
              {/* Title */}
              <Text style={styles.propertyTitle} numberOfLines={2}>
                {property.title || property.name || t("search.property")}
              </Text>

              {/* Location */}
              <View style={styles.locationRow}>
                <MapPin size={18} color="#666666" weight="regular" />
                <Text style={styles.locationText}>
                  {property.city || property.location || "Mauritania"}
                </Text>
              </View>

              {/* Property Features */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Bed size={20} color="#666666" weight="regular" />
                  <Text style={styles.featureText}>
                    {property.bedrooms || property.beds || "?"}{" "}
                    {t("search.filters.bedrooms")}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Bathtub size={20} color="#666666" weight="regular" />
                  <Text style={styles.featureText}>
                    {property.bathrooms || "?"} {t("search.filters.bathrooms")}
                  </Text>
                </View>
                {property.area && (
                  <View style={styles.featureItem}>
                    <Square size={20} color="#666666" weight="regular" />
                    <Text style={styles.featureText}>{property.area} m²</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {property.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {property.description}
                  </Text>
                </View>
              )}

              {/* Contact Info */}
              <View style={styles.contactContainer}>
                {property.host_phone && (
                  <View style={styles.contactItem}>
                    <Phone size={18} color="#666666" weight="regular" />
                    <Text style={styles.contactText}>
                      {property.host_phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
              disabled={isGenerating}
            >
              <ShareIcon size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.actionButtonText}>
                {isGenerating ? t("common.generating") : t("common.share")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton]}
              onPress={handleDownload}
              disabled={isGenerating}
            >
              <Download size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.actionButtonText}>
                {isGenerating ? t("common.generating") : t("common.download")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  template: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: "center",
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerPrice: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  headerPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121212",
  },
  headerPriceSubtext: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  appLogo: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  shareDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 6,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  priceBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  perNight: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 2,
  },
  detailsContainer: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: "#666666",
  },
  featuresContainer: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  contactContainer: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  templateFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  footerLogo: {
    flex: 1,
  },
  footerAppName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  footerTagline: {
    fontSize: 12,
    color: "#666666",
  },
  footerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 5,
  },
  shareButton: {
    backgroundColor: theme["color-temporary-primary"],
  },
  downloadButton: {
    backgroundColor: "#222222",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ShareSheet;
