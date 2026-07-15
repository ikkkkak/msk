import { TurboModuleRegistry } from "react-native";
import Constants from "expo-constants";

/** MapLibre 11.x — only modules required for cadastre MVT rendering. */
const REQUIRED_MODULES = ["MLRNMapViewModule", "MLRNCameraModule"] as const;

let cached: boolean | null = null;
let sessionDisabled = false;
let warnedMissing = false;
let warnedExpoGo = false;

/**
 * Expo Go can't load any custom native module — @maplibre/maplibre-react-native
 * is one. Same detection used elsewhere in this app (see
 * utils/videoCompressForUpload.ts: isExpoGo).
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Whether it's even safe to `import("./HabitatMapLibreCadastre")`. In Expo
 * Go, merely evaluating the @maplibre/maplibre-react-native package's JS
 * module can hard-crash the app (native Turbo Module lookups at import time
 * that aren't guarded/catchable the way a missing-module error normally is)
 * — this must be checked *before* the dynamic import, not just before
 * mounting the component. Caching a dev-client build with the module linked
 * but genuinely missing is the only other false case, covered separately by
 * isMapLibreNativeAvailable() after the module has actually loaded.
 */
export function canAttemptMapLibreModuleLoad(): boolean {
  if (isExpoGo()) {
    if (!warnedExpoGo) {
      warnedExpoGo = true;
      console.warn(
        "[HabitatCadastre] [GPU_FALLBACK] Running in Expo Go — MapLibre native modules cannot load here (custom native code requires a dev client build). Using react-native-maps polygon fallback.",
        { at: new Date().toISOString() },
      );
    }
    return false;
  }
  return true;
}

const loggedTurboModuleFailures = new Set<string>();

function turboModuleReady(name: string): boolean {
  try {
    const mod = TurboModuleRegistry.get(name);
    if (mod == null && !loggedTurboModuleFailures.has(name)) {
      loggedTurboModuleFailures.add(name);
      console.warn(`[HabitatCadastre] [GPU_FALLBACK] TurboModuleRegistry.get("${name}") returned null (module not registered)`);
    }
    return mod != null;
  } catch (err) {
    // Swallowing this before would hide a *real* native error (e.g. a
    // native init exception) behind the same generic "not found" path as
    // a genuinely-missing module — surfacing it so a real bug isn't
    // indistinguishable from "native module simply isn't linked."
    if (!loggedTurboModuleFailures.has(name)) {
      loggedTurboModuleFailures.add(name);
      console.warn(`[HabitatCadastre] [GPU_FALLBACK] TurboModuleRegistry.get("${name}") threw`, {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
    return false;
  }
}

export function resetMapLibreSessionGate(): void {
  sessionDisabled = false;
  cached = null;
}

/**
 * Permanently disable MapLibre for this app session after a native/runtime
 * failure. This is the signal that a production user just silently dropped
 * into the legacy react-native-maps polygon fallback — log it as a distinct,
 * greppable event (not just a generic warning) so degraded sessions are
 * visible in log aggregation instead of invisible until someone reports a
 * freeze. Not importing CADASTRE_LOG here on purpose (see file header —
 * habitatCadastreLog.ts -> habitatVectorTiles.ts -> this file would cycle).
 */
export function markMapLibreNativeUnavailable(reason?: string): void {
  const wasAlreadyDisabled = sessionDisabled;
  sessionDisabled = true;
  cached = false;
  if (!wasAlreadyDisabled) {
    console.warn("[HabitatCadastre] [GPU_FALLBACK] MapLibre disabled for session — using react-native-maps polygon fallback", {
      reason: reason ?? "unknown",
      at: new Date().toISOString(),
    });
  }
}

/**
 * True when MapLibre Native was linked into the dev client (not Expo Go).
 *
 * Only a positive result is cached permanently. A negative result is NOT
 * locked in — TurboModuleRegistry.get() is a cheap, synchronous call, and
 * caching "false" forever after a single check risks permanently wrongly
 * disabling the GPU path if this ever gets called before native module
 * registration has fully settled (e.g. very first render on cold start).
 * Re-checking costs nothing and self-heals; permanently caching false does
 * not.
 */
export function isMapLibreNativeAvailable(): boolean {
  if (sessionDisabled) return false;
  if (cached === true) return true;
  if (!canAttemptMapLibreModuleLoad()) return false;

  const results = REQUIRED_MODULES.map(
    (name) => [name, turboModuleReady(name)] as const,
  );
  const allReady = results.every(([, ready]) => ready);

  if (allReady) {
    cached = true;
    if (warnedMissing) {
      // Confirms this was a startup timing race, not a truly missing
      // module — the earlier warning above was a false negative.
      console.warn(
        "[HabitatCadastre] [GPU_FALLBACK] MapLibre native modules became available after an earlier failed check — was a startup timing race, not actually missing",
        { at: new Date().toISOString() },
      );
    }
    return true;
  }

  // Cold-start absence (module never linked into this binary) is the most
  // common way users end up on the polygon fallback in production — log it
  // once, always (not __DEV__-gated), so it's visible without a crash report.
  if (!warnedMissing) {
    warnedMissing = true;
    console.warn("[HabitatCadastre] [GPU_FALLBACK] MapLibre native modules not present in this binary — using react-native-maps polygon fallback", {
      per_module: Object.fromEntries(results),
      at: new Date().toISOString(),
    });
  }
  return false;
}

export function warnIfMapLibreNativeMissing(flagEnabled: boolean) {
  if (!__DEV__) return;
  if (!flagEnabled || isMapLibreNativeAvailable() || warnedMissing) return;
  console.warn(
    "[HabitatCadastre] MapLibre native modules not in this binary — using react-native-maps fallback.",
  );
}
