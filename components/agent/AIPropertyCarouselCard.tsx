import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Bed, Bathtub, MapPin, House, Mountains } from "phosphor-react-native";
import type { PropertyRecommendation } from "../../services/aiService";
import { formatMruAmount } from "../../utils/formatMruPrice";
import { AI_CHAT as C } from "./aiChatTheme";

const W = Dimensions.get("window").width;
const CARD_W = W * 0.72;

function isLandmark(rec: PropertyRecommendation): boolean {
  const src = String((rec as { source?: string }).source ?? "")
    .trim()
    .toLowerCase();
  return src === "landmark" || src.includes("landmark");
}

type Props = {
  rec: PropertyRecommendation;
  index: number;
  onPress: (rec: PropertyRecommendation) => void;
};

export function AIPropertyCarouselCard({ rec, index, onPress }: Props) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const landmark = isLandmark(rec);

  const inner = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeLabel = landmark
    ? t("aiChat.badgeLand", "Land")
    : rec.type === "sale"
      ? t("aiChat.badgeSale", "Sale")
      : t("aiChat.badgeRent", "Rent");

  const formatPrice = (price: number) => {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return formatMruAmount(Math.round(n));
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(300)}
      style={styles.item}
    >
      <Animated.View style={[styles.card, inner]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPressIn={() => {
            scale.value = withSpring(0.99, { damping: 20, stiffness: 400 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 20, stiffness: 400 });
          }}
          onPress={() => onPress(rec)}
          accessibilityRole="button"
        >
          <View style={styles.imageWrap}>
            {rec.image ? (
              <>
                {!imgLoaded && <View style={styles.imageSkeleton} />}
                <Image
                  source={{ uri: rec.image }}
                  style={[styles.image, !imgLoaded && styles.imageHidden]}
                  resizeMode="cover"
                  onLoadEnd={() => setImgLoaded(true)}
                />
              </>
            ) : (
              <View style={styles.imageFallback}>
                {landmark ? (
                  <Mountains size={28} color={C.textMuted} weight="regular" />
                ) : (
                  <House size={28} color={C.textMuted} weight="regular" />
                )}
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {rec.title}
            </Text>
            <Text style={styles.price}>{formatPrice(rec.price)}</Text>
            {!landmark && (rec.bedrooms > 0 || rec.bathrooms > 0) ? (
              <View style={styles.metaRow}>
                {rec.bedrooms > 0 ? (
                  <View style={styles.metaItem}>
                    <Bed size={13} color={C.textMuted} weight="regular" />
                    <Text style={styles.metaText}>{rec.bedrooms}</Text>
                  </View>
                ) : null}
                {rec.bathrooms > 0 ? (
                  <View style={styles.metaItem}>
                    <Bathtub size={13} color={C.textMuted} weight="regular" />
                    <Text style={styles.metaText}>{rec.bathrooms}</Text>
                  </View>
                ) : null}
                {rec.size_m2 ? (
                  <Text style={styles.metaText}>{rec.size_m2} m²</Text>
                ) : null}
              </View>
            ) : null}
            {landmark && rec.size_m2 ? (
              <Text style={styles.metaText}>{Math.round(rec.size_m2)} m²</Text>
            ) : null}
            <View style={styles.locRow}>
              <MapPin size={12} color={C.textMuted} weight="regular" />
              <Text style={styles.locText} numberOfLines={1}>
                {rec.quartier_label || rec.location_label || rec.city}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { width: CARD_W, marginRight: 10 },
  card: {
    borderRadius: C.radius.lg,
    backgroundColor: C.bg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: C.bgMuted,
  },
  image: { width: "100%", height: "100%" },
  imageHidden: { opacity: 0 },
  imageSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bgChip,
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bgMuted,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: C.radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textSub,
    letterSpacing: 0.2,
  },
  body: { paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text,
    lineHeight: 19,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: C.textMuted },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  locText: { flex: 1, fontSize: 12, color: C.textMuted },
});
