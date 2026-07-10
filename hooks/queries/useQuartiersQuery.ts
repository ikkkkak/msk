import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface Quartier {
  id: number;
  name: string;
  name_ar: string;
  zone_id?: number;
}

export const useQuartiersByZone = (zoneId: number) => {
  return useQuery({
    queryKey: ["quartiers", zoneId],
    queryFn: async (): Promise<Quartier[]> => {
      try {
        const response = await api.get(`/cities/zones/${zoneId}/quartiers`);
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[useQuartiersByZone] API failed:", err);
        return [];
      }
    },
    enabled: zoneId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
