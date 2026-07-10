/**
 * usePropertyCardQuery.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TanStack Query hook for single property card fetch.
 *
 * • Stable query key: ['property', propertyId]
 * • AbortController - cancels on unmount (no late overwrites)
 * • Deduplication via propertyCardApi
 * • Deterministic, robust, never silently fails
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchPropertyCard,
  type PropertyCardData,
} from "../../services/propertyCardApi";

export const PROPERTY_CARD_QUERY_KEY = "property" as const;

export function usePropertyCardQuery(
  propertyId: number,
  options?: {
    enabled?: boolean;
    initialData?: PropertyCardData;
    lang?: string;
  },
) {
  const { enabled = true, initialData, lang = "en" } = options ?? {};

  const query = useQuery<PropertyCardData, Error>({
    queryKey: [PROPERTY_CARD_QUERY_KEY, propertyId],
    queryFn: async ({ signal }) => {
      return fetchPropertyCard({
        propertyId,
        signal: signal ?? undefined,
        lang,
      });
    },
    enabled: enabled && !!propertyId && propertyId > 0,
    initialData,
    // Never pass Date.now() here — options are recreated each render and would
    // constantly reset the query's "updated at" timestamp.

    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 4,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: "offlineFirst",
    placeholderData: (prev) => prev,
  });

  return query;
}
