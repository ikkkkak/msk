/** Normalized keys match `listing.common.paperTypes.*` in i18n. */
const PAPER_ALIAS_MAP: Record<string, string> = {
  "titre foncier": "titre_foncier",
  titre_foncier: "titre_foncier",
  quitane: "quitane",
  lettre: "lettre",
  concession: "concession",
  bornage: "bornage",
};

export type PaperDisplayItem = { canonicalKey: string; label: string };

export function paperCanonicalKeyFromStored(raw: string): string | null {
  const n = raw.trim().toLowerCase();
  return PAPER_ALIAS_MAP[n] ?? null;
}

export function buildPaperDisplayItems(
  rawList: unknown,
  t: (key: string, defaultValue: string) => string,
): PaperDisplayItem[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map((paper) => {
      const canonical = paperCanonicalKeyFromStored(paper);
      const canonicalKey = canonical ?? "custom";
      const label = canonical
        ? t(`listing.common.paperTypes.${canonical}`, paper)
        : paper;
      return { canonicalKey, label };
    });
}
