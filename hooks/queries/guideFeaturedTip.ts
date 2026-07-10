import type { ListingGuidePreview } from "./useMeskenyGuide";
import { normalizeGuidePreviewsMap } from "./useMeskenyGuide";

const severityRank: Record<string, number> = {
  urgent: 0,
  action: 1,
  info: 2,
};

export type FeaturedGuideTip = {
  preview: ListingGuidePreview;
  propertyTitle: string;
};

/** Pick one tip to surface on dashboard / org — unread & urgent first. */
export function pickFeaturedGuideTip(
  previews: Map<number, ListingGuidePreview> | Record<number, ListingGuidePreview>,
  titleBySaleId: Map<number, string>,
): FeaturedGuideTip | null {
  const map =
    previews instanceof Map
      ? previews
      : normalizeGuidePreviewsMap(previews);
  if (!map.size) return null;

  const rows = [...map.entries()].map(([saleId, preview]) => ({
    saleId,
    preview,
    title:
      titleBySaleId.get(saleId)?.trim() ||
      titleBySaleId.get(preview.propertySaleId)?.trim() ||
      "",
  }));

  rows.sort((a, b) => {
    const aUnread = a.preview.status === "unread" ? 0 : 1;
    const bUnread = b.preview.status === "unread" ? 0 : 1;
    if (aUnread !== bUnread) return aUnread - bUnread;
    const aSev = severityRank[a.preview.severity] ?? 9;
    const bSev = severityRank[b.preview.severity] ?? 9;
    return aSev - bSev;
  });

  const best = rows[0];
  if (!best?.preview.diagnosis?.trim()) return null;

  return {
    preview: best.preview,
    propertyTitle:
      best.title ||
      /* fallback */ `#${best.preview.propertySaleId}`,
  };
}
