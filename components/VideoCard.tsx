// // ─────────────────────────────────────────────
// // VideoCard.tsx
// //
// // ARCHITECTURE RULES IMPLEMENTED HERE:
// //  • React.memo with custom comparator → zero re-renders during scroll
// //  • Blur hides on onReadyForDisplay only — never onLoad; 5s timeout + error fallback
// //  • Video fades in while blur fades out — viewport-gated by parent FlashList
// //  • shouldPlay drives expo-av, not imperative calls from parent
// //  • onPlaybackStatus / onLoad callbacks are stable refs (no re-render)
// // ─────────────────────────────────────────────

// import React, {
//   useCallback,
//   useRef,
//   useState,
//   useEffect,
//   useLayoutEffect,
//   memo,
//   useMemo,
// } from "react";
// import type { AVPlaybackStatus } from "expo-av";
// import {
//   View,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Animated,
//   Dimensions,
//   Platform,
//   Easing,
// } from "react-native";
// import { Image as ExpoImage } from "expo-image";
// import { Video, ResizeMode } from "expo-av";
// import { Text } from "@ui-kitten/components";
// import {
//   Heart,
//   ChatCircleDotsIcon,
//   BookmarkSimpleIcon,
//   CaretDown,
//   PlayIcon,
// } from "phosphor-react-native";
// import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
// import {
//   ArrowBendLeftDownIcon,
//   BathtubIcon,
//   BedIcon,
// } from "phosphor-react-native";
// import { useTranslation } from "react-i18next";
// import * as Haptics from "expo-haptics";
// import type { FeedProfileContext, VideoCardProps } from "../hooks/Videofeedtypes";
// import { resolveFeedProfileContext } from "../utils/feedProfileContext";
// import {
//   FEED_STREAMING_ONLY,
//   feedPreferLocalFirst,
//   resolveFeedPlaybackUri,
//   resolveFeedVideoPlaceholder,
//   feedPlaceholderBlurRadius,
//   feedPosterPrefetchUris,
//   resolveProgressiveMp4Uri,
// } from "../config/videoPlayback";
// import {
//   isPlayableLocalVideoPath,
//   isMobileMp4PlaybackUrl,
//   normalizePlaybackUrl,
// } from "../utils/playbackUrl";
// import { markVideoLoadStart, isFeedVideoSurfaceRevealed, markFeedVideoSurfaceRevealed } from "../services/videoPlaybackMetrics";
// import { warmFeedPlayback } from "../services/videoSegmentPrefetch";
// import { videoPreloadService } from "../services/videoPreloadService";
// import { DoubleTapHeartBurst } from "./video/DoubleTapHeartBurst";

// const { width, height } = Dimensions.get("window");
// const PAGE_HEIGHT = height - 80;

// /** One box for poster + decoder — explicit size avoids expo-av / FlashList offset bugs */
// const MEDIA_FILL = {
//   position: "absolute" as const,
//   top: 0,
//   left: 0,
//   width,
//   height: PAGE_HEIGHT,
// };

// /** TikTok-scale action rail */
// const REEL_ICON_SIZE = 35;
// const REEL_MORE_SIZE = 30;
// const REEL_CIRCLE = 58;

// /** Poster fade once the decoder draws a real frame */
// const REVEAL_MS = 300;
// /** Force-hide blur if onReadyForDisplay never fires */
// const BLUR_TIMEOUT_MS = 5000;
// /** Slow networks: brief wait for disk before CDN */
// const LOCAL_WAIT_MS = 900;
// /** If still no frame after CDN fallback, try alternate MP4 */
// const STREAM_FALLBACK_MS = 4000;

// /** __DEV__ only — explains slow playback or stuck blur */
// function logFeedPlaybackDiagnostic(videoUrl: string, videoId: string | number) {
//   const url = normalizePlaybackUrl(videoUrl);
//   console.log("\n════════════════════════════════════════");
//   console.log("    MESKENY VIDEO DIAGNOSTIC (VideoCard)");
//   console.log("════════════════════════════════════════");
//   console.log("ID:", videoId);
//   console.log("URL:", url);
//   if (url !== videoUrl) {
//     console.log("RAW:", videoUrl);
//   }

//   if (url.startsWith("file://")) {
//     if (isPlayableLocalVideoPath(url)) {
//       console.log("✅ CHECK 1: Local cache file with video extension");
//     } else {
//       console.warn(
//         "[VideoCard] 🔴 CHECK 1: Local cache missing .mp4/.m3u8 — iOS cannot decode",
//       );
//     }
//   } else if (url.includes(".m3u8") || url.includes("/hls/")) {
//     console.log("✅ CHECK 1: HLS manifest");
//   } else if (isMobileMp4PlaybackUrl(url)) {
//     console.log("✅ CHECK 1: Mobile MP4 tier (fast feed playback)");
//   } else if (url.includes(".mp4")) {
//     console.warn(
//       `[VideoCard] ⚠️  CHECK 1: Raw MP4 — prefer mobile_video_url or HLS`,
//     );
//   } else {
//     console.warn("[VideoCard] ⚠️  CHECK 1: Unknown format");
//   }

//   if (url.includes("cdn.digitaloceanspaces.com")) {
//     console.log("✅ CHECK 2: DO CDN edge");
//   } else if (url.includes("digitaloceanspaces.com")) {
//     console.warn(
//       "[VideoCard] 🔴 CHECK 2: DO Spaces ORIGIN — rewriting to CDN on playback",
//     );
//   }

//   if (!url.startsWith("http")) {
//     console.log("════════════════════════════════════════\n");
//     return;
//   }

//   const start = Date.now();
//   fetch(url, { method: "HEAD" })
//     .then((res) => {
//       const ms = Date.now() - start;
//       const ct = res.headers.get("content-type") ?? "unknown";
//       console.log(`── CHECK 3: HTTP ${res.status} TTFB ${ms}ms Content-Type: ${ct}`);
//       if (ct.includes("mpegurl") || ct.includes("m3u8")) {
//         console.log("   ✅ HLS Content-Type");
//       } else if (ct.includes("octet-stream") && url.includes(".m3u8")) {
//         console.warn("   ⚠️  Wrong Content-Type for .m3u8 — may still play");
//       }
//       if (ms > 800) {
//         console.warn("[VideoCard] 🔴 TTFB slow — may not be hitting CDN cache");
//       }
//     })
//     .catch((err) => {
//       console.warn("[VideoCard] 🔴 HEAD failed:", err?.message ?? err);
//     });
//   console.log("════════════════════════════════════════\n");
// }

// function pickDecoderUri(
//   id: number | string,
//   primaryStream: string,
//   allowCdn: boolean,
//   preferLocalFirst: boolean,
// ): string {
//   const primary = normalizePlaybackUrl(primaryStream);
//   const local = videoPreloadService.getLocalPlaybackUri(id);
//   if (local && isPlayableLocalVideoPath(local)) return local;
//   if (
//     !FEED_STREAMING_ONLY &&
//     preferLocalFirst &&
//     !allowCdn &&
//     videoPreloadService.isVideoPreloading(id)
//   ) {
//     return "";
//   }
//   return normalizePlaybackUrl(
//     videoPreloadService.getPlaybackUri(id, primary) || primary,
//   );
// }

// function shouldAllowCdnNow(
//   preferLocalFirst: boolean,
//   hasLocal: boolean,
//   preloading: boolean,
// ): boolean {
//   if (FEED_STREAMING_ONLY) return true;
//   if (hasLocal) return true;
//   if (!preferLocalFirst) return true;
//   return !preloading;
// }

// /** TikTok / Reels-style compact counts */
// function formatReelCount(n: number): string {
//   if (!Number.isFinite(n) || n < 0) return "0";
//   if (n >= 1_000_000) {
//     const v = n / 1_000_000;
//     return v >= 10
//       ? `${Math.round(v)}M`
//       : `${v.toFixed(1).replace(/\.0$/, "")}M`;
//   }
//   if (n >= 10_000) return `${Math.round(n / 1000)}K`;
//   if (n >= 1000) {
//     const v = n / 1000;
//     return `${v.toFixed(1).replace(/\.0$/, "")}K`;
//   }
//   return String(Math.round(n));
// }

// // ── Heart elastic animation (self-contained, no global state) ─────────────────
// const HeartButton = memo(
//   ({
//     liked,
//     count,
//     onPress,
//     disabled,
//   }: {
//     liked: boolean;
//     count: number;
//     onPress: () => void;
//     disabled?: boolean;
//   }) => {
//     const scale = useRef(new Animated.Value(1)).current;

//     const handlePress = useCallback(() => {
//       Haptics.impactAsync(
//         liked
//           ? Haptics.ImpactFeedbackStyle.Light
//           : Haptics.ImpactFeedbackStyle.Medium,
//       ).catch(() => {});
//       Animated.sequence([
//         Animated.timing(scale, {
//           toValue: 1.22,
//           duration: 120,
//           useNativeDriver: true,
//         }),
//         Animated.spring(scale, {
//           toValue: 1,
//           friction: 4,
//           tension: 220,
//           useNativeDriver: true,
//         }),
//       ]).start();
//       onPress();
//     }, [liked, onPress, scale]);

//     const display = formatReelCount(isNaN(count) ? 0 : count);

//     return (
//       <TouchableOpacity
//         style={styles.reelActionWrap}
//         onPress={handlePress}
//         disabled={disabled}
//         activeOpacity={0.85}
//         hitSlop={{ top: 8, left: 12, right: 12 }}
//       >
//         <View
//           style={[styles.reelIconCircle, liked && styles.reelIconCircleLiked]}
//         >
//           <Animated.View style={{ transform: [{ scale }] }}>
//             <Heart
//               size={REEL_ICON_SIZE}
//               weight="fill"
//               color={liked ? "#FF385C" : "#FFFFFF"}
//             />
//           </Animated.View>
//         </View>
//         <Text style={styles.reelCountText}>{display}</Text>
//       </TouchableOpacity>
//     );
//   },
// );

