import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, publicApi } from "../../services/api";
import { endpoints } from "../../constants";
import { rentDiscoveryFiltersKey } from "../../utils/rentDiscoveryFiltersKey";
import {
  filterPublicRentProperties,
  RENT_PUBLIC_LISTING_STATUSES,
} from "../../utils/rentPropertyVisibility";

/** Query params for GET /location-discovery/criteria/:id/properties (rent discovery filters). */
export type RentDiscoveryQueryFilters = {
  propertyType?: string;
  propertyCategoryId?: number;
  countryId?: number;
  cityId?: number;
  zoneId?: number;
  quartierId?: number;
  minPrice?: number;
  maxPrice?: number;
};

function rentDiscoveryQuerySuffix(f?: RentDiscoveryQueryFilters): string {
  if (!f) return "";
  const parts: string[] = [];
  if (f.propertyType && String(f.propertyType).toLowerCase() !== "all") {
    parts.push(
      `property_type=${encodeURIComponent(String(f.propertyType).trim())}`,
    );
  }
  if (f.propertyCategoryId != null && f.propertyCategoryId > 0) {
    parts.push(
      `property_category_id=${encodeURIComponent(String(f.propertyCategoryId))}`,
    );
  }
  if (f.countryId != null && f.countryId > 0)
    parts.push(`country_id=${encodeURIComponent(String(f.countryId))}`);
  if (f.cityId != null && f.cityId > 0)
    parts.push(`city_id=${encodeURIComponent(String(f.cityId))}`);
  if (f.zoneId != null && f.zoneId > 0)
    parts.push(`zone_id=${encodeURIComponent(String(f.zoneId))}`);
  if (f.quartierId != null && f.quartierId > 0)
    parts.push(`quartier_id=${encodeURIComponent(String(f.quartierId))}`);
  if (f.minPrice != null && f.minPrice > 0)
    parts.push(`min_price=${encodeURIComponent(String(f.minPrice))}`);
  if (f.maxPrice != null && f.maxPrice > 0)
    parts.push(`max_price=${encodeURIComponent(String(f.maxPrice))}`);
  return parts.length ? `&${parts.join("&")}` : "";
}

// Hook to get all location criteria
export const useLocationCriteria = (
  langOverride?: string,
  options?: { enabled?: boolean },
) => {
  const lang = (langOverride || "en").toLowerCase();
  return useQuery({
    queryKey: ["locationCriteria", lang],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      console.log(
        "🔍 useLocationCriteria - Fetching location criteria from server with lang:",
        lang
      );
      try {
        const response = await api.get(
          `/location-discovery/criteria?lang=${lang}`
        );
        const raw =
          response?.data?.data ??
          response?.data?.criteria ??
          response?.data ??
          [];
        // Normalize field names to lowerCamel expected by UI
        const normalized = (Array.isArray(raw) ? raw : []).map((c: any) => ({
          id: c.id ?? c.ID ?? c.Id,
          name: c.name ?? c.Name,
          displayName: c.displayName ?? c.DisplayName ?? c.display_name,
          description: c.description ?? c.Description,
          centerLat: c.centerLat ?? c.CenterLat ?? c.center_lat,
          centerLng: c.centerLng ?? c.CenterLng ?? c.center_lng,
          radius: c.radius ?? c.Radius,
          priority: c.priority ?? c.Priority,
          isActive: c.isActive ?? c.IsActive,
          icon: c.icon ?? c.Icon,
          color: c.color ?? c.Color,
          propertyCount:
            c.propertyCount ?? c.PropertyCount ?? c.property_count ?? 0
        }));
        console.log("🔍 useLocationCriteria - Normalized criteria:", {
          count: normalized.length,
          names: normalized.map((c: any) => c.name)
        });
        return normalized;
      } catch (error: any) {
        console.error(
          "❌ useLocationCriteria - Error fetching criteria:",
          error
        );
        // If auth fails, try without auth token (public endpoint)
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          console.log(
            "🔄 useLocationCriteria - Retrying without auth token (public API)..."
          );
          try {
            const response = await publicApi.get(
              `/location-discovery/criteria?lang=${lang}`
            );
            const raw =
              response?.data?.data ??
              response?.data?.criteria ??
              response?.data ??
              [];
            const normalized = (Array.isArray(raw) ? raw : []).map(
              (c: any) => ({
                id: c.id ?? c.ID ?? c.Id,
                name: c.name ?? c.Name,
                displayName: c.displayName ?? c.DisplayName ?? c.display_name,
                description: c.description ?? c.Description,
                centerLat: c.centerLat ?? c.CenterLat ?? c.center_lat,
                centerLng: c.centerLng ?? c.CenterLng ?? c.center_lng,
                radius: c.radius ?? c.Radius,
                priority: c.priority ?? c.Priority,
                isActive: c.isActive ?? c.IsActive,
                icon: c.icon ?? c.Icon,
                color: c.color ?? c.Color,
                propertyCount:
                  c.propertyCount ?? c.PropertyCount ?? c.property_count ?? 0
              })
            );
            console.log(
              "✅ useLocationCriteria - Successfully fetched without auth"
            );
            return normalized;
          } catch (retryError) {
            console.error(
              "❌ useLocationCriteria - Retry also failed:",
              retryError
            );
            throw retryError;
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors - these endpoints should work without auth
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false // Prevent refetch on window focus to avoid excessive requests
  });
};

// Hook to get properties for a specific location criteria
export const useLocationProperties = (
  criteriaId: number,
  limit: number = 8,
  langOverride?: string
) => {
  const lang = (langOverride || "en").toLowerCase();
  // Add rotation timestamp that changes on each mount
  const [rotationKey] = useState(() => Date.now());

  return useQuery({
    queryKey: ["locationProperties", criteriaId, limit, lang, rotationKey],
    queryFn: async () => {
      const timestamp = Date.now(); // Unique timestamp for this request
      try {
        const response = await api.get(
          `/location-discovery/criteria/${criteriaId}/properties?limit=${limit}&status=${RENT_PUBLIC_LISTING_STATUSES}&lang=${lang}&_t=${timestamp}`,
          {
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
          }
        );

        console.log("🔍 useLocationProperties - Server response:", {
          criteriaId,
          responseData: response.data,
          data: response.data.data
        });

        const data = response.data?.data;
        const raw = Array.isArray(data?.properties)
          ? data.properties
          : Array.isArray(data)
          ? data
          : [];
        const properties = filterPublicRentProperties(raw);

        console.log("🔍 useLocationProperties - Extracted properties:", {
          criteriaId,
          propertiesCount: properties.length,
          properties: properties.map((p: any) => ({
            id: p.id || p.ID,
            title: p.title || p.Title
          }))
        });

        return { ...(data || {}), properties };
      } catch (error: any) {
        console.error(
          "❌ useLocationProperties - Error fetching properties:",
          error
        );
        // If auth fails, try without auth token (public endpoint)
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          console.log(
            "🔄 useLocationProperties - Retrying without auth token (public API)..."
          );
          try {
            const response = await publicApi.get(
              `/location-discovery/criteria/${criteriaId}/properties?limit=${limit}&status=${RENT_PUBLIC_LISTING_STATUSES}&lang=${lang}&_t=${timestamp}`,
              {
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
              }
            );
            const data = response.data?.data;
            const raw = Array.isArray(data?.properties)
              ? data.properties
              : Array.isArray(data)
              ? data
              : [];
            const properties = filterPublicRentProperties(raw);
            console.log(
              "✅ useLocationProperties - Successfully fetched without auth:",
              {
                criteriaId,
                propertiesCount: properties.length
              }
            );
            return { ...(data || {}), properties };
          } catch (retryError) {
            console.error(
              "❌ useLocationProperties - Retry also failed:",
              retryError
            );
            throw retryError;
          }
        }
        throw error;
      }
    },
    enabled: !!criteriaId,
    staleTime: 0, // Always consider stale to get fresh rotated results
    gcTime: 30 * 1000, // Keep cache for 30 seconds only
    refetchOnMount: "always", // Always refetch on mount for fresh rotation
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors - these endpoints should work without auth
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    }
  });
};

