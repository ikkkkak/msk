/**
 * Horizontal WhatsApp share card — rendered at 1080×568, exported at 4K.
 */
import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { ShareQrCode } from "./ShareQrCode";
import {
  WHATSAPP_SHARE_CARD_H,
  WHATSAPP_SHARE_CARD_W,
  shareCardPx,
  buildPropertySaleDeepLink,
  formatPropertySaleSharePrice,
  pickPropertySaleShareImages,
  type PropertySaleSharePayload,
} from "../../utils/propertySaleShare";
import { localizePropertySaleType } from "../../utils/listingLabels";

type Props = {
  property: PropertySaleSharePayload;
};

function BentoImage({
  uri,
  style,
}: {
  uri?: string;
  style: object;
}) {
  return (
    <View style={[styles.imageSlot, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholderInner}>
          <Image
            source={require("../../assets/logo-bg-white.png")}
            style={styles.placeholderLogo}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

export const PropertySaleWhatsAppShareCard = memo(
  function PropertySaleWhatsAppShareCard({ property }: Props) {
    const { t } = useTranslation();
    const photos = useMemo(
      () => pickPropertySaleShareImages(property.images, 4),
      [property.images],
    );
    const deepLink = buildPropertySaleDeepLink(property.id);
    const priceLabel = formatPropertySaleSharePrice(
      property.listing_price,
      t("common.priceOnRequest", "Price on request"),
    );
    const typeLabel = localizePropertySaleType(property.property_type, t);
    const locationLabel = [property.city, property.address]
      .filter(Boolean)
      .join(" · ");

    const features: string[] = [];
    if (typeLabel) features.push(typeLabel);
    if (typeof property.bedrooms === "number" && property.bedrooms > 0) {
      features.push(
        t("propertySaleDetails.shareCard.bedroomsShort", "{{count}} bd", {
          count: property.bedrooms,
        }),
      );
    }
    if (typeof property.bathrooms === "number" && property.bathrooms > 0) {
      features.push(
        t("propertySaleDetails.shareCard.bathroomsShort", "{{count}} ba", {
          count: property.bathrooms,
        }),
      );
    }
    if (typeof property.area === "number" && property.area > 0) {
      features.push(`${property.area} m²`);
    }

    return (
      <View style={styles.card} collapsable={false}>
        <View style={styles.leftCol}>
          <View style={styles.bentoTopRow}>
            <BentoImage uri={photos[0]} style={styles.bentoHero} />
            <BentoImage uri={photos[1]} style={styles.bentoTall} />
          </View>
          <View style={styles.bentoBottomRow}>
            <BentoImage uri={photos[2]} style={styles.bentoSmall} />
            <BentoImage uri={photos[3]} style={styles.bentoSmall} />
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/logo-bg-white.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Meskeny</Text>
          </View>
          <View style={styles.brandRule} />

          <View style={styles.infoBlock}>
            <Text style={styles.price}>{priceLabel}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {property.title?.trim() ||
                t(
                  "propertySaleDetails.shareCard.defaultTitle",
                  "Property for sale",
                )}
            </Text>
            {locationLabel ? (
              <Text style={styles.location} numberOfLines={2}>
                {locationLabel}
              </Text>
            ) : null}

            {features.length > 0 ? (
              <View style={styles.featureRow}>
                {features.slice(0, 4).map((f) => (
                  <View key={f} style={styles.featurePill}>
                    <Text style={styles.featureText} numberOfLines={1}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.qrBlock}>
            <View style={styles.qrWrap}>
              <ShareQrCode
                value={deepLink}
                size={shareCardPx(96)}
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrHint}>
              {t(
                "propertySaleDetails.shareCard.scanToView",
                "Scan to view listing",
              )}
            </Text>
          </View>
        </View>

        <View style={styles.watermark} pointerEvents="none">
          <Text style={styles.watermarkText}>meskeny</Text>
        </View>
      </View>
    );
  },
);

const px = shareCardPx;

const styles = StyleSheet.create({
  card: {
    width: WHATSAPP_SHARE_CARD_W,
    height: WHATSAPP_SHARE_CARD_H,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: px(1),
    borderColor: "#E5E7EB",
  },
  leftCol: {
    width: "58%",
    padding: px(14),
    gap: px(10),
    backgroundColor: "#F3F4F6",
  },
  bentoTopRow: {
    flex: 1.15,
    flexDirection: "row",
    gap: px(10),
    minHeight: 0,
  },
  bentoBottomRow: {
    flex: 0.85,
    flexDirection: "row",
    gap: px(10),
    minHeight: 0,
  },
  imageSlot: {
    borderRadius: px(12),
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    minHeight: 0,
  },
  bentoHero: {
    flex: 1.65,
  },
  bentoTall: {
    flex: 1,
  },
  bentoSmall: {
    flex: 1,
  },
  imagePlaceholderInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  placeholderLogo: {
    width: px(48),
    height: px(48),
    opacity: 0.35,
  },
  rightCol: {
    flex: 1,
    paddingHorizontal: px(22),
    paddingVertical: px(18),
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(8),
  },
  brandRule: {
    height: px(2),
    backgroundColor: "#111827",
    opacity: 0.08,
    marginTop: px(6),
    marginBottom: px(4),
    borderRadius: px(1),
  },
  brandLogo: {
    width: px(34),
    height: px(34),
  },
  brandName: {
    fontSize: px(22),
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.8,
  },
  infoBlock: {
    gap: px(8),
    flexShrink: 1,
  },
  price: {
    fontSize: px(34),
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1.2,
  },
  title: {
    fontSize: px(20),
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: px(26),
  },
  location: {
    fontSize: px(15),
    color: "#6B7280",
    lineHeight: px(20),
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: px(6),
    marginTop: px(4),
  },
  featurePill: {
    backgroundColor: "#F3F4F6",
    borderRadius: px(999),
    paddingHorizontal: px(10),
    paddingVertical: px(5),
    maxWidth: "48%",
    borderWidth: px(1),
    borderColor: "#E5E7EB",
  },
  featureText: {
    fontSize: px(12),
    fontWeight: "600",
    color: "#374151",
  },
  qrBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: px(12),
  },
  qrWrap: {
    padding: px(8),
    borderRadius: px(10),
    backgroundColor: "#FFFFFF",
    borderWidth: px(1),
    borderColor: "#D1D5DB",
  },
  qrHint: {
    flex: 1,
    fontSize: px(13),
    fontWeight: "600",
    color: "#4B5563",
    lineHeight: px(18),
  },
  watermark: {
    position: "absolute",
    right: px(18),
    bottom: px(10),
    opacity: 0.07,
  },
  watermarkText: {
    fontSize: px(42),
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 2,
  },
});

export default PropertySaleWhatsAppShareCard;
