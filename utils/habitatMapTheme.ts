import type { HabitatPlan } from "../types/habitat";
import { colorWithAlpha } from "./habitatGeo";

/** District palette — consistent across plan / sector / plot layers */
export const HABITAT_PLAN_COLORS: Record<string, string> = {
  TEV: "#D35400",
  ARF: "#2980B9",
  DNM: "#27AE60",
  MNA: "#C0392B",
  RYD: "#16A085",
  SBK: "#8E44AD",
  TYR: "#1E8449",
  TJN: "#922B21",
  KSR: "#D68910",
};

export const HABITAT_DEFAULT_PLAN = "#3D5A80";

export const HABITAT_STROKE_WIDTH = {
  plan: 1.2,
  planSelected: 1.8,
  sector: 0.95,
  sectorSelected: 1.5,
  plot: 1.35,
  plotSelected: 2,
} as const;

export const HABITAT_FILL_ALPHA = {
  plan: 0.1,
  planSelected: 0.14,
  sector: 0.08,
  sectorSelected: 0.11,
  plot: 0.28,
  plotSelected: 0.38,
} as const;

export const HABITAT_NEUTRAL = {
  plotStroke: "#D97706",
  plotStrokeSelected: "#D97706",
  plotFill: "rgba(255, 255, 255, 0.32)",
  plotFillSelected: "rgba(255, 247, 237, 0.52)",
  label: "#111827",
  labelMuted: "#4B5563",
} as const;

/** Distinct highlight for plots that are actively for sale (landmarks). */
export const HABITAT_FOR_SALE = {
  plotStroke: "#DC2626",
  plotFill: "rgba(239, 68, 68, 0.18)",
} as const;

export function habitatPlanColor(plan: HabitatPlan): string {
  if (plan.color?.startsWith("#")) return plan.color;
  return HABITAT_PLAN_COLORS[plan.code] ?? HABITAT_DEFAULT_PLAN;
}

export function habitatPlanFill(plan: HabitatPlan, selected = false): string {
  return colorWithAlpha(
    habitatPlanColor(plan),
    selected ? HABITAT_FILL_ALPHA.planSelected : HABITAT_FILL_ALPHA.plan,
  );
}

export function habitatSectorStroke(
  plan?: HabitatPlan,
  selected = false,
): string {
  const base = plan ? habitatPlanColor(plan) : HABITAT_DEFAULT_PLAN;
  return colorWithAlpha(base, selected ? 0.95 : 0.72);
}

export function habitatSectorFill(
  plan?: HabitatPlan,
  selected = false,
): string {
  const base = plan ? habitatPlanColor(plan) : HABITAT_DEFAULT_PLAN;
  return colorWithAlpha(
    base,
    selected ? HABITAT_FILL_ALPHA.sectorSelected : HABITAT_FILL_ALPHA.sector,
  );
}
