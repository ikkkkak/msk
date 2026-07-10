/**
 * Device + network aware streaming profile for feed playback.
 * Tunes max resolution tier for emerging markets / low-end Android.
 */

import { Platform } from "react-native";
import type { ConnectionQuality } from "../hooks/useConnectivity";

export type DeviceTier = "low" | "mid" | "high";

export type StreamingProfile = {
  tier: DeviceTier;
  /** Max HLS rung height (portrait); player may still adapt below this */
  maxHeight: 360 | 540 | 720 | 1080;
  prefetchAhead: number;
  prefetchBehind: number;
  /** Only warm first HLS segment for off-screen items */
  prefetchSegmentsOnly: boolean;
  preferHls: boolean;
};

function isStreamProcessingReady(
  item: Record<string, unknown> | undefined,
): boolean {
  if (!item) return true;
  const s = String(
    item.processingStatus ?? item.processing_status ?? "ready",
  ).toLowerCase();
  return !s || s === "ready";
}

let cachedTier: DeviceTier | null = null;

/** Heuristic tier — extend with expo-device totalMemory when available */
export function getDeviceTier(): DeviceTier {
  if (cachedTier) return cachedTier;
  if (Platform.OS === "android") {
    // Conservative default for fragmented low-RAM devices
    cachedTier = "mid";
    return cachedTier;
  }
  cachedTier = "high";
  return cachedTier;
}

export function getStreamingProfile(
  connectionQuality: ConnectionQuality = "good",
): StreamingProfile {
  const tier = getDeviceTier();

  if (connectionQuality === "offline" || connectionQuality === "poor") {
    return {
      tier: "low",
      maxHeight: 360,
      prefetchAhead: 0,
      prefetchBehind: 0,
      prefetchSegmentsOnly: true,
      preferHls: false,
    };
  }

  if (tier === "low" || connectionQuality === "moderate") {
    return {
      tier: tier === "low" ? "low" : "mid",
      maxHeight: connectionQuality === "moderate" ? 540 : 360,
      prefetchAhead: 1,
      prefetchBehind: 1,
      prefetchSegmentsOnly: true,
      preferHls: true,
    };
  }

  return {
    tier: "high",
    maxHeight: 1080,
    prefetchAhead: 2,
    prefetchBehind: 1,
    prefetchSegmentsOnly: true,
    preferHls: true,
  };
}

/** Filter master playlist URLs — cap rung by passing mobile URL on low tier */
export function pickPlaybackUrl(
  item: {
    hlsURL?: string;
    videoURL?: string;
    mobile_video_url?: string;
    mobileVideoURL?: string;
  },
  profile: StreamingProfile,
): { uri: string; preferHls: boolean } {
  const mobile =
    item.mobile_video_url || item.mobileVideoURL || "";
  const hls = item.hlsURL || "";
  const mp4 = item.videoURL || "";

  if (profile.tier === "low" && mobile) {
    return { uri: mobile, preferHls: false };
  }
  const hlsReady = isStreamProcessingReady(item as Record<string, unknown>);
  if (profile.preferHls && hls && hlsReady) {
    return { uri: hls, preferHls: true };
  }
  if (mobile) return { uri: mobile, preferHls: false };
  return { uri: mp4 || (hlsReady ? hls : ""), preferHls: hlsReady && !!hls };
}
