import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import { 
  Location, 
  LocationPropertiesResponse, 
  CoordinatesPropertiesResponse, 
  PropertyFilters, 
  FilteredPropertiesResponse 
} from '../types/location';

export const locationService = {
  // Get properties near a specific location
  getPropertiesNearLocation: async (locationKey: string, limit: number = 8): Promise<LocationPropertiesResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/location/near/${locationKey}?limit=${limit}`);
    return response.data;
  },

  // Get all available locations
  getAvailableLocations: async (): Promise<{ success: boolean; locations: Record<string, Location> }> => {
    const response = await axios.get(`${API_BASE_URL}/api/location/locations`);
    return response.data;
  },

  // Get properties by coordinates
  getPropertiesByCoordinates: async (
    lat: number, 
    lng: number, 
    radius: number = 5, 
    limit: number = 20
  ): Promise<CoordinatesPropertiesResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/location/coordinates`, {
      params: { lat, lng, radius, limit }
    });
    return response.data;
  },

  // Get properties with advanced filtering
  getPropertiesWithFilters: async (filters: PropertyFilters): Promise<FilteredPropertiesResponse> => {
    const params = new URLSearchParams();
    
    if (filters.lat !== undefined) params.append('lat', filters.lat.toString());
    if (filters.lng !== undefined) params.append('lng', filters.lng.toString());
    if (filters.radius !== undefined) params.append('radius', filters.radius.toString());
    if (filters.property_type) params.append('property_type', filters.property_type);
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms !== undefined) params.append('bathrooms', filters.bathrooms.toString());
    if (filters.amenities && filters.amenities.length > 0) {
      params.append('amenities', JSON.stringify(filters.amenities));
    }

    // Get user token for user-specific exclusions
    const token = await AsyncStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(`${API_BASE_URL}/api/location/search?${params.toString()}`, { headers });
    return response.data;
  }
};
