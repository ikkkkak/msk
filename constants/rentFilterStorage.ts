import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "rent_tab_filters_v1";

export type RentFilterState = {
  listingType: string;
  /** Property category id from /categories?type=property */
  propertyCategoryId?: number;
  countryId?: number;
  cityId?: number;
  zoneId?: number;
  quartierId?: number;
  countryName?: string;
  cityName?: string;
  zoneName?: string;
  quartierName?: string;
  priceMin?: number;
  priceMax?: number;
};

export const DEFAULT_RENT_FILTERS: RentFilterState = {
  listingType: "all",
};

export const rentFilterStorage = {
  async load(): Promise<RentFilterState | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RentFilterState;
      return { ...DEFAULT_RENT_FILTERS, ...parsed };
    } catch {
      return null;
    }
  },

  async save(state: RentFilterState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
