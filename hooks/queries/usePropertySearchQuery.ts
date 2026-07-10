import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../../constants";
import { getAppLanguage } from "../../utils/translation";

export type PropertySearchFilters = {
  city?: string;
  state?: string;
  country?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minRating?: number;
  available?: boolean;
  sort?: "recent" | "price_low" | "price_high" | "rating";
  status?: "approved" | "live";
};

function buildQueryString(filters: PropertySearchFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
      return;
    }
    params.set(key, String(value));
  });
  return params.toString();
}

export function usePropertySearchQuery(
  filters: PropertySearchFilters,
  enabled: boolean = true
) {
  const qs = useMemo(
    () => buildQueryString({ status: "approved", ...filters }),
    [filters]
  );
  const lang = getAppLanguage();
  const url = `${endpoints.baseURL}/properties/search${
    qs ? `?${qs}&lang=${lang}` : `?lang=${lang}`
  }`;

  return useQuery({
    queryKey: ["property-search", filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to search properties");
      }
      return res.json();
    },
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 10_000
  });
}
