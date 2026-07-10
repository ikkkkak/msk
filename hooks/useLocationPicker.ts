import { useMemo, useState } from "react";
import {
  isHabitatCatalogCity,
  locationDisplayName,
  useListingLocationCatalog,
  type LocationCity,
  type LocationQuartier,
  type LocationZone,
} from "./useListingLocationCatalog";

export type UseLocationPickerOptions = {
  countryId?: number | null;
};

/** Shared city / zone / quartier catalog + search state for all listing flows. */
export function useLocationPicker(
  cityId?: number | null,
  zoneId?: number | null,
  options?: UseLocationPickerOptions,
) {
  const [citySearch, setCitySearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");
  const [quartierSearch, setQuartierSearch] = useState("");

  const catalog = useListingLocationCatalog(
    cityId ?? undefined,
    zoneId ?? undefined,
    {
      countryId: options?.countryId ?? undefined,
    },
  );

  const selectedCity = useMemo(
    () => catalog.cities.find((c) => c.id === cityId) ?? null,
    [catalog.cities, cityId],
  );
  const selectedZone = useMemo(
    () => catalog.zones.find((z) => z.id === zoneId) ?? null,
    [catalog.zones, zoneId],
  );

  const habitatCity = isHabitatCatalogCity(selectedCity);
  const cityName = selectedCity ? catalog.label(selectedCity) : "";
  const zoneName = selectedZone ? catalog.label(selectedZone) : "";

  const resetZoneSearch = () => setZoneSearch("");
  const resetQuartierSearch = () => setQuartierSearch("");
  const resetAllSearch = () => {
    setCitySearch("");
    setZoneSearch("");
    setQuartierSearch("");
  };

  return {
    ...catalog,
    citySearch,
    setCitySearch,
    zoneSearch,
    setZoneSearch,
    quartierSearch,
    setQuartierSearch,
    resetZoneSearch,
    resetQuartierSearch,
    resetAllSearch,
    selectedCity,
    selectedZone,
    habitatCity,
    cityName,
    zoneName,
    displayName: (item: LocationCity | LocationZone | LocationQuartier) =>
      locationDisplayName(item, catalog.lang),
  };
}
