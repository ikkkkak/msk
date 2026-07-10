/**
 * Cadastre map draw caps — PRODUCTION GRADE.
 *
 * These limits protect native iOS MKMapView / Android GMSMapView from
 * exceeding memory budgets. Each <Marker> with a custom React Native <View>
 * child consumes ~1–3 MB of native bitmap memory. Each <Polygon> consumes
 * proportional to its coordinate count. These caps keep the combined native
 * footprint well below the 150 MB danger zone on all devices.
 *
 * NEVER raise these without load-testing on a low-end device (iPhone SE, Galaxy A13).
 */

/** Max sector polygon overlays rendered simultaneously. */
export const MAX_SECTORS_DRAWN = 15;

/** Browse-mode viewport plots (no quartier pinned). */
export const MAX_PLOTS_DRAWN = 80;

/** Pinned quartier: draw every loaded plot — no sampling cap. */
export const MAX_SECTOR_POLYGON_DRAW = 20_000;

/** @deprecated use MAX_SECTOR_POLYGON_DRAW for pinned quartiers */
export const MAX_PLOTS_VIEWPORT_SECTOR = 80;

/** Below this zoom, draw fewer polygons (still from full local cache). */
export const MIN_ZOOM_SECTOR_PLOT_GEOM = 12;

/** Max plots fetched from API for one quartier (all plots drawn when pinned). */
export const MAX_SECTOR_PLOTS_FETCH = 20_000;

/** Plot number labels — only render when very few plots visible. */
export const MAX_PLOT_NUMBER_LABELS = 8;

/**
 * HARD SAFETY CAP: total native map children (Markers + Polygons combined).
 * Browse mode uses the lower cap; pinned quartier draws all loaded plots.
 */
export const MAX_NATIVE_MAP_CHILDREN = 250;

/** Native map budget when an entire quartier is pinned. */
export const MAX_NATIVE_MAP_CHILDREN_SECTOR = 20_000;
