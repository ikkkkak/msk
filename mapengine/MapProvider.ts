/**
 * MapProvider — decides which engine renders the cadastre map this session.
 *
 *   "mapbox"   → Mapbox native GPU engine (primary; dev/prod builds)
 *   "fallback" → native Apple/Google map + server raster overlay
 *                (Expo Go, missing token, or a Mapbox runtime failure)
 *
 * The decision is per-session and sticky-downgrades: once Mapbox fails it
 * never retries until next launch, so users can't get into a crash loop.
 */
import {
  canAttemptMapboxLoad,
  isMapboxRuntimeFailed,
} from "./MapEngine";

/** Master switch for the Mapbox cadastre engine. */
export const USE_MAPBOX_CADASTRE = true;

export type CadastreEngine = "mapbox" | "fallback";

export function resolveCadastreEngine(): CadastreEngine {
  if (!USE_MAPBOX_CADASTRE) return "fallback";
  if (isMapboxRuntimeFailed()) {
    // A prior load/mount error already downgraded this session (logged then).
    return "fallback";
  }
  if (!canAttemptMapboxLoad()) return "fallback"; // logs its own reason
  return "mapbox";
}