// /** Single Reels-style control: frosted circle + icon + optional count */
// const ReelActionButton = memo(
//   ({
//     onPress,
//     children,
//     count,
//     testID,
//   }: {
//     onPress: () => void;
//     children: React.ReactNode;
//     count?: number;
//     testID?: string;
//   }) => {
//     const fire = useCallback(() => {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
//       onPress();
//     }, [onPress]);

//     return (
//       <TouchableOpacity
//         style={styles.reelActionWrap}
//         onPress={fire}
//         activeOpacity={0.85}
//         hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}
//         testID={testID}
//       >
//         <View style={styles.reelIconCircle}>{children}</View>
//         {count !== undefined && (
//           <Text style={styles.reelCountText}>{formatReelCount(count)}</Text>
//         )}
//       </TouchableOpacity>
//     );
//   },
// );

// // ── Double-tap detector (delayed single so double-like does not toggle pause) ──
// function useDoubleTap(onSingle: () => void, onDouble: () => void) {
//   const lastTap = useRef(0);
//   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   return useCallback(() => {
//     const now = Date.now();
//     if (now - lastTap.current < 300) {
//       if (timer.current) clearTimeout(timer.current);
//       timer.current = null;
//       lastTap.current = 0;
//       onDouble();
//       return;
//     }
//     lastTap.current = now;
//     if (timer.current) clearTimeout(timer.current);
//     timer.current = setTimeout(() => {
//       timer.current = null;
//       onSingle();
//     }, 300);
//   }, [onSingle, onDouble]);
// }

// // ── ProfileBadge + Main VideoCard ─────────────────────────────────────

// const ProfileBadge = memo(
//   ({
//     orgLogoUrl,
//     orgInitial,
//     isOrganization,
//     onPress,
//   }: {
//     orgLogoUrl?: string;
//     orgInitial: string;
//     isOrganization: boolean;
//     onPress?: () => void;
//   }) => (
//     <TouchableOpacity
//       style={styles.profileBadgeTouchable}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <View style={styles.profileBadgeContainer}>
//         {/* Avatar */}
//         {orgLogoUrl ? (
//           <ExpoImage
//             source={{ uri: orgLogoUrl }}
//             style={styles.profileBadgeAvatar}
//             contentFit="cover"
//             cachePolicy="memory-disk"
//             recyclingKey={`v-badge-${orgLogoUrl.slice(-40)}`}
//           />
//         ) : (
//           <View style={styles.profileBadgeAvatarPlaceholder}>
//             <Text style={styles.profileBadgeInitial}>{orgInitial}</Text>
//           </View>
//         )}
//         {/* Show CaretDown badge ONLY if org. TikTok badge style */}
//         {isOrganization && (
//           <View style={styles.profileBadgeCaretDown}>
//             <CaretDown size={14} weight="bold" color="#121212" />
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   ),
// );

// // ── Main VideoCard ─────────────────────────────────────────────────────────────
// const VideoCard = ({
//   item,
//   index,
//   isActive,
//   isPreloaded,
//   isMuted,
//   shouldAutoplay = true,
//   tab,
//   liked,
//   saved,
//   likesCount,
//   savesCount,
//   mountDecoder = true,
//   onLike,
//   onSave,
//   onPress,
//   onLongPress,
//   onComment,
//   onMore,
//   onPlaybackStatus,
//   onLoad,
//   videoRef,
//   onProfilePress,
//   onListingCardPress,
//   connectionQuality = "good",
//   userPaused = false,
//   onUserPauseChange,
// }: VideoCardProps) => {
//   const { t } = useTranslation();
//   /** True when the decoder is actually drawing frames — NOT the same as onLoad (audio can run first). */
//   const [surfaceReady, setSurfaceReady] = useState(() =>
//     isFeedVideoSurfaceRevealed(item.ID),
//   );
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isBuffering, setIsBuffering] = useState(false);
//   const posterOpacity = useRef(
//     new Animated.Value(isFeedVideoSurfaceRevealed(item.ID) ? 0 : 1),
//   ).current;
//   const rebufferVeilOpacity = useRef(new Animated.Value(0)).current;
//   const blurRevealDoneRef = useRef(isFeedVideoSurfaceRevealed(item.ID));
//   const prevMountDecoderRef = useRef(mountDecoder);
//   const wasInactiveRef = useRef(false);
//   const [likeBurstVisible, setLikeBurstVisible] = useState(false);
//   const innerVideoRef = useRef<InstanceType<typeof Video> | null>(null);
//   const surfaceMarkedRef = useRef(isFeedVideoSurfaceRevealed(item.ID));
//   const ttffEndRef = useRef<(() => void) | null>(null);

//   const anyFeed = item as unknown as Record<string, unknown>;
//   const placeholder = resolveFeedVideoPlaceholder(item);
//   const placeholderUri = placeholder?.uri;
//   const placeholderKind = placeholder?.kind;
//   const primaryStream = useMemo(
//     () => resolveFeedPlaybackUri(anyFeed, connectionQuality),
//     [anyFeed, connectionQuality],
//   );
//   const mp4Fallback = useMemo(
//     () => resolveProgressiveMp4Uri(anyFeed, connectionQuality),
//     [anyFeed, connectionQuality],
//   );
//   const preferLocalFirst = feedPreferLocalFirst(connectionQuality);
//   const [allowCdnFallback, setAllowCdnFallback] = useState(() =>
//     shouldAllowCdnNow(
//       preferLocalFirst,
//       Boolean(videoPreloadService.getLocalPlaybackUri(item.ID)),
//       videoPreloadService.isVideoPreloading(item.ID),
//     ),
//   );
//   const [streamUri, setStreamUri] = useState(() =>
//     pickDecoderUri(
//       item.ID,
//       primaryStream,
//       allowCdnFallback,
//       preferLocalFirst,
//     ),
//   );
//   const streamUriRef = useRef(streamUri);
//   streamUriRef.current = streamUri;
//   const videoSource = streamUri;
//   const posterSig = [
//     anyFeed.preview_blur_url,
//     anyFeed.previewBlurURL,
//     anyFeed.preview_thumbnail_url,
//     item.thumbnailURL,
//     item.thumbnail_url,
//     anyFeed.poster_url,
//     anyFeed.posterURL,
//     item.property?.images?.[0],
//     item.propertySale?.images?.[0],
//     item.landmark?.images?.[0],
//   ].join("|");

//   const handleVideoRef = useCallback(
//     (r: InstanceType<typeof Video> | null) => {
//       innerVideoRef.current = r;
//       videoRef(r);
//     },
//     [videoRef],
//   );

//   useLayoutEffect(() => {
//     if (!mountDecoder || !isActive) {
//       innerVideoRef.current = null;
//       videoRef(null);
//     }
//   }, [mountDecoder, isActive, videoRef]);

//   // New clip → reset poster only if this id never revealed a frame yet.
//   useEffect(() => {
//     const revealed = isFeedVideoSurfaceRevealed(item.ID);
//     const hasLocal = Boolean(videoPreloadService.getLocalPlaybackUri(item.ID));
//     const preloading = videoPreloadService.isVideoPreloading(item.ID);
//     const allowCdn = shouldAllowCdnNow(
//       preferLocalFirst,
//       hasLocal,
//       preloading,
//     );
//     setAllowCdnFallback(allowCdn);
//     setStreamUri(
//       pickDecoderUri(item.ID, primaryStream, allowCdn, preferLocalFirst),
//     );
//     if (!revealed) {
//       setSurfaceReady(false);
//       surfaceMarkedRef.current = false;
//       blurRevealDoneRef.current = false;
//       setIsBuffering(false);
//       posterOpacity.setValue(placeholderUri ? 1 : 0);
//     } else {
//       setSurfaceReady(true);
//       surfaceMarkedRef.current = true;
//       blurRevealDoneRef.current = true;
//       posterOpacity.setValue(0);
//     }
//   }, [item.ID, primaryStream, placeholderUri, posterOpacity, preferLocalFirst]);

//   /** Fade poster out — use for onReadyForDisplay, timeout, and fatal errors. */
//   const hidePosterOverlay = useCallback(() => {
//     blurRevealDoneRef.current = true;
//     surfaceMarkedRef.current = true;
//     markFeedVideoSurfaceRevealed(item.ID);
//     setSurfaceReady(true);
//     ttffEndRef.current?.();
//     ttffEndRef.current = null;
//     Animated.timing(posterOpacity, {
//       toValue: 0,
//       duration: REVEAL_MS,
//       easing: Easing.out(Easing.cubic),
//       useNativeDriver: true,
//     }).start();
//   }, [posterOpacity, item.ID]);

//   /** onReadyForDisplay — first pixel on screen. NOT onLoad. */
//   const revealPoster = useCallback(() => {
//     if (blurRevealDoneRef.current) return;
//     if (__DEV__) {
//       console.log(
//         `[VideoCard] onReadyForDisplay ← hide blur here (${String(item.ID)})`,
//       );
//     }
//     hidePosterOverlay();
//   }, [hidePosterOverlay, item.ID]);

//   /** onLoad = metadata only — never hide blur here. */
//   const handleVideoLoad = useCallback(
//     (status: any) => {
//       if (__DEV__) {
//         console.log(
//           `[VideoCard] onLoad ← metadata only, frame NOT painted (${String(item.ID)})`,
//         );
//       }
//       onLoad?.(status);
//     },
//     [onLoad, item.ID],
//   );

//   const restorePosterLayer = useCallback(() => {
//     surfaceMarkedRef.current = false;
//     blurRevealDoneRef.current = false;
//     setSurfaceReady(false);
//     posterOpacity.setValue(placeholderUri ? 1 : 0);
//   }, [placeholderUri, posterOpacity]);

//   // Active clip: on slow networks only, briefly wait for disk before CDN.
//   useEffect(() => {
//     if (!isActive || !preferLocalFirst) return;
//     videoPreloadService.ensureVideo(item.ID);
//     if (allowCdnFallback) return;
//     if (videoPreloadService.getLocalPlaybackUri(item.ID)) return;

