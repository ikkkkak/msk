/**
 * Cadastre map draw caps — EMERGENCY FALLBACK ONLY.
 *
 * The real scaling strategy for cadastre plots is GPU vector tiles
 * (components/habitat/HabitatMapLibreCadastre.tsx — MapLibre renders every
 * plot in a quartier via MVT, no React components, no cap needed). These
 * limits exist only for the legacy react-native-maps <Polygon> path, which
 * activates when MapLibre's native module isn't linked into the running
 * binary (see utils/habitatMapLibreNative.ts — that now logs a
 * [GPU_FALLBACK] warning whenever this path engages, so it's visible in
 * production instead of a silent degradation).
 *
 * Each <Marker> with a custom React Native <View> child consumes ~1–3 MB of
 * native bitmap memory; each <Polygon> consumes proportional to its
 * coordinate count. These caps keep the combined native footprint well below
 * the 150 MB danger zone on all devices in this last-resort path.
 *
 * NEVER raise these without load-testing on a low-end device (iPhone SE, Galaxy A13).
 */

/** Max sector polygon overlays rendered simultaneously. */
export const MAX_SECTORS_DRAWN = 15;

/** Browse-mode viewport plots (no quartier pinned). */
export const MAX_PLOTS_DRAWN = 80;

/** Max plots fetched from API for one quartier — no practical cap; paginate until complete. */
export const MAX_SECTOR_PLOTS_FETCH = Number.MAX_SAFE_INTEGER;

/** Pinned quartier: draw every loaded plot in the quartier. */
export const MAX_SECTOR_POLYGON_DRAW = MAX_SECTOR_PLOTS_FETCH;

/** @deprecated use MAX_SECTOR_POLYGON_DRAW for pinned quartiers */
export const MAX_PLOTS_VIEWPORT_SECTOR = 80;

/** Below this zoom, draw fewer polygons (still from full local cache). */
export const MIN_ZOOM_SECTOR_PLOT_GEOM = 12;

/** Plot number labels — only render when very few plots visible. */
export const MAX_PLOT_NUMBER_LABELS = 8;

/**
 * HARD SAFETY CAP: total native map children (Markers + Polygons combined).
 */
export const MAX_NATIVE_MAP_CHILDREN = 250;

/**
 * Max native polygons when a quartier is pinned.
 * Native polygons crashed at 1,754+ plots.
 * Using GitHub Actions + Vector Tiles (MapLibre GL) for production 1,800+ plot rendering.
 */
export const MAX_NATIVE_MAP_CHILDREN_SECTOR = 120;
