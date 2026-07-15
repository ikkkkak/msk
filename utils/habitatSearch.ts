/** Normalize text for Arabic/Latin cadastre search (case, alef, tatweel). */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ");
}

export function matchesCadastreSearch(
  haystack: string | null | undefined,
  query: string,
): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  if (!haystack) return false;
  return normalizeSearchText(haystack).includes(q);
}

export function matchesPlan(plan: { name: string; name_ar?: string; code?: string }, query: string): boolean {
  return (
    matchesCadastreSearch(plan.name, query) ||
    matchesCadastreSearch(plan.name_ar, query) ||
    matchesCadastreSearch(plan.code, query)
  );
}

export function matchesSector(
  sector: { name: string; name_ar?: string; code?: string },
  query: string,
): boolean {
  return (
    matchesCadastreSearch(sector.name, query) ||
    matchesCadastreSearch(sector.name_ar, query) ||
    matchesCadastreSearch(sector.code, query)
  );
}

export function matchesSubSector(
  subSector: { name: string; name_ar?: string; code?: string },
  query: string,
): boolean {
  return (
    matchesCadastreSearch(subSector.name, query) ||
    matchesCadastreSearch(subSector.name_ar, query) ||
    matchesCadastreSearch(subSector.code, query)
  );
}

/** True when query is mostly digits (plot number search). */
export function looksLikePlotNumber(query: string): boolean {
  const t = query.trim();
  if (t.length < 2) return false;
  const digits = t.replace(/[\s\-_/]/g, "");
  return digits.length >= 2 && /^\d+$/.test(digits);
}
