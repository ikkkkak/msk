import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { Text } from "@ui-kitten/components";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useListingWishlist } from "../hooks/useListingWishlist";

import {
  extractLandmarkVideoUrl,
  getLandmarkPrimaryImageUrl,
} from "../utils/landmarkMedia";
import {
  getLandmarkHostContact,
} from "../utils/landmarkHostContact";
import {
  localizeLandType,
  localizeListingStatus,
} from "../utils/listingLabels";
import { theme } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");
const IMAGE_H = 224;

// ============================================================
// Design Tokens (Same as Zillow Card)
// ============================================================
const T = {
  white: "#FFFFFF",
  ink: "#1A1A1A",
  inkSoft: "#666666",
  inkMuted: "#999999",
  border: "#F0F0F0",
  brand: theme["color-temporary-primary"], // Chinese red
  green: "#10B981",
  redHeart: "#FF385C",
  glassDark: "rgba(0,0,0,0.65)",
};

// ============================================================
// Types
// ============================================================
export interface LandmarkCardData {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  surface_area?: number;
  area?: number;
  area_unit?: string;
  images?: string[];
  video_url?: string;
  zone_name?: string;
  land_type?: string;
  zoning?: string;
  description?: string;
  organization?: { name?: string };
  is_investment_opportunity?: boolean;
  is_good_deal?: boolean;
  is_gold?: boolean;
  is_verified?: boolean;
  plot_number?: string;
  plot_confirmed?: boolean;
  habitat_plot_id?: number;
  host?: { name?: string };
  host_name?: string;
  plot_ratio?: number;
  building_coverage?: number;
  ownership_years?: number;
  [key: string]: any;
}

interface LandmarkCardProps {
  landmark: LandmarkCardData;
  onPress: () => void;
  onFavorite?: () => void;
  onContact?: () => void;
}

