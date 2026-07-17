/**
 * Quartier tile-pyramid prefetch — the third leg of the raster-carpet
 * architecture (with @2x tiles and the capped zoom range).
 *
 * The moment a quartier is pinned, every raster tile the user is likely to
 * look at (z14–17 across the quartier's bounds) is fetched in the
 * background. This warms BOTH caches at once: the server's in-process
 * render cache (so its own prewarm sweep and our requests converge) and
 * the device's HTTP cache. By the time a pinch-zoom lands on any tile,
 * it's already hot — cold tiles rendering blank mid-gesture was the one
 * legitimate complaint against the raster path.
 *
 * z18–20 are deliberately NOT prefetched: their tile counts explode
 * (4× per level) and by the time a user is that deep, the visible set is
 * tiny and the server cache is already warm from this sweep + its own.
 */
import type { HabitatSector } from "../types/habitat";
import { extractSectorPolygons } from "./habitatGeometry";
import { habitatSectorRasterTileUrl } from "./habitatRasterOverlay";

const PREFETCH_MIN_ZOOM = 14;
const PREFETCH_MAX_ZOOM = 17;
const PREFETCH_MAX_TILES = 180;
const PREFETCH_CONCURRENCY = 5;

let activeAbort: AbortController | null = null;

function lngToTileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
}

function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, z),
  );
}

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

function sectorBounds(sector: HabitatSector): Bounds | null {
  const rings = extractSectorPolygons(sector);
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const c of ring) {
      minLat = Math.min(minLat, c.latitude);
      maxLat = Math.max(maxLat, c.latitude);
      minLng = Math.min(minLng, c.longitude);
      maxLng = Math.max(maxLng, c.longitude);
    }
  }
  if (Number.isFinite(minLat)) return { minLat, maxLat, minLng, maxLng };

  const lat = sector.centroid_lat;
  const lng = sector.centroid_lng;
  if (lat == null || lng == null) return null;
  // ~1.1km half-extent fallback when the sector has no boundary polygon.
  return {
    minLat: lat - 0.01,
    maxLat: lat + 0.01,
    minLng: lng - 0.01,
    maxLng: lng + 0.01,
  };
}

/** Fire-and-forget; a new call (quartier switch) aborts the previous sweep. */
export function prefetchSectorRasterTiles(sector: HabitatSector): void {
  activeAbort?.abort();
  const ac = new AbortController();
  activeAbort = ac;

  const bounds = sectorBounds(sector);
  if (!bounds || sector.id == null) return;

  const template = habitatSectorRasterTileUrl(sector.id);
  const urls: string[] = [];
  for (let z = PREFETCH_MIN_ZOOM; z <= PREFETCH_MAX_ZOOM; z++) {
    const x0 = lngToTileX(bounds.minLng, z);
    const x1 = lngToTileX(bounds.maxLng, z);
    const y0 = latToTileY(bounds.maxLat, z);
    const y1 = latToTileY(bounds.minLat, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        if (urls.length >= PREFETCH_MAX_TILES) break;
        urls.push(
          template
            .replace("{z}", String(z))
            .replace("{x}", String(x))
            .replace("{y}", String(y)),
        );
      }
      if (urls.length >= PREFETCH_MAX_TILES) break;
    }
    if (urls.length >= PREFETCH_MAX_TILES) break;
  }
  if (urls.length === 0) return;

  let next = 0;
  const worker = async () => {
    while (next < urls.length && !ac.signal.aborted) {
      const url = urls[next++]!;
      try {
        await fetch(url, { signal: ac.signal });
      } catch {
        /* best effort — the on-demand path still works */
      }
    }
  };
  for (let w = 0; w < PREFETCH_CONCURRENCY; w++) {
    void worker();
  }
}
