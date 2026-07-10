import { useQuery } from "@tanstack/react-query";

import { publicApi } from "../services/api";

import { useLanguage } from "../contexts/LanguageContext";



export type LocationCity = {

  id: number;

  name: string;

  name_ar?: string;

};



export type LocationZone = {

  id: number;

  name: string;

  name_ar?: string;

  city_id: number;

  habitat_plan_id?: number | null;

};



export type LocationQuartier = {

  id: number;

  name: string;

  name_ar?: string;

  zone_id: number;

  habitat_sector_id?: number | null;

};



export function matchesLocationSearch(

  item: { name?: string; name_ar?: string },

  query: string,

): boolean {

  const q = query.trim().toLowerCase();

  if (!q) return true;

  return (

    (item.name || "").toLowerCase().includes(q) ||

    (item.name_ar || "").toLowerCase().includes(q)

  );

}



export function locationDisplayName(

  item: { name?: string; name_ar?: string },

  lang: string,

): string {

  if (lang === "ar") return item.name_ar || item.name || "";

  return item.name || item.name_ar || "";

}



/** Nouakchott uses habitat_plans (zones) and habitat_sectors (quartiers) via the cities API. */

export function isHabitatCatalogCity(city?: LocationCity | null): boolean {

  if (!city) return false;

  const n = (city.name || "").trim().toLowerCase();

  const ar = (city.name_ar || "").trim();

  return (

    n === "nouakchott" ||

    n.includes("nouakchott") ||

    ar === "نواكشوط" ||

    ar.includes("نواكشوط")

  );

}



async function fetchCities(countryId?: number | null): Promise<LocationCity[]> {

  const hasCountry = countryId != null && countryId > 0;

  const path = hasCountry ? `/countries/${countryId}/cities` : "/cities";

  const r = await publicApi.get(path, { timeout: 15000 });

  let data = (r.data?.data || []) as LocationCity[];

  if (hasCountry && data.length === 0) {

    const fallback = await publicApi.get("/cities", { timeout: 15000 });

    data = (fallback.data?.data || []) as LocationCity[];

  }

  return data;

}



async function fetchZones(cityId: number): Promise<LocationZone[]> {

  const r = await publicApi.get(`/cities/${cityId}/zones`, { timeout: 15000 });

  return (r.data?.data || []) as LocationZone[];

}



async function fetchQuartiers(zoneId: number): Promise<LocationQuartier[]> {

  const r = await publicApi.get(`/cities/zones/${zoneId}/quartiers`, {

    timeout: 15000,

  });

  return (r.data?.data || []) as LocationQuartier[];

}



/** Cities, zones, and quartiers from the live catalog API (same source as Add with AI). */

export function useListingLocationCatalog(

  cityId?: number,

  zoneId?: number,

  options?: { countryId?: number | null },

) {

  const { currentLanguage } = useLanguage();

  const lang = currentLanguage || "en";

  const countryId = options?.countryId;



  const {

    data: cities = [],

    isLoading: citiesLoading,

    isError: citiesError,

    refetch: refetchCities,

  } = useQuery({

    queryKey: ["cities", lang, countryId ?? "all"],

    queryFn: () => fetchCities(countryId),

    staleTime: 5 * 60 * 1000,

    retry: 2,

  });



  const {

    data: zones = [],

    isLoading: zonesLoading,

    isError: zonesError,

    refetch: refetchZones,

  } = useQuery({

    queryKey: ["zones", cityId, lang],

    queryFn: () => fetchZones(cityId!),

    enabled: !!cityId && cityId > 0,

    staleTime: 5 * 60 * 1000,

    retry: 2,

  });



  const {

    data: quartiers = [],

    isLoading: quartiersLoading,

    isError: quartiersError,

    refetch: refetchQuartiers,

  } = useQuery({

    queryKey: ["quartiers", zoneId, lang],

    queryFn: () => fetchQuartiers(zoneId!),

    enabled: !!zoneId && zoneId > 0,

    staleTime: 5 * 60 * 1000,

    retry: 2,

  });



  return {

    lang,

    cities,

    zones,

    quartiers,

    citiesLoading,

    zonesLoading,

    quartiersLoading,

    citiesError,

    zonesError,

    quartiersError,

    refetchCities,

    refetchZones,

    refetchQuartiers,

    label: (item: { name?: string; name_ar?: string }) =>

      locationDisplayName(item, lang),

  };

}


