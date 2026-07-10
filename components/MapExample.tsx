/**
 * Example Usage of Shared Map Components
 * 
 * This file shows how to use the new shared map components
 * that work with MapTiler for all three map types.
 */

import React, { useRef } from "react";
import { View } from "react-native";
import MapView from "react-native-maps";
import { PropertyMap, PropertySaleMap, LandmarkMap } from "./MapAdapter";
import { Property } from "../types/property";

// ============================================================================
// EXAMPLE 1: Properties Map
// ============================================================================

export const PropertiesMapExample = () => {
  const mapRef = useRef<MapView>(null);
  const properties: Property[] = [
    {
      ID: 1,
      title: "Beautiful Apartment",
      lat: 18.0,
      lng: -15.9,
      nightlyPrice: 100,
      images: ["https://example.com/image1.jpg"],
      // ... other property fields
    } as Property,
    // ... more properties
  ];

  return (
    <View style={{ flex: 1 }}>
      <PropertyMap
        mapRef={mapRef}
        properties={properties}
        selectedPropertyId={null}
        onPropertySelect={(propertyId, index) => {
          console.log("Selected property:", propertyId);
        }}
        initialRegion={{
          latitude: 18.0,
          longitude: -15.9,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2
        }}
        districtBoundaries={[
          {
            name: "Zone 1",
            coordinates: [
              { latitude: 17.9, longitude: -16.0 },
              { latitude: 18.1, longitude: -16.0 },
              { latitude: 18.1, longitude: -15.8 },
              { latitude: 17.9, longitude: -15.8 }
            ]
          }
        ]}
        showZones={true}
        mapType="standard"
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 2: Property Sales Map
// ============================================================================

export const PropertySalesMapExample = () => {
  const mapRef = useRef<MapView>(null);
  const propertySales = [
    {
      id: 1,
      title: "Luxury Villa",
      listing_price: 500000,
      latitude: 18.0,
      longitude: -15.9,
      images: ["https://example.com/image1.jpg"],
      bedrooms: 3,
      bathrooms: 2,
      surface_area: 150
    },
    // ... more property sales
  ];

  return (
    <View style={{ flex: 1 }}>
      <PropertySaleMap
        mapRef={mapRef}
        propertySales={propertySales}
        selectedPropertySaleId={null}
        onPropertySaleSelect={(id, index) => {
          console.log("Selected property sale:", id);
        }}
        initialRegion={{
          latitude: 18.0,
          longitude: -15.9,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2
        }}
        mapType="standard"
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 3: Landmarks Map
// ============================================================================

export const LandmarksMapExample = () => {
  const mapRef = useRef<MapView>(null);
  const landmarks = [
    {
      id: 1,
      title: "Land Plot A",
      price: 200000,
      point1_lat: 18.0,
      point1_lng: -15.9,
      point2_lat: 18.01,
      point2_lng: -15.9,
      point3_lat: 18.01,
      point3_lng: -15.91,
      point4_lat: 18.0,
      point4_lng: -15.91,
      images: ["https://example.com/image1.jpg"],
      surface_area: 500,
      area_unit: "m²"
    },
    // ... more landmarks
  ];

  return (
    <View style={{ flex: 1 }}>
      <LandmarkMap
        mapRef={mapRef}
        landmarks={landmarks}
        selectedLandmarkId={null}
        onLandmarkSelect={(id, index) => {
          console.log("Selected landmark:", id);
        }}
        initialRegion={{
          latitude: 18.0,
          longitude: -15.9,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2
        }}
        mapType="satellite" // Recommended for landmarks
        districtBoundaries={[]}
        showZones={true}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 4: With Drawing Enabled
// ============================================================================

export const MapWithDrawingExample = () => {
  const mapRef = useRef<MapView>(null);
  const [polygonPoints, setPolygonPoints] = React.useState<
    { latitude: number; longitude: number }[]
  >([]);

  const properties: Property[] = [];

  return (
    <View style={{ flex: 1 }}>
      <PropertyMap
        mapRef={mapRef}
        properties={properties}
        drawingEnabled={true}
        polygonPoints={polygonPoints}
        setPolygonPoints={setPolygonPoints}
        onApplyPolygon={(polygon) => {
          console.log("Applied polygon:", polygon);
          // Use polygon for search/filter
        }}
        initialRegion={{
          latitude: 18.0,
          longitude: -15.9,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2
        }}
      />
    </View>
  );
};
