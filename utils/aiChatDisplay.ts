/** Strip internal AI / picker payloads from text shown in chat bubbles. */

export type PickerBlock = {
  cityName: string;
  zoneName: string;
  quartierName: string;
  budgetMin: number;
  budgetMax: number;
};

const INTERNAL_LINE_PATTERNS = [
  /^\s*Do NOT ask again for city\/zone\/quartier\/budget\.?\s*$/i,
  /^\s*Use the filters exactly as provided above\.?\s*$/i,
  /^\s*Then return the best real property suggestions from Meskeny\.?\s*$/i,
];

export function parsePickerBlock(content: string): PickerBlock | null {
  const raw = content || "";
  const start = raw.indexOf("[MESKENY_PICKER]");
  const end = raw.indexOf("[/MESKENY_PICKER]");
  if (start < 0 || end <= start) return null;

  const block = raw.slice(start + "[MESKENY_PICKER]".length, end);
  const out: PickerBlock = {
    cityName: "",
    zoneName: "",
    quartierName: "",
    budgetMin: 0,
    budgetMax: 0,
  };

  for (const ln of block.split("\n")) {
    const trimmed = ln.trim();
    if (!trimmed || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const val = rest.join("=").trim();
    switch (key.trim()) {
      case "city_name":
        out.cityName = val;
        break;
      case "zone_name":
        out.zoneName = val;
        break;
      case "quartier_name":
        out.quartierName = val;
        break;
      case "budget_min_mru":
        out.budgetMin = Number(val) || 0;
        break;
      case "budget_max_mru":
        out.budgetMax = Number(val) || 0;
        break;
      default:
        break;
    }
  }

  if (!out.cityName.trim()) return null;
  return out;
}

function formatBudgetLabel(min: number, max: number): string | null {
  if (min <= 0 && max <= 0) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-MR", { maximumFractionDigits: 0 }).format(n);
  if (min > 0 && max > min) return `${fmt(min)} – ${fmt(max)} MRU`;
  if (max > 0) return `≤ ${fmt(max)} MRU`;
  if (min > 0) return `≥ ${fmt(min)} MRU`;
  return null;
}

export function stripInternalAiInstructions(text: string): string {
  let out = (text || "").replace(
    /\[MESKENY_PICKER\][\s\S]*?\[\/MESKENY_PICKER\]\n?/g,
    "",
  );
  for (const re of INTERNAL_LINE_PATTERNS) {
    out = out.replace(re, "");
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function formatUserMessageForDisplay(content: string): string {
  const picker = parsePickerBlock(content);
  if (picker) {
    const parts = [
      picker.quartierName,
      picker.zoneName,
      picker.cityName,
    ].filter(Boolean);
    const lines: string[] = [];
    if (parts.length) lines.push(`📍 ${parts.join(" · ")}`);
    const budget = formatBudgetLabel(picker.budgetMin, picker.budgetMax);
    if (budget) lines.push(`💰 ${budget}`);
    return lines.join("\n") || "Search filters";
  }
  return stripInternalAiInstructions(content);
}

export function sanitizeAssistantContentForDisplay(content: string): string {
  const raw = stripInternalAiInstructions((content || "").replace(/\r/g, ""));
  const parts = raw.split("\n");
  const firstNonEmptyIdx = parts.findIndex((l) => l.trim().length > 0);
  if (firstNonEmptyIdx === -1) return raw;
  const line = parts[firstNonEmptyIdx];
  const greetingPrefixRe =
    /^(\s*)(hello|hi|bonjour|salut)\b[\s\u00A0]*[!.,:;?\-]*[\s\u00A0]*/i;
  if (greetingPrefixRe.test(line)) {
    const cleaned = line.replace(greetingPrefixRe, "$1");
    if (cleaned.trim().length === 0) parts.splice(firstNonEmptyIdx, 1);
    else parts[firstNonEmptyIdx] = cleaned;
    return parts.join("\n");
  }
  return raw;
}

export function isClarificationQuickReplies(
  replies: { id: string }[] | undefined,
): boolean {
  if (!replies?.length) return false;
  return replies.some(
    (r) =>
      r.id.startsWith("purpose_") ||
      r.id.startsWith("type_") ||
      r.id.startsWith("loc_"),
  );
}

export function splitClarificationReplies(
  replies: { id: string; text: string; action: string }[],
) {
  const purpose = replies.filter((r) => r.id.startsWith("purpose_"));
  const types = replies.filter((r) => r.id.startsWith("type_"));
  const location = replies.filter((r) => r.id.startsWith("loc_"));
  const other = replies.filter(
    (r) =>
      !r.id.startsWith("purpose_") &&
      !r.id.startsWith("type_") &&
      !r.id.startsWith("loc_"),
  );
  return { purpose, types, location, other };
}

/** Merge rent/buy + property type chip actions into one search message. */
export function buildCombinedClarificationReply(
  purpose: { id: string; action: string },
  type: { id: string; action: string },
): string {
  const typeAction = (type.action || "").trim();
  const purposeAction = (purpose.action || "").trim();
  if (!purposeAction) return typeAction;
  if (!typeAction) return purposeAction;

  if (
    /rent|louer|إيجار|كراء|租/i.test(typeAction) ||
    /buy|acheter|شراء|买|vendre|sale/i.test(typeAction)
  ) {
    return typeAction;
  }

  const injected = injectPurposeIntoTypeAction(purpose.id, typeAction);
  if (injected) return injected;

  return `${purposeAction}. ${typeAction}`;
}

function injectPurposeIntoTypeAction(
  purposeId: string,
  typeAction: string,
): string | null {
  const rent = purposeId === "purpose_rent";
  const buy = purposeId === "purpose_buy";
  if (!rent && !buy) return null;

  if (rent) {
    if (/^Show me /i.test(typeAction)) {
      return typeAction.replace(/^Show me /i, "I want to rent ");
    }
    if (/^Montre-moi /i.test(typeAction)) {
      return typeAction.replace(/^Montre-moi /i, "Je cherche à louer ");
    }
    if (/^أبحث عن /i.test(typeAction)) {
      return typeAction.replace(/^أبحث عن /i, "أبحث عن ");
    }
    if (/^我想在/.test(typeAction)) {
      return typeAction.replace(/^我想在/, "我想在").replace(/找/, "租");
    }
  }

  if (buy) {
    if (/^Show me /i.test(typeAction)) {
      return typeAction.replace(/^Show me /i, "I want to buy ");
    }
    if (/^Montre-moi /i.test(typeAction)) {
      return typeAction.replace(/^Montre-moi /i, "Je cherche à acheter ");
    }
    if (/^أبحث عن /i.test(typeAction)) {
      return typeAction.replace(
        /^أبحث عن (.+) في /i,
        "أبحث عن $1 للبيع في ",
      );
    }
  }

  return null;
}
