import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { endpoints, queryKeys } from "../../constants";
import { Property } from "../../types/property";
import { useUser } from "../useUser";
import { useLanguage } from "../../contexts/LanguageContext";
import { getAppLanguage } from "../../utils/translation";

const fetchProperty = async (
  propertyID: number,
  lang: string
): Promise<Property> => {
  const url = `${endpoints.getPropertyByID}${propertyID}?lang=${lang}`;
  const response = await axios.get(url);

  const data: Property = response.data;
  return data;
};

export const useSelectedPropertyQuery = (propertyID: number) => {
  const { user } = useUser();
  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage || getAppLanguage()).toLowerCase();

  const queryInfo = useQuery({
    queryKey: [...queryKeys.selectedProperty, propertyID, lang],
    queryFn: () => fetchProperty(propertyID, lang),
    refetchOnMount: "always", // refetch when details screen is opened (e.g. after approval)
  });

  const data = queryInfo?.data;
  if (data && user?.savedProperties?.includes(data.ID)) {
    data.liked = true;
  }

  return {
    ...queryInfo,
    data
  };
};
