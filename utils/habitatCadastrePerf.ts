/** Cadastre performance tracing — always logs (prod + dev). */
import { CADASTRE_LOG } from "../hooks/habitatCadastreLog";

export type CadastrePerfStage =
  | "tap"
  | "lookup"
  | "metadata"
  | "merge"
  | "highlight"
  | "focus"
  | "popup"
  | "count_api"
  | "plots_api"
  | "decode"
  | "draw_prep"
  | "geometry_prefetch"
  | "camera"
  | "done";

const STAGE_ORDER: CadastrePerfStage[] = [
  "tap",
  "lookup",
  "metadata",
  "merge",
  "highlight",
  "focus",
  "popup",
  "count_api",
  "plots_api",
  "decode",
  "draw_prep",
  "geometry_prefetch",
  "camera",
  "done",
];

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Trace one user flow (plot tap, quartier load, etc.). */
export class CadastrePerfTrace {
  private readonly label: string;
  private readonly t0: number;
  private readonly marks = new Map<CadastrePerfStage, number>();
  private closed = false;

  constructor(label: string, firstStage: CadastrePerfStage = "tap") {
    this.label = label;
    this.t0 = nowMs();
    this.marks.set(firstStage, this.t0);
  }

  mark(stage: CadastrePerfStage) {
    this.marks.set(stage, nowMs());
  }

  /** Milliseconds between two marked stages (rounded). */
  span(from: CadastrePerfStage, to: CadastrePerfStage): number | null {
    const a = this.marks.get(from);
    const b = this.marks.get(to);
    if (a == null || b == null) return null;
    return Math.round(b - a);
  }

  finish(extra?: Record<string, unknown>) {
    if (this.closed) return;
    this.closed = true;
    this.mark("done");

    const totalMs = Math.round(nowMs() - this.t0);
    const stages: Record<string, number> = {};

    for (let i = 0; i < STAGE_ORDER.length - 1; i += 1) {
      const from = STAGE_ORDER[i]!;
      const to = STAGE_ORDER[i + 1]!;
      const delta = this.span(from, to);
      if (delta != null && delta >= 0) {
        stages[`${from}_to_${to}`] = delta;
      }
    }

    // Named shortcuts for the common plot-tap pipeline.
    const lookupMs = this.span("tap", "lookup");
    const metadataMs = this.span("lookup", "metadata");
    const highlightMs = this.span("metadata", "highlight");
    const focusMs = this.span("highlight", "focus");
    const popupMs = this.span("focus", "popup");

    const pipeline: Record<string, number | null> = {};
    if (lookupMs != null) pipeline.lookup_ms = lookupMs;
    if (metadataMs != null) pipeline.metadata_ms = metadataMs;
    if (highlightMs != null) pipeline.highlight_ms = highlightMs;
    if (focusMs != null) pipeline.focus_ms = focusMs;
    if (popupMs != null) pipeline.popup_ms = popupMs;

    console.log(`${CADASTRE_LOG} [Perf] ${this.label}`, {
      total_ms: totalMs,
      pipeline,
      stages,
      ...extra,
    });
  }
}

/** Run async work and record elapsed ms for a stage boundary. */
export async function perfAsync<T>(
  trace: CadastrePerfTrace,
  startStage: CadastrePerfStage,
  endStage: CadastrePerfStage,
  fn: () => Promise<T>,
): Promise<T> {
  trace.mark(startStage);
  try {
    return await fn();
  } finally {
    trace.mark(endStage);
  }
}
