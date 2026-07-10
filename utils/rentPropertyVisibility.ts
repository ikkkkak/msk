/** Public rent listings — approved or published only (sent on every search URL). */
export const RENT_PUBLIC_LISTING_STATUSES = "approved,published" as const;

const BLOCKED_RENT_STATUSES = new Set([
  "rejected",
  "pending",
  "draft",
  "denied",
  "cancelled",
  "canceled",
  "suspended",
  "inactive",
  "blocked",
]);

const ALLOWED_RENT_STATUSES = new Set(["approved", "published"]);

function readRentListingStatus(item: Record<string, unknown>): string {
  const raw =
    item.status ??
    item.Status ??
    item.listing_status ??
    item.listingStatus ??
    item.moderation_status ??
    item.moderationStatus ??
    item.review_status ??
    item.reviewStatus ??
    "";
  return String(raw).trim().toLowerCase().replace(/\s+/g, "_");
}

function isExplicitlyInactive(item: Record<string, unknown>): boolean {
  const isActiveRaw = item.is_active ?? item.isActive ?? item.IsActive;
  if (isActiveRaw === undefined || isActiveRaw === null) return false;
  return !Boolean(isActiveRaw);
}

function isExplicitlyFlagged(item: Record<string, unknown>): boolean {
  return item.isFlagged === true || item.is_flagged === true;
}

export function isRentPropertyPublic(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const p = item as Record<string, unknown>;

  if (isExplicitlyInactive(p) || isExplicitlyFlagged(p)) return false;

  const status = readRentListingStatus(p);
  if (!status) return false;
  if (status.includes("reject")) return false;
  if (BLOCKED_RENT_STATUSES.has(status)) return false;
  if (!ALLOWED_RENT_STATUSES.has(status)) return false;

  return true;
}

export function filterPublicRentProperties<T>(items: T[]): T[] {
  return items.filter(isRentPropertyPublic);
}

export function rentPublicSearchParams(): {
  status: typeof RENT_PUBLIC_LISTING_STATUSES;
} {
  return { status: RENT_PUBLIC_LISTING_STATUSES };
}
