import { TurboModuleRegistry } from "react-native";

let cached: boolean | null = null;
let warnedMissing = false;

/** True when MapLibre Native was linked into the dev client (not Expo Go). */
export function isMapLibreNativeAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    cached =
      TurboModuleRegistry.get("MLRNMapViewModule") != null &&
      TurboModuleRegistry.get("MLRNCameraModule") != null;
  } catch {
    cached = false;
  }
  return cached;
}

export function warnIfMapLibreNativeMissing(flagEnabled: boolean) {
  if (!flagEnabled || isMapLibreNativeAvailable() || warnedMissing) return;
  warnedMissing = true;
  console.warn(
    "[HabitatCadastre] MapLibre native modules not in this binary — using react-native-maps. Rebuild the dev client: npx expo run:ios (or run:android). MapLibre does not work in Expo Go.",
  );
}
