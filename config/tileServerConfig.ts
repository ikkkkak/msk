/**
 * Vector Tile Server Configuration
 * Serves optimized vector tiles from Hetzner server
 */

// ⚠️ CHANGE THIS TO YOUR HETZNER IP
export const TILE_SERVER_URL = 'http://167.233.98.159:8080';

// Vector tile endpoint (PBF format, z/x/y addressing)
export const TILE_ENDPOINT = `${TILE_SERVER_URL}/data/mauritania/{z}/{x}/{y}.pbf`;

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
