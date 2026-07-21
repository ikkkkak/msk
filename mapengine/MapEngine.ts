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

/**
 * Resolve the Mapbox token from every place a build can surface it, in
 * order: the inlined EXPO_PUBLIC_ env var (local Metro / build env), then
 * app config `extra.mapboxToken` (set by app.config.js — survives when the
 * env var isn't inlined into the JS bundle, e.g. some CI paths). A `pk.`
 * token is a PUBLIC client token by design (it ships in every map request);
 * the only real protection is URL/scope restrictions on the Mapbox side,
 * not secrecy — so reading it from config is safe and does NOT hardcode it
 * into the committed source.
 */
function resolveMapboxToken(): string {
  const fromEnv = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const extra =
    (Constants.expoConfig?.extra as { mapboxToken?: string } | undefined) ??
    (Constants.manifest2?.extra?.expoClient?.extra as
      | { mapboxToken?: string }
      | undefined);
  const fromExtra = extra?.mapboxToken?.trim();
  if (fromExtra) return fromExtra;
  return "";
}

export const MAPBOX_ACCESS_TOKEN = resolveMapboxToken();

/** Professional basemap styles — street + satellite tiers. */
export const MAPBOX_STYLE_STREETS = "mapbox://styles/mapbox/streets-v12";
export const MAPBOX_STYLE_SATELLITE =
  "mapbox://styles/mapbox/satellite-streets-v12";

export type CadastreMapType = "standard" | "satellite" | "sentinel";

export function mapboxStyleForMapType(mapType: CadastreMapType): string {
  return mapType === "standard" ? MAPBOX_STYLE_STREETS : MAPBOX_STYLE_SATELLITE;
}

/** One-line reason the engine can/can't use Mapbox — logged once for diagnosis. */
export function mapboxLoadBlockReason(): string | null {
  if (!MAPBOX_ACCESS_TOKEN) return "no Mapbox token at runtime (EXPO_PUBLIC_MAPBOX_TOKEN / extra.mapboxToken both empty)";
  try {
    // Expo Go cannot host custom native modules. Detect ONLY the real Expo
    // Go runtime — a dev/standalone build must never be misclassified here.
    if (Constants.executionEnvironment === "storeClient") return "running in Expo Go (storeClient) — dev build required";
  } catch {
    /* unknown runtime — allow the attempt */
  }
  return null;
}

/**
 * True when this runtime can host the Mapbox native module at all.
 * Deliberately does NOT check the deprecated `appOwnership` (it can read
 * "expo" on some dev builds and wrongly force the fallback) — the
 * executionEnvironment storeClient check is the reliable Expo Go signal.
 */
export function canAttemptMapboxLoad(): boolean {
  const reason = mapboxLoadBlockReason();
  if (reason) {
    console.warn("[MapEngine] Mapbox unavailable →", reason);
    return false;
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
