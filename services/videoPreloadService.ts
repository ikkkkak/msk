/**
 * Video preload service — feed buffer + disk cache orchestration.
 */

import { Video } from "../types/video";
import { PropertySaleVideo } from "../types/propertySaleVideo";
import { LandmarkVideo } from "../types/landmarkVideo";
import {
  FEED_STREAMING_ONLY,
  resolveFeedCacheTargetUri,
  resolveFeedPlaybackUri,
} from "../config/videoPlayback";
import { isPlayableLocalVideoPath } from "../utils/playbackUrl";
import { videoFileCacheService } from "./videoFileCache";

export type VideoPreloadItem = Video | PropertySaleVideo | LandmarkVideo;

export interface VideoPreloadInput {
  ID: number | string;
  videoURL?: string;
  VideoURL?: string;
  [key: string]: any;
}

export type FeedNetworkPolicy = "cdn-first" | "local-first";

const BUFFER_SIZE_AHEAD = 6;
const BUFFER_SIZE_BEHIND = 4;
const PRIORITY_ACTIVE = 3000;
const PRIORITY_FIRST = 2500;
const PRIORITY_NEAR = 200;

export function feedRowCacheKey(id: number | string): string {
  return String(id);
}

export function feedVideoFileCacheId(id: number | string): number {
  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }
  const s = String(id);
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h === 0 ? 1 : h;
}

interface VideoBufferItem {
  rowKey: string;
  fileCacheId: number;
  playbackUrl: string;
  cacheUrl: string;
  metadata: VideoPreloadInput;
  localPath: string | null;
  isPreloading: boolean;
  isReady: boolean;
  unsubscribeFileCache?: () => void;
}

type LocalReadyListener = (localPath: string) => void;

class VideoPreloadService {
  private buffer = new Map<string, VideoBufferItem>();
  private readyListeners = new Map<string, Set<LocalReadyListener>>();
  private currentIndex = 0;
  private videos: VideoPreloadInput[] = [];
  private networkPolicy: FeedNetworkPolicy = "cdn-first";

  setNetworkPolicy(policy: FeedNetworkPolicy): void {
    this.networkPolicy = policy;
  }

  private resolveCacheUrl(video: VideoPreloadInput): string {
    return (
      resolveFeedCacheTargetUri(video) ||
      resolveFeedPlaybackUri(video) ||
      video.videoURL ||
      video.VideoURL ||
      ""
    );
  }

  private syncDiskPath(fileCacheId: number, cacheUrl: string): string | null {
    if (!cacheUrl || cacheUrl.includes(".m3u8")) return null;
    const fullOnly = this.networkPolicy === "cdn-first";
    return videoFileCacheService.getCachedVideoPathSync(fileCacheId, cacheUrl, {
      fullOnly,
    });
  }

  getLocalPlaybackUri(id: number | string): string | null {
    const rowKey = feedRowCacheKey(id);
    const item = this.buffer.get(rowKey);
    if (item?.localPath) {
      if (!isPlayableLocalVideoPath(item.localPath)) {
        return null;
      }
      if (this.networkPolicy === "cdn-first" && item.localPath.includes(".partial")) {
        return null;
      }
      return item.localPath;
    }
    const video = this.videos.find((v) => feedRowCacheKey(v.ID) === rowKey);
    if (!video) return null;
    const cacheUrl = this.resolveCacheUrl(video);
    const path = this.syncDiskPath(feedVideoFileCacheId(id), cacheUrl);
    if (path && !isPlayableLocalVideoPath(path)) return null;
    return path;
  }

  isVideoPreloading(id: number | string): boolean {
    if (this.networkPolicy === "cdn-first") return false;
    const rowKey = feedRowCacheKey(id);
    const item = this.buffer.get(rowKey);
    if (item?.isPreloading) return true;
    const video = this.videos.find((v) => feedRowCacheKey(v.ID) === rowKey);
    if (!video) return false;
    return videoFileCacheService.isQueuedOrDownloading(
      feedVideoFileCacheId(id),
    );
  }

