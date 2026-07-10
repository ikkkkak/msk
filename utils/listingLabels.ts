import type { TFunction } from "i18next";

const LAND_TYPE_KEY_MAP: Record<string, string> = {
  residential: "residential",
  commercial: "commercial",
  agricultural: "agricultural",
  industrial: "industrial",
  mixed: "mixed",
  "mixed use": "mixed",
  "mixed-use": "mixed",
  mixed_use: "mixed",
  other: "other",
};

const PROPERTY_SALE_TYPE_KEY_MAP: Record<string, string> = {
  apartment: "apartment",
  house: "house",
  villa: "villa",
  studio: "studio",
  townhouse: "townhouse",
  duplex: "duplex",
  condo: "apartment",
  residential: "house",
};

const LISTING_STATUS_ALIASES: Record<string, string> = {
  published: "published",
  active: "published",
  live: "published",
  draft: "draft",
  pending: "pending",
  "pending review": "pending",
  pending_review: "pending",
  sold: "sold",
  archived: "archived",
  rejected: "rejected",
  verified: "verified",
  inactive: "inactive",
};

type TranslateFn = TFunction | ((key: string, fallback?: string) => string);

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Localize land type / zoning labels shown on landmark cards and details. */
export function localizeLandType(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value || typeof value !== "string") return "";
  const key = LAND_TYPE_KEY_MAP[value.trim().toLowerCase()];
  return key ? t(`landmark.landTypes.${key}`, value) : value;
}

/** Localize property-for-sale type (Apartment, House, …). */
export function localizePropertySaleType(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value || typeof value !== "string") return "";
  const normalized = normalizeKey(value);
  const key = PROPERTY_SALE_TYPE_KEY_MAP[normalized];
  return key
    ? t(`listing.sale.propertyType.${key}`, value)
    : value.charAt(0).toUpperCase() + value.slice(1);
}

/** Localize listing workflow status for sale properties and landmarks. */
export function localizeListingStatus(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value || typeof value !== "string") return "";
  const raw = value.trim().toLowerCase();
  const key =
    LISTING_STATUS_ALIASES[raw] ??
    LISTING_STATUS_ALIASES[normalizeKey(raw)] ??
    normalizeKey(raw);
  return t(`listingStatus.${key}`, value);
}

/** Localize compass orientation when a known key is provided. */
export function localizeOrientation(
  value: string | null | undefined,
  t: TranslateFn,
): string {
  if (!value || typeof value !== "string") return "";
  const key = normalizeKey(value).replace(/-/g, "_");
  const translated = t(`propertySaleDetails.orientations.${key}`, "");
  return translated || value;
}
