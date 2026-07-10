# Shared Map Components - Usage Guide

This project now uses a **shared BaseMap component** that works with **MapTiler** and supports all three map types:
- **Properties Map** (rental properties)
- **Property Sales Map** (sale properties)
- **Landmarks Map** (land plots)

## Quick Start

### 1. Configure MapTiler API Key

Edit `config/mapTiler.ts` and replace `YOUR_MAPTILER_API_KEY_HERE` with your actual MapTiler API key.

Or use environment variables (see `MAPTILER_SETUP.md` for details).

### 2. Use the Adapter Components

Instead of using the old `Map`, `MapPropertySale`, or `MapLandmarks` components directly, use the new adapter components:

```typescript
import { PropertyMap, PropertySaleMap, LandmarkMap } from '../components/MapAdapter';
```

## Component Usage Examples

### PropertyMap (Rental Properties)

```typescript
import React, { useRef } from 'react';
import { PropertyMap } from '../components/MapAdapter';
import { Property } from '../types/property';

const MyComponent = () => {
  const mapRef = useRef<MapView>(null);
  const properties: Property[] = [...]; // Your properties array

  return (
    <PropertyMap
      mapRef={mapRef}
      properties={properties}
      selectedPropertyId={selectedId}
      onPropertySelect={(propertyId, index) => {
        console.log('Selected property:', propertyId);
      }}
      initialRegion={{
        latitude: 18.0,
        longitude: -15.9,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2
      }}
      districtBoundaries={boundaries}
      showZones={true}
      mapType="standard"
    />
  );
};
```

### PropertySaleMap (Sale Properties)

```typescript
import { PropertySaleMap } from '../components/MapAdapter';

const propertySales = [
  {
    id: 1,
    title: "Beautiful Home",
    listing_price: 500000,
    latitude: 18.0,
    longitude: -15.9,
    images: ["url1", "url2"],
    bedrooms: 3,
    bathrooms: 2
  },
  // ... more properties
];

<PropertySaleMap
  mapRef={mapRef}
  propertySales={propertySales}
  selectedPropertySaleId={selectedId}
  onPropertySaleSelect={(id, index) => {
    // Handle selection
  }}
  initialRegion={region}
  mapType="standard"
/>
```

### LandmarkMap (Land Plots)

```typescript
import { LandmarkMap } from '../components/MapAdapter';

const landmarks = [
  {
    id: 1,
    title: "Land Plot",
    price: 200000,
    point1_lat: 18.0,
    point1_lng: -15.9,
    point2_lat: 18.01,
    point2_lng: -15.9,
    point3_lat: 18.01,
    point3_lng: -15.91,
    point4_lat: 18.0,
    point4_lng: -15.91,
    images: ["url1"]
  },
  // ... more landmarks
];

<LandmarkMap
  mapRef={mapRef}
  landmarks={landmarks}
  selectedLandmarkId={selectedId}
  onLandmarkSelect={(id, index) => {
    // Handle selection
  }}
  initialRegion={region}
  mapType="satellite" // Recommended for landmarks
  districtBoundaries={boundaries}
  showZones={true}
/>
```

## All Available Props

All three adapter components accept these props (plus type-specific ones):

### Common Props

- `mapRef` - React ref to MapView (required)
- `initialRegion` - Initial map region
- `mapType` - "standard" | "satellite" | "hybrid" | "terrain"
- `selectedMarkerId` - Currently selected marker ID
- `onMarkerSelect` - Callback when marker is selected
- `onMapPress` - Callback when map is pressed
- `drawingEnabled` - Enable polygon drawing
- `polygonPoints` - Current polygon points
- `setPolygonPoints` - Set polygon points
- `onApplyPolygon` - Callback when polygon is applied
- `districtBoundaries` - Array of district boundaries
- `showZones` - Show/hide district zones
- `onRegionChange` - Callback on region change
- `onRegionChangeComplete` - Callback when region change completes
- `style` - Custom map style
- `containerStyle` - Custom container style

### PropertyMap Specific

- `properties` - Array of Property objects
- `selectedPropertyId` - Selected property ID
- `onPropertySelect` - Property selection callback

### PropertySaleMap Specific

- `propertySales` - Array of PropertySale objects
- `selectedPropertySaleId` - Selected property sale ID
- `onPropertySaleSelect` - Property sale selection callback

### LandmarkMap Specific

- `landmarks` - Array of Landmark objects
- `selectedLandmarkId` - Selected landmark ID
- `onLandmarkSelect` - Landmark selection callback

## Migration from Old Components

### Old Map.tsx Usage:
```typescript
<Map
  properties={properties}
  mapRef={mapRef}
  // ... other props
/>
```

### New Usage:
```typescript
<PropertyMap
  properties={properties}
  mapRef={mapRef}
  // ... same props work!
/>
```

The API is **almost identical** - just replace the component name!

## Features

✅ **MapTiler Integration** - Beautiful, customizable maps  
✅ **Unified API** - Same props across all three map types  
✅ **Performance** - Viewport filtering, memoization  
✅ **Animations** - Smooth zoom-based marker transitions  
✅ **Drawing** - Polygon drawing for search areas  
✅ **Zones** - District/zone boundary visualization  
✅ **Customizable** - Custom markers and cards  

## Need Help?

See `MAPTILER_SETUP.md` for MapTiler API key configuration.
