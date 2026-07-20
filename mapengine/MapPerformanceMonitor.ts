/**
 * MapPerformanceMonitor — dev-only timing for the quartier load pipeline.
 * Measures pin → tiles-rendered wall time so regressions are visible in
 * logs instead of vibes. No-ops in production builds.
 */
const marks = new Map<string, number>();

export function markQuartierLoadStart(sectorId: number): void {
  if (!__DEV__) return;
  marks.set(`quartier-${sectorId}`, Date.now());
}

export function markQuartierRendered(sectorId: number, plotCount?: number): void {
  if (!__DEV__) return;
  const key = `quartier-${sectorId}`;
  const start = marks.get(key);
  if (start == null) return;
  marks.delete(key);
  console.log(
    `[MapPerf] quartier ${sectorId} rendered in ${Date.now() - start}ms` +
      (plotCount != null ? ` (${plotCount} plots, GPU tiles)` : ""),
  );
}
