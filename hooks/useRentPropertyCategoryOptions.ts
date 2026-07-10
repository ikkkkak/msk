import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  usePropertyCategories,
  type Category,
} from "./queries/useCategories";
import { useLanguage } from "../contexts/LanguageContext";
import { getLocalizedCategoryName } from "../utils/localizedCategoryName";

export type RentPropertyCategoryOption = {
  id: number;
  value: string;
  label: string;
  icon?: string;
  category: Category;
};

/** Same category list as AddPropertySection property-type step + rent filter bar. */
export function useRentPropertyCategoryOptions() {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const query = usePropertyCategories();

  const lang = i18n.language || currentLanguage || "en";

  const options = useMemo((): RentPropertyCategoryOption[] => {
    const sorted = [...(query.data ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    return sorted.map((cat) => ({
      id: cat.id,
      value: String(cat.id),
      label: getLocalizedCategoryName(cat, lang),
      icon: cat.icon,
      category: cat,
    }));
  }, [query.data, lang]);

  const allOption = useMemo(
    () => ({
      value: "all",
      label: t("filters.any", t("propertyType.all", "All")),
    }),
    [t],
  );

  const filterBarOptions = useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label, icon: o.icon })),
    [options],
  );

  const sectionTitle = t(
    "listing.rent.steps.propertyCategory.title",
    t("filters.propertyType", "Property type"),
  );

  const labelForCategoryId = (id?: number | string | null): string | undefined => {
    if (id == null || id === "" || Number(id) <= 0) return undefined;
    return options.find(
      (o) => o.id === Number(id) || o.value === String(id),
    )?.label;
  };

  return {
    options,
    filterBarOptions,
    allOption,
    sectionTitle,
    labelForCategoryId,
    isLoading: query.isLoading,
    categories: query.data ?? [],
  };
}

export function readRentPropertyCategoryId(property: Record<string, unknown>): number | undefined {
  const raw =
    property.propertyCategoryId ??
    property.property_category_id ??
    property.PropertyCategoryID ??
    property.PropertyCategoryId;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}
