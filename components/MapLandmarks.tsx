/**
 * MapLandmarks Component - Airbnb Style
 * Now uses shared BaseMap component with MapTiler support
 * 
 * This component uses LandmarkMap from MapAdapter which internally
 * uses the shared BaseMap component. All features are preserved.
 */

import React from "react";
import MapView, { Region } from "react-native-maps";
import { LandmarkMap } from "./MapAdapter";

// Nouakchott, Mauritania - Default region
const NOUAKCHOTT_REGION: Region = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.1, // Zoomed in for better detail
  longitudeDelta: 0.1
};

// =============================================================================
// LANDMARK TYPE (for backward compatibility)
// =============================================================================

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

// =============================================================================
// MAIN MAP LANDMARKS COMPONENT
// =============================================================================

export const MapLandmarks = ({
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
}: {
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
}) => {
  return (
    <LandmarkMap
      mapRef={mapRef}
      landmarks={landmarks}
      initialRegion={initialRegion || NOUAKCHOTT_REGION}
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
