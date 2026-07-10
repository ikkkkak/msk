import { useQuery } from "@tanstack/react-query";
import { locationService } from "../../services/locationService";
import { PropertyFilters } from "../../types/location";

// Hook to get properties near a specific location
export const useLocationProperties = (
  locationKey: string,
  limit: number = 8
) => {
  return useQuery({
    queryKey: ["location-properties", locationKey, limit],
    queryFn: () =>
      locationService.getPropertiesNearLocation(locationKey, limit),
    enabled: !!locationKey,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Hook to get all available locations
export const useAvailableLocations = () => {
  return useQuery({
    queryKey: ["available-locations"],
    queryFn: locationService.getAvailableLocations,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
};

// Hook to get properties by coordinates
export const usePropertiesByCoordinates = (
  lat: number,
  lng: number,
  radius: number = 5,
  limit: number = 20,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["properties-by-coordinates", lat, lng, radius, limit],
    queryFn: () =>
      locationService.getPropertiesByCoordinates(lat, lng, radius, limit),
    enabled: enabled && !isNaN(lat) && !isNaN(lng),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Hook to get properties with filters
export const usePropertiesWithFilters = (filters: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties-with-filters", filters],
    queryFn: () => locationService.getPropertiesWithFilters(filters),
    enabled: !!(filters.lat && filters.lng),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};
