import type { Category } from "../hooks/queries/useCategories";

/** Same label resolution as AddPropertySection property-type step. */
export function getLocalizedCategoryName(
  item: Category | Record<string, unknown>,
  lang?: string,
): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  const name = (item as Category)?.name;
  if (name && typeof name === "object") {
    if (code === "ar") return name.ar || name.fr || name.en || "—";
    if (code === "fr") return name.fr || name.ar || name.en || "—";
    return name.en || name.fr || name.ar || "—";
  }
  const raw = item as Record<string, unknown>;
  if (code === "ar") {
    return String(raw.name_ar || raw.name || "—");
  }
  return String(raw.name || raw.name_ar || "—");
}

export function categoryEnglishName(
  item: Category | Record<string, unknown>,
): string {
  const name = (item as Category)?.name;
  if (name && typeof name === "object" && name.en) return name.en;
  return String((item as Record<string, unknown>).name || "").trim();
}

/** Match sale `property_type` filter value back to a category id. */
export function categoryIdForSalePropertyType(
  categories: Category[],
  propertyType?: string,
): number | undefined {
  if (!propertyType || String(propertyType).toLowerCase() === "all") {
    return undefined;
  }
  const needle = String(propertyType).trim().toLowerCase();
  const hit = categories.find(
    (cat) => categoryEnglishName(cat).toLowerCase() === needle,
  );
  return hit?.id;
}
