export interface Location {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  type: 'city_center' | 'business' | 'transport' | 'luxury' | 'leisure' | 'commercial';
  priority: number;
}

export interface LocationPropertiesResponse {
  success: boolean;
  properties: Property[];
  location: Location;
  count: number;
}

export interface CoordinatesPropertiesResponse {
  success: boolean;
  properties: Property[];
  count: number;
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
}

export interface PropertyFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}

export interface FilteredPropertiesResponse {
  success: boolean;
  properties: Property[];
  count: number;
  filters: PropertyFilters;
}

export interface Property {
  id: number;
  hostID: number;
  title: string;
  description: string;
  propertyType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lng: number;
  capacity: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  nightlyPrice: number;
  cleaningFee: number;
  serviceFee: number;
  currency: string;
  amenities: string[];
  houseRules: string;
  cancellationPolicy: string;
  images: string[];
  isActive: boolean;
  rating: number;
  host?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarURL: string;
  };
}
