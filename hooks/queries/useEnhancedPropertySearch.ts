import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../../constants";
import { Property } from "../../types/property";
import { useUser } from "../useUser";
import { getAppLanguage } from "../../utils/translation";
import {
  isRentPropertyPublic,
  RENT_PUBLIC_LISTING_STATUSES,
} from "../../utils/rentPropertyVisibility";

export interface PropertySearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  limit?: number;
  offset?: number;
  boundingBox?: number[]; // [latLow, latHigh, lngLow, lngHigh]
}

const fetchPropertiesWithFilters = async (
  params: PropertySearchParams
): Promise<Property[]> => {
  try {
    const lang = getAppLanguage();
    let url = "";
    let requestData: any = {};

    // Use bounding box search if provided
    if (params.boundingBox && params.boundingBox.length === 4) {
      url = `${endpoints.getPropertiesByBoundingBox}?lang=${lang}`;
      requestData = {
        latLow: params.boundingBox[0],
        latHigh: params.boundingBox[1],
        lngLow: params.boundingBox[2],
        lngHigh: params.boundingBox[3]
      };
    } else if (params.lat && params.lng) {
      // Use bounding box search with coordinate filters
      url = `${endpoints.getPropertiesByBoundingBox}?lang=${lang}`;
      requestData = {
        latLow: params.lat - (params.radius || 0.01),
        latHigh: params.lat + (params.radius || 0.01),
        lngLow: params.lng - (params.radius || 0.01),
        lngHigh: params.lng + (params.radius || 0.01)
      };
      // Add filters to requestData for POST request
      if (params.propertyType) requestData.property_type = params.propertyType;
      if (params.minPrice) requestData.min_price = params.minPrice;
      if (params.maxPrice) requestData.max_price = params.maxPrice;
      if (params.bedrooms) requestData.bedrooms = params.bedrooms;
      if (params.bathrooms) requestData.bathrooms = params.bathrooms;
      if (params.amenities && params.amenities.length > 0) {
        requestData.amenities = params.amenities;
      }
      requestData.status = RENT_PUBLIC_LISTING_STATUSES;
    } else {
      console.warn("No valid search parameters provided");
      return [];
    }

    console.log(
      "Fetching properties with URL:",
      url,
      "Data:",
      requestData,
      "Lang:",
      lang
    );

    const response = params.boundingBox
      ? await axios.post(url, requestData)
      : await axios.get(url);

    const data: Property[] = (response.data || []).filter(isRentPropertyPublic);
    console.log("Fetched properties:", data.length, "properties");

    // Log first property details for debugging
    if (data.length > 0) {
      const firstProperty = data[0];
      console.log("Sample property:", {
        id: firstProperty.ID,
        title: firstProperty.title,
        city: firstProperty.city,
        price: firstProperty.nightlyPrice,
        host:
          firstProperty.host?.firstName + " " + firstProperty.host?.lastName,
        images: firstProperty.images
      });
    }

    return data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
};

export const useEnhancedPropertySearch = (params: PropertySearchParams) => {
  const { user } = useUser();

  const queryInfo = useQuery({
    queryKey: ["enhanced-property-search", params],
    queryFn: () => fetchPropertiesWithFilters(params),
    enabled: !!(params.boundingBox || (params.lat && params.lng)),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes (formerly cacheTime)
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
