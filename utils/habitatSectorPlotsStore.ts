import type { HabitatPlot } from "../types/habitat";

/** Module store — avoids copying 1000+ plot rows through React state on every page. */
let activeSectorId: number | null = null;
let plots: HabitatPlot[] = [];

export function resetSectorPlotsStore(sectorId: number): void {
  activeSectorId = sectorId;
  plots = [];
}

export function appendSectorPlotsStore(sectorId: number, chunk: HabitatPlot[]): void {
  if (activeSectorId !== sectorId || chunk.length === 0) return;
  plots.push(...chunk);
}

export function getSectorPlotsSnapshot(sectorId: number | null): HabitatPlot[] {
  if (sectorId == null || activeSectorId !== sectorId) return [];
  return plots;
}

export function getSectorPlotsCount(sectorId: number | null): number {
  if (sectorId == null || activeSectorId !== sectorId) return 0;
  return plots.length;
}

export function clearSectorPlotsStore(): void {
  activeSectorId = null;
  plots = [];
}
