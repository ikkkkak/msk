import { api } from "./api";
import { endpoints } from "../constants";

export interface FavoriteCity {
  cityId?: number;
  cityName?: string;
  zoneId?: number;
  zoneName?: string;
}

/**
 * Set user's favorite city
 */
export const setFavoriteCity = async (
  cityId?: number,
  cityName?: string,
  zoneId?: number,
  zoneName?: string
): Promise<FavoriteCity> => {
  const { data } = await api.post(`${endpoints.user}/favorite-city`, {
    city_id: cityId,
    city_name: cityName,
    zone_id: zoneId,
    zone_name: zoneName,
  });
  return data.favoriteCity;
};

/**
 * Get user's favorite city
 */
export const getFavoriteCity = async (): Promise<FavoriteCity | null> => {
  try {
    const { data } = await api.get(`${endpoints.user}/favorite-city`);
    return data.favoriteCity;
  } catch (error) {
    return null;
  }
};
