/**
 * propertyCardApi.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic, robust property card fetch layer.
 *
 * • In-flight request deduplication (propertyId -> promise)
 * • AbortController support - cancels on unmount
 * • Request lifecycle logging (start, success, fail, cancelled)
 * • requestId for tracing
 */

import { api } from "./api";
import { flattenPropertySaleGalleryImages } from "../utils/propertySaleGallery";

export type PropertyCardData = Record<string, unknown>;

const inFlightMap = new Map<number, Promise<PropertyCardData>>();

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function safeNormalize(raw: unknown): PropertyCardData {
  if (raw == null) return {};
  if (typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const id = o.id ?? o.ID ?? o.Id;
  const images = flattenPropertySaleGalleryImages(o);
  return {
    ...o,
    id: typeof id === "number" ? id : Number(id) || 0,
    listing_price: o.listing_price ?? o.price ?? o.amount,
    price: o.listing_price ?? o.price ?? o.amount,
    images,
    title: o.title ?? o.name ?? o.headline ?? "",
    address: o.address ?? o.street ?? "",
    bedrooms: o.bedrooms ?? o.Bedrooms,
    bathrooms: o.bathrooms ?? o.Bathrooms,
    square_footage: o.square_footage ?? o.area ?? o.size,
  };
}

export interface PropertyCardFetchOptions {
  propertyId: number;
  signal?: AbortSignal;
  lang?: string;
}

/**
 * Fetch a single property card. Deduplicates concurrent calls for same propertyId.
 * Uses AbortController - pass signal to cancel on unmount.
 */
export async function fetchPropertyCard(
  options: PropertyCardFetchOptions
): Promise<PropertyCardData> {
  const { propertyId, signal, lang = "en" } = options;
  const requestId = generateRequestId();

  if (__DEV__) {
    console.log(
      `[propertyCard] START requestId=${requestId} propertyId=${propertyId}`
    );
  }

  const doFetch = async (): Promise<PropertyCardData> => {
    const res = await api.get<PropertyCardData | { data: PropertyCardData }>(
      `/property-sales/public/${propertyId}`,
      {
        params: { lang },
        signal: signal ?? undefined,
        headers: { "X-Request-ID": requestId },
      }
    );

    const raw =
      (res.data as any)?.data ??
      (res.data as any)?.property ??
      res.data;
    const normalized = safeNormalize(raw);

    if (__DEV__) {
      console.log(
        `[propertyCard] SUCCESS requestId=${requestId} propertyId=${propertyId}`
      );
    }
    return normalized;
  };

  const existing = inFlightMap.get(propertyId);
  if (existing) {
    if (__DEV__) {
      console.log(
        `[propertyCard] DEDUP reusing in-flight request propertyId=${propertyId}`
      );
    }
    return existing;
  }

  const promise = doFetch()
    .then((data) => {
      inFlightMap.delete(propertyId);
      return data;
    })
    .catch((err) => {
      inFlightMap.delete(propertyId);
      const isAbort =
        err?.name === "AbortError" ||
        err?.name === "CanceledError" ||
        err?.code === "ERR_CANCELED";
      if (__DEV__) {
        console.log(
          `[propertyCard] ${isAbort ? "CANCELLED" : "FAIL"} requestId=${requestId} propertyId=${propertyId}`,
          isAbort ? "" : err?.message ?? err
        );
      }
      throw err;
    });

  inFlightMap.set(propertyId, promise);
  return promise;
}
