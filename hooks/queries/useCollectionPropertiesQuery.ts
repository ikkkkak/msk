import { useQuery } from "@tanstack/react-query";
import { Property } from "../../types/property";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";
import axios from "axios";

export const useCollectionPropertiesQuery = (collectionID: number) => {
  const { user } = useUser();

  return useQuery<Property[]>(
    ["collectionProperties", collectionID],
    async () => {
      console.log("Fetching properties for collection:", collectionID);
      const response = await axios.get(
        endpoints.collectionProperties(collectionID),
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      console.log("Collection properties response:", response.data);
      return response.data.properties;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!user?.accessToken && !!collectionID, // Only run query if user is authenticated and collectionID exists
      onError: (error) => {
        console.error("Collection properties query error:", error);
      }
    }
  );
};
