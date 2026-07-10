/**
 * Pre-upload video sizing — Expo Go compatible (no native compressor modules).
 *
 * TikTok/Instagram compress on-device; in Expo Go we rely on expo-image-picker
 * export presets (480p H.264) at pick time. Dev/EAS builds can add
 * react-native-compressor later for extra shrink.
 */

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

export type VideoCompressProgress = {
  percent: number;
  message?: string;
};

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function canUseNativeVideoCompressor(): boolean {
  return !isExpoGo();
}

/** No-op in Expo Go — picker should already export 720p. Passthrough for dev builds without compressor. */
export async function compressVideoForUpload(
  localUri: string,
  onProgress?: (p: VideoCompressProgress) => void,
): Promise<{ uri: string; cleanup: () => Promise<void> }> {
  const trimmed = String(localUri || "").trim();
  if (!trimmed) throw new Error("Video URI is empty");

  const info = await FileSystem.getInfoAsync(trimmed);
  const sizeMB =
    info.exists && "size" in info && info.size
      ? info.size / (1024 * 1024)
      : 0;

  if (isExpoGo()) {
    console.log(
      `[videoCompress] Expo Go — using picker export quality (${sizeMB.toFixed(1)}MB). Pick a shorter clip if upload fails.`,
    );
  } else {
    console.log(
      `[videoCompress] passthrough ${sizeMB.toFixed(1)}MB (native compressor disabled for Expo Go compatibility)`,
    );
  }

  onProgress?.({
    percent: 100,
    message: "Preparing upload…",
  });

  return { uri: trimmed, cleanup: async () => {} };
}
