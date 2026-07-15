/**
 * GeoJSON Server Configuration
 * Serves raw GeoJSON from Hetzner server for client-side rendering
 */

// ⚠️ CHANGE THIS TO YOUR HETZNER IP
export const GEOJSON_SERVER_URL = 'http://167.233.98.159:8081';

// GeoJSON file served directly (146 MB)
export const GEOJSON_URL = `${GEOJSON_SERVER_URL}/mauritania_plots.geojson`;

export const MAP_COLORS = {
  available: '#10B981',
  reserved: '#F59E0B',
  sold: '#EF4444',
  boundary: '#1E40AF',
  selected: '#3B82F6',
  text: '#FFFFFF',
};

export const MAP_BOUNDS = {
  minLng: -20,
  maxLng: -8,
  minLat: 14,
  maxLat: 22,
};

export const MAP_CENTER = {
  lng: -15.975,
  lat: 18.085,
  zoom: 11,
};
