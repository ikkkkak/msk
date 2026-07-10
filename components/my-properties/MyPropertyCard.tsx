import React, { useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Bed, Bathtub, House, MapPin } from "phosphor-react-native";
import type { Property } from "../../types/property";
import { FastListingImage } from "../FastListingImage";
import { mp } from "./myPropertiesTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_MARGIN = 16;
const IMAGE_W = SCREEN_W - CARD_H_MARGIN * 2;
const IMAGE_H = Math.round(IMAGE_W * (9 / 16));

export type MyPropertyCardProperty = Property & {
  status?: string;
  hostPrivateNote?: string;
  reviewNotes?: string;
};

type Props = {
  property: MyPropertyCardProperty;
  onPress: () => void;
};

type StatusKey = "live" | "pending" | "rejected";

function resolveStatus(property: MyPropertyCardProperty): {
  key: StatusKey;
  bg: string;
  text: string;
} {
  const raw = (property.status || "").toLowerCase();
  if (raw === "approved" || raw === "live" || raw === "published") {
    return { key: "live", bg: mp.liveBg, text: mp.live };
  }
  if (raw === "rejected") {
    return { key: "rejected", bg: mp.rejectedBg, text: mp.rejected };
  }
  if (property.isActive === true) {
    return { key: "live", bg: mp.liveBg, text: mp.live };
  }
  if (property.isActive === false) {
    return { key: "pending", bg: mp.pendingBg, text: mp.pending };
  }
  return { key: "pending", bg: mp.pendingBg, text: mp.pending };
}

function formatPrice(
  value: number | undefined,
  currency: string,
  perNight: string,
): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const amount = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `${amount} ${currency}/${perNight}`;
}

export const MyPropertyCard = React.memo(function MyPropertyCard({
  property,
  onPress,
}: Props) {
  const { t, i18n } = useTranslation();
  const status = resolveStatus(property);
  const statusLabel = t(`myProperties.status.${status.key}`, status.key);

  const imageUri = property.images?.[0]?.trim();
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const currency = property.currency || t("common.currencySymbol", "MRU");
  const perNight = t("myProperties.perNightShort", "night");
  const priceLabel = formatPrice(property.nightlyPrice, currency, perNight);

  const rating = useMemo(() => {
    const r = Number(property.rating);
    return Number.isFinite(r) && r > 0 ? r.toFixed(1) : null;
  }, [property.rating]);

  const beds =
    property.bedrooms > 0
      ? t("listing.common.bedroomsShort", "{{count}} bd", {
          count: property.bedrooms,
        })
      : null;
  const baths =
    property.bathrooms > 0
      ? t("listing.common.bathroomsShort", "{{count}} ba", {
          count: property.bathrooms,
        })
      : null;

  const isRtl = (i18n.language || "").toLowerCase().startsWith("ar");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={property.title || t("hostStudio.untitled", "Listing")}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <FastListingImage
            uri={imageUri}
            width={IMAGE_W}
            height={IMAGE_H}
            priority="normal"
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imageEmpty]}>
            <House size={32} color={mp.inkMuted} weight="duotone" />
            <Text style={styles.noPhoto}>
              {t("myProperties.noPhoto", "No photo yet")}
            </Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.body, isRtl && styles.bodyRtl]}>
        {priceLabel ? (
          <Text style={[styles.price, isRtl && styles.textRtl]} numberOfLines={1}>
            {priceLabel}
          </Text>
        ) : (
          <Text style={[styles.priceUnset, isRtl && styles.textRtl]}>
            {t("myProperties.setPrice", "Set a price")}
          </Text>
        )}

        {(beds || baths) ? (
          <View style={[styles.specsRow, isRtl && styles.specsRowRtl]}>
            {beds ? (
              <View style={styles.specItem}>
                <Bed size={15} color={mp.inkSecondary} weight="fill" />
                <Text style={styles.specText}>{beds}</Text>
              </View>
            ) : null}
            {baths ? (
              <View style={styles.specItem}>
                <Bathtub size={15} color={mp.inkSecondary} weight="fill" />
                <Text style={styles.specText}>{baths}</Text>
              </View>
            ) : null}
            {rating ? (
              <Text style={styles.rating}>★ {rating}</Text>
            ) : (
              <Text style={styles.newListing}>
                {t("myProperties.new", "New listing")}
              </Text>
            )}
          </View>
        ) : null}

        <Text style={[styles.title, isRtl && styles.textRtl]} numberOfLines={2}>
          {property.title?.trim() || t("hostStudio.untitled", "Listing")}
        </Text>

        {location ? (
          <View style={[styles.locationRow, isRtl && styles.locationRowRtl]}>
            <MapPin size={13} color={mp.inkMuted} weight="fill" />
            <Text style={[styles.location, isRtl && styles.textRtl]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_H_MARGIN,
    marginBottom: 16,
    borderRadius: mp.radiusLg,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
    overflow: "hidden",
    shadowColor: mp.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: IMAGE_W,
    height: IMAGE_H,
    backgroundColor: mp.borderLight,
  },
  image: {
    width: IMAGE_W,
    height: IMAGE_H,
  },
  imageEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noPhoto: {
    fontSize: 12,
    fontWeight: "500",
    color: mp.inkMuted,
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  bodyRtl: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: mp.ink,
    letterSpacing: -0.4,
  },
  priceUnset: {
    fontSize: 15,
    fontWeight: "600",
    color: mp.inkMuted,
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  specsRowRtl: {
    flexDirection: "row-reverse",
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    fontSize: 14,
    fontWeight: "500",
    color: mp.inkSecondary,
  },
  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: mp.ink,
    marginLeft: "auto",
  },
  newListing: {
    fontSize: 12,
    fontWeight: "600",
    color: mp.inkMuted,
    marginLeft: "auto",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: mp.ink,
    lineHeight: 20,
    marginTop: 2,
  },
  textRtl: {
    textAlign: "right",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationRowRtl: {
    flexDirection: "row-reverse",
  },
  location: {
    flex: 1,
    fontSize: 13,
    color: mp.inkMuted,
    fontWeight: "400",
  },
});
