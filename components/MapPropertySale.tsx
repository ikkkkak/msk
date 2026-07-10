/**
 * MapPropertySale Component - Airbnb Style
 * Now uses shared BaseMap component with MapTiler support
 * 
 * This component uses PropertySaleMap from MapAdapter which internally
 * uses the shared BaseMap component. All features are preserved.
 */

import React from "react";
import MapView, { Region } from "react-native-maps";
import { PropertySaleMap } from "./MapAdapter";
import type { BaseMapProps } from "./BaseMap";
import { logAction, logElapsedSinceTap } from "../utils/debugMarkerTap";

// Nouakchott, Mauritania - Default region
const NOUAKCHOTT_REGION: Region = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.1, // Zoomed in for better detail
  longitudeDelta: 0.1
};

// ============================================================================
// TYPE DEFINITIONS (for backward compatibility)
// ============================================================================

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
// MAIN MAP PROPERTY SALE COMPONENT
// ============================================================================

export const MapPropertySale = ({
  properties = [],
  mapRef,
  initialRegion,
  onPropertySelect,
  selectedPropertyId,
  mapType: mapTypeProp = "standard",
  districtBoundaries = [],
  onPolygonApply,
  sheetRef,
  cardVisible = false,
  onDismissCard,
  navigation,
  useExternalCard = false,
  isLoadingMarkers,
  habitatCadastre,
  onRegionChangeComplete,
  onMapPress,
}: {
  properties?: PropertySale[];
  mapRef?: React.MutableRefObject<MapView | null>;
  initialRegion?: Region;
  onPropertySelect?: (propertyId: number, propertyData?: any) => void;
  selectedPropertyId?: number | null;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  districtBoundaries?: Array<{
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
  onPolygonApply?: (polygon: { latitude: number; longitude: number }[]) => void;
  sheetRef?: any;
  cardVisible?: boolean;
  onDismissCard?: () => void;
  navigation?: any;
  useExternalCard?: boolean;
  isLoadingMarkers?: boolean;
  habitatCadastre?: BaseMapProps["habitatCadastre"];
  onRegionChangeComplete?: BaseMapProps["onRegionChangeComplete"];
  onMapPress?: BaseMapProps["onMapPress"];
}) => {
  // Ensure mapRef is provided
  const defaultMapRef = React.useRef<MapView | null>(null);
  const actualMapRef = mapRef || defaultMapRef;

  // Convert onPropertySelect signature if needed
  const handlePropertySelect = React.useCallback(
    (propertyId: number, index: number) => {
      logAction("MapPropertySale handlePropertySelect", { propertyId, index });
      logElapsedSinceTap("MapPropertySale handlePropertySelect");
      if (onPropertySelect) {
        const property = properties.find((p) => p.id === propertyId);
        onPropertySelect(propertyId, property);
      }
    },
    [onPropertySelect, properties]
  );

  return (
    <PropertySaleMap
      mapRef={actualMapRef}
      propertySales={properties}
      initialRegion={initialRegion || NOUAKCHOTT_REGION}
      onPropertySaleSelect={handlePropertySelect}
      selectedPropertySaleId={selectedPropertyId}
      mapType={mapTypeProp}
      districtBoundaries={districtBoundaries}
      onApplyPolygon={onPolygonApply}
      showZones={true}
      useExternalCard={useExternalCard}
      onMapPress={
        onMapPress ??
        (useExternalCard && onDismissCard
          ? () => onDismissCard()
          : undefined)
      }
      isLoadingMarkers={isLoadingMarkers}
      habitatCadastre={habitatCadastre}
      onRegionChangeComplete={onRegionChangeComplete}
    />
  );
};
