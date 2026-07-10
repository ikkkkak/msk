import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { VideoCamera, Upload } from "phosphor-react-native";
import type { HostStudioVideo } from "../../hooks/queries/useHostStudioQuery";
import { HostStudioVideoCard } from "./HostStudioVideoCard";
import { studio } from "./studioTheme";
import type { VideoSegment } from "./HostStudioVideoSegment";

type Props = {
  videos: HostStudioVideo[];
  kind: VideoSegment;
  onPressVideo: (video: HostStudioVideo) => void;
};

export function HostStudioVideosList({ videos, kind, onPressVideo }: Props) {
  const { t } = useTranslation();

  if (videos.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <VideoCamera size={28} color={studio.muted} weight="duotone" />
        </View>
        <Text style={styles.emptyTitle}>
          {kind === "rent"
            ? t("hostStudio.noRentVideos", "No rental videos yet")
            : t("hostStudio.noSaleVideos", "No for-sale videos yet")}
        </Text>
        <Text style={styles.emptySub}>
          {kind === "rent"
            ? t(
                "hostStudio.noRentVideosSub",
                "Upload a tour video on a rental listing to see views and engagement here.",
              )
            : t(
                "hostStudio.noSaleVideosSub",
                "Add a video to a property for sale to track buyer interest.",
              )}
        </Text>
        <View style={styles.emptyHint}>
          <Upload size={14} color={studio.inkSecondary} />
          <Text style={styles.emptyHintText}>
            {t("hostStudio.noVideosCta", "Use Quick tools → Video")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {videos.map((item) => (
        <HostStudioVideoCard
          key={`${item.kind}-${item.id}-${item.video_url}`}
          video={item}
          showKind={false}
          onPress={() => onPressVideo(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 12,
  },
  empty: {
    marginHorizontal: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: studio.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: studio.ink,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: studio.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: studio.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  emptyHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: studio.inkSecondary,
  },
});