//     const timer = setTimeout(() => {
//       setAllowCdnFallback(true);
//       setStreamUri(
//         pickDecoderUri(item.ID, primaryStream, true, preferLocalFirst),
//       );
//     }, LOCAL_WAIT_MS);
//     return () => clearTimeout(timer);
//   }, [
//     isActive,
//     item.ID,
//     primaryStream,
//     allowCdnFallback,
//     preferLocalFirst,
//   ]);

//   // Swap to file:// when preload finishes — never interrupt CDN mid-playback.
//   useEffect(() => {
//     return videoPreloadService.subscribeLocalReady(item.ID, (localPath) => {
//       if (!isPlayableLocalVideoPath(localPath)) return;
//       if (streamUriRef.current === localPath) return;
//       if (isFeedVideoSurfaceRevealed(item.ID)) {
//         if (!streamUriRef.current.startsWith("file://")) {
//           return;
//         }
//         if (
//           streamUriRef.current.startsWith("file://") &&
//           localPath.startsWith("file://")
//         ) {
//           return;
//         }
//       }
//       if (
//         surfaceMarkedRef.current &&
//         streamUriRef.current.startsWith("file://") &&
//         localPath.startsWith("file://")
//       ) {
//         return;
//       }
//       streamUriRef.current = localPath;
//       setAllowCdnFallback(true);
//       if (!isFeedVideoSurfaceRevealed(item.ID)) {
//         restorePosterLayer();
//       }
//       setStreamUri(localPath);
//     });
//   }, [item.ID, restorePosterLayer]);

//   const handlePlaybackError = useCallback(() => {
//     if (streamUri.startsWith("file://")) {
//       setAllowCdnFallback(true);
//       restorePosterLayer();
//       setStreamUri(normalizePlaybackUrl(primaryStream || mp4Fallback));
//       return;
//     }
//     if (
//       streamUri !== mp4Fallback &&
//       mp4Fallback &&
//       mp4Fallback !== primaryStream
//     ) {
//       restorePosterLayer();
//       setStreamUri(normalizePlaybackUrl(mp4Fallback));
//       return;
//     }
//     if (__DEV__) {
//       console.error(
//         `[VideoCard] onError — fatal, hiding blur (${String(item.ID)})`,
//         streamUri,
//       );
//     }
//     hidePosterOverlay();
//   }, [
//     streamUri,
//     mp4Fallback,
//     primaryStream,
//     restorePosterLayer,
//     hidePosterOverlay,
//     item.ID,
//   ]);

//   // Warm CDN bytes (good network) while disk cache runs in background.
//   useEffect(() => {
//     if (!isActive && !isPreloaded) return;
//     const warmUri = primaryStream || videoSource;
//     if (!warmUri) return;
//     warmFeedPlayback(
//       String(item.ID),
//       warmUri,
//       connectionQuality,
//       mp4Fallback,
//     );
//   }, [
//     isActive,
//     isPreloaded,
//     videoSource,
//     primaryStream,
//     item.ID,
//     connectionQuality,
//     mp4Fallback,
//   ]);

//   // Background disk preload for active + upcoming clips.
//   useEffect(() => {
//     if (!isActive && !isPreloaded) return;
//     videoPreloadService.ensureVideo(item.ID);
//   }, [isActive, isPreloaded, item.ID]);

//   // Prefetch poster(s) for instant placeholder decode.
//   useEffect(() => {
//     const urls = feedPosterPrefetchUris(item);
//     for (const u of urls) {
//       const t = u.trim();
//       if (!t) continue;
//       ExpoImage.prefetch(t).catch(() => {});
//       Image.prefetch(t).catch(() => {});
//     }
//   }, [item.ID, posterSig, item.thumbnailURL, item.thumbnail_url]);

//   // Off-screen: cover with poster (Android SurfaceView ignores opacity).
//   // Re-entering: brief poster until decoder paints again.
//   useEffect(() => {
//     if (!isActive) {
//       wasInactiveRef.current = true;
//       posterOpacity.setValue(placeholderUri ? 1 : 0);
//       return;
//     }
//     if (wasInactiveRef.current) {
//       wasInactiveRef.current = false;
//       blurRevealDoneRef.current = false;
//       posterOpacity.setValue(placeholderUri ? 1 : 0);
//     }
//   }, [isActive, placeholderUri, posterOpacity]);

//   useEffect(() => {
//     const prev = prevMountDecoderRef.current;
//     prevMountDecoderRef.current = mountDecoder;

//     if (prev && !mountDecoder) {
//       posterOpacity.setValue(placeholderUri ? 1 : 0);
//       blurRevealDoneRef.current = false;
//       return;
//     }

//     if (!prev && mountDecoder && videoSource) {
//       if (!isFeedVideoSurfaceRevealed(item.ID)) {
//         setSurfaceReady(false);
//         surfaceMarkedRef.current = false;
//         blurRevealDoneRef.current = false;
//         posterOpacity.setValue(placeholderUri ? 1 : 0);
//       }
//     }
//   }, [mountDecoder, videoSource, placeholderUri, posterOpacity, item.ID]);

//   // Mid-play re-buffer: subtle dark veil on the last frame.
//   useEffect(() => {
//     if (!surfaceReady || !isActive) {
//       rebufferVeilOpacity.setValue(0);
//       return;
//     }
//     Animated.timing(rebufferVeilOpacity, {
//       toValue: isBuffering ? 0.14 : 0,
//       duration: isBuffering ? 140 : 220,
//       easing: Easing.out(Easing.quad),
//       useNativeDriver: true,
//     }).start();
//   }, [isBuffering, surfaceReady, isActive, rebufferVeilOpacity]);

//   // Stuck on poster too long → try MP4 fallback (never reveal black).
//   useEffect(() => {
//     if (!isActive || !videoSource || surfaceReady) return;
//     if (
//       streamUri === mp4Fallback ||
//       !mp4Fallback ||
//       mp4Fallback === primaryStream
//     ) {
//       return;
//     }
//     const t = setTimeout(() => {
//       if (!surfaceMarkedRef.current) {
//         restorePosterLayer();
//         setStreamUri(mp4Fallback);
//       }
//     }, STREAM_FALLBACK_MS);
//     return () => clearTimeout(t);
//   }, [
//     isActive,
//     videoSource,
//     surfaceReady,
//     streamUri,
//     mp4Fallback,
//     primaryStream,
//     restorePosterLayer,
//     item.ID,
//   ]);

//   useEffect(() => {
//     if (!__DEV__ || !isActive) return;
//     if (!videoSource) {
//       console.warn(
//         `[VideoCard] no stream URL for feed item ${String(item.ID)}`,
//       );
//       return;
//     }
//     logFeedPlaybackDiagnostic(videoSource, item.ID);
//   }, [isActive, videoSource, item.ID]);

//   // Safety net: onReadyForDisplay sometimes never fires (expo-av + MP4 edge cases).
//   useEffect(() => {
//     if (!isActive || !videoSource || surfaceReady) return;
//     const timer = setTimeout(() => {
//       if (!blurRevealDoneRef.current) {
//         if (__DEV__) {
//           console.warn(
//             `[VideoCard] blur timeout ${BLUR_TIMEOUT_MS}ms — force hide (${String(item.ID)})`,
//           );
//         }
//         hidePosterOverlay();
//       }
//     }, BLUR_TIMEOUT_MS);
//     return () => clearTimeout(timer);
//   }, [isActive, videoSource, surfaceReady, item.ID, hidePosterOverlay]);

//   useEffect(() => {
//     if (!isActive || !videoSource) {
//       ttffEndRef.current = null;
//       return;
//     }
//     ttffEndRef.current = markVideoLoadStart(item.ID);
//     return () => {
//       ttffEndRef.current = null;
//     };
//   }, [isActive, videoSource, item.ID]);

//   // Hard-stop off-screen players (backs up shouldPlay + playback hook).
//   useEffect(() => {
//     if (isActive) return;
//     const v = innerVideoRef.current as any;
//     if (!v) return;
//     v.pauseAsync?.().catch(() => {});
//     v.setIsMutedAsync?.(true).catch(() => {});
//   }, [isActive]);

//   // User pause: hard stop playback and audio (survives focus / AppState / hook playAt).
//   useEffect(() => {
//     if (!isActive || !userPaused) return;
//     const v = innerVideoRef.current as any;
//     if (!v) return;
//     v.pauseAsync?.().catch(() => {});
//     v.setIsMutedAsync?.(true).catch(() => {});
//   }, [userPaused, isActive]);

//   const handleSingleTap = useCallback(() => {
//     onUserPauseChange?.(!userPaused);
//     onPress();
//   }, [onPress, onUserPauseChange, userPaused]);

//   const handleDoubleTap = useCallback(() => {
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
//       () => {},
//     );
//     setLikeBurstVisible(true);
//     if (!liked) onLike();
//   }, [onLike, liked]);

//   const handleTap = useDoubleTap(handleSingleTap, handleDoubleTap);

//   const shouldPlay = isActive && !userPaused && shouldAutoplay;
//   const showPauseIcon = isActive && userPaused;

//   // ── Profile avatar (org → host → property image → thumbnail) ─────────────
//   const profileCtx = useMemo(
//     () => resolveFeedProfileContext(item, tab),
//     [item, tab],
//   );

//   useEffect(() => {
//     const u = profileCtx?.avatarUrl?.trim();
//     if (!u || (!u.startsWith("http://") && !u.startsWith("https://"))) return;
//     ExpoImage.prefetch(u).catch(() => {});
//   }, [profileCtx?.avatarUrl]);

