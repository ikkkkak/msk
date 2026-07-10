import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { Text } from "@ui-kitten/components";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { LandmarkCardData } from "./LandmarkCard";
import { theme } from "../theme";
import {
  extractLandmarkVideoUrl,
  getLandmarkPosterUrl,
  getLandmarkPrimaryImageUrl
} from "../utils/landmarkMedia";

const CARD_W = 150;
const IMAGE_H = 108;

function fmtPrice(p?: number): string {
  if (p == null || !Number.isFinite(p)) return "—";
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `${Math.round(p / 1_000)}K`;
  return `${Math.round(p)}`;
}

/** Media tile: prefer looping muted video when URL exists; else image; else placeholder. */
const DiscoverLandMedia: React.FC<{
  landmark: LandmarkCardData;
  stableKey: string;
}> = ({ landmark, stableKey }) => {
  const lm = landmark as Record<string, unknown>;

  const videoUrl = useMemo(() => extractLandmarkVideoUrl(lm), [landmark]);
  const imageUrl = useMemo(() => getLandmarkPrimaryImageUrl(lm), [landmark]);
  const posterUri = useMemo(() => getLandmarkPosterUrl(lm), [landmark]);

  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (!videoUrl) return;
    let cancelled = false;
    const kick = async () => {
      const v = videoRef.current;
      if (!v || cancelled) return;
      try {
        await v.setIsMutedAsync(true);
        await v.playAsync();
      } catch {
        /* not loaded yet */
      }
    };
    const t = setTimeout(kick, 0);
    const raf = requestAnimationFrame(kick);
    return () => {
      cancelled = true;
      clearTimeout(t);
      cancelAnimationFrame(raf);
      const v = videoRef.current;
      void v?.pauseAsync()?.catch(() => {});
    };
  }, [videoUrl, stableKey]);

  if (videoUrl) {
    return (
      <View style={styles.thumbWrap}>
        {posterUri ? (
          <Image
            pointerEvents="none"
            source={{ uri: posterUri }}
            style={styles.thumbUnderlay}
            contentFit="cover"
            recyclingKey={`poster-${stableKey}`}
          />
        ) : imageUrl ? (
          <Image
            pointerEvents="none"
            source={{ uri: imageUrl }}
            style={styles.thumbUnderlay}
            contentFit="cover"
            recyclingKey={`img-under-${stableKey}`}
          />
        ) : (
          <View style={[styles.thumbUnderlay, styles.videoLoadingBg]} />
        )}
        <Video
          ref={videoRef}
          key={`v-${stableKey}-${videoUrl}`}
          source={{ uri: videoUrl }}
          style={styles.thumbVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />
        <View style={styles.videoBadge} pointerEvents="none">
          <MaterialIcons name="videocam" size={14} color="#fff" />
        </View>
      </View>
    );
  }

  if (imageUrl) {
    return (
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumb}
          contentFit="cover"
          transition={160}
          recyclingKey={stableKey}
        />
      </View>
    );
  }

  return (
    <View style={[styles.thumbWrap, styles.placeholderThumb]}>
      <MaterialIcons name="landscape" size={28} color="#94a3b8" />
    </View>
  );
};

interface DiscoverLandsHomeRowProps {
  landmarks: LandmarkCardData[];
  isLoading?: boolean;
  onPressLand: (landmark: LandmarkCardData) => void;
  onViewAll: () => void;
}

export const DiscoverLandsHomeRow: React.FC<DiscoverLandsHomeRowProps> = ({
  landmarks,
  isLoading,
  onPressLand,
  onViewAll
}) => {
  const { t } = useTranslation();

  const renderSkeleton = useCallback(
    () => (
      <View style={styles.skeletonRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.miniCard,
              styles.skeletonCard,
              i < 3 ? { marginRight: 12 } : null
            ]}
          />
        ))}
      </View>
    ),
    []
  );

  return (
    <View style={styles.outer} testID="discover-lands-row">
      <LinearGradient
        colors={[
          theme["color-temporary-primary"],
          theme["color-temporary-primary"],
          theme["color-temporary-primary"]
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.innerGlow} pointerEvents="none" />

        <View style={styles.headerRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.titleText}>
              {t("discoverLands.title", "Discover lands")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onViewAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.viewMoreBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.viewMoreText}>
              {t("discoverLands.viewMore", "View more")}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="#FFF"
              style={{ marginTop: -1 }}
            />
          </TouchableOpacity>
        </View>

        {isLoading && landmarks.length === 0 ? (
          <>
            <ActivityIndicator
              style={{ marginTop: 12 }}
              color="#99f6e4"
              size="small"
            />
            {renderSkeleton()}
          </>
        ) : landmarks.length === 0 ? (
          <Text style={styles.emptyHint}>
            {t("discoverLands.empty", "No lands available right now")}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScrollContent}
          >
            {landmarks.slice(0, 4).map((lm, idx) => {
              const id = lm.id ?? (lm as any).ID ?? idx;
              const title =
                lm.title || lm.name || t("discoverLands.plot", "Land plot");
              const zone = lm.zone_name || (lm as any).city || "";
              const mediaKey = String(id);

              return (
                <TouchableOpacity
                  key={`discover-land-${id}-${idx}`}
                  style={styles.miniCard}
                  activeOpacity={0.92}
                  onPress={() => onPressLand(lm)}
                >
                  <DiscoverLandMedia landmark={lm} stableKey={mediaKey} />
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  {(lm.price != null && Number(lm.price) > 0) || zone ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {(lm.price != null && Number(lm.price) > 0
                        ? `${fmtPrice(Number(lm.price))} MRU`
                        : "") +
                        (lm.price != null && Number(lm.price) > 0 && zone
                          ? " · "
                          : "") +
                        (zone ? zone : "")}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 0,
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 4,
    // lift off list background
    shadowColor: "#0c4a6e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  gradient: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderRadius: 5
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  titleText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(167,243,208,0.35)"
  },
  viewMoreText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13
  },
  subtitle: {
    color: "rgba(236,253,245,0.72)",
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
    zIndex: 1,
    maxWidth: "98%"
  },
  hScrollContent: {
    paddingTop: 14,
    paddingBottom: 2,
    paddingRight: 4
  },
  miniCard: {
    width: CARD_W,
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 5,
    overflow: "hidden",
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.25)",
    zIndex: 1
  },
  skeletonRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 0,
    zIndex: 1
  },
  skeletonCard: {
    height: IMAGE_H + 56,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 0
  },
  thumbWrap: {
    width: CARD_W,
    height: IMAGE_H,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2e8f0"
  },
  thumb: {
    width: "100%",
    height: IMAGE_H
  },
  thumbUnderlay: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_W,
    height: IMAGE_H
  },
  thumbVideo: {
    width: "100%",
    height: IMAGE_H,
    backgroundColor: "transparent"
  },
  videoLoadingBg: {
    backgroundColor: "#cbd5e1"
  },
  placeholderThumb: {
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  videoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 2,
    elevation: 2
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 8,
    marginTop: 6,
    lineHeight: 17,
    minHeight: 34
  },
  cardMeta: {
    fontSize: 11,
    color: "#475569",
    paddingHorizontal: 8,
    marginTop: 2,
    fontWeight: "600"
  },
  emptyHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 12,
    zIndex: 1
  }
});