// ============================================================
// Animated Heart
// ============================================================
const AnimHeart: React.FC<{
  isFav: boolean;
  onPress: () => void;
  loading?: boolean;
}> = ({ isFav, onPress, loading }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.78, { damping: 6 }),
      withSpring(1.25, { damping: 5 }),
      withSpring(1, { damping: 12 }),
    );
    onPress();
  };

  return (
    <TouchableOpacity
      style={heart.btn}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={1}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View
        style={useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }))}
      >
        <Ionicons
          name={isFav ? "heart" : "heart-outline"}
          size={24}
          color={isFav ? "#FF385C" : "#FFF"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const heart = StyleSheet.create({
  btn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

// ============================================================
// Badge
// ============================================================
const Badge: React.FC<{
  label: string;
  variant?: "gold" | "invest" | "good" | "verified";
}> = ({ label, variant }) => {
  const getStyle = () => {
    switch (variant) {
      case "gold":
        return { bg: "#FEF9C3", text: "#B45309" };
      case "invest":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "good":
        return { bg: "#D1FAE5", text: "#065F46" };
      case "verified":
        return { bg: "#DBEAFE", text: "#1D4ED8" };
      default:
        return { bg: T.glassDark, text: "#FFF" };
    }
  };

  const s = getStyle();

  return (
    <View style={[bd.pill, { backgroundColor: s.bg }]}>
      {variant === "gold" && (
        <MaterialIcons name="star" size={10} color="#D4AF37" />
      )}
      {variant === "verified" && (
        <MaterialIcons name="verified" size={10} color="#1D4ED8" />
      )}
      <Text style={[bd.text, { color: s.text }]}>{label}</Text>
    </View>
  );
};

const bd = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

// ============================================================
// Main Landmark Card (Zillow Style)
// ============================================================
export const LandmarkCard: React.FC<LandmarkCardProps> = ({
  landmark,
  onPress,
  onFavorite,
}) => {
  const { t } = useTranslation();
  const landmarkId = Number(landmark.id ?? landmark.ID ?? 0) || undefined;
  const landmarkWishlist = useListingWishlist("landmark", landmarkId, {
    initialSaved: Boolean(landmark.saved),
    showToast: true,
  });

  const images = useMemo(
    () => (landmark.images ?? []).filter(Boolean),
    [landmark.images],
  );
  const videoUrl = extractLandmarkVideoUrl(landmark as any);
  const primaryImage = getLandmarkPrimaryImageUrl(landmark as any);

  const area = landmark.surface_area ?? landmark.area;
  const areaUnit = landmark.area_unit || t("common.areaUnitM2", "m²");
  const price = landmark.price ?? 0;
  const pricePerUnit = area && price ? Math.round(price / area) : null;

  const landTypeRaw = landmark.land_type || landmark.zoning || "";
  const landType = landTypeRaw ? localizeLandType(landTypeRaw, t) : "";
  const listingStatus =
    landmark.status || landmark.listing_status || landmark.listingStatus || "";
  const zone = landmark.zone_name || "";

  const isGold = Boolean(landmark.is_gold);
  const isInvestment = Boolean(landmark.is_investment_opportunity);
  const isGoodDeal = Boolean(landmark.is_good_deal);
  const isVerified = Boolean(landmark.is_verified);
  const hasCadastreVerifiedPlot =
    Boolean(landmark.plot_confirmed) && Boolean(landmark.habitat_plot_id);
  const showPlotChip = hasCadastreVerifiedPlot && !!landmark.plot_number;
  const hostName =
    landmark.host?.name ||
    landmark.host_name ||
    landmark.organization?.name ||
    "";

  const badges = useMemo(() => {
    const list: any[] = [];
    if (isGold)
      list.push({ label: t("landmark.badges.gold", "Gold"), variant: "gold" });
    if (isInvestment)
      list.push({
        label: t("landmark.badges.investmentOpportunity", "Investment"),
        variant: "invest",
      });
    if (isGoodDeal)
      list.push({
        label: t("landmark.badges.goodDeal", "Good Deal"),
        variant: "good",
      });

    if (isVerified)
      list.push({
        label: t("landmark.badges.verified", "Verified"),
        variant: "verified",
      });
    if (listingStatus)
      list.push({
        label: localizeListingStatus(String(listingStatus), t),
        variant: "verified",
      });

    return list;
  }, [isGold, isInvestment, isGoodDeal, isVerified, listingStatus, t]);

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite();
      return;
    }
    void landmarkWishlist.toggle();
  };
  const handlePress = () => onPress();

  const handleContact = () => {
    const contact = getLandmarkHostContact(landmark);
    if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const handleWhatsApp = () => {
    const contact = getLandmarkHostContact(landmark);
    const num = contact.phone;
    if (num) Linking.openURL(`https://wa.me/${num.replace(/\D/g, "")}`);
  };

  const handleEmail = () => {
    const contact = getLandmarkHostContact(landmark);
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
  };

  return (
    <View style={s.card}>
      {/* Image Area */}
      <View style={s.imgBox}>
        {images.length > 0 ? (
          <Image
            source={{ uri: images[0] }}
            style={s.media}
            contentFit="cover"
            placeholder="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
          />
        ) : videoUrl ? (
          <Video
            source={{ uri: videoUrl }}
            style={s.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            style={s.media}
            contentFit="cover"
          />
        ) : (
          <View style={s.placeholder}>
            <MaterialIcons name="terrain" size={48} color="#CBD5E1" />
          </View>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <View style={s.badgesRow}>
            {badges.slice(0, 3).map((b, i) => (
              <Badge key={i} label={b.label} variant={b.variant} />
            ))}
          </View>
        )}

        <AnimHeart
          isFav={landmarkWishlist.isSaved}
          onPress={handleFavorite}
          loading={landmarkWishlist.isPending}
        />
      </View>

      {/* Content Area */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={s.content}
      >
        <Text style={s.title} numberOfLines={2}>
          {landmark.title ||
            landmark.name ||
            t("landmarkCard.fallbackTitle", "Land")}
        </Text>

        {/* Price */}
        {price > 0 && (
          <View style={s.priceRow}>
            <Text style={s.price}>
              {price.toLocaleString()}{" "}
              <Text style={s.priceUnit}>
                {landmark.currency || t("common.currencySymbol", "MRU")}
              </Text>
            </Text>
            {pricePerUnit && (
              <Text style={s.unitPrice}>
                {t("landmarkCard.pricePerUnit", "~{{price}} {{currency}}/{{unit}}", {
                  price: pricePerUnit.toLocaleString(),
                  currency: landmark.currency || t("common.currencySymbol", "MRU"),
                  unit: areaUnit,
                })}
              </Text>
            )}
          </View>
        )}

        {/* Specs */}
        <View style={s.specsRow}>
          {area && (
            <Text style={s.specText}>
              <Text style={s.specNum}>{area.toLocaleString()}</Text> {areaUnit}
            </Text>
          )}
          {landType && (
            <>
              <Text style={s.specSeparator}>·</Text>
              <Text style={s.specText}>{landType}</Text>
            </>
          )}
          {landmark.ownership_years && (
            <>
              <Text style={s.specSeparator}>·</Text>
              <Text style={s.specText}>
                {t("landmarkCard.ownershipYears", "{{count}} yrs ownership", {
                  count: landmark.ownership_years,
                })}
              </Text>
            </>
          )}
        </View>

        {/* Plot Ratio & Coverage */}
        {(landmark.plot_ratio || landmark.building_coverage) && (
          <View style={s.featureRow}>
            {landmark.plot_ratio && (
              <View style={s.featurePill}>
                <Text style={s.featureText}>
                  {t("landmarkCard.plotRatio", "Plot ratio")}: {landmark.plot_ratio}
                </Text>
              </View>
            )}
            {landmark.building_coverage && (
              <View style={s.featurePill}>
                <Text style={s.featureText}>
                  {t("landmarkCard.coverage", "Coverage")}: {landmark.building_coverage}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Location */}
        {zone && (
          <View style={s.addrRow}>
            <Feather name="map-pin" size={14} color={T.inkMuted} />
            <Text style={s.addrText} numberOfLines={1}>
              {zone}
            </Text>
          </View>
        )}

        {/* Description */}
        {/* 
        {landmark.description && (
          <Text style={s.desc} numberOfLines={2}>
            {landmark.description}
          </Text>
        )} */}

        {showPlotChip ? (
          <View style={s.plotChip}>
            <MaterialIcons
              name="verified-user"
              size={14}
              color={theme["color-temporary-primary"]}
            />
            <Text style={s.plotChipText}>
              {t("listing.landmark.steps.review.plotChip", "Plot {{number}}", {
                number: landmark.plot_number,
              })}
            </Text>
          </View>
        ) : null}

        {hostName ? (
          <View style={s.hostRow}>
            <MaterialIcons name="person-outline" size={14} color={T.inkMuted} />
            <Text style={s.hostText} numberOfLines={1}>
              {t("landmarkCard.hostedBy", "Hosted by {{name}}", {
                name: hostName,
              })}
            </Text>
          </View>
        ) : null}

        <Pressable onPress={handlePress} style={s.detailsLink} hitSlop={8}>
          <Text style={s.detailsLinkText}>
            {t("landmarkCard.viewDetails", "View details")}
          </Text>
          <MaterialIcons
            name="arrow-forward-ios"
            size={12}
            color={theme["color-temporary-primary"]}
          />
        </Pressable>

        {/* TEMPORARY COMMENTED Organization */}
        {/* {landmark.organization?.name && (
          <View style={s.orgFooter}>
            <MaterialIcons name="business" size={13} color={T.inkMuted} />
            <Text style={s.orgText} numberOfLines={1}>
              {landmark.organization.name}
            </Text>
            {isVerified && (
              <MaterialIcons name="verified" size={13} color={T.green} />
            )}
          </View>
        )} */}

        {/* Action Buttons */}
        <View style={s.buttonGroup}>
          <TouchableOpacity style={s.actionBtn} onPress={handleEmail}>
            <Feather name="mail" size={16} color="#FFF" />
            <Text style={s.actionBtnText}>
              {t("propertyCard.emailInquiry", "Email")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} onPress={handleContact}>
            <Feather name="phone" size={16} color="#FFF" />
            <Text style={s.actionBtnText}>
              {t("propertyCard.phoneCall", "Call")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.whatsappBtn]}
            onPress={handleWhatsApp}
          >
            <MaterialCommunityIcons name="whatsapp" size={17} color="#FFF" />
            <Text style={s.actionBtnText}>
              {t("propertyCard.whatsApp", "WhatsApp")}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// Styles - Zillow-Inspired
// ============================================================
const s = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: "#EEEEEE",
  },
  imgBox: {
    height: IMAGE_H,
    backgroundColor: "#F8F9FA",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  badgesRow: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    zIndex: 5,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: "700",
    color: T.ink,
    lineHeight: 22,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 21,
    fontWeight: "800",
    color: T.brand,
    letterSpacing: -0.4,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: "500",
    color: T.inkSoft,
  },
  unitPrice: {
    fontSize: 11.5,
    color: T.inkSoft,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  specText: { fontSize: 13.5, color: T.inkSoft, fontWeight: "500" },
  specNum: { color: T.ink, fontWeight: "700" },
  specSeparator: { marginHorizontal: 6, color: "#CCC", fontSize: 13 },

  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  featurePill: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },
  featureText: {
    fontSize: 11.5,
    color: T.inkSoft,
    fontWeight: "500",
  },

  desc: {
    fontSize: 13,
    color: T.inkSoft,
    lineHeight: 18,
    marginBottom: 10,
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  addrText: {
    fontSize: 12.5,
    color: T.inkMuted,
    flex: 1,
  },
  plotChip: {
    marginBottom: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF1EA",
    borderColor: "#F4C9B4",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  plotChipText: {
    fontSize: 12,
    color: theme["color-temporary-primary"],
    fontWeight: "700",
  },
  orgFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: T.border,
  },
  orgText: {
    fontSize: 12,
    color: T.inkSoft,
    flex: 1,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  hostText: {
    fontSize: 12.5,
    color: T.inkSoft,
    flex: 1,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  detailsLinkText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: theme["color-temporary-primary"],
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: T.brand,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14.5,
  },
});