//   return (
//     <View style={styles.page}>
//       <TouchableOpacity
//         activeOpacity={1}
//         style={styles.mediaTapArea}
//         onPress={handleTap}
//         onLongPress={onLongPress}
//         delayLongPress={400}
//       >
//         {/* Single clipping stack — poster and decoder share identical bounds */}
//         <View style={styles.mediaStage} collapsable={false}>
//           {mountDecoder && isActive && videoSource ? (
//             <View pointerEvents="none" style={MEDIA_FILL}>
//               <Video
//                 key={`feed-video-${item.ID}`}
//                 ref={handleVideoRef}
//                 source={{ uri: videoSource }}
//                 style={MEDIA_FILL}
//                 resizeMode={ResizeMode.COVER}
//                 shouldPlay={shouldPlay}
//                 isLooping
//                 isMuted={isMuted || !isActive}
//                 volume={isActive && !isMuted ? 1.0 : 0}
//                 useNativeControls={false}
//                 onReadyForDisplay={revealPoster}
//                 onLoad={handleVideoLoad}
//                 onError={handlePlaybackError}
//                 onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
//                   if (status.isLoaded) {
//                     setIsBuffering(status.isBuffering ?? false);
//                     if (userPaused && status.isPlaying) {
//                       const v = innerVideoRef.current as any;
//                       v?.pauseAsync?.().catch(() => {});
//                       v?.setIsMutedAsync?.(true).catch(() => {});
//                     }
//                     setIsPlaying(
//                       userPaused ? false : (status.isPlaying ?? false),
//                     );
//                   }
//                   onPlaybackStatus(status);
//                 }}
//                 progressUpdateIntervalMillis={isActive ? 100 : 400}
//               />
//             </View>
//           ) : null}

//           <Animated.View
//             pointerEvents="none"
//             style={[
//               MEDIA_FILL,
//               styles.posterLayer,
//               styles.posterStackTop,
//               { opacity: posterOpacity },
//             ]}
//           >
//             {placeholderUri && placeholderKind ? (
//               <ExpoImage
//                 source={{ uri: placeholderUri }}
//                 style={MEDIA_FILL}
//                 contentFit="cover"
//                 cachePolicy="memory-disk"
//                 priority={isActive ? "high" : "normal"}
//                 recyclingKey={`poster-${item.ID}-${String(placeholderUri).slice(-48)}`}
//                 transition={0}
//                 blurRadius={feedPlaceholderBlurRadius(
//                   placeholderKind,
//                   surfaceReady,
//                 )}
//               />
//             ) : (
//               <View style={[MEDIA_FILL, styles.posterPlaceholder]} />
//             )}
//             <View style={styles.posterScrim} pointerEvents="none" />
//           </Animated.View>

//           <Animated.View
//             pointerEvents="none"
//             style={[
//               MEDIA_FILL,
//               styles.rebufferVeil,
//               styles.posterStackTop,
//               { opacity: rebufferVeilOpacity },
//             ]}
//           />

//           {showPauseIcon && (
//             <View
//               pointerEvents="none"
//               style={[MEDIA_FILL, styles.pauseOverlay, styles.posterStackTop]}
//             >
//               <View style={styles.pauseCircle}>
//                 <PlayIcon
//                   weight="fill"
//                   size={56}
//                   color="#fff"
//                   style={{ marginLeft: 4 }}
//                 />
//               </View>
//             </View>
//           )}
//         </View>

//         <DoubleTapHeartBurst
//           visible={likeBurstVisible}
//           onFinished={() => setLikeBurstVisible(false)}
//         />
//       </TouchableOpacity>

//       {/* ── RIGHT ACTIONS ─────────────────────────────────────────── */}
//       <View style={styles.actionsColumn} pointerEvents="box-none">
//         {/* Org avatar with badge (TikTok-style), spaced from heart button */}
//         {(tab === "sale" || tab === "rent" || tab === "landmarks") &&
//           profileCtx && (
//             <View style={styles.profileBadgeOuterWrap}>
//               <ProfileBadge
//                 orgLogoUrl={profileCtx.avatarUrl}
//                 orgInitial={profileCtx.initial}
//                 isOrganization={profileCtx.isOrganization}
//                 onPress={() => {
//                   if (onProfilePress) onProfilePress(profileCtx);
//                 }}
//               />
//             </View>
//           )}

//         {/* Give breathing space for Heart button */}
//         <View style={styles.actionsGap} />

//         {!item.isPromotional && (
//           <HeartButton liked={liked} count={likesCount} onPress={onLike} />
//         )}

//         {!item.isPromotional && (
//           <ReelActionButton onPress={onComment} count={item.commentsCount ?? 0}>
//             <ChatCircleDotsIcon
//               size={REEL_ICON_SIZE}
//               weight="fill"
//               color="#FFFFFF"
//             />
//           </ReelActionButton>
//         )}

//         {!item.isPromotional && (
//           <ReelActionButton
//             onPress={onSave}
//             count={isNaN(savesCount) ? 0 : savesCount}
//           >
//             <BookmarkSimpleIcon
//               size={REEL_ICON_SIZE}
//               weight="fill"
//               color={saved ? "#FFD54F" : "#FFFFFF"}
//             />
//           </ReelActionButton>
//         )}

//         <ReelActionButton onPress={onMore}>
//           <MaterialIcons
//             name="more-vert"
//             size={REEL_MORE_SIZE}
//             color="#FFFFFF"
//           />
//         </ReelActionButton>
//       </View>

//       {/* ── BOTTOM INFO CARD ────────────────────────────────────────
//           These sit above the full-screen video TouchableOpacity. Without
//           pointerEvents="none" (or an explicit onPress), they intercept taps and
//           the video feels "dead" in that region. */}
//       {tab === "rent" && item.property && !item.isPromotional && (
//         <PropertyCard
//           title={item.property.title ?? ""}
//           city={item.property.city}
//           bedrooms={item.property.bedrooms}
//           bathrooms={item.property.bathrooms}
//           imageUri={item.property.images?.[0]}
//           meta={undefined}
//           t={t}
//           onPress={onListingCardPress}
//         />
//       )}
//       {tab === "sale" && item.propertySale && (
//         <PropertyCard
//           title={item.propertySale.title ?? ""}
//           city={item.propertySale.city}
//           bedrooms={item.propertySale.bedrooms}
//           bathrooms={item.propertySale.bathrooms}
//           imageUri={item.propertySale.images?.[0]}
//           meta={
//             item.propertySale.listing_price
//               ? `${item.propertySale.listing_price.toLocaleString()} MRU`
//               : undefined
//           }
//           t={t}
//           onPress={onListingCardPress}
//         />
//       )}
//       {tab === "landmarks" && item.landmark && (
//         <LandmarkCard item={item} t={t} onPress={onListingCardPress} />
//       )}
//       {tab === "rent" && item.isPromotional && item.title && (
//         <View style={styles.promoCard} pointerEvents="none">
//           <Text style={styles.promoTitle}>{item.title}</Text>
//           {item.description && (
//             <Text style={styles.promoDesc} numberOfLines={2}>
//               {item.description}
//             </Text>
//           )}
//         </View>
//       )}
//     </View>
//   );
// };

// // ── Sub-components (stable, defined outside to avoid recreation) ───────────────

// const PropertyCard = memo(
//   ({
//     title,
//     city,
//     bedrooms,
//     bathrooms,
//     imageUri,
//     meta,
//     t,
//     onPress,
//   }: {
//     title: string;
//     city?: string;
//     bedrooms?: number;
//     bathrooms?: number;
//     imageUri?: string;
//     meta?: string;
//     t: any;
//     onPress?: () => void;
//   }) => {
//     const body = (
//       <>
//         {imageUri ? (
//           <Image source={{ uri: imageUri }} style={styles.infoCardImage} />
//         ) : (
//           <View
//             style={[styles.infoCardImage, styles.infoCardImagePlaceholder]}
//           />
//         )}
//         <View style={styles.infoCardBody}>
//           <Text style={styles.infoCardTitle} numberOfLines={1}>
//             {title}
//           </Text>
//           {meta && <Text style={styles.infoCardMeta}>{meta}</Text>}
//           {city && (
//             <Text style={styles.infoCardCity} numberOfLines={1}>
//               {city}
//             </Text>
//           )}
//           <View style={styles.infoCardRow}>
//             {bathrooms !== undefined && (
//               <View style={styles.infoCardStat}>
//                 <BathtubIcon size={13} color="#717171" />
//                 <Text style={styles.infoCardStatText}>
//                   {bathrooms} {t("property.bathroomsShort", "ba")}
//                 </Text>
//               </View>
//             )}
//             {bedrooms !== undefined && (
//               <View style={styles.infoCardStat}>
//                 <BedIcon size={13} color="#717171" />
//                 <Text style={styles.infoCardStatText}>
//                   {bedrooms} {t("property.bedroomsShort", "bd")}
//                 </Text>
//               </View>
//             )}
//           </View>
//         </View>
//         <ArrowBendLeftDownIcon size={13} color="#717171" />
//       </>
//     );

//     if (onPress) {
//       return (
//         <TouchableOpacity
//           style={styles.infoCard}
//           activeOpacity={0.92}
//           onPress={() => {
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
//               () => {},
//             );
//             onPress();
//           }}
//         >
//           {body}
//         </TouchableOpacity>
//       );
//     }
//     return (
//       <View style={styles.infoCard} pointerEvents="none">
//         {body}
//       </View>
//     );
//   },
// );

// const LandmarkCard = memo(
//   ({ item, t, onPress }: { item: any; t: any; onPress?: () => void }) => {
//     const lm = item.landmark ?? {};
//     const thumb = item.thumbnailURL ?? item.thumbnail_url;
//     const body = (
//       <>
//         {thumb ? (
//           <Image source={{ uri: thumb }} style={styles.infoCardImage} />
//         ) : (
//           <View
//             style={[styles.infoCardImage, styles.infoCardImagePlaceholder]}
//           />
//         )}
//         <View style={styles.infoCardBody}>
//           <Text style={styles.infoCardTitle} numberOfLines={2}>
//             {lm.title ??
//               lm.name ??
//               item.title ??
//               t("video.landmark", "Landmark")}
//           </Text>
//           {lm.zone_name && (
//             <Text style={styles.infoCardCity} numberOfLines={1}>
//               {lm.zone_name}
//             </Text>
//           )}
//           {lm.surface_area != null && (
//             <Text style={styles.infoCardStatText}>
//               {lm.surface_area} {lm.area_unit ?? "m²"}
//             </Text>
//           )}
//         </View>
//         <ArrowBendLeftDownIcon size={13} color="#717171" />
//       </>
//     );

