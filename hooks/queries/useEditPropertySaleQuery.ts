import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { endpoints } from "../../constants";
import { useLanguage } from "../../contexts/LanguageContext";
import { getAppLanguage } from "../../utils/translation";

const fetchPropertySale = async (
  propertyID: number,
  lang: string
): Promise<any> => {
  const response = await axios.get(
    `${endpoints.propertySales}/${propertyID}?lang=${lang}`,
    {
      headers: {
        // Add auth if needed
      }
    }
  );

  const data =
    response.data?.property || response.data?.property_sale || response.data;
  return data;
};

export const useEditPropertySaleQuery = (propertyID: number) => {
  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage || getAppLanguage()).toLowerCase();

  return useQuery({
    queryKey: ["editPropertySale", propertyID, lang],
    queryFn: () => fetchPropertySale(propertyID, lang),
    enabled: !!propertyID,
    retry: 1,
  });
};
