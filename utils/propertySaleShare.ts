/** Public web origin for share links and QR codes (not the API / dev scheme). */
export const MESKENY_WEB_ORIGIN = "https://meskeny.com";

/** On-device layout size — view-shot renders this, then upscales to export size. */
export const WHATSAPP_SHARE_CARD_W = 1080;
export const WHATSAPP_SHARE_CARD_H = 568;

/** Final PNG export size (4K horizontal). */
export const WHATSAPP_SHARE_CARD_EXPORT_W = 3840;
export const WHATSAPP_SHARE_CARD_EXPORT_H = 2020;

/** Design tokens are authored at 1080px width. */
export const SHARE_CARD_SCALE = 1;

/** Layout pixel value (1080p design grid). */
export function shareCardPx(base: number): number {
  return Math.round(base * SHARE_CARD_SCALE);
}

/** Wait for remote photos + layout before view-shot capture. */
export const SHARE_CARD_CAPTURE_DELAY_MS = 900;

export type PropertySaleSharePayload = {
  id: number;
  title?: string | null;
  listing_price?: number | null;
  address?: string | null;
  city?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  property_type?: string | null;
  images?: string[];
};

export function buildPropertySaleDeepLink(propertyId: number): string {
  return `${MESKENY_WEB_ORIGIN}/property-sale/${propertyId}`;
}

export function buildPropertySaleShareCaption(
  property: Pick<PropertySaleSharePayload, "id" | "title">,
): string {
  const link = buildPropertySaleDeepLink(property.id);
  const title = property.title?.trim();
  if (title) {
    return `${title}\n${link}`;
  }
  return link;
}

export function formatPropertySaleSharePrice(
  price: number | null | undefined,
  priceOnRequestLabel: string,
): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return priceOnRequestLabel;
  return `${n.toLocaleString("fr-FR")} MRU`;
}

export function pickPropertySaleShareImages(
  images: string[] | undefined,
  max = 4,
): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter(Boolean).slice(0, max);
}

/** Normalize view-shot tmp path for Share API on Android. */
export function normalizeShareFileUri(uri: string): string {
  if (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("data:")
  ) {
    return uri;
  }
  return `file://${uri}`;
}
