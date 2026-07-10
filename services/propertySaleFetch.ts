import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { flattenPropertySaleGalleryImages } from "../utils/propertySaleGallery";

/** React Query key for public sale detail (shared with prefetch + screen). */
export function propertySaleDetailQueryKey(id: number, lang: string) {
  return ["property-sale", id, lang] as const;
}

type FeedPage = { items?: unknown[] };

const inFlightMap = new Map<string, Promise<Record<string, unknown>>>();

function inFlightKey(id: number, lang: string) {
  return `${id}:${lang}`;
}

function parsePropertySaleResponse(res: {
  data: unknown;
}): Record<string, unknown> {
  const raw =
    (res.data as { data?: unknown; property?: unknown; property_sale?: unknown })
      ?.data ??
    (res.data as { property?: unknown })?.property ??
    (res.data as { property_sale?: unknown })?.property_sale ??
    res.data;
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

/** Shared fetch for sale detail + React Query prefetch (single source of truth). */
export async function fetchPropertySalePublic(
  id: number,
  lang: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const key = inFlightKey(id, lang);
  const existing = inFlightMap.get(key);
  if (existing) return existing;

  const promise = api
    .get(`/property-sales/public/${id}`, {
      params: { lang },
      signal,
      timeout: 20_000,
    })
    .then((res) => {
      inFlightMap.delete(key);
      return parsePropertySaleResponse(res);
    })
    .catch((err) => {
      inFlightMap.delete(key);
      throw err;
    });

  inFlightMap.set(key, promise);
  return promise;
}

/** Scan infinite feed caches for a list card item to use as instant placeholder. */
export function findPropertySaleInFeedCache(
  queryClient: QueryClient,
  propertyId: number,
): Record<string, unknown> | undefined {
  const entries = queryClient.getQueriesData<
    InfiniteData<FeedPage> | FeedPage
  >({ queryKey: ["publicPropertySales"] });

  for (const [, data] of entries) {
    if (!data) continue;
    const pages =
      "pages" in data && Array.isArray(data.pages)
        ? data.pages
        : [data as FeedPage];
    for (const page of pages) {
      const items = page?.items;
      if (!Array.isArray(items)) continue;
      const found = items.find(
        (p) =>
          p &&
          typeof p === "object" &&
          Number((p as { id?: number; ID?: number }).id ?? (p as { ID?: number }).ID) ===
            propertyId,
      );
      if (found && typeof found === "object") {
        return found as Record<string, unknown>;
      }
    }
  }
  return undefined;
}

/** Seed detail cache from a list/card item so the screen renders immediately. */
export function seedPropertySaleDetailCache(
  queryClient: QueryClient,
  id: number,
  lang: string,
  partial: Record<string, unknown> | null | undefined,
): void {
  if (!id || !partial || typeof partial !== "object") return;
  const qk = propertySaleDetailQueryKey(id, lang);
  if (queryClient.getQueryData(qk)) return;
  queryClient.setQueryData(qk, { ...partial, id });
}

/** Prefetch full detail before navigation (deduped with in-flight map). */
export function prefetchPropertySaleDetail(
  queryClient: QueryClient,
  id: number,
  lang: string,
): void {
  if (!Number.isFinite(id) || id <= 0) return;
  void queryClient.prefetchQuery({
    queryKey: propertySaleDetailQueryKey(id, lang),
    queryFn: ({ signal }) => fetchPropertySalePublic(id, lang, signal),
    staleTime: 1000 * 60 * 5,
  });
}

/** Seed from list item (if any) and start detail fetch — call on card press. */
export function warmPropertySaleDetailNavigation(
  queryClient: QueryClient,
  id: number,
  lang: string,
  listItem?: Record<string, unknown> | null,
): void {
  if (!Number.isFinite(id) || id <= 0) return;
  const fromList =
    listItem ??
    findPropertySaleInFeedCache(queryClient, id) ??
    undefined;
  seedPropertySaleDetailCache(queryClient, id, lang, fromList);
  prefetchPropertySaleDetail(queryClient, id, lang);
}

export function collectPropertySaleImageUrls(
  property: Record<string, unknown> | null | undefined,
): string[] {
  return flattenPropertySaleGalleryImages(property);
}
