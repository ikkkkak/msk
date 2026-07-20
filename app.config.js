/**
 * Dynamic Expo config — extends app.json.
 *
 * Exists so the @rnmapbox/maps plugin can receive its tokens from the
 * environment instead of committed JSON:
 * - MAPBOX_DOWNLOAD_TOKEN (secret, Downloads:Read) — native SDK download
 *   at prebuild. Set in .env locally and as a CI secret.
 * - Runtime access token is read separately in code from
 *   EXPO_PUBLIC_MAPBOX_TOKEN (see mapengine/MapEngine.ts).
 *
 * NO token values may ever appear in this file or app.json.
 */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsImpl: "mapbox",
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
  ],
});
