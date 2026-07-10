// ─────────────────────────────────────────────
// useVideoFeed.ts
//
// Centralizes ALL feed state so VideoFeedScreen
// is a thin orchestrator with no business logic.
//
// PAGINATION ALGORITHM (spec):
//  • Initial batch: 10
//  • Load-more trigger: when activeIndex >= totalCount - 3
//  • Cursor-based, appending (never resetting)
//  • Dedup guard prevents double-fetches
// ─────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { FeedTab, FeedVideo } from "./videoFeedTypes";

// ── Stable ID helper ─────────────────────────────────────────────────────────
export function getStableId(item: FeedVideo): number {
  const raw = String(item.ID);
  const parts = raw.split("_");
  const n = parseInt(parts[0], 10);
  return Number.isFinite(n) ? n : 0;
}

/** Per–feed-row cache key (e.g. property sale clip "42_0"). Do not use getStableId() for video URL cache. */
export function feedVideoCacheKey(item: { ID: number | string }): string {
  return String(item.ID);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useVideoFeed(
  feedKey: string,
  videos: FeedVideo[],
  isLoading: boolean,
  fetchNextPage: () => void,
  hasNextPage: boolean,
  isFetchingNextPage: boolean
) {
  // ── Interaction state (liked / saved / counts) ───────────────────────────
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [savesCount, setSavesCount] = useState<Record<number, number>>({});
  const [likePending, setLikePending] = useState<Record<number, boolean>>({});
  const [savePending, setSavePending] = useState<Record<number, boolean>>({});

  // ── Seed from server data (server is source of truth on first load) ───────
  const seededIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!videos.length) return;
    const newLiked: Record<number, boolean> = {};
    const newSaved: Record<number, boolean> = {};
    const newLikes: Record<number, number> = {};
    const newSaves: Record<number, number> = {};
    let changed = false;

    videos.forEach((v) => {
      const id = getStableId(v);
      if (seededIds.current.has(id)) return; // already seeded, don't overwrite optimistic
      seededIds.current.add(id);
      changed = true;
      if (v.liked !== undefined) newLiked[id] = Boolean(v.liked);
      if (v.saved !== undefined) newSaved[id] = Boolean(v.saved);
      if (typeof v.likesCount === "number") newLikes[id] = v.likesCount;
      if (typeof v.savesCount === "number") newSaves[id] = v.savesCount;
    });

    if (!changed) return;
    setLiked((p) => ({ ...newLiked, ...p })); // p wins (optimistic takes priority)
    setSaved((p) => ({ ...newSaved, ...p }));
    setLikesCount((p) => ({ ...newLikes, ...p }));
    setSavesCount((p) => ({ ...newSaves, ...p }));
  }, [videos]);

  // Reset seed cache when filter changes
  useEffect(() => {
    seededIds.current.clear();
    setLiked({});
    setSaved({});
    setLikesCount({});
    setSavesCount({});
  }, [feedKey]);

  // ── Optimistic like ───────────────────────────────────────────────────────
  const toggleLike = useCallback(
    async (item: FeedVideo, mutateAsync: (id: number) => Promise<any>) => {
      const id = getStableId(item);
      if (likePending[id]) return;

      const wasLiked = liked[id] ?? Boolean(item.liked);
      const newLiked = !wasLiked;
      const prevCount = likesCount[id] ?? item.likesCount ?? 0;
      const newCount = Math.max(0, newLiked ? prevCount + 1 : prevCount - 1);

      // Optimistic
      setLikePending((p) => ({ ...p, [id]: true }));
      setLiked((p) => ({ ...p, [id]: newLiked }));
      setLikesCount((p) => ({ ...p, [id]: newCount }));

      try {
        const result = await mutateAsync(id);
        if (typeof result?.likesCount === "number") {
          setLikesCount((p) => ({ ...p, [id]: result.likesCount }));
        }
        if (result?.liked !== undefined) {
          setLiked((p) => ({ ...p, [id]: Boolean(result.liked) }));
        }
      } catch {
        // Rollback
        setLiked((p) => ({ ...p, [id]: wasLiked }));
        setLikesCount((p) => ({ ...p, [id]: prevCount }));
      } finally {
        setLikePending((p) => ({ ...p, [id]: false }));
      }
    },
    [liked, likePending, likesCount]
  );

  // ── Optimistic save ───────────────────────────────────────────────────────
  const toggleSave = useCallback(
    async (item: FeedVideo, mutateAsync: (id: number) => Promise<any>) => {
      const id = getStableId(item);
      if (savePending[id]) return;

      const wasSaved = saved[id] ?? Boolean(item.saved);
      const newSaved = !wasSaved;
      const prevCount = savesCount[id] ?? item.savesCount ?? 0;
      const newCount = Math.max(0, newSaved ? prevCount + 1 : prevCount - 1);

      setSavePending((p) => ({ ...p, [id]: true }));
      setSaved((p) => ({ ...p, [id]: newSaved }));
      setSavesCount((p) => ({ ...p, [id]: newCount }));

      try {
        const result = await mutateAsync(id);
        if (typeof result?.savesCount === "number") {
          setSavesCount((p) => ({ ...p, [id]: result.savesCount }));
        }
      } catch {
        setSaved((p) => ({ ...p, [id]: wasSaved }));
        setSavesCount((p) => ({ ...p, [id]: prevCount }));
      } finally {
        setLikePending((p) => ({ ...p, [id]: false }));
      }
    },
    [saved, savePending, savesCount]
  );

  // ── Pagination guard ──────────────────────────────────────────────────────
  const loadMoreQueued = useRef(false);

  const maybeLoadMore = useCallback(
    (activeIndex: number) => {
      // Prefetch next batch around 70% through loaded window (TikTok-style).
      const threshold = Math.max(0, Math.floor(videos.length * 0.7));
      if (activeIndex < threshold) return;
      if (!hasNextPage || isFetchingNextPage || isLoading) return;
      if (loadMoreQueued.current) return;

      loadMoreQueued.current = true;
      fetchNextPage();

      // Reset guard after a tick (hook state update will reset isFetching too)
      setTimeout(() => {
        loadMoreQueued.current = false;
      }, 500);
    },
    [videos.length, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]
  );

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isLiked = useCallback(
    (item: FeedVideo) => {
      const id = getStableId(item);
      return liked[id] ?? Boolean(item.liked);
    },
    [liked]
  );

  const isSaved = useCallback(
    (item: FeedVideo) => {
      const id = getStableId(item);
      return saved[id] ?? Boolean(item.saved);
    },
    [saved]
  );

  const getLikesCount = useCallback(
    (item: FeedVideo) => {
      const id = getStableId(item);
      return likesCount[id] ?? item.likesCount ?? 0;
    },
    [likesCount]
  );

  const getSavesCount = useCallback(
    (item: FeedVideo) => {
      const id = getStableId(item);
      return savesCount[id] ?? item.savesCount ?? 0;
    },
    [savesCount]
  );

  return {
    liked,
    saved,
    likesCount,
    savesCount,
    likePending,
    savePending,
    isLiked,
    isSaved,
    getLikesCount,
    getSavesCount,
    toggleLike,
    toggleSave,
    maybeLoadMore
  };
}
