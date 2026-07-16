/**
 * Cadastre map draw caps — the native map (Apple Maps on iOS, Google Maps
 * on Android via react-native-maps) is the ONLY rendering path.
 *
 * Scaling strategy: a pinned quartier's plots are all fetched once and kept
 * in an in-memory spatial index (utils/habitatSpatialIndex.ts); every camera
 * move mounts only the plots intersecting the buffered viewport, capped
 * below. A 1,800-plot (or 50,000-plot) quartier therefore never mounts more
 * than a few hundred native polygons simultaneously — native polygons
 * crashed outright at 1,754 mounted at once.
 *
 * Each <Marker> with a custom React Native <View> child consumes ~1–3 MB of
 * native bitmap memory; each <Polygon> consumes proportional to its
 * coordinate count. These caps keep the combined native footprint well below
 * the 150 MB danger zone on all devices.
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

/**
 * Pinned-quartier LOD is now binary: at or above MIN_ZOOM_SECTOR_PLOT_GEOM
 * every plot in the quartier is mounted (complete data, matching the
 * official cadastre); below it only the quartier boundary renders — plots
 * are sub-pixel at city zoom. The transition is a prefix-slice of ONE
 * stable ordered array, so crossing it adds/removes polygons incrementally
 * without ever rebuilding the mounted set.
 */

/** Plot number labels — only render when very few plots visible. */
export const MAX_PLOT_NUMBER_LABELS = 8;

/**
 * HARD SAFETY CAP: total native map children (Markers + Polygons combined).
 */
export const MAX_NATIVE_MAP_CHILDREN = 250;

/**
 * Max native polygons mounted when a quartier is pinned — set ABOVE the
 * largest quartier in the dataset (8K plots), so every quartier mounts its
 * COMPLETE plot set as one static overlay collection. No sampling, no
 * viewport culling: the product requirement is that every plot the server
 * returns is drawn. Map polygons are GPU overlays (MKPolygon / GMaps
 * polygon), not views; the historical crashes were identity churn (the set
 * being rebuilt per camera move) and the geometry effect cycling
 * mount/unmount storms across a zoom boundary — both eliminated. The static
 * set is built once per quartier and never rebuilt while pinned.
 */
export const MAX_NATIVE_MAP_CHILDREN_SECTOR = 9000;
