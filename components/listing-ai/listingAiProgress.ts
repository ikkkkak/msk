import type { ListingAiKind } from "../../types/listingAi";

/** Ordered progress keys returned by the listing-ai worker. */
export const LISTING_AI_PROGRESS_STEPS = [
  "queued",
  "uploading",
  "matching_location",
  "writing_listing",
  "finalizing",
  "done",
] as const;

export type ListingAiProgressKey = (typeof LISTING_AI_PROGRESS_STEPS)[number];

export function progressStepIndex(key: string): number {
  const i = LISTING_AI_PROGRESS_STEPS.indexOf(key as ListingAiProgressKey);
  return i >= 0 ? i : 0;
}

export function progressPercent(key: string): number {
  const idx = progressStepIndex(key);
  const max = LISTING_AI_PROGRESS_STEPS.length - 1;
  return Math.round((idx / max) * 100);
}

/** Steps shown only on the AI processing sheet (not upload). */
export const AI_PROCESSING_STEPS = [
  "matching_location",
  "writing_listing",
  "finalizing",
] as const;

export function aiStepState(
  step: (typeof AI_PROCESSING_STEPS)[number],
  current: string,
): "done" | "active" | "upcoming" {
  const order = [...AI_PROCESSING_STEPS];
  const cur =
    current === "uploading" || current === "queued"
      ? "matching_location"
      : (order.includes(current as (typeof AI_PROCESSING_STEPS)[number])
          ? current
          : "matching_location");
  const stepIdx = order.indexOf(step);
  const curIdx = order.indexOf(cur as (typeof AI_PROCESSING_STEPS)[number]);
  if (stepIdx < curIdx) return "done";
  if (stepIdx === curIdx) return "active";
  return "upcoming";
}

export function aiProgressPercent(key: string): number {
  if (key === "uploading" || key === "queued") return 8;
  if (key === "done") return 100;
  const order = [...AI_PROCESSING_STEPS];
  const cur = order.includes(key as (typeof AI_PROCESSING_STEPS)[number])
    ? (key as (typeof AI_PROCESSING_STEPS)[number])
    : "matching_location";
  const idx = order.indexOf(cur);
  return Math.round(12 + ((idx + 1) / order.length) * 88);
}

export function suggestionExamples(
  kind: ListingAiKind,
  t: (key: string, opts?: { defaultValue: string }) => string,
): string[] {
  if (kind === "land") {
    return [
      t("listingAi.exampleLand1", {
        defaultValue:
          "500 m² residential plot in Tevragh Zeina, quiet street, title deed available.",
      }),
      t("listingAi.exampleLand2", {
        defaultValue:
          "Corner land near main road in Nouakchott, fenced, ideal for villa.",
      }),
    ];
  }
  if (kind === "sale") {
    return [
      t("listingAi.exampleSale1", {
        defaultValue:
          "Modern 3-bedroom apartment in Ksar, renovated kitchen, parking.",
      }),
      t("listingAi.exampleSale2", {
        defaultValue:
          "Villa with garden in Tevragh Zeina, 4 beds, quiet family area.",
      }),
    ];
  }
  return [
    t("listingAi.exampleRent1", {
      defaultValue:
        "Furnished 2-bedroom near university, Wi‑Fi, monthly rent.",
    }),
    t("listingAi.exampleRent2", {
      defaultValue:
        "Studio in city center, AC, ideal for professionals.",
    }),
  ];
}
