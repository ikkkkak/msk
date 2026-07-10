/**
 * Map Component - Professional Airbnb-Style Property Map
 * Now uses shared BaseMap component with MapTiler support
 * 
 * This component uses PropertyMap from MapAdapter which internally
 * uses the shared BaseMap component. All features are preserved.
 */

import React from "react";
import MapView, { Region } from "react-native-maps";
import { Property } from "../types/property";
import { PropertyMap } from "./MapAdapter";
import type { BaseMapProps } from "./BaseMap";

// Nouakchott, Mauritania - Default region
// Matches MapPropertySale.tsx zoom level and coordinates for consistency
const NOUAKCHOTT_REGION: Region = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.1, // Professional zoom level matching MapPropertySale
  longitudeDelta: 0.1
};

// ============================================================================
// MAIN MAP COMPONENT
// ============================================================================

export const Map = ({
  properties,
  mapRef,
  location, // Kept for backward compatibility but not used
  setLocation, // Kept for backward compatibility but not used
  initialRegion,
  onPropertySelect,
  onMapPress,
  selectedPropertyId,
  drawingEnabledExternally,
  onApplyPolygon,
  mapType: mapTypeProp,
  districtBoundaries,
  showZones: showZonesProp = true,
  polygonPoints: externalPolygonPoints,
  setPolygonPoints: setExternalPolygonPoints,
  isLoadingMarkers,
  habitatCadastre,
}: {
  properties: Property[];
  mapRef: React.MutableRefObject<MapView | null>;
  location: string;
  setLocation: (location: string) => void;
  initialRegion?: Region;
  onPropertySelect?: (propertyId: number, index: number) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  selectedPropertyId?: number | null;
  showSearchAreaButton?: boolean;
  enableDrawing?: boolean;
  drawingEnabledExternally?: boolean;
  onApplyPolygon?: (polygon: { latitude: number; longitude: number }[]) => void;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  districtBoundaries?: Array<{
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
  showZones?: boolean;
  polygonPoints?: { latitude: number; longitude: number }[];
  setPolygonPoints?: (
    points: { latitude: number; longitude: number }[]
  ) => void;
  isLoadingMarkers?: boolean;
  habitatCadastre?: BaseMapProps["habitatCadastre"];
}) => {
  return (
    <PropertyMap
      mapRef={mapRef}
      properties={properties}
      initialRegion={initialRegion || NOUAKCHOTT_REGION}
      onPropertySelect={onPropertySelect}
      onMapPress={onMapPress}
      selectedPropertyId={selectedPropertyId}
      drawingEnabled={drawingEnabledExternally}
      onApplyPolygon={onApplyPolygon}
      mapType={mapTypeProp}
      districtBoundaries={districtBoundaries}
      showZones={showZonesProp}
      polygonPoints={externalPolygonPoints}
      setPolygonPoints={setExternalPolygonPoints}
      isLoadingMarkers={isLoadingMarkers}
      habitatCadastre={habitatCadastre}
    />
  );
};