  subscribeLocalReady(
    id: number | string,
    listener: LocalReadyListener,
  ): () => void {
    const rowKey = feedRowCacheKey(id);
    if (!this.readyListeners.has(rowKey)) {
      this.readyListeners.set(rowKey, new Set());
    }
    const set = this.readyListeners.get(rowKey)!;
    set.add(listener);
    const existing = this.getLocalPlaybackUri(id);
    if (existing) {
      listener(existing);
    }
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.readyListeners.delete(rowKey);
      }
    };
  }

  private emitLocalReady(rowKey: string, localPath: string): void {
    for (const listener of this.readyListeners.get(rowKey) ?? []) {
      listener(localPath);
    }
  }

  private markLocalReady(rowKey: string, localPath: string): void {
    const item = this.buffer.get(rowKey);
    if (!item) return;
    item.localPath = localPath;
    item.isPreloading = false;
    item.isReady = true;
    if (!isPlayableLocalVideoPath(localPath)) {
      return;
    }
    if (this.networkPolicy === "cdn-first" && localPath.includes(".partial")) {
      return;
    }
    this.emitLocalReady(rowKey, localPath);
  }

  private attachFileCacheListener(
    rowKey: string,
    fileCacheId: number,
    _cacheUrl: string,
  ): void {
    const item = this.buffer.get(rowKey);
    if (!item) return;
    item.unsubscribeFileCache?.();
    item.unsubscribeFileCache = videoFileCacheService.onDownloadComplete(
      fileCacheId,
      (localPath) => {
        this.markLocalReady(rowKey, localPath);
      },
    );
  }

  private priorityForIndex(index: number): number {
    if (index === this.currentIndex) return PRIORITY_ACTIVE;
    if (index === 0 && this.currentIndex === 0) return PRIORITY_FIRST;
    const distance = Math.abs(index - this.currentIndex);
    return Math.max(10, PRIORITY_NEAR - distance * 40);
  }

  ensureVideo(id: number | string): void {
    const rowKey = feedRowCacheKey(id);
    const index = this.videos.findIndex((v) => feedRowCacheKey(v.ID) === rowKey);
    const video =
      index >= 0 ? this.videos[index] : this.videos.find((v) => feedRowCacheKey(v.ID) === rowKey);
    if (!video) return;

    const fileCacheId = feedVideoFileCacheId(id);
    const cacheUrl = this.resolveCacheUrl(video);
    const syncPath = this.syncDiskPath(fileCacheId, cacheUrl);
    if (syncPath) {
      if (this.buffer.has(rowKey)) {
        this.markLocalReady(rowKey, syncPath);
      }
      return;
    }

    videoFileCacheService.boostPriority(fileCacheId, PRIORITY_ACTIVE);

    if (!this.buffer.has(rowKey)) {
      void this.preloadVideo(index >= 0 ? index : this.currentIndex, video);
      return;
    }

    const item = this.buffer.get(rowKey)!;
    if (!item.isPreloading || !cacheUrl || cacheUrl.includes(".m3u8")) {
      return;
    }

    void videoFileCacheService.preloadVideo(
      fileCacheId,
      cacheUrl,
      PRIORITY_ACTIVE,
      { leadInOnly: this.networkPolicy === "cdn-first" },
    );
  }

  initialize(videos: VideoPreloadInput[]): void {
    const hadPriorBatch = this.videos.length > 0;
    this.videos = videos;
    this.currentIndex = 0;

    if (!hadPriorBatch) {
      this.buffer.clear();
      this.preloadInitialBatch();
      return;
    }

    for (let i = 0; i < Math.min(BUFFER_SIZE_AHEAD + 1, videos.length); i++) {
      const video = videos[i];
      if (video) void this.preloadVideo(i, video);
    }
  }

  private preloadInitialBatch(): void {
    if (this.videos.length === 0) return;
    const initialCount = Math.min(BUFFER_SIZE_AHEAD + 1, this.videos.length);
    for (let i = 0; i < initialCount; i++) {
      const video = this.videos[i];
      if (video) void this.preloadVideo(i, video);
    }
  }

  setCurrentIndex(index: number): void {
    if (index < 0 || index >= this.videos.length) return;

    const oldIndex = this.currentIndex;
    this.currentIndex = index;

    const current = this.videos[index];
    if (current) {
      this.ensureVideo(current.ID);
      if (!this.buffer.has(feedRowCacheKey(current.ID))) {
        void this.preloadVideo(index, current);
      }
    }

    this.preloadAhead(index);
    this.cleanOldVideos(index);

    if (index > oldIndex + 1) {
      this.preloadAhead(index, BUFFER_SIZE_AHEAD + 2);
    }
  }

  private preloadAhead(
    currentIndex: number,
    count: number = BUFFER_SIZE_AHEAD,
  ): void {
    const endIndex = Math.min(currentIndex + count + 1, this.videos.length);
    for (let i = currentIndex + 1; i < endIndex; i++) {
      const video = this.videos[i];
      if (video) void this.preloadVideo(i, video);
    }
  }

  private async preloadVideo(
    index: number,
    video: VideoPreloadInput,
  ): Promise<void> {
    const rowKey = feedRowCacheKey(video.ID);
    const fileCacheId = feedVideoFileCacheId(video.ID);
    const playbackUrl = resolveFeedPlaybackUri(video);
    const cacheUrl = this.resolveCacheUrl(video);

    if (!playbackUrl && !cacheUrl) {
      if (__DEV__) {
        console.warn(`[VideoPreload] No stream URL for video ${rowKey}`);
      }
      return;
    }

    const downloadUrl = cacheUrl || playbackUrl;
    const streamOnly = !downloadUrl || downloadUrl.includes(".m3u8");

    if (this.buffer.has(rowKey)) {
      const existing = this.buffer.get(rowKey)!;
      if (!existing.localPath) {
        const syncPath = this.syncDiskPath(fileCacheId, downloadUrl);
        if (syncPath) {
          this.markLocalReady(rowKey, syncPath);
        }
      }
      if (!streamOnly && existing.isPreloading) {
        videoFileCacheService.boostPriority(
          fileCacheId,
          this.priorityForIndex(index),
        );
      }
      return;
    }

    if (FEED_STREAMING_ONLY) {
      this.buffer.set(rowKey, {
        rowKey,
        fileCacheId,
        playbackUrl: playbackUrl || cacheUrl,
        cacheUrl: downloadUrl,
        metadata: video,
        localPath: null,
        isPreloading: false,
        isReady: true,
      });
      return;
    }

    const bufferItem: VideoBufferItem = {
      rowKey,
      fileCacheId,
      playbackUrl: playbackUrl || downloadUrl,
      cacheUrl: downloadUrl,
      metadata: video,
      localPath: null,
      isPreloading: !streamOnly,
      isReady: streamOnly,
    };
    this.buffer.set(rowKey, bufferItem);

    if (streamOnly) {
      return;
    }

    const syncPath = this.syncDiskPath(fileCacheId, downloadUrl);
    if (syncPath) {
      this.markLocalReady(rowKey, syncPath);
      return;
    }

    this.attachFileCacheListener(rowKey, fileCacheId, downloadUrl);

    const priority = this.priorityForIndex(index);
    const cachedPath = await videoFileCacheService.getCachedVideoPath(
      fileCacheId,
      downloadUrl,
    );
    if (cachedPath) {
      this.markLocalReady(rowKey, cachedPath);
      return;
    }

    void videoFileCacheService.preloadVideo(fileCacheId, downloadUrl, priority, {
      leadInOnly: this.networkPolicy === "cdn-first",
    });
  }

  getPlaybackUri(id: number | string, fallbackStream: string = ""): string {
    const local = this.getLocalPlaybackUri(id);
    if (local) return local;

    const rowKey = feedRowCacheKey(id);
    const item = this.buffer.get(rowKey);
    if (item?.playbackUrl) {
      return item.playbackUrl;
    }
    const video = this.videos.find((v) => feedRowCacheKey(v.ID) === rowKey);
    if (video) {
      return resolveFeedPlaybackUri(video) || fallbackStream;
    }
    return fallbackStream;
  }

  async getVideoUrl(id: number | string): Promise<string> {
    return this.getPlaybackUri(id);
  }

  getVideoMetadata(id: number | string): VideoPreloadInput | null {
    const item = this.buffer.get(feedRowCacheKey(id));
    return item ? item.metadata : null;
  }

  isVideoReady(id: number | string): boolean {
    const item = this.buffer.get(feedRowCacheKey(id));
    return item?.isReady || Boolean(this.getLocalPlaybackUri(id));
  }

  private cleanOldVideos(currentIndex: number): void {
    const removeThreshold = currentIndex - BUFFER_SIZE_BEHIND - 1;

    for (const [rowKey, item] of this.buffer.entries()) {
      const videoIndex = this.videos.findIndex(
        (v) => feedRowCacheKey(v.ID) === rowKey,
      );
      if (videoIndex < removeThreshold) {
        item.unsubscribeFileCache?.();
        this.buffer.delete(rowKey);
      }
    }
  }

  appendVideos(newVideos: VideoPreloadInput[]): void {
    const startIndex = this.videos.length;
    this.videos = [...this.videos, ...newVideos];
    const endIndex = Math.min(
      this.currentIndex + BUFFER_SIZE_AHEAD + 1,
      this.videos.length,
    );
    for (let i = Math.max(this.currentIndex + 1, startIndex); i < endIndex; i++) {
      const video = this.videos[i];
      if (video) void this.preloadVideo(i, video);
    }
  }

  clear(): void {
    for (const item of this.buffer.values()) {
      item.unsubscribeFileCache?.();
    }
    this.buffer.clear();
    this.videos = [];
    this.currentIndex = 0;
  }

  getBufferStats(): {
    bufferSize: number;
    readyCount: number;
    preloadingCount: number;
    currentIndex: number;
    totalVideos: number;
  } {
    let readyCount = 0;
    let preloadingCount = 0;

    for (const item of this.buffer.values()) {
      if (item.isReady) readyCount++;
      if (item.isPreloading) preloadingCount++;
    }

    return {
      bufferSize: this.buffer.size,
      readyCount,
      preloadingCount,
      currentIndex: this.currentIndex,
      totalVideos: this.videos.length,
    };
  }
}

export const videoPreloadService = new VideoPreloadService();
