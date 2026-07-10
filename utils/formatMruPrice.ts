/** Property sale + land sale price filter caps (MRU). */
export const SALE_PRICE_FILTER_MAX = 50_000_000;
/** Nightly rent price filter cap (MRU). */
export const RENT_PRICE_FILTER_MAX = 400_000;

/** Thousands separators for filter inputs and chips (e.g. 1,250,000). */
export function formatPriceThousands(
  value: number | string | null | undefined,
): string {
  if (value == null || value === "") return "";
  const num =
    typeof value === "string"
      ? parseInt(String(value).replace(/,/g, ""), 10)
      : Math.trunc(Number(value));
  if (!Number.isFinite(num) || num < 0) return "";
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function parsePriceThousandsInput(text: string): number | undefined {
  const cleaned = text.replace(/,/g, "").replace(/[^\d]/g, "").trim();
  if (!cleaned) return undefined;
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

/** Display label with MRU after the amount. */
export function formatMruAmount(value: number): string {
  return `${formatPriceThousands(value)} MRU`;
}

export function formatMruPriceRangeLabel(min: number, max: number): string {
  return `${formatPriceThousands(min)} - ${formatPriceThousands(max)} MRU`;
}
