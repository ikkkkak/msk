/**
 * Meskeny Map Engine — core configuration for the Mapbox GPU pipeline.
 *
 * IMPORTANT: this module must stay free of any static `@rnmapbox/maps`
 * import. The native module is looked up at import time; evaluating it in a
 * binary that doesn't bundle it (Expo Go) hard-crashes the app — the exact
 * failure mode the old MapLibre integration had. Only the dynamically
 * imported map component (`MapboxCadastreMap`) imports the SDK, and only
 * after `canAttemptMapboxLoad()` says the runtime can support it.
 *
 * Token security: the access token is NEVER hardcoded — it comes from the
 * EXPO_PUBLIC_MAPBOX_TOKEN env var (.env locally — gitignored — and a CI
 * secret for builds). Telemetry is disabled at init.
 */
import Constants from "expo-constants";

export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";

/** Professional basemap styles — street + satellite tiers. */
export const MAPBOX_STYLE_STREETS = "mapbox://styles/mapbox/streets-v12";
export const MAPBOX_STYLE_SATELLITE =
  "mapbox://styles/mapbox/satellite-streets-v12";

export type CadastreMapType = "standard" | "satellite" | "sentinel";

export function mapboxStyleForMapType(mapType: CadastreMapType): string {
  return mapType === "standard" ? MAPBOX_STYLE_STREETS : MAPBOX_STYLE_SATELLITE;
}

/**
 * True when this runtime can host the Mapbox native module at all.
 * Expo Go ("storeClient") cannot — custom native modules aren't bundled.
 */
export function canAttemptMapboxLoad(): boolean {
  if (!MAPBOX_ACCESS_TOKEN) return false;
  try {
    if (Constants.appOwnership === "expo") return false;
    if (Constants.executionEnvironment === "storeClient") return false;
  } catch {
    /* default to attempting on unknown runtimes */
  }
  return true;
}

/** Set when the SDK module load or first mount fails — never retried this session. */
let mapboxRuntimeFailed = false;

export function markMapboxRuntimeFailed(reason?: string): void {
  if (!mapboxRuntimeFailed) {
    console.warn("[MapEngine] Mapbox runtime unavailable — falling back", reason);
  }
  mapboxRuntimeFailed = true;
}

export function isMapboxRuntimeFailed(): boolean {
  return mapboxRuntimeFailed;
}

let engineInitialized = false;

/**
 * Idempotent engine init — called by the map component module with the
 * loaded SDK. Applies the access token and disables telemetry.
 */
export function initMapboxEngine(mapbox: {
  setAccessToken: (t: string) => void;
  setTelemetryEnabled?: (b: boolean) => void;
}): void {
  if (engineInitialized) return;
  engineInitialized = true;
  mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  try {
    mapbox.setTelemetryEnabled?.(false);
  } catch {
    /* telemetry API differs across SDK versions — non-fatal */
  }
}
