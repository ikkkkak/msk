import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface Zone {
  id: number;
  name: string;
  name_ar: string;
  city_id?: number;
}

export const useZonesByCity = (cityId: number) => {
  return useQuery({
    queryKey: ["zones", cityId],
    queryFn: async (): Promise<Zone[]> => {
      try {
        const response = await api.get(`/cities/${cityId}/zones`);
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[useZonesByCity] API failed:", err);
        return [];
      }
    },
    enabled: cityId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
