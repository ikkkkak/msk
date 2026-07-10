import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, queryKeys } from "../../constants";

import { Property } from "../../types/property";
import { useUser } from "../useUser";
import { isRentPropertyPublic } from "../../utils/rentPropertyVisibility";

const fetchProperties = async (boundingBox: number[]): Promise<Property[]> => {
  if (!boundingBox || boundingBox.length !== 4) return [];

  try {
    // Get user token for user-specific exclusions
    const token = await AsyncStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(
      `${endpoints.getPropertiesByBoundingBox}`,
      {
        latLow: boundingBox[0],
        latHigh: boundingBox[1],
        lngLow: boundingBox[2],
        lngHigh: boundingBox[3]
      },
      { headers }
    );

    const data: Property[] = (Array.isArray(response.data) ? response.data : [])
      .filter(isRentPropertyPublic);
    console.log("Fetched properties:", data.length, "properties");
    return data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
};

export const useSearchPropertiesQuery = (boundingBox: number[]) => {
  const { user } = useUser();
  const queryInfo = useQuery({
    queryKey: [...queryKeys.searchProperties, boundingBox],
    queryFn: () => fetchProperties(boundingBox),
    enabled: boundingBox && boundingBox.length === 4,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  const data = queryInfo?.data;
  if (data)
    for (let property of data) {
      property.liked = false;
      if (user?.savedProperties?.includes(property.ID)) property.liked = true;
    }

  return {
    ...queryInfo,
    data
  };
};
