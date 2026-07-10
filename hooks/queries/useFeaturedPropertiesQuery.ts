import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { endpoints, queryKeys } from "../../constants";
import { Property } from "../../types/property";
import { useUser } from "../useUser";

const fetchFeaturedProperties = async (): Promise<Property[]> => {
  // For now, we'll use a default bounding box that covers a large area
  // In the future, this could be based on user location or popular areas
  const defaultBoundingBox = {
    latLow: -90,
    latHigh: 90,
    lngLow: -180,
    lngHigh: 180
  };

  const response = await axios.post(
    `${endpoints.getPropertiesByBoundingBox}`,
    defaultBoundingBox
  );
  const data: Property[] = response.data;

  // Return only the first 20 properties for featured display
  return data.slice(0, 20);
};

export const useFeaturedPropertiesQuery = () => {
  const { user } = useUser();
  const queryInfo = useQuery({
    queryKey: queryKeys.featuredProperties,
    queryFn: fetchFeaturedProperties,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  });

  const data = queryInfo?.data;
  if (data) {
    for (let property of data) {
      property.liked = false;
      if (user?.savedProperties?.includes(property.ID)) property.liked = true;
    }
  }

  return {
    ...queryInfo,
    data
  };
};
