import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import * as VideoThumbnails from "expo-video-thumbnails";
import { pickVideoNative } from "../../utils/nativePhotoPicker";

export type RentListingVideoDraft = {
  localUri: string;
  mime: string;
  durationSec: number | null;
  thumbUri: string | null;
  fileSize: number | null;
};

type Props = {
  value: RentListingVideoDraft | null;
  onChange: (next: RentListingVideoDraft | null) => void;
  maxDurationSec?: number;
  labels?: {
    title?: string;
    hint?: string;
    pick?: string;
    replace?: string;
    remove?: string;
    tooLong?: string;
    optional?: string;
  };
};

const DEFAULT_MAX = 5 * 60;

export function RentListingVideoPicker({
  value,
  onChange,
  maxDurationSec = DEFAULT_MAX,
  labels = {},
}: Props) {
  const pickVideo = useCallback(async () => {
    try {
      const res = await pickVideoNative({ quality: 1, allowsEditing: true });
      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0]!;
      let durationSec: number | null = null;
      if (asset.duration) {
        durationSec =
          asset.duration > 10000 ? asset.duration / 1000 : asset.duration;
      }
      if (durationSec && durationSec > maxDurationSec) {
        alert(
          labels.tooLong ||
            "Please choose a video under 5 minutes for the feed.",
        );
        return;
      }

      let thumbUri: string | null = null;
      try {
        const t =
          durationSec && durationSec < 5 ? 100 : 500;
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: t,
          quality: 0.8,
        });
        thumbUri = uri;
      } catch {
        thumbUri = null;
      }

      onChange({
        localUri: asset.uri,
        mime: asset.mimeType || "video/mp4",
        durationSec,
        thumbUri,
        fileSize: asset.fileSize ?? null,
      });
    } catch (e) {
      console.error("[RentListingVideoPicker] pick failed", e);
    }
  }, [maxDurationSec, labels.tooLong, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {labels.title || "Property video (optional)"}
      </Text>
      <Text style={styles.hint}>
        {labels.hint ||
          "A short video helps your listing appear in the video feed and get more views."}
      </Text>
      {labels.optional ? (
        <Text style={styles.optional}>{labels.optional}</Text>
      ) : null}

      {!value ? (
        <TouchableOpacity
          style={styles.pickBtn}
          onPress={pickVideo}
          activeOpacity={0.85}
        >
          <MaterialIcons name="videocam" size={40} color="#717171" />
          <Text style={styles.pickText}>
            {labels.pick || "Add a video"}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.previewWrap}>
          {value.thumbUri ? (
            <Image source={{ uri: value.thumbUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <MaterialIcons name="movie" size={36} color="#999" />
            </View>
          )}
          <View style={styles.previewMeta}>
            <Text style={styles.metaLine}>
              {value.durationSec
                ? `${Math.floor(value.durationSec / 60)}:${String(
                    Math.floor(value.durationSec % 60),
                  ).padStart(2, "0")}`
                : "Video selected"}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={pickVideo} style={styles.linkBtn}>
                <Text style={styles.linkText}>
                  {labels.replace || "Replace"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onChange(null)}
                style={styles.linkBtn}
              >
                <Text style={[styles.linkText, styles.removeText]}>
                  {labels.remove || "Remove"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export function RentListingVideoUploadOverlay({
  visible,
  percent,
  message,
}: {
  visible: boolean;
  percent: number;
  message?: string;
}) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.overlayText}>
        {message || `Uploading video… ${Math.round(percent)}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  title: { fontSize: 17, fontWeight: "700", color: "#222", marginBottom: 8 },
  hint: { fontSize: 14, color: "#717171", lineHeight: 20, marginBottom: 16 },
  optional: { fontSize: 12, color: "#999", marginBottom: 12 },
  pickBtn: {
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  pickText: { marginTop: 12, fontSize: 15, fontWeight: "600", color: "#444" },
  previewWrap: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  thumb: { width: 88, height: 132, borderRadius: 8, backgroundColor: "#EEE" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  previewMeta: { flex: 1 },
  metaLine: { fontSize: 15, fontWeight: "600", color: "#222", marginBottom: 8 },
  row: { flexDirection: "row", gap: 16 },
  linkBtn: { paddingVertical: 4 },
  linkText: { fontSize: 14, fontWeight: "600", color: "#222" },
  removeText: { color: "#C13515" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  overlayText: {
    marginTop: 16,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
