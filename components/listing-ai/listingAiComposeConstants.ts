import { PROPERTY_TYPE_OPTIONS } from "../../constants";

/** Rent listing property types (keys match manual rent form). */
export const RENT_PROPERTY_TYPES = PROPERTY_TYPE_OPTIONS.map((o) => ({
  key: o.key,
  labelKey: o.label,
}));

/** Sale listing property types (keys match CreatePropertySaleScreen). */
export const SALE_PROPERTY_TYPES = [
  { key: "Apartment", labelKey: "listing.sale.propertyType.apartment" },
  { key: "House", labelKey: "listing.sale.propertyType.house" },
  { key: "Villa", labelKey: "listing.sale.propertyType.villa" },
  { key: "Studio", labelKey: "listing.sale.propertyType.studio" },
  { key: "Townhouse", labelKey: "listing.sale.propertyType.townhouse" },
  { key: "Duplex", labelKey: "listing.sale.propertyType.duplex" },
] as const;
