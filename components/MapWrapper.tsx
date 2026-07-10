/**
 * Map Wrapper Components
 * Backward-compatible wrappers that use the new BaseMap internally
 * This allows gradual migration without breaking existing code
 * 
 * IMPORTANT: These wrappers use MapTiler when API key is configured
 */

import React from "react";
import { PropertyMap, PropertySaleMap, LandmarkMap } from "./MapAdapter";
import { Property } from "../types/property";
import { Region } from "react-native-maps";
import MapView from "react-native-maps";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Landmark {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  surface_area?: number;
  area?: number;
  area_unit?: string;
  point1_lat?: number;
  point1_lng?: number;
  point2_lat?: number;
  point2_lng?: number;
  point3_lat?: number;
  point3_lng?: number;
  point4_lat?: number;
  point4_lng?: number;
  lat?: number;
  lng?: number;
  images?: string[];
  zone_name?: string;
  city_name?: string;
  land_type?: string;
  zoning?: string;
  organization?: { name?: string };
  [key: string]: any;
}

interface PropertySale {
  id: number;
  title?: string;
  listing_price?: number;
  price?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  [key: string]: any;
}

// ============================================================================
// BACKWARD-COMPATIBLE MAP WRAPPER (Properties)
// ============================================================================

interface MapWrapperProps {
  properties: Property[];
  mapRef: React.MutableRefObject<MapView | null>;
  location?: string;
  setLocation?: (location: string) => void;
  initialRegion?: Region;
  onPropertySelect?: (propertyId: number, index: number) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  selectedPropertyId?: number | null;
  drawingEnabledExternally?: boolean;
  onApplyPolygon?: (polygon: { latitude: number; longitude: number }[]) => void;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  districtBoundaries?: Array<{
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
  showZones?: boolean;
  polygonPoints?: { latitude: number; longitude: number }[];
  setPolygonPoints?: (points: { latitude: number; longitude: number }[]) => void;
}

/**
 * Backward-compatible Map component (Properties)
 * Uses the new PropertyMap internally but maintains the old API
 */
export const Map: React.FC<MapWrapperProps> = ({
  properties,
  mapRef,
  location, // Not used in new implementation but kept for compatibility
  setLocation, // Not used in new implementation but kept for compatibility
  initialRegion,
  onPropertySelect,
  onMapPress,
  selectedPropertyId,
  drawingEnabledExternally,
  onApplyPolygon,
  mapType,
  districtBoundaries,
  showZones = true,
  polygonPoints,
  setPolygonPoints
}) => {
  return (
    <PropertyMap
      mapRef={mapRef}
      properties={properties}
      initialRegion={initialRegion}
      onPropertySelect={onPropertySelect}
      onMapPress={onMapPress}
      selectedPropertyId={selectedPropertyId}
      drawingEnabled={drawingEnabledExternally}
      onApplyPolygon={onApplyPolygon}
      mapType={mapType}
      districtBoundaries={districtBoundaries}
      showZones={showZones}
      polygonPoints={polygonPoints}
      setPolygonPoints={setPolygonPoints}
    />
  );
};

// ============================================================================
// BACKWARD-COMPATIBLE MAP PROPERTY SALE WRAPPER
// ============================================================================

interface MapPropertySaleWrapperProps {
  propertySales: PropertySale[];
  mapRef: React.MutableRefObject<MapView | null>;
  initialRegion?: Region;
  onPropertySaleSelect?: (propertySaleId: number, index: number) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  selectedPropertySaleId?: number | null;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  districtBoundaries?: Array<{
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
  showZones?: boolean;
  onRegionChange?: (region: Region) => void;
}

/**
 * Backward-compatible MapPropertySale component
 * Uses the new PropertySaleMap internally but maintains the old API
 */
export const MapPropertySale: React.FC<MapPropertySaleWrapperProps> = ({
  propertySales,
  mapRef,
  initialRegion,
  onPropertySaleSelect,
  onMapPress,
  selectedPropertySaleId,
  mapType = "standard",
  districtBoundaries,
  showZones = true,
  onRegionChange
}) => {
  return (
    <PropertySaleMap
      mapRef={mapRef}
      propertySales={propertySales}
      initialRegion={initialRegion}
      onPropertySaleSelect={onPropertySaleSelect}
      onMapPress={onMapPress}
      selectedPropertySaleId={selectedPropertySaleId}
      mapType={mapType}
      districtBoundaries={districtBoundaries}
      showZones={showZones}
      onRegionChange={onRegionChange}
    />
  );
};

// ============================================================================
// BACKWARD-COMPATIBLE MAP LANDMARKS WRAPPER
// ============================================================================

interface MapLandmarksWrapperProps {
  landmarks: Landmark[];
  mapRef: React.MutableRefObject<MapView | null>;
  initialRegion?: Region;
  onLandmarkSelect?: (landmarkId: number, index: number) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  selectedLandmarkId?: number | null;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  districtBoundaries?: Array<{
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
  showZones?: boolean;
  onRegionChange?: (region: Region) => void;
}

/**
 * Backward-compatible MapLandmarks component
 * Uses the new LandmarkMap internally but maintains the old API
 */
export const MapLandmarks: React.FC<MapLandmarksWrapperProps> = ({
  landmarks,
  mapRef,
  initialRegion,
  onLandmarkSelect,
  onMapPress,
  selectedLandmarkId,
  mapType: mapTypeProp = "satellite",
  districtBoundaries,
  showZones: showZonesProp = true,
  onRegionChange
}) => {
  return (
    <LandmarkMap
      mapRef={mapRef}
      landmarks={landmarks}
      initialRegion={initialRegion}
      onLandmarkSelect={onLandmarkSelect}
      onMapPress={onMapPress}
      selectedLandmarkId={selectedLandmarkId}
      mapType={mapTypeProp}
      districtBoundaries={districtBoundaries}
      showZones={showZonesProp}
      onRegionChange={onRegionChange}
    />
  );
};
