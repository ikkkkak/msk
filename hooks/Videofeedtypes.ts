// ─────────────────────────────────────────────
// videoFeedTypes.ts
// Shared type contracts for the video feed system
// ─────────────────────────────────────────────

import type { ConnectionQuality } from "./useConnectivity";

export type FeedTab = "rent" | "sale" | "landmarks";

/** Profile preview passed from feed avatar tap → ProfileSheet. */
export type FeedProfileContext = {
  profileUserId: number | string;
  avatarUrl?: string;
  displayName: string;
  initial: string;
  isOrganization: boolean;
  organizationId?: number;
};

/** Set when merging unified feed — drives like/save/navigation per clip. */
export type FeedVideoKind = FeedTab;

export interface FeedVideo {
  ID: number | string;
  /** Source feed after unified merge (sale / rent / landmarks). */
  _feedKind?: FeedVideoKind;
  videoURL?: string;
  VideoURL?: string;
  /** Adaptive HLS manifest (preferred when present; expo-av streams, no full download). */
  hlsURL?: string;
  videoHlsURL?: string;
  video_hls_url?: string;
  /** Low-bitrate MP4 for cellular / 3G when HLS not available (optional; backend). */
  mobile_video_url?: string;
  preview_video_url?: string;
  /** Default true; set false to force progressive MP4 when both HLS and MP4 exist. */
  preferHls?: boolean;
  thumbnailURL?: string;
  thumbnail_url?: string;
  /** Server-generated blurred first frame (TikTok-style placeholder). */
  preview_blur_url?: string;
  previewBlurURL?: string;
  liked?: boolean;
  saved?: boolean;
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  property?: {
    ID: number;
    title?: string;
    city?: string;
    bedrooms?: number;
    bathrooms?: number;
    price?: number;
    currency?: string;
    images?: string[];
    rating?: number;
  };
  propertySale?: {
    id: number;
    title?: string;
    city?: string;
    bedrooms?: number;
    bathrooms?: number;
    listing_price?: number;
    images?: string[];
    organization?: {
      id?: number;
      name?: string;
      logoURL?: string;
      logo?: string;
    };
    owner?: {
      id?: number;
      ID?: number;
      firstName?: string;
      lastName?: string;
      avatarURL?: string;
      avatarUrl?: string;
    };
    owner_id?: number;
  };
  landmark?: {
    id?: number;
    title?: string;
    name?: string;
    zone_name?: string;
    district?: string;
    region?: string;
    area?: number;
    area_unit?: string;
    plot_number?: string;
    price?: number;
    currency?: string;
    surface_area?: number;
    images?: string[];
    owner?: {
      firstName?: string;
      lastName?: string;
      avatarURL?: string;
    };
    organization?: {
      name?: string;
      logo?: string;
    };
  };
  landmarkID?: number;
  isPromotional?: boolean;
  /** True for server-generated slideshow clips from listing photos. */
  isAutoSlideshow?: boolean;
  title?: string;
  description?: string;
  caption?: string;
  organization?: {
    id?: number;
    name?: string;
    logoURL?: string;
    logo?: string;
  };
  userID?: number;
  user?: {
    ID?: number;
    id?: number;
    firstName?: string;
    lastName?: string;
    avatarURL?: string;
    avatarUrl?: string;
  };
  User?: FeedVideo["user"];
}

export interface PlaybackState {
  /** Index currently visible / playing */
  activeIndex: number;
  /** Indexes buffering (preloaded) but not playing */
  preloadedIndexes: Set<number>;
  /** Indexes that are paused but mounted */
  pausedIndexes: Set<number>;
  isMuted: boolean;
  isUserPaused: boolean;
}

export interface VideoCardProps {
  item: FeedVideo;
  index: number;
  isActive: boolean;
  isPreloaded: boolean;
  isMuted: boolean;
  /** When false (e.g. low connectivity), native player stays paused; hook still can try playAsync. */
  shouldAutoplay?: boolean;
  tab: FeedTab;
  liked: boolean;
  saved: boolean;
  likesCount: number;
  savesCount: number;
  /**
   * When false, the native Video decoder is not mounted (poster only). Reduces RAM/CPU
   * for off-window rows when autoplay is off, or beyond the preload window when on.
   */
  mountDecoder?: boolean;
  /** Used with `resolveStreamUri` to pick mobile-tier URLs on 3G. */
  connectionQuality?: ConnectionQuality;
  /** User tapped pause — must stay paused until they tap again. */
  userPaused?: boolean;
  onUserPauseChange?: (paused: boolean) => void;
  onLike: () => void;
  onSave: () => void;
  onPress: () => void;
  onLongPress: () => void;
  onComment: () => void;
  onMore: () => void;
  onPlaybackStatus: (status: any) => void;
  onLoad: (status: any) => void;
  videoRef: (ref: any) => void;
  onProfilePress?: (ctx: FeedProfileContext) => void;
  /** Tap on bottom listing info card (rent/sale/landmark). When omitted, card uses pointerEvents="none" so video tap still works. */
  onListingCardPress?: () => void;
}

export interface PaginationCursor {
  nextCursor: string | null;
  hasMore: boolean;
  isFetching: boolean;
}
