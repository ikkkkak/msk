import type { FeedTab, FeedVideo } from "../hooks/Videofeedtypes";

/** Listing id from feed row id (e.g. sale clip "42_1" → 42). */
function listingIdFromFeedRow(v: FeedVideo): number {
  const raw = String(v.ID ?? "");
  const head = raw.split("_")[0] ?? raw;
  const n = parseInt(head, 10);
  return Number.isFinite(n) ? n : 0;
}

function feedSource(v: FeedVideo): string {
  const r = v as FeedVideo & { source?: string; Source?: string };
  return String(r.source ?? r.Source ?? "").toLowerCase();
}

/** True when rent feed returned a property-for-sale clip (unified feed loads sale separately). */
export function isRentPropertySaleFallback(v: FeedVideo): boolean {
  const src = feedSource(v);
  if (src === "property_sale" || src === "property_sale_fallback") return true;
  if (v.landmark || v.landmarkID) return false;
  if (v.property?.ID) return false;
  // Sale listing mis-tagged as rent (fallback or stale cache) — propertySale without rental property.
  if (v.propertySale?.id) return true;
  const r = v as FeedVideo & { videos?: string[] };
  if (Array.isArray(r.videos) && r.videos.length > 0) return true;
  return false;
}

/** Drop rent-tab property-sale fallback rows — same clips come from the sale feed. */
export function stripRentPropertySaleFallback(videos: FeedVideo[]): FeedVideo[] {
  return videos.filter((v) => !isRentPropertySaleFallback(v));
}

/** Unique clip key across tabs (sale "30_0" ≡ rent fallback id 30 clip 0). */
export function feedClipDedupeKey(v: FeedVideo): string {
  const kind = resolveFeedKind(v);
  const src = feedSource(v);
  const rawId = String(v.ID ?? "");

  const saleListingId =
    v.propertySale?.id ??
    (kind === "sale" || src.includes("property_sale")
      ? listingIdFromFeedRow(v)
      : 0);

  if (saleListingId > 0 || kind === "sale" || src.includes("property_sale")) {
    const clipMatch = rawId.match(/^\d+_(\d+)$/);
    const clipIdx = clipMatch ? clipMatch[1] : "0";
    return `sale:${saleListingId}:${clipIdx}`;
  }

  if (kind === "landmarks") {
    const id = v.landmark?.id ?? v.landmarkID ?? listingIdFromFeedRow(v);
    return `land:${id}:0`;
  }

  if (v.property?.ID) {
    return `rent:${v.property.ID}:${rawId}`;
  }

  return `${kind}:${rawId}`;
}