//     if (onPress) {
//       return (
//         <TouchableOpacity
//           style={styles.infoCard}
//           activeOpacity={0.92}
//           onPress={() => {
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
//               () => {},
//             );
//             onPress();
//           }}
//         >
//           {body}
//         </TouchableOpacity>
//       );
//     }
//     return (
//       <View style={styles.infoCard} pointerEvents="none">
//         {body}
//       </View>
//     );
//   },
// );

// export default memo(VideoCard, (prev, next) => {
//   // Only re-render if props that affect rendering changed.
//   // This is the KEY re-render guard — prevents full list re-renders during scroll.
//   const prevComments =
//     (prev.item as { commentsCount?: number }).commentsCount ?? 0;
//   const nextComments =
//     (next.item as { commentsCount?: number }).commentsCount ?? 0;
//   const prevQ = prev.connectionQuality ?? "good";
//   const nextQ = next.connectionQuality ?? "good";
//   const prevUri = resolveFeedPlaybackUri(
//     prev.item as unknown as Record<string, unknown>,
//     prevQ,
//   );
//   const nextUri = resolveFeedPlaybackUri(
//     next.item as unknown as Record<string, unknown>,
//     nextQ,
//   );
//   return (
//     prev.isActive === next.isActive &&
//     prev.isPreloaded === next.isPreloaded &&
//     prev.isMuted === next.isMuted &&
//     prev.shouldAutoplay === next.shouldAutoplay &&
//     prevQ === nextQ &&
//     prev.liked === next.liked &&
//     prev.saved === next.saved &&
//     prev.likesCount === next.likesCount &&
//     prev.savesCount === next.savesCount &&
//     prev.mountDecoder === next.mountDecoder &&
//     prev.userPaused === next.userPaused &&
//     prev.item.ID === next.item.ID &&
//     prevUri === nextUri &&
//     prevComments === nextComments &&
//     prev.tab === next.tab &&
//     prev.onListingCardPress === next.onListingCardPress
//   );
// });

// // ── Styles ─────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   page: {
//     height: PAGE_HEIGHT,
//     width,
//     backgroundColor: "#000",
//     overflow: "hidden",
//   },
//   mediaTapArea: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   mediaStage: {
//     ...MEDIA_FILL,
//     overflow: "hidden",
//     backgroundColor: "#000",
//   },
//   posterLayer: {
//     backgroundColor: "#141414",
//   },
//   posterStackTop: {
//     zIndex: 2,
//     ...Platform.select({
//       android: { elevation: 4 },
//       default: {},
//     }),
//   },
//   posterScrim: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.22)",
//   },
//   chunkVeil: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.12)",
//   },
//   rebufferVeil: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000",
//   },
//   /** Subtle veil so BlurView reads on very light thumbnails */
//   blurTintVeil: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.12)",
//   },
//   posterPlaceholder: {
//     backgroundColor: "#1e1e1e",
//   },
//   pauseOverlay: {
//     zIndex: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   pauseCircle: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   // Right-side action column (TikTok / Reels-inspired stack)
//   actionsColumn: {
//     position: "absolute",
//     right: 1,
//     bottom: 20,
//     alignItems: "center",
//     zIndex: 10,
//   },
//   actionsGap: {
//     height: 14,
//   },
//   reelActionWrap: {
//     alignItems: "center",
//     justifyContent: "flex-start",
//     minWidth: 64,
//     marginBottom: 17,
//   },
//   reelIconCircle: {
//     borderRadius: REEL_CIRCLE / 2,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 1,
//   },
//   reelIconCircleLiked: {
//     borderColor: "rgba(255,56,92,0.45)",
//   },
//   reelCountText: {
//     color: "#FFFFFF",
//     fontSize: 12,
//     fontWeight: "800",
//     // letterSpacing: 0.15
//     // textShadowColor: "rgba(0,0,0,0.85)",
//     // textShadowOffset: { width: 0, height: 1 },
//     // textShadowRadius: 3
//   },
//   // Profile avatar ring (Reels / TikTok)
//   profileBadgeOuterWrap: {
//     marginBottom: 6,
//     alignItems: "center",
//     justifyContent: "center",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.4,
//         shadowRadius: 5,
//       },
//       android: { elevation: 6 },
//     }),
//   },
//   profileBadgeTouchable: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   profileBadgeContainer: {
//     position: "relative",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   profileBadgeAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     borderWidth: 2.5,
//     borderColor: "#FFFFFF",
//     backgroundColor: "#222",
//   },
//   profileBadgeAvatarPlaceholder: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "rgba(255,255,255,0.18)",
//     borderWidth: 2.5,
//     borderColor: "#FFFFFF",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileBadgeInitial: {
//     color: "#FFF",
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   profileBadgeCaretDown: {
//     position: "absolute",
//     bottom: -9,
//     alignSelf: "center",
//     left: "25%",
//     // marginLeft: -20,
//     width: 15,
//     height: 15,
//     borderRadius: 12,
//     backgroundColor: "#fafafa",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   // End of profile badge overrides
//   // For backward compatibility, keep existing avatar styles (unused now):
//   orgAvatarWrap: { display: "none" },
//   profileArrowBadge: { display: "none" },
//   orgAvatar: { display: "none" },
//   orgAvatarPlaceholder: { display: "none" },
//   orgAvatarInitial: { display: "none" },
//   // Bottom info card
//   infoCard: {
//     position: "absolute",
//     left: 12,
//     bottom: 24,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderRadius: 10,
//     maxWidth: width * 0.65,
//     overflow: "hidden",
//   },
//   infoCardImage: {
//     width: 80,
//     height: 80,
//   },
//   infoCardImagePlaceholder: {
//     backgroundColor: "#EAEAEA",
//   },
//   infoCardBody: {
//     flex: 1,
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//   },
//   infoCardTitle: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#222",
//     marginBottom: 2,
//     maxWidth: 110,
//   },
//   infoCardMeta: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#222",
//     marginBottom: 2,
//   },
//   infoCardCity: {
//     fontSize: 11,
//     color: "#717171",
//     marginBottom: 2,
//   },
//   infoCardRow: {
//     flexDirection: "row",
//     gap: 8,
//     marginTop: 2,
//   },
//   infoCardStat: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 2,
//   },
//   infoCardStatText: {
//     fontSize: 11,
//     color: "#717171",
//   },
//   // Promo card
//   promoCard: {
//     position: "absolute",
//     left: 12,
//     bottom: 16,
//     maxWidth: width * 0.65,
//   },
//   promoTitle: {
//     color: "#FFF",
//     fontSize: 14,
//     fontWeight: "700",
//     textShadowColor: "rgba(0,0,0,0.8)",
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   promoDesc: {
//     color: "rgba(255,255,255,0.85)",
//     fontSize: 13,
//     lineHeight: 18,
//     marginTop: 2,
//   },
// });
// ─────────────────────────────────────────────
// VideoCard.tsx
//
// ARCHITECTURE RULES IMPLEMENTED HERE:
//  • React.memo with custom comparator → zero re-renders during scroll
//  • Blur hides on onReadyForDisplay only — never onLoad; 5 s timeout + error fallback
//  • Video fades in while blur fades out — viewport-gated by parent FlashList
//  • shouldPlay drives expo-av, not imperative calls from parent
//  • onPlaybackStatus / onLoad callbacks are stable refs (no re-render)
// ─────────────────────────────────────────────

// VideoCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  TikTok/Reels-style video card with aggressive performance optimizations:
//  • React.memo + custom comparator → zero re-renders during scroll
//  • Blur hides on onReadyForDisplay only — 5s timeout + MP4 fallback
//  • Video fades in while blur fades out — viewport-gated by parent FlashList
//  • shouldPlay drives expo-av; no imperative play/pause from parent
//  • All callbacks are stable refs (useCallback with empty deps where safe)
// ─────────────────────────────────────────────────────────────────────────────

// VideoCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  TikTok / Reels-style video card. Clean white property card, no dark backdrop.
//  Right rail: avatar → heart → comment → save → more.
//  Bottom: white PropertyCard with thumbnail + dark text.
//  Blur fades on onReadyForDisplay only. 5s timeout + MP4 fallback chain.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  memo
} from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Easing
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Text } from "@ui-kitten/components";
import {
  Heart,
  ChatCircleDots,
  BookmarkSimple,
  Play,
  CaretDown
} from "phosphor-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import type { AVPlaybackStatus } from "expo-av";
import type {
  FeedProfileContext,
  FeedVideo,
  VideoCardProps
} from "../hooks/Videofeedtypes";
import { resolveFeedProfileContext } from "../utils/feedProfileContext";
import {
  FEED_STREAMING_ONLY,
  feedPreferLocalFirst,
  resolveFeedPlaybackUri,
  resolveFeedVideoPlaceholder,
  feedPlaceholderBlurRadius,
  feedPosterPrefetchUris,
  resolveProgressiveMp4Uri
} from "../config/videoPlayback";
import {
  isPlayableLocalVideoPath,
  isMobileMp4PlaybackUrl,
  normalizePlaybackUrl
} from "../utils/playbackUrl";
import {
  markVideoLoadStart,
  isFeedVideoSurfaceRevealed,
  markFeedVideoSurfaceRevealed
} from "../services/videoPlaybackMetrics";
import { warmFeedPlayback } from "../services/videoSegmentPrefetch";
import { videoPreloadService } from "../services/videoPreloadService";
import { DoubleTapHeartBurst } from "./video/DoubleTapHeartBurst";

const { width, height } = Dimensions.get("window");
const PAGE_HEIGHT = height - 80;

type ListingDetailCardProps = {
  title: string;
  price?: string;
  area?: string;
  plotNumber?: string;
  specsLine?: string;
  location?: string;
  imageUri?: string;
  onPress?: () => void;
};

function isSystemSlideshow(item: FeedVideo, tab: VideoCardProps["tab"]) {
  if (item.isAutoSlideshow) return true;
  if (tab === "landmarks") return true;
  const cap = String(item.caption ?? "").toLowerCase();
  return cap.includes("auto-generated");
}

