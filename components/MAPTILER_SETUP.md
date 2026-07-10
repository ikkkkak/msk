# MapTiler Setup Guide for Expo

This guide explains how to set up MapTiler with the shared BaseMap component.

## Prerequisites

1. **MapTiler Account**: Sign up at https://cloud.maptiler.com/
2. **Get API Key**: 
   - Go to your MapTiler Cloud dashboard
   - Navigate to "Keys" section
   - Copy your API key

## Setup Steps

### Option 1: Using Environment Variables (Recommended)

1. **Install dotenv** (if not already installed):
   ```bash
   npm install react-native-dotenv
   ```

2. **Create `.env` file** in the root directory:
   ```
   MAPTILER_API_KEY=your_actual_api_key_here
   ```

3. **Update `babel.config.js`** to include the dotenv plugin:
   ```js
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['module:react-native-dotenv', {
           moduleName: '@env',
           path: '.env',
         }]
       ],
     };
   };
   ```

4. **Update `config/mapTiler.ts`**:
   ```typescript
   import { MAPTILER_API_KEY } from '@env';
   export const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY || MAPTILER_API_KEY || "YOUR_MAPTILER_API_KEY_HERE";
   ```

### Option 2: Direct Configuration

1. **Edit `config/mapTiler.ts`**:
   ```typescript
   export const MAPTILER_API_KEY = "your_actual_api_key_here";
   ```

## Usage

### For Properties Map

```typescript
import { PropertyMap } from '../components/MapAdapter';

<PropertyMap
  mapRef={mapRef}
  properties={propertiesArray}
  selectedPropertyId={selectedId}
  onPropertySelect={(id, index) => {
    // Handle selection
  }}
  initialRegion={region}
  districtBoundaries={boundaries}
  showZones={true}
/>
```

### For Property Sales Map

```typescript
import { PropertySaleMap } from '../components/MapAdapter';

<PropertySaleMap
  mapRef={mapRef}
  propertySales={propertySalesArray}
  selectedPropertySaleId={selectedId}
  onPropertySaleSelect={(id, index) => {
    // Handle selection
  }}
  initialRegion={region}
  mapType="standard"
/>
```

### For Landmarks Map

```typescript
import { LandmarkMap } from '../components/MapAdapter';

<LandmarkMap
  mapRef={mapRef}
  landmarks={landmarksArray}
  selectedLandmarkId={selectedId}
  onLandmarkSelect={(id, index) => {
    // Handle selection
  }}
  initialRegion={region}
  mapType="satellite" // Recommended for landmarks
  districtBoundaries={boundaries}
/>
```

## Features

✅ **MapTiler Integration**: Uses MapTiler tiles for beautiful, customizable maps  
✅ **Expo Compatible**: Works with Expo (no bare workflow needed)  
✅ **Unified API**: Same component for all three map types  
✅ **Performance Optimized**: Viewport filtering, memoization, smooth animations  
✅ **Customizable**: Custom markers, cards, and styling  
✅ **Drawing Support**: Polygon drawing for search areas  
✅ **Zone Boundaries**: District/zone visualization  

## MapTiler Styles Available

- `streets` - Default street map
- `basic` - Basic style
- `bright` - Bright style
- `dark` - Dark style
- `satellite` - Satellite imagery
- `hybrid` - Satellite with labels
- `terrain` - Topographic style

## Notes

- The map will fall back to default Google Maps if MapTiler API key is not configured
- MapTiler tiles are loaded via URL template in react-native-maps
- All three map types (Properties, Property Sales, Landmarks) use the same BaseMap component
- Custom marker and card components can be provided for each map type
