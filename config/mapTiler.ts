/**
 * MapTiler Configuration
 * 
 * To use MapTiler:
 * 1. Sign up at https://cloud.maptiler.com/
 * 2. Get your API key from the dashboard
 * 3. Add it to your .env file or replace MAPTILER_API_KEY below
 * 
 * For Expo, you can use environment variables:
 * - Create a .env file in the root
 * - Add: MAPTILER_API_KEY=your_key_here
 * - Install: npm install react-native-dotenv
 */

// Get API key from environment or use placeholder
// IMPORTANT: Replace with your actual MapTiler API key
export const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY || "YOUR_MAPTILER_API_KEY_HERE";

// MapTiler style URLs
export const MAPTILER_STYLES = {
  // Basic styles
  streets: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
  basic: `https://api.maptiler.com/maps/basic/style.json?key=${MAPTILER_API_KEY}`,
  bright: `https://api.maptiler.com/maps/bright/style.json?key=${MAPTILER_API_KEY}`,
  dark: `https://api.maptiler.com/maps/dark/style.json?key=${MAPTILER_API_KEY}`,
  
  // Satellite
  satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`,
  hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`,
  
  // Terrain
  terrain: `https://api.maptiler.com/maps/topo/style.json?key=${MAPTILER_API_KEY}`,
  
  // Custom tile URL template (for react-native-maps)
  tileUrlTemplate: (style: string = "streets") => {
    // MapTiler tile URL template
    // Format: https://api.maptiler.com/maps/{style}/{z}/{x}/{y}.png?key={key}
    return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
  }
};

// Default style
export const DEFAULT_MAPTILER_STYLE = MAPTILER_STYLES.streets;

// Helper to get style URL based on map type
export const getMapTilerStyleUrl = (
  mapType: "standard" | "satellite" | "hybrid" | "terrain" = "standard"
): string => {
  switch (mapType) {
    case "satellite":
      return MAPTILER_STYLES.satellite;
    case "hybrid":
      return MAPTILER_STYLES.hybrid;
    case "terrain":
      return MAPTILER_STYLES.terrain;
    case "standard":
    default:
      return MAPTILER_STYLES.streets;
  }
};