// Hook to get multiple location properties at once
export const useMultipleLocationProperties = (
  criteriaIds: number[],
  limit: number = 8,
  langOverride?: string,
  filters?: RentDiscoveryQueryFilters
) => {
  const lang = (langOverride || "en").toLowerCase();
  const fq = rentDiscoveryQuerySuffix(filters);
  const filterKey = rentDiscoveryFiltersKey(filters);
  const criteriaKey = [...criteriaIds].sort((a, b) => a - b).join(",");
  return useQuery({
    queryKey: ["multipleLocationProperties", criteriaKey, limit, lang, filterKey],
    queryFn: async ({ signal }) => {
      try {
        const promises = criteriaIds.map((criteriaId) =>
          api.get(
            `/location-discovery/criteria/${criteriaId}/properties?limit=${limit}&status=${RENT_PUBLIC_LISTING_STATUSES}&lang=${lang}${fq}`,
            { signal },
          )
        );

        const responses = await Promise.all(promises);
        return responses.map((response) => {
          const data = response.data?.data;
          const raw = Array.isArray(data?.properties)
            ? data.properties
            : Array.isArray(data)
            ? data
            : [];
          const properties = filterPublicRentProperties(raw);
          return { ...(data || {}), properties };
        });
      } catch (error: any) {
        console.error(
          "❌ useMultipleLocationProperties - Error fetching properties:",
          error
        );
        // If auth fails, try without auth token (public endpoint)
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          console.log(
            "🔄 useMultipleLocationProperties - Retrying without auth token (public API)..."
          );
          try {
            const promises = criteriaIds.map((criteriaId) =>
              publicApi.get(
                `/location-discovery/criteria/${criteriaId}/properties?limit=${limit}&status=${RENT_PUBLIC_LISTING_STATUSES}&lang=${lang}${fq}`,
                { signal },
              )
            );
            const responses = await Promise.all(promises);
            console.log(
              "✅ useMultipleLocationProperties - Successfully fetched without auth"
            );
            return responses.map((response) => {
              const data = response.data?.data;
              const raw = Array.isArray(data?.properties)
                ? data.properties
                : Array.isArray(data)
                ? data
                : [];
              const properties = filterPublicRentProperties(raw);
              return { ...(data || {}), properties };
            });
          } catch (retryError) {
            console.error(
              "❌ useMultipleLocationProperties - Retry also failed:",
              retryError
            );
            throw retryError;
          }
        }
        throw error;
      }
    },
    enabled: criteriaIds.length > 0,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors - these endpoints should work without auth
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    }
  });
};
