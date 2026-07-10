# Map Migration Guide - Shared BaseMap with MapTiler

## ✅ What's Been Created

### 1. **BaseMap Component** (`BaseMap.tsx`)
   - Shared map component that works with MapTiler
   - Supports all three map types: Properties, Property Sales, Landmarks
   - Includes all features: markers, polygons, drawing, zones, animations
   - Works with Expo (no bare workflow needed)

### 2. **Map Adapter Components** (`MapAdapter.tsx`)
   - `PropertyMap` - For rental properties
   - `PropertySaleMap` - For property sales
   - `LandmarkMap` - For land plots/landmarks
   - Converts your data to BaseMap format automatically

### 3. **Backward-Compatible Wrappers** (`MapWrapper.tsx`)
   - `Map` - Wrapper for properties (uses PropertyMap)
   - `MapPropertySale` - Wrapper for property sales
   - `MapLandmarks` - Wrapper for landmarks
   - **Your existing code will work without changes!**

### 4. **MapTiler Configuration** (`config/mapTiler.ts`)
   - Centralized MapTiler API key configuration
   - Style URL helpers
   - Easy to configure

## 🚀 Quick Start

### Step 1: Configure MapTiler API Key

Edit `config/mapTiler.ts`:
```typescript
export const MAPTILER_API_KEY = "your_actual_api_key_here";
```

Or use environment variables (see `MAPTILER_SETUP.md`).

### Step 2: Use the Components

**Option A: Use New Adapter Components (Recommended)**
```typescript
import { PropertyMap, PropertySaleMap, LandmarkMap } from './components/MapAdapter';
```

**Option B: Use Backward-Compatible Wrappers (No Code Changes Needed)**
```typescript
import { Map, MapPropertySale, MapLandmarks } from './components/MapWrapper';
// Your existing code works as-is!
```

## 📋 Component Comparison

| Old Component | New Adapter | Backward-Compatible Wrapper |
|--------------|-------------|----------------------------|
| `Map` | `PropertyMap` | `Map` (from MapWrapper) |
| `MapPropertySale` | `PropertySaleMap` | `MapPropertySale` (from MapWrapper) |
| `MapLandmarks` | `LandmarkMap` | `MapLandmarks` (from MapWrapper) |

## 🔄 Migration Path

### Phase 1: Immediate (No Changes Required)
- Your existing code continues to work
- Just import from `MapWrapper` instead of the old files
- MapTiler will be used automatically when API key is configured

### Phase 2: Gradual Migration (Recommended)
- Start using the new adapter components (`PropertyMap`, etc.)
- They have cleaner APIs and better TypeScript support
- See `MapExample.tsx` for usage examples

### Phase 3: Full Migration
- Remove old map component files
- Use only the new BaseMap system
- All maps now share the same codebase

## 📝 Example: Updating Your Imports

### Before:
```typescript
import { Map } from '../components/Map';
import { MapPropertySale } from '../components/MapPropertySale';
import { MapLandmarks } from '../components/MapLandmarks';
```

### After (Option 1 - Backward Compatible):
```typescript
import { Map, MapPropertySale, MapLandmarks } from '../components/MapWrapper';
// No other changes needed!
```

### After (Option 2 - New Adapters):
```typescript
import { PropertyMap, PropertySaleMap, LandmarkMap } from '../components/MapAdapter';
// Cleaner API, same functionality
```

## ✨ Features

All three map types now support:
- ✅ **MapTiler Integration** - Beautiful, customizable maps
- ✅ **Viewport Filtering** - Only renders visible markers (performance)
- ✅ **Zoom-based Markers** - Dots when zoomed out, cards when zoomed in
- ✅ **Polygon Drawing** - Draw search areas on the map
- ✅ **District Zones** - Visualize district boundaries
- ✅ **Smooth Animations** - Professional transitions
- ✅ **Custom Cards** - Property/landmark detail cards
- ✅ **Map Type Toggle** - Switch between standard/satellite

## 🎯 Benefits

1. **Code Reuse** - One BaseMap component for all three map types
2. **Consistency** - Same behavior and styling across all maps
3. **Maintainability** - Fix bugs once, applies to all maps
4. **MapTiler** - Professional map tiles with customization
5. **Performance** - Optimized rendering with viewport filtering
6. **Type Safety** - Full TypeScript support

## 📚 Documentation

- `MAPTILER_SETUP.md` - MapTiler API key configuration
- `README_MAPS.md` - Detailed usage guide
- `MapExample.tsx` - Code examples for all three map types

## ⚠️ Important Notes

1. **MapTiler API Key Required**: The map will fall back to default Google Maps if API key is not configured
2. **Expo Compatible**: Works with Expo managed workflow (no bare workflow needed)
3. **Backward Compatible**: Your existing code will work without changes
4. **Performance**: Viewport filtering ensures only visible markers are rendered

## 🐛 Troubleshooting

### Map shows default tiles instead of MapTiler
- Check that `MAPTILER_API_KEY` is set in `config/mapTiler.ts`
- Verify the API key is valid
- Check console for any errors

### Markers not showing
- Ensure your data has valid `latitude` and `longitude` (or `lat`/`lng`)
- Check that markers array is not empty
- Verify coordinates are within the visible region

### Performance issues
- Viewport filtering is automatic - only visible markers render
- Large datasets (>1000 markers) may need clustering (future enhancement)

## 🎉 You're All Set!

The shared map system is ready to use. Start by configuring your MapTiler API key, then use the components as shown in the examples.

For questions or issues, refer to the documentation files or check the example code in `MapExample.tsx`.