/** Remove duplicate clips; prefer sale > landmarks > rent when the same clip appears twice. */
export function dedupeFeedClips(videos: FeedVideo[]): FeedVideo[] {
  const kindRank: Record<FeedTab, number> = {
    sale: 3,
    landmarks: 2,
    rent: 1,
  };
  const best = new Map<string, FeedVideo>();

  for (const v of videos) {
    const key = feedClipDedupeKey(v);
    const existing = best.get(key);
    if (!existing) {
      best.set(key, v);
      continue;
    }
    const curRank = kindRank[resolveFeedKind(v)] ?? 0;
    const prevRank = kindRank[resolveFeedKind(existing)] ?? 0;
    if (curRank >= prevRank) {
      best.set(key, v);
    }
  }

  const seen = new Set<string>();
  const out: FeedVideo[] = [];
  for (const v of videos) {
    const key = feedClipDedupeKey(v);
    if (best.get(key) !== v) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Stable key for one listing — multiple clips share the same key. */
export function feedListingKey(v: FeedVideo): string {
  const kind = resolveFeedKind(v);
  if (kind === "sale") {
    const id = v.propertySale?.id ?? listingIdFromFeedRow(v);
    return `sale:${id}`;
  }
  if (kind === "landmarks") {
    const id = v.landmark?.id ?? v.landmarkID ?? listingIdFromFeedRow(v);
    return `land:${id}`;
  }
  const id = v.property?.ID ?? listingIdFromFeedRow(v);
  return `rent:${id}`;
}

/**
 * Reorder clips so the same listing never appears back-to-back.
 * Keeps every clip (e.g. sale "42_0" and "42_1" both stay in the feed).
 */
export function spreadSameListingClips(videos: FeedVideo[]): FeedVideo[] {
  if (videos.length <= 1) return videos;

  const piles = new Map<string, FeedVideo[]>();
  const keyOrder: string[] = [];
  for (const v of videos) {
    const key = feedListingKey(v);
    if (!piles.has(key)) {
      piles.set(key, []);
      keyOrder.push(key);
    }
    piles.get(key)!.push(v);
  }

  const hasMultiClipListing = [...piles.values()].some((pile) => pile.length > 1);
  if (!hasMultiClipListing) return videos;

  const out: FeedVideo[] = [];
  while (out.length < videos.length) {
    let placed = false;
    for (const key of keyOrder) {
      const pile = piles.get(key);
      if (!pile?.length) continue;
      const prevKey =
        out.length > 0 ? feedListingKey(out[out.length - 1]!) : null;
      if (prevKey === key) continue;
      out.push(pile.shift()!);
      placed = true;
    }
    if (placed) continue;
    for (const key of keyOrder) {
      const pile = piles.get(key);
      if (pile?.length) {
        out.push(pile.shift()!);
        break;
      }
    }
  }
  return out;
}

/** Unified feed filter — one scroll, filter by listing type. */
export type FeedFilter = "all" | "sale" | "rent" | "land";

export const FEED_FILTER_OPTIONS: FeedFilter[] = [
  "all",
  "sale",
  "rent",
  "land",
];

export function tagFeedVideos(
  videos: FeedVideo[],
  kind: FeedTab,
): FeedVideo[] {
  return videos.map((v) => ({ ...v, _feedKind: kind }));
}

/** Round-robin merge so rent/sale/land appear in one mixed feed. */
export function interleaveUnifiedFeed(
  sale: FeedVideo[],
  rent: FeedVideo[],
  land: FeedVideo[],
): FeedVideo[] {
  const rentOnly = stripRentPropertySaleFallback(rent);
  const buckets = [
    spreadSameListingClips(tagFeedVideos(sale, "sale")),
    spreadSameListingClips(tagFeedVideos(rentOnly, "rent")),
    spreadSameListingClips(tagFeedVideos(land, "landmarks")),
  ];
  const maxLen = Math.max(...buckets.map((b) => b.length), 0);
  const out: FeedVideo[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      const v = bucket[i];
      if (!v) continue;
      const id = v.ID;
      if (id === undefined || id === null || String(id) === "undefined") continue;
      const clipKey = feedClipDedupeKey(v);
      if (seen.has(clipKey)) continue;
      seen.add(clipKey);
      out.push(v);
    }
  }
  return spreadSameListingClips(dedupeFeedClips(out));
}

export function resolveFeedKind(item: FeedVideo): FeedTab {
  if (item.landmark || item.landmarkID) return "landmarks";
  if (isRentPropertySaleFallback(item)) return "sale";
  const saleId = item.propertySale?.id;
  const rentId = item.property?.ID;
  if (saleId && !rentId) return "sale";
  if (item._feedKind) return item._feedKind;
  if (item.propertySale) return "sale";
  if (item.property) return "rent";
  return "sale";
}

export function filterUnifiedFeed(
  videos: FeedVideo[],
  filter: FeedFilter,
): FeedVideo[] {
  if (filter === "all") return videos;
  if (filter === "sale") {
    return videos.filter((v) => resolveFeedKind(v) === "sale");
  }
  if (filter === "rent") {
    return videos.filter((v) => resolveFeedKind(v) === "rent");
  }
  return videos.filter((v) => resolveFeedKind(v) === "landmarks");
}

export function feedFilterLabelKey(filter: FeedFilter): string {
  switch (filter) {
    case "all":
      return "video.filterAll";
    case "sale":
      return "video.propertiesforsale";
    case "rent":
      return "video.propertiesforrent";
    case "land":
      return "video.landForSale";
    default:
      return "video.filterAll";
  }
}

export function feedFilterDefaultLabel(filter: FeedFilter): string {
  switch (filter) {
    case "all":
      return "All";
    case "sale":
      return "For Sale";
    case "rent":
      return "For Rent";
    case "land":
      return "Land";
    default:
      return "All";
  }
}
