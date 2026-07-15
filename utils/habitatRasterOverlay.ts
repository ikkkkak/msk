/**
 * Native-map raster overlay for cadastre plots — plot boundaries pre-rendered
 * server-side as PNG image tiles, displayed via react-native-maps <UrlTile>
 * on top of the platform's native map (Apple Maps on iOS, Google Maps on
 * Android). Exists because neither native SDK can render our MVT vector
 * layer (that's MapLibre-only), and thousands of native <Polygon>
 * components is the exact crash this whole redesign started from — this is
 * the third option: native map imagery without native-view-per-plot cost.
 */
import { serverUrl } from "../constants";

/** Primary rendering path — native map (Apple/Google) + native polygon overlays. */
export const USE_HABITAT_RASTER_OVERLAY = false;

/**
 * Must match habitatRasterRenderVersion in routes/habitat_raster_tiles.go —
 * bump both together whenever the server-side drawing logic changes
 * (colors, stroke width, clipping/projection). The server's tile response
 * has a 24h Cache-Control, and react-native-maps'/the OS's HTTP cache keys
 * purely on this URL — a rendering change with no URL change means every
 * device that already loaded a tile keeps showing the old one for up to a
 * day (or forever, since a sector whose plot data never changes gives the
 * server no other reason to regenerate it either). Confirmed in production:
 * a freshly-fetched tile came back with stroke colors that don't exist
 * anywhere in the current rendering code, meaning this was already silently
 * broken — this query param is what makes a version bump actually reach
 * devices instead of only ever helping the server's own in-memory cache.
 */
const HABITAT_RASTER_RENDER_VERSION = "2";

/**
 * Retina factor — the server renders the tile bitmap at 256*scale px while
 * keeping the {z}/{x}/{y} tile addressing in standard 256 space. At @2x a
 * 512px bitmap backs each logical tile, so on 2x/3x phone screens (and while
 * the native map is live-scaling tiles mid-pinch) plot edges stay crisp
 * instead of being upscaled from 256px — which is what made corners look
 * soft/deformed during a zoom gesture. Must be paired with tileSize={512} on
 * the <UrlTile> (see HABITAT_RASTER_TILE_SIZE) so the map knows each bitmap
 * covers one tile, not four. Server clamps scale to 2 (rasterMaxScale).
 */
export const HABITAT_RASTER_SCALE = 2;

/** On-screen size of one logical tile = 256 * HABITAT_RASTER_SCALE. */
export const HABITAT_RASTER_TILE_SIZE = 256 * HABITAT_RASTER_SCALE;

/** No extension — same Iris routing reasoning as the MVT tile routes. */
export function habitatSectorRasterTileUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/raster-tiles/{z}/{x}/{y}?rv=${HABITAT_RASTER_RENDER_VERSION}&scale=${HABITAT_RASTER_SCALE}`;
}

export function habitatPlotAtPointUrl(
  sectorId: number,
  lat: number,
  lng: number,
): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/plot-at-point?lat=${lat}&lng=${lng}`;
}
