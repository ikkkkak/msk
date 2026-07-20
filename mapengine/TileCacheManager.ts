/**
 * TileCacheManager — quartier-level cache orchestration.
 *
 * Layers of caching (outermost first):
 * 1. Mapbox's own native tile/style cache — automatic, on-disk, survives
 *    restarts. Basemap + our MVT plot tiles both benefit.
 * 2. This module: TileJSON metadata per quartier (bounds for instant
 *    camera fit) with an LRU cap, plus request dedup + abort on
 *    quartier switch.
 *
 * Returning to a recently opened quartier costs zero network requests for
 * camera fit, and the plot tiles come out of Mapbox's disk cache.
 */
import { habitatApi } from "../services/habitatApi";
import type { HabitatTileJson } from "../utils/habitatVectorTiles";

const TILEJSON_LRU_CAP = 12;

const tileJsonBySector = new Map<number, HabitatTileJson>();
const inFlight = new Map<number, Promise<HabitatTileJson | null>>();

export async function getSectorTileJsonCached(
  sectorId: number,
): Promise<HabitatTileJson | null> {
  const cached = tileJsonBySector.get(sectorId);
  if (cached) {
    // refresh LRU position
    tileJsonBySector.delete(sectorId);
    tileJsonBySector.set(sectorId, cached);
    return cached;
  }
  const pending = inFlight.get(sectorId);
  if (pending) return pending;

  const req = habitatApi
    .getSectorTileJson(sectorId)
    .then((tj) => {
      if (tj) {
        tileJsonBySector.set(sectorId, tj);
        while (tileJsonBySector.size > TILEJSON_LRU_CAP) {
          const oldest = tileJsonBySector.keys().next();
          if (oldest.done) break;
          tileJsonBySector.delete(oldest.value);
        }
      }
      return tj ?? null;
    })
    .catch(() => null)
    .finally(() => {
      inFlight.delete(sectorId);
    });
  inFlight.set(sectorId, req);
  return req;
}

/** Fire-and-forget warm — call when a quartier becomes likely (e.g. picker open). */
export function prefetchSectorTileJson(sectorId: number): void {
  void getSectorTileJsonCached(sectorId);
}

export function clearTileJsonCache(): void {
  tileJsonBySector.clear();
}
