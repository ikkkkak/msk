import { useCallback, useEffect, useMemo, useState } from "react";
import type { RentDiscoveryQueryFilters } from "./queries/useLocationDiscovery";
import {
  DEFAULT_RENT_FILTERS,
  rentFilterStorage,
  type RentFilterState,
} from "../constants/rentFilterStorage";

export function useRentTabFilters() {
  const [state, setState] = useState<RentFilterState>(DEFAULT_RENT_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void rentFilterStorage.load().then((saved) => {
      if (cancelled) return;
      if (saved) setState(saved);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void rentFilterStorage.save(state);
  }, [state, hydrated]);

  const patch = useCallback((partial: Partial<RentFilterState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setListingType = useCallback((listingType: string) => {
    patch({ listingType: listingType || "all" });
  }, [patch]);

  const setPropertyCategory = useCallback((propertyCategoryId?: number) => {
    patch({
      propertyCategoryId:
        propertyCategoryId != null && propertyCategoryId > 0
          ? propertyCategoryId
          : undefined,
    });
  }, [patch]);

  const setCountry = useCallback(
    (countryId?: number, countryName?: string) => {
      patch({
        countryId,
        countryName,
        cityId: undefined,
        cityName: undefined,
        zoneId: undefined,
        zoneName: undefined,
        quartierId: undefined,
        quartierName: undefined,
      });
    },
    [patch],
  );

  const setCity = useCallback((cityId?: number, cityName?: string) => {
    patch({
      cityId,
      cityName,
      zoneId: undefined,
      zoneName: undefined,
      quartierId: undefined,
      quartierName: undefined,
    });
  }, [patch]);

  const setZone = useCallback((zoneId?: number, zoneName?: string) => {
    patch({
      zoneId,
      zoneName,
      quartierId: undefined,
      quartierName: undefined,
    });
  }, [patch]);

  const setQuartier = useCallback(
    (quartierId?: number, quartierName?: string) => {
      patch({ quartierId, quartierName });
    },
    [patch],
  );

  const setPriceRange = useCallback(
    (min?: number, max?: number) => {
      patch({ priceMin: min, priceMax: max });
    },
    [patch],
  );

  const clearAll = useCallback(() => {
    setState(DEFAULT_RENT_FILTERS);
    void rentFilterStorage.clear();
  }, []);

  const filtersActive = useMemo(() => {
    return (
      (state.cityId != null && state.cityId > 0) ||
      (state.zoneId != null && state.zoneId > 0) ||
      (state.quartierId != null && state.quartierId > 0) ||
      (state.countryId != null && state.countryId > 0) ||
      (state.priceMin != null && state.priceMin > 0) ||
      (state.priceMax != null && state.priceMax > 0) ||
      (state.listingType && state.listingType !== "all") ||
      (state.propertyCategoryId != null && state.propertyCategoryId > 0)
    );
  }, [state]);

  const discoveryFilters = useMemo((): RentDiscoveryQueryFilters => {
    const f: RentDiscoveryQueryFilters = {};
    if (state.listingType && state.listingType !== "all") {
      f.propertyType = state.listingType;
    }
    if (state.propertyCategoryId != null && state.propertyCategoryId > 0) {
      f.propertyCategoryId = state.propertyCategoryId;
    }
    if (state.countryId != null && state.countryId > 0) {
      f.countryId = state.countryId;
    }
    if (state.cityId != null && state.cityId > 0) f.cityId = state.cityId;
    if (state.zoneId != null && state.zoneId > 0) f.zoneId = state.zoneId;
    if (state.quartierId != null && state.quartierId > 0) {
      f.quartierId = state.quartierId;
    }
    if (state.priceMin != null && state.priceMin > 0) {
      f.minPrice = state.priceMin;
    }
    if (state.priceMax != null && state.priceMax > 0) {
      f.maxPrice = state.priceMax;
    }
    return f;
  }, [state]);

  return {
    hydrated,
    listingType: state.listingType,
    propertyCategoryId: state.propertyCategoryId,
    countryId: state.countryId,
    cityId: state.cityId,
    zoneId: state.zoneId,
    quartierId: state.quartierId,
    priceRange: { min: state.priceMin, max: state.priceMax },
    filtersActive,
    discoveryFilters,
    setListingType,
    setPropertyCategory,
    setCountry,
    setCity,
    setZone,
    setQuartier,
    setPriceRange,
    clearAll,
  };
}