function formatBedBathLine(
  bedrooms?: number,
  bathrooms?: number
): string | undefined {
  const parts: string[] = [];
  if (bedrooms != null && bedrooms > 0) {
    parts.push(`${bedrooms} bed${bedrooms === 1 ? "" : "s"}`);
  }
  if (bathrooms != null && bathrooms > 0) {
    parts.push(`${bathrooms} bath${bathrooms === 1 ? "" : "s"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function formatMoney(amount: number, currency = "MRU", suffix = ""): string {
  const cur = currency.trim() || "MRU";
  return `${Number(amount).toLocaleString()} ${cur}${suffix}`;
}

function extractListingDetails(
  item: FeedVideo,
  tab: VideoCardProps["tab"]
): ListingDetailCardProps | null {
  if (tab === "rent" && item.property) {
    const p = item.property;
    const title = (p.title ?? item.title ?? "").trim();
    if (!title) return null;
    const price =
      p.price != null && p.price > 0
        ? formatMoney(p.price, p.currency, "/mo")
        : undefined;
    return {
      title,
      price,
      specsLine: formatBedBathLine(p.bedrooms, p.bathrooms),
      location: p.city?.trim() || undefined,
      imageUri: p.images?.[0] ?? item.thumbnailURL
    };
  }

  if (tab === "landmarks" && item.landmark) {
    const lm = item.landmark;
    const title = (item.title ?? lm.title ?? "").trim();
    if (!title) return null;
    const price =
      lm.price != null && lm.price > 0
        ? formatMoney(lm.price, lm.currency || "MRU")
        : undefined;
    const unit = !lm.area_unit || lm.area_unit === "sqm" ? "m²" : lm.area_unit;
    const area =
      lm.area != null && lm.area > 0
        ? `${Number(lm.area).toLocaleString()} ${unit}`
        : undefined;
    const plotNumber = lm.plot_number?.trim()
      ? `Plot #${lm.plot_number.trim()}`
      : undefined;
    const location = [lm.district, lm.region].filter(Boolean).join(", ");
    return {
      title,
      price,
      area,
      plotNumber,
      location: location || undefined,
      imageUri: lm.images?.[0]
    };
  }

  if (tab === "sale" && item.propertySale) {
    const ps = item.propertySale;
    const title = (ps.title ?? item.title ?? "").trim();
    if (!title) return null;
    const price =
      ps.listing_price != null && ps.listing_price > 0
        ? formatMoney(ps.listing_price, "MRU")
        : undefined;
    return {
      title,
      price,
      specsLine: formatBedBathLine(ps.bedrooms, ps.bathrooms),
      location: ps.city?.trim() || undefined,
      imageUri: ps.images?.[0] ?? item.thumbnailURL
    };
  }

  return null;
}

const TikTokMusicDisc = memo(
  ({
    imageUri,
    size = 46,
    spinning = true
  }: {
    imageUri?: string;
    size?: number;
    spinning?: boolean;
  }) => {
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!spinning) {
        spin.stopAnimation();
        return;
      }
      spin.setValue(0);
      const anim = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 6500,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      anim.start();
      return () => anim.stop();
    }, [spin, spinning]);

    const rotate = spin.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"]
    });

    return (
      <View
        style={[styles.musicDiscStack, { width: size + 10, height: size + 14 }]}
      >
        <View style={styles.musicDiscArm} />
        <Animated.View
          style={[
            styles.musicDiscSpin,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ rotate }]
            }
          ]}
        >
          <View
            style={[
              styles.musicDiscOuter,
              { width: size, height: size, borderRadius: size / 2 }
            ]}
          >
            {imageUri ? (
              <ExpoImage
                source={{ uri: imageUri }}
                style={[
                  styles.musicDiscArt,
                  {
                    width: size - 10,
                    height: size - 10,
                    borderRadius: (size - 10) / 2
                  }
                ]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  styles.musicDiscArtFallback,
                  {
                    width: size - 10,
                    height: size - 10,
                    borderRadius: (size - 10) / 2
                  }
                ]}
              />
            )}
          </View>
        </Animated.View>
      </View>
    );
  }
);

