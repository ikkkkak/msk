import type { LatLng } from "../types/habitat";
import type { HabitatMapRef } from "./habitatMapFit";

/** Imperative handle for the cadastre map (react-native-maps). */
export type CadastreMapHandle = HabitatMapRef & {
  pointForCoordinate?: (
    coordinate: LatLng,
  ) => Promise<{ x: number; y: number } | null>;
};
