/**
 * Shared React Query keys + fetch options for video feeds.
 * Single source of truth — prefetch and screen must use the same key.
 */

import type { VideoFeedFilters } from "../services/videoFeedFetcher";

export type VideoFeedTab = "rent" | "sale" | "landmarks";

export function videoFeedQueryKey(opts: {
  tab: VideoFeedTab;
  userId?: number;
  lang: string;
  filters?: VideoFeedFilters | null;
  feedQuality?: "high" | "low";
}) {
  return [
    "cursorVideoFeed",
    opts.tab,
    opts.userId ?? undefined,
    (opts.lang || "en").toLowerCase(),
    opts.filters ?? null,
    opts.feedQuality ?? "high",
  ] as const;
}