const ListingDetailCard = memo(
  ({
    title,
    price,
    area,
    plotNumber,
    location,
    imageUri,
    specsLine,
    onPress
  }: ListingDetailCardProps) => {
    const landParts = [area, plotNumber].filter(Boolean);
    const detailsLine = specsLine ?? landParts.join(" · ");

    return (
      <TouchableOpacity
        style={styles.listingDetailCard}
        onPress={onPress}
        activeOpacity={0.94}
        testID="listing-detail-card"
      >
        <View style={styles.listingDetailThumbWrap}>
          {imageUri ? (
            <ExpoImage
              source={{ uri: imageUri }}
              style={styles.listingDetailThumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View
              style={[
                styles.listingDetailThumb,
                styles.listingDetailThumbEmpty
              ]}
            />
          )}
        </View>

        <View style={styles.listingDetailBody}>
          <Text style={styles.listingDetailTitle} numberOfLines={1}>
            {title}
          </Text>

          {price ? (
            <Text style={styles.listingDetailPrice} numberOfLines={1}>
              {price}
            </Text>
          ) : null}

          {detailsLine ? (
            <Text style={styles.listingDetailMeta} numberOfLines={1}>
              {detailsLine}
            </Text>
          ) : null}

          {location ? (
            <Text style={styles.listingDetailLocation} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }
);

// ── TikTok-calibrated layout ────────────────────────────────────────────────
const ICON_SIZE = 35;
const MORE_SIZE = 26;
const AVATAR_SIZE = 48;
const BADGE_SIZE = 18;
const ACTION_GAP = 16;
const RAIL_RIGHT = 10;
const RAIL_BOTTOM = 100;

// ── Timing ──────────────────────────────────────────────────────────────────
const REVEAL_MS = 80;
const STREAM_FALLBACK_MS = 2500;

// ── Media fill absolute box ─────────────────────────────────────────────────
const MEDIA_FILL = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width,
  height: PAGE_HEIGHT
};

// ── Utilities ───────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return v >= 10
      ? `${Math.round(v)}M`
      : `${v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

function logDiagnostic(url: string, id: string | number) {
  if (!__DEV__) return;
  const u = normalizePlaybackUrl(url);
  console.log(`\n[VideoCard ${id}] URI: ${u}`);
  if (u.startsWith("file://")) {
    console.log(isPlayableLocalVideoPath(u) ? "  ✅ Local" : "  🔴 Bad local");
  } else if (u.includes(".m3u8") || u.includes("/hls/")) {
    console.log("  ✅ HLS");
  } else if (isMobileMp4PlaybackUrl(u)) {
    console.log("  ✅ Mobile MP4");
  } else {
    console.log("  ⚠️ Unknown");
  }
}

// ── Hook: double-tap detector ─────────────────────────────────────────────────
function useDoubleTap(onSingle: () => void, onDouble: () => void) {
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      timer.current && clearTimeout(timer.current);
      timer.current = null;
      lastTap.current = 0;
      onDouble();
      return;
    }
    lastTap.current = now;
    timer.current = setTimeout(() => {
      timer.current = null;
      onSingle();
    }, 300);
  }, [onSingle, onDouble]);
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

const ActionItem = memo(
  ({
    icon,
    count,
    onPress
  }: {
    icon: React.ReactNode;
    count?: number;
    onPress: () => void;
  }) => {
    const fire = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress();
    }, [onPress]);

    return (
      <TouchableOpacity
        style={styles.actionItem}
        onPress={fire}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        {icon}
        {count !== undefined && (
          <Text style={styles.actionCount}>{formatCount(count)}</Text>
        )}
      </TouchableOpacity>
    );
  }
);

const HeartAction = memo(
  ({
    liked,
    count,
    onPress
  }: {
    liked: boolean;
    count: number;
    onPress: () => void;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = useCallback(() => {
      Haptics.impactAsync(
        liked
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
      ).catch(() => {});
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          tension: 240,
          useNativeDriver: true
        })
      ]).start();
      onPress();
    }, [liked, onPress]);

    return (
      <TouchableOpacity
        style={styles.actionItem}
        onPress={handlePress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Heart
            size={ICON_SIZE}
            weight="fill"
            color={liked ? "#FF2C55" : "#fff"}
          />
        </Animated.View>
        <Text style={styles.actionCount}>
          {formatCount(isNaN(count) ? 0 : count)}
        </Text>
      </TouchableOpacity>
    );
  }
);

const ProfileBadge = memo(
  ({
    avatarUrl,
    initial,
    isOrganization,
    onPress
  }: {
    avatarUrl?: string;
    initial: string;
    isOrganization: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
    >
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <ExpoImage
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        {isOrganization && (
          <View style={styles.orgBadge}>
            <CaretDown size={10} weight="bold" color="#121212" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
);

// ── Main VideoCard ────────────────────────────────────────────────────────────
const VideoCard = ({
  item,
  index,
  isActive,
  isPreloaded,
  isMuted,
  shouldAutoplay = true,
  tab,
  liked,
  saved,
  likesCount,
  savesCount,
  mountDecoder = true,
  onLike,
  onSave,
  onPress,
  onLongPress,
  onComment,
  onMore,
  onPlaybackStatus,
  onLoad,
  videoRef,
  onProfilePress,
  onListingCardPress,
  connectionQuality = "good",
  userPaused = false,
  onUserPauseChange
}: VideoCardProps) => {
  const { t } = useTranslation();
  const innerVideoRef = useRef<InstanceType<typeof Video> | null>(null);
  const [likeBurstVisible, setLikeBurstVisible] = useState(false);

  // ── Playback state ───────────────────────────────────────────────────────
  const [surfaceReady, setSurfaceReady] = useState(() =>
    isFeedVideoSurfaceRevealed(item.ID)
  );
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamUri, setStreamUri] = useState("");
  const [allowCdnFallback, setAllowCdnFallback] = useState(false);

  const posterOpacity = useRef(
    new Animated.Value(isFeedVideoSurfaceRevealed(item.ID) ? 0 : 1)
  ).current;
  const rebufferVeil = useRef(new Animated.Value(0)).current;
  const blurDoneRef = useRef(isFeedVideoSurfaceRevealed(item.ID));
  const surfaceMarkedRef = useRef(isFeedVideoSurfaceRevealed(item.ID));
  const streamUriRef = useRef(streamUri);
  const ttffEndRef = useRef<(() => void) | null>(null);
  const wasInactiveRef = useRef(false);

  // ── Derived data ─────────────────────────────────────────────────────────
  const anyFeed = item as unknown as Record<string, unknown>;
  const placeholder = resolveFeedVideoPlaceholder(item);
  const placeholderUri = placeholder?.uri;
  const placeholderKind = placeholder?.kind;

  const primaryStream = useMemo(
    () => resolveFeedPlaybackUri(anyFeed, connectionQuality),
    [anyFeed, connectionQuality]
  );
  const mp4Fallback = useMemo(
    () => resolveProgressiveMp4Uri(anyFeed, connectionQuality),
    [anyFeed, connectionQuality]
  );
  const preferLocalFirst = useMemo(
    () => feedPreferLocalFirst(connectionQuality),
    [connectionQuality]
  );
  const profileCtx = useMemo(
    () => resolveFeedProfileContext(item, tab),
    [item, tab]
  );
  const listingDetails = useMemo(
    () => (item.isPromotional ? null : extractListingDetails(item, tab)),
    [item, tab]
  );
  const showSlideshowChrome = isSystemSlideshow(item, tab);
  /** Slideshow / wide listing images: letterbox in frame — never COVER-crop overlays away. */
  const useLetterboxMedia =
    showSlideshowChrome || Boolean(item.isAutoSlideshow);
  const videoResizeMode = useLetterboxMedia
    ? ResizeMode.CONTAIN
    : ResizeMode.COVER;
  const posterContentFit = useLetterboxMedia ? "contain" : "cover";

  // ── URI resolution ────────────────────────────────────────────────────────
  const pickUri = useCallback(
    (_allowCdn: boolean) => {
      const local = videoPreloadService.getLocalPlaybackUri(item.ID);
      if (local && isPlayableLocalVideoPath(local)) return local;
      // Never return "" — always show blur/thumbnail until first frame, never black.
      return normalizePlaybackUrl(
        videoPreloadService.getPlaybackUri(item.ID, primaryStream) ||
          primaryStream ||
          mp4Fallback
      );
    },
    [item.ID, primaryStream, mp4Fallback]
  );

  const shouldAllowCdn = useCallback(() => {
    if (FEED_STREAMING_ONLY) return true;
    const hasLocal = Boolean(videoPreloadService.getLocalPlaybackUri(item.ID));
    if (hasLocal) return true;
    if (!preferLocalFirst) return true;
    return !videoPreloadService.isVideoPreloading(item.ID);
  }, [item.ID, preferLocalFirst]);

  // ── Reset on new item ──────────────────────────────────────────────────────
  useEffect(() => {
    const cdn = shouldAllowCdn();
    setAllowCdnFallback(cdn);
    const uri = pickUri(cdn);
    setStreamUri(uri);
    streamUriRef.current = uri;

    const revealed = isFeedVideoSurfaceRevealed(item.ID);
    if (!revealed) {
      setSurfaceReady(false);
      surfaceMarkedRef.current = false;
      blurDoneRef.current = false;
      posterOpacity.setValue(placeholderUri ? 1 : 0);
    } else {
      setSurfaceReady(true);
      surfaceMarkedRef.current = true;
      blurDoneRef.current = true;
      posterOpacity.setValue(0);
    }
  }, [
    item.ID,
    primaryStream,
    placeholderUri,
    posterOpacity,
    pickUri,
    shouldAllowCdn
  ]);

  // ── Poster lifecycle ────────────────────────────────────────────────────────
  const hidePoster = useCallback(
    (instant = false) => {
      if (blurDoneRef.current) return;
      blurDoneRef.current = true;
      surfaceMarkedRef.current = true;
      markFeedVideoSurfaceRevealed(item.ID);
      setSurfaceReady(true);
      ttffEndRef.current?.();
      ttffEndRef.current = null;
      if (instant) {
        posterOpacity.setValue(0);
        return;
      }
      Animated.timing(posterOpacity, {
        toValue: 0,
        duration: REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    },
    [item.ID, posterOpacity]
  );

  const restorePoster = useCallback(() => {
    surfaceMarkedRef.current = false;
    blurDoneRef.current = false;
    setSurfaceReady(false);
    posterOpacity.setValue(placeholderUri ? 1 : 0);
  }, [placeholderUri, posterOpacity]);

  const revealPoster = useCallback(() => {
    if (blurDoneRef.current) return;
    if (__DEV__) console.log(`[VideoCard] onReadyForDisplay ${item.ID}`);
    hidePoster(false);
  }, [hidePoster, item.ID]);

  /** Pre-warm adjacent rows: mark first frame without waiting for active swipe. */
  const warmFirstFrame = useCallback(() => {
    if (blurDoneRef.current) return;
    markFeedVideoSurfaceRevealed(item.ID);
    blurDoneRef.current = true;
    surfaceMarkedRef.current = true;
    setSurfaceReady(true);
  }, [item.ID]);

  const handleLoad = useCallback(
    (status: AVPlaybackStatus) => {
      if (__DEV__) console.log(`[VideoCard] onLoad ${item.ID}`);
      onLoad?.(status);
    },
    [onLoad, item.ID]
  );

  // ── Error fallback chain ──────────────────────────────────────────────────
  const handleError = useCallback(() => {
    const current = streamUriRef.current;
    if (current.startsWith("file://")) {
      setAllowCdnFallback(true);
      restorePoster();
      const fallback = normalizePlaybackUrl(primaryStream || mp4Fallback);
      streamUriRef.current = fallback;
      setStreamUri(fallback);
      return;
    }
    if (
      current !== mp4Fallback &&
      mp4Fallback &&
      mp4Fallback !== primaryStream
    ) {
      restorePoster();
      const fallback = normalizePlaybackUrl(mp4Fallback);
      streamUriRef.current = fallback;
      setStreamUri(fallback);
      return;
    }
    if (__DEV__) console.error(`[VideoCard] Fatal error ${item.ID}`, current);
    hidePoster();
  }, [primaryStream, mp4Fallback, restorePoster, hidePoster, item.ID]);

  const handleStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        setIsBuffering(status.isBuffering ?? false);
      }
      onPlaybackStatus(status);
    },
    [onPlaybackStatus]
  );

  // ── Effects: CDN warm, disk cache, preload ─────────────────────────────────
  useEffect(() => {
    return videoPreloadService.subscribeLocalReady(item.ID, (localPath) => {
      if (
        !isPlayableLocalVideoPath(localPath) ||
        streamUriRef.current === localPath
      )
        return;
      const revealed = isFeedVideoSurfaceRevealed(item.ID);
      if (revealed) {
        streamUriRef.current = localPath;
        setAllowCdnFallback(true);
        setStreamUri(localPath);
        posterOpacity.setValue(0);
        return;
      }
      streamUriRef.current = localPath;
      setAllowCdnFallback(true);
      setStreamUri(localPath);
    });
  }, [item.ID, posterOpacity]);

  useEffect(() => {
    if (!isActive && !isPreloaded) return;
    const warmUri = primaryStream || streamUriRef.current;
    if (!warmUri) return;
    warmFeedPlayback(String(item.ID), warmUri, connectionQuality, mp4Fallback);
  }, [
    isActive,
    isPreloaded,
    item.ID,
    primaryStream,
    connectionQuality,
    mp4Fallback
  ]);

  useEffect(() => {
    if (!isActive && !isPreloaded) return;
    videoPreloadService.ensureVideo(item.ID);
  }, [isActive, isPreloaded, item.ID]);

  useEffect(() => {
    const urls = feedPosterPrefetchUris(item);
    urls.forEach((u) => {
      const t = u.trim();
      if (!t) return;
      ExpoImage.prefetch(t).catch(() => {});
      Image.prefetch(t).catch(() => {});
    });
  }, [item.ID]);

  // Instant resume when scrolling back to a decoded clip.
  useEffect(() => {
    if (!isActive) return;
    if (isFeedVideoSurfaceRevealed(item.ID) || blurDoneRef.current) {
      hidePoster(true);
    }
  }, [isActive, item.ID, hidePoster]);

  // Active / inactive — never re-blur a decoded clip (instant scroll-back).
  useEffect(() => {
    const revealed = blurDoneRef.current || isFeedVideoSurfaceRevealed(item.ID);
    if (!isActive) {
      wasInactiveRef.current = true;
      posterOpacity.setValue(revealed ? 0 : 1);
      return;
    }
    if (revealed) {
      wasInactiveRef.current = false;
      blurDoneRef.current = true;
      setSurfaceReady(true);
      posterOpacity.setValue(0);
      return;
    }
    if (wasInactiveRef.current) {
      wasInactiveRef.current = false;
      posterOpacity.setValue(1);
    }
  }, [isActive, placeholderUri, posterOpacity, item.ID]);

  useEffect(() => {
    if (!surfaceReady || !isActive) {
      rebufferVeil.setValue(0);
      return;
    }
    Animated.timing(rebufferVeil, {
      toValue: isBuffering ? 0.12 : 0,
      duration: isBuffering ? 120 : 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [isBuffering, surfaceReady, isActive, rebufferVeil]);

  useEffect(() => {
    if (!isActive || !streamUriRef.current || surfaceReady) return;
    if (
      streamUriRef.current === mp4Fallback ||
      !mp4Fallback ||
      mp4Fallback === primaryStream
    )
      return;
    const t = setTimeout(() => {
      if (!surfaceMarkedRef.current && mp4Fallback) {
        const fallback = normalizePlaybackUrl(mp4Fallback);
        streamUriRef.current = fallback;
        setStreamUri(fallback);
      }
    }, STREAM_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [isActive, surfaceReady, mp4Fallback, primaryStream]);

  useEffect(() => {
    if (!isActive || !streamUriRef.current) {
      ttffEndRef.current = null;
      return;
    }
    ttffEndRef.current = markVideoLoadStart(item.ID);
    return () => {
      ttffEndRef.current = null;
    };
  }, [isActive, item.ID]);

  useEffect(() => {
    if (!__DEV__ || !isActive || !streamUriRef.current) return;
    logDiagnostic(streamUriRef.current, item.ID);
  }, [isActive, item.ID]);

  // ── Hard stops ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) return;
    const v = innerVideoRef.current as any;
    if (!v) return;
    v.pauseAsync?.().catch(() => {});
    v.setIsMutedAsync?.(true).catch(() => {});
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !userPaused) return;
    const v = innerVideoRef.current as any;
    if (!v) return;
    v.pauseAsync?.().catch(() => {});
    v.setIsMutedAsync?.(true).catch(() => {});
  }, [userPaused, isActive]);

  // ── Ref forwarding ────────────────────────────────────────────────────────
  const handleRef = useCallback(
    (r: InstanceType<typeof Video> | null) => {
      innerVideoRef.current = r;
      videoRef(r);
    },
    [videoRef]
  );

  useLayoutEffect(() => {
    if (!mountDecoder) {
      innerVideoRef.current = null;
      videoRef(null);
    }
  }, [mountDecoder, videoRef]);

  // ── Avatar prefetch ─────────────────────────────────────────────────────
  useEffect(() => {
    const u = profileCtx?.avatarUrl?.trim();
    if (!u || (!u.startsWith("http://") && !u.startsWith("https://"))) return;
    ExpoImage.prefetch(u).catch(() => {});
  }, [profileCtx?.avatarUrl]);

  // ── Tap handlers ─────────────────────────────────────────────────────────
  const handleSingleTap = useCallback(() => {
    onUserPauseChange?.(!userPaused);
    onPress();
  }, [onPress, onUserPauseChange, userPaused]);

  const handleDoubleTap = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    setLikeBurstVisible(true);
    if (!liked) onLike();
  }, [onLike, liked]);

  const handleTap = useDoubleTap(handleSingleTap, handleDoubleTap);

  const shouldPlay = isActive && !userPaused && shouldAutoplay;
  const showPause = isActive && userPaused;
  const showActions = !item.isPromotional;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.page}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.tapArea}
        onPress={handleTap}
        onLongPress={onLongPress}
        delayLongPress={400}
      >
        <View style={styles.stage} collapsable={false}>
          {/* Decoder — mount in ±2 window; only active row plays (TikTok pipeline) */}
          {mountDecoder && streamUri ? (
            <View pointerEvents="none" style={MEDIA_FILL}>
              <Video
                key={`feed-video-${item.ID}`}
                ref={handleRef}
                source={{ uri: streamUri }}
                style={MEDIA_FILL}
                resizeMode={videoResizeMode}
                shouldPlay={shouldPlay}
                isLooping
                isMuted={isMuted || !isActive}
                volume={isActive && !isMuted ? 1.0 : 0}
                useNativeControls={false}
                onReadyForDisplay={isActive ? revealPoster : warmFirstFrame}
                onLoad={handleLoad}
                onError={handleError}
                onPlaybackStatusUpdate={isActive ? handleStatus : undefined}
                progressUpdateIntervalMillis={isActive ? 100 : 400}
              />
            </View>
          ) : null}

          {/* Poster / blur */}
          <Animated.View
            pointerEvents="none"
            style={[MEDIA_FILL, styles.posterLayer, { opacity: posterOpacity }]}
          >
            {placeholderUri && placeholderKind ? (
              <ExpoImage
                source={{ uri: placeholderUri }}
                style={MEDIA_FILL}
                contentFit={posterContentFit}
                cachePolicy="memory-disk"
                priority={isActive ? "high" : "normal"}
                recyclingKey={`poster-${item.ID}`}
                transition={0}
                blurRadius={feedPlaceholderBlurRadius(
                  placeholderKind,
                  surfaceReady
                )}
              />
            ) : (
              <View style={[MEDIA_FILL, { backgroundColor: "#111" }]} />
            )}
            <View style={styles.posterScrim} />
          </Animated.View>

          {/* Rebuffer veil */}
          <Animated.View
            pointerEvents="none"
            style={[MEDIA_FILL, styles.rebufferVeil, { opacity: rebufferVeil }]}
          />

          {/* Pause overlay */}
          {showPause && (
            <View
              pointerEvents="none"
              style={[MEDIA_FILL, styles.pauseOverlay]}
            >
              <View style={styles.pauseCircle}>
                <Play
                  weight="fill"
                  size={44}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
          )}
        </View>

        <DoubleTapHeartBurst
          visible={likeBurstVisible}
          onFinished={() => setLikeBurstVisible(false)}
        />
      </TouchableOpacity>

      {/* ── Right Action Rail ───────────────────────────────────────────────── */}
      <View style={styles.actionRail} pointerEvents="box-none">
        {(tab === "sale" || tab === "rent" || tab === "landmarks") &&
          profileCtx && (
            <ProfileBadge
              avatarUrl={profileCtx.avatarUrl}
              initial={profileCtx.initial}
              isOrganization={profileCtx.isOrganization}
              onPress={() => onProfilePress?.(profileCtx)}
            />
          )}

        {showActions && (
          <HeartAction liked={liked} count={likesCount} onPress={onLike} />
        )}

        {showActions && (
          <ActionItem
            icon={
              <ChatCircleDots size={ICON_SIZE} weight="fill" color="#fff" />
            }
            count={item.commentsCount ?? 0}
            onPress={onComment}
          />
        )}

        {showActions && (
          <ActionItem
            icon={
              <BookmarkSimple
                size={ICON_SIZE}
                weight="fill"
                color={saved ? "#FFD54F" : "#fff"}
              />
            }
            count={isNaN(savesCount) ? 0 : savesCount}
            onPress={onSave}
          />
        )}

        <ActionItem
          icon={
            <MaterialIcons name="more-vert" size={MORE_SIZE} color="#fff" />
          }
          onPress={onMore}
        />
      </View>

      {/* ── Bottom listing card (rent / sale / land) ──────────────────────── */}
      {listingDetails && (
        <ListingDetailCard {...listingDetails} onPress={onListingCardPress} />
      )}

      {showSlideshowChrome && (
        <View style={styles.musicDiscAnchor} pointerEvents="none">
          <TikTokMusicDisc
            imageUri={
              listingDetails?.imageUri ??
              item.thumbnailURL ??
              item.property?.images?.[0] ??
              item.landmark?.images?.[0] ??
              item.propertySale?.images?.[0]
            }
            spinning={isActive && !userPaused && shouldAutoplay}
          />
        </View>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    width,
    height: PAGE_HEIGHT,
    backgroundColor: "#141414"
  },
  tapArea: {
    width,
    height: PAGE_HEIGHT
  },
  stage: {
    width,
    height: PAGE_HEIGHT,
    overflow: "hidden",
    backgroundColor: "#141414"
  },
  posterLayer: {
    backgroundColor: "#141414",
    zIndex: 10
  },
  posterScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)"
  },
  rebufferVeil: {
    backgroundColor: "rgba(0,0,0,0.12)",
    zIndex: 11
  },
  pauseOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 12
  },
  pauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center"
  },
  actionRail: {
    position: "absolute",
    right: RAIL_RIGHT,
    bottom: RAIL_BOTTOM,
    alignItems: "center",
    zIndex: 20
  },
  actionItem: {
    alignItems: "center",
    marginBottom: ACTION_GAP
  },
  actionCount: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  avatarWrap: {
    position: "relative"
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#fff"
  },
  avatarPlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700"
  },
  orgBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FAFAFA"
    // light shadow
  },
  musicDiscAnchor: {
    position: "absolute",
    bottom: 22,
    right: 12,
    zIndex: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  musicDiscStack: {
    alignItems: "center",
    justifyContent: "flex-end"
  },
  musicDiscArm: {
    position: "absolute",
    top: 0,
    right: 2,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
    borderTopRightRadius: 8,
    transform: [{ rotate: "18deg" }],
    zIndex: 3
  },
  musicDiscSpin: {
    justifyContent: "center",
    alignItems: "center"
  },
  musicDiscOuter: {
    backgroundColor: "#111",
    borderWidth: 3,
    borderColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4
      },
      android: {
        elevation: 6
      }
    })
  },
  musicDiscArt: {
    backgroundColor: "#222"
  },
  musicDiscArtFallback: {
    backgroundColor: "#333"
  },
  listingDetailCard: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 68,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    minHeight: 76,
    zIndex: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14
      },
      android: {
        elevation: 5
      }
    })
  },
  listingDetailThumbWrap: {
    width: 78,
    alignSelf: "stretch",
    position: "relative",
    backgroundColor: "#EBEBEB"
  },
  listingDetailThumb: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  listingDetailThumbEmpty: {
    backgroundColor: "#E4E4E4"
  },
  listingDetailBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 12
  },
  listingDetailTitle: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.25,
    lineHeight: 18
  },
  listingDetailPrice: {
    color: "#222222",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.15,
    lineHeight: 17,
    marginTop: 2
  },
  listingDetailMeta: {
    color: "#484848",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 2
  },
  listingDetailLocation: {
    color: "#717171",
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 14,
    marginTop: 3
  }
});

// ── Memo comparator (zero re-renders during scroll) ─────────────────────────
function propsEqual(prev: VideoCardProps, next: VideoCardProps): boolean {
  return (
    prev.item.ID === next.item.ID &&
    prev.index === next.index &&
    prev.isActive === next.isActive &&
    prev.isPreloaded === next.isPreloaded &&
    prev.isMuted === next.isMuted &&
    prev.shouldAutoplay === next.shouldAutoplay &&
    prev.tab === next.tab &&
    prev.liked === next.liked &&
    prev.saved === next.saved &&
    prev.likesCount === next.likesCount &&
    prev.savesCount === next.savesCount &&
    prev.mountDecoder === next.mountDecoder &&
    prev.connectionQuality === next.connectionQuality &&
    prev.userPaused === next.userPaused
  );
}

export default memo(VideoCard, propsEqual);
