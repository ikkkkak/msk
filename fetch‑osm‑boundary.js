// fetch‑osm‑boundary.js
// Usage: node fetch‑osm‑boundary.js <relationId>
// Example: node fetch‑osm‑boundary.js 16510626

import fetch from "node-fetch";
import fs from "fs";

// OSM relation id for Ksar
const relId = process.argv[2] || "16510626";

async function main() {
  // Overpass QL query to get relation + members with geometry
  const query = `
    [out:json][timeout:50];
    relation(${relId});
    (._;>;);
    out body;
  `;

  const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Overpass request failed: " + resp.status);
  const osm = await resp.json();

  // convert OSM JSON to GeoJSON using osmtogeojson
  const { osm2geojson } = await import("osm-to-geojson");
  const geo = osm2geojson(osm);

  if (!geo.features.length) {
    console.warn("No features found for relation", relId);
    return;
  }

  // Find first polygon / multipolygon feature
  const feat = geo.features.find(f => ["Polygon","MultiPolygon"].includes(f.geometry.type));
  if (!feat) {
    console.warn("No polygon feature found in GeoJSON");
    return;
  }

  // If MultiPolygon pick outer ring of first polygon
  let coords = [];
  if (feat.geometry.type === "Polygon") {
    coords = feat.geometry.coordinates[0];
  } else if (feat.geometry.type === "MultiPolygon") {
    coords = feat.geometry.coordinates[0][0];
  }

  // Convert [lon, lat] → { latitude, longitude }
  const rnCoords = coords.map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));

  // Write files
  fs.writeFileSync("boundary.geojson", JSON.stringify(geo, null, 2));
  fs.writeFileSync(
    "boundary_rn_coords.json",
    JSON.stringify(rnCoords, null, 2)
  );

  console.log("Done. boundary.geojson + boundary_rn_coords.json generated.");
}

main().catch(console.error);
