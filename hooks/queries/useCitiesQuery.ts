import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface City {
  id: number;
  name: string;
  name_ar: string;
  country?: string;
  country_ar?: string;
  country_id?: number;
  is_active?: boolean;
  zones?: Array<{ id: number; name: string; name_ar: string }>;
}

export const useCitiesQuery = (countryId?: number) => {
  return useQuery({
    queryKey: ["cities", countryId ?? "all"],
    queryFn: async (): Promise<City[]> => {
      try {
        const params =
          countryId != null && countryId > 0
            ? { country_id: countryId }
            : undefined;
        const response = await api.get("/cities", { params });
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[useCitiesQuery] API failed, returning empty:", err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: countryId === undefined || countryId > 0,
  });
};
