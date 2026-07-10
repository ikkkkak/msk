import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

interface PropertyLocationCriteria {
  id: number;
  name: string;
  displayName: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  distance: number; // Distance from property to criteria center
  icon: string;
  color: string;
}

export const usePropertyLocationCriteria = (propertyId: number) => {
  return useQuery<PropertyLocationCriteria | null>({
    queryKey: ["property-location-criteria", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      try {
        const response = await api.get(
          `${endpoints.baseURL}/location-discovery/property/${propertyId}/criteria`
        );
        return response.data.data || null;
      } catch (error) {
        console.log("Property not assigned to any location criteria");
        return null;
      }
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (cacheTime renamed to gcTime in v5)
  });
};
