/**
 * Listing output language from user-written text only (NOT app i18n locale).
 * Any Arabic script → Arabic output.
 */
export type InputLang = "ar" | "fr" | "en";

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function detectInputLanguage(text: string): InputLang {
  const s = text.trim();
  if (!s) return "fr";

  if (ARABIC_RE.test(s)) return "ar";

  const lower = s.toLowerCase();
  const frWords = [
    "je",
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "est",
    "cherche",
    "maison",
    "terrain",
    "vends",
    "louer",
    "appartement",
  ];
  const enWords = [
    "the",
    "is",
    "are",
    "house",
    "land",
    "bedroom",
    "for sale",
    "looking",
    "rent",
    "apartment",
  ];
  let fr = 0;
  let en = 0;
  for (const w of frWords) {
    if (lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.includes(w)) fr++;
  }
  for (const w of enWords) {
    if (lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.includes(w)) en++;
  }
  if (en > fr) return "en";
  return "fr";
}

/** Detect from description + optional location hints (same rules as server). */
export function detectListingOutputLanguage(
  details: string,
  cityHint = "",
  zoneHint = "",
  quartierHint = "",
  appLocaleFallback?: string,
): InputLang {
  const blob = [details, cityHint, zoneHint, quartierHint].filter(Boolean).join(" ");
  if (blob.trim().length >= 8) {
    return detectInputLanguage(blob);
  }
  const loc = (appLocaleFallback || "").toLowerCase();
  if (loc.startsWith("ar")) return "ar";
  if (loc.startsWith("en")) return "en";
  if (loc.startsWith("fr")) return "fr";
  return detectInputLanguage(blob);
}
