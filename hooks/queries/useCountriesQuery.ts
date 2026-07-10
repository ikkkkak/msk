import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface Country {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  name_fr?: string;
  is_active?: boolean;
  sort_order?: number;
}

export function getCountryDisplayName(
  country: Country | undefined,
  lang: string,
): string {
  if (!country) return "";
  const l = (lang || "en").toLowerCase();
  if (l === "ar") return country.name_ar || country.name;
  if (l === "fr") return country.name_fr || country.name;
  return country.name;
}

export const useCountriesQuery = () => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async (): Promise<Country[]> => {
      try {
        const response = await api.get("/countries");
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[useCountriesQuery] failed:", err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
