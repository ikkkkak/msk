import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocationProperties, useAvailableLocations } from '../hooks/queries/useLocationProperties';
import { useLocationCriteria } from '../hooks/queries/useLocationDiscovery';
import { LocationPropertyCard } from './LocationPropertyCard';

interface LocationPropertyDiscoveryProps {
  onViewAll?: (locationKey: string, locationName: string) => void;
}

export const LocationPropertyDiscovery: React.FC<LocationPropertyDiscoveryProps> = ({ 
  onViewAll 
}) => {
  const navigation = useNavigation();
  
  // Get available locations
  const { data: locationsData, isLoading: locationsLoading } = useAvailableLocations();
  
  // Get location criteria
  const { data: locationCriteria } = useLocationCriteria();
  
  const handleViewAll = (locationKey: string, locationName: string) => {
    if (onViewAll) {
      onViewAll(locationKey, locationName);
    } else {
      // Find the criteria entry to get full details
      const criteriaEntry = locationCriteria?.find((c: any) => 
        c.name === locationKey || 
        c.displayName === locationKey || 
        c.name === locationKey.toLowerCase() ||
        c.displayName?.toLowerCase() === locationKey.toLowerCase()
      );
      
      // Default navigation to location search screen with full criteria info
      navigation.navigate('LocationSearch' as never, { 
        location: locationKey,
        locationName: locationName,
        criteriaId: criteriaEntry?.id,
        lat: criteriaEntry?.centerLat,
        lng: criteriaEntry?.centerLng,
        radiusKm: criteriaEntry?.radius ?? 5,
        filterByLocationCriteria: true
      } as never);
    }
  };

  if (locationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A699" />
        <Text style={styles.loadingText}>Chargement des lieux...</Text>
      </View>
    );
  }

  const locations = locationsData?.locations || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Découvrez par lieu</Text>
      <Text style={styles.subtitle}>Explorez les meilleures propriétés près des lieux d'intérêt</Text>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(locations).map(([key, location]) => (
          <LocationSection
            key={key}
            locationKey={key}
            location={location}
            onViewAll={handleViewAll}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface LocationSectionProps {
  locationKey: string;
  location: any;
  onViewAll: (locationKey: string, locationName: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({ 
  locationKey, 
  location, 
  onViewAll 
}) => {
  const { data, isLoading, error } = useLocationProperties(locationKey, 8);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'city_center':
        return 'location-city';
      case 'business':
        return 'business';
      case 'transport':
        return 'flight';
      case 'luxury':
        return 'star';
      case 'leisure':
        return 'beach-access';
      case 'commercial':
        return 'store';
      default:
        return 'place';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'city_center':
        return '#00A699';
      case 'business':
        return '#FF8C00';
      case 'transport':
        return '#1F8A70';
      case 'luxury':
        return '#FFD700';
      case 'leisure':
        return '#87CEEB';
      case 'commercial':
        return '#FF6B6B';
      default:
        return '#717171';
    }
  };

  if (error) {
    return null; // Don't show sections with errors
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons 
            name={getLocationIcon(location.type)} 
            size={24} 
            color={getLocationColor(location.type)} 
          />
          <View style={styles.sectionTitleText}>
            <Text style={styles.sectionTitle}>{location.name}</Text>
            <Text style={styles.sectionSubtitle}>
              {location.type === 'city_center' ? 'Centre-ville' :
               location.type === 'business' ? 'Zone d\'affaires' :
               location.type === 'transport' ? 'Transport' :
               location.type === 'luxury' ? 'Quartier de luxe' :
               location.type === 'leisure' ? 'Loisirs' :
               location.type === 'commercial' ? 'Commercial' : 'Autre'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => onViewAll(locationKey, location.name)}
        >
          <Text style={styles.viewAllText}>Voir tout</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#00A699" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color="#00A699" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.propertiesScroll}
        >
          {data?.properties?.map((property) => (
            <LocationPropertyCard 
              key={property.id} 
              property={property} 
            />
          ))}
          
          {(!data?.properties || data.properties.length === 0) && (
            <View style={styles.emptyState}>
              <MaterialIcons name="home" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>Aucune propriété disponible</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#717171',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitleText: {
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#717171',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#00A699',
    fontWeight: '500',
    marginRight: 4,
  },
  propertiesScroll: {
    paddingLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#717171',
    marginTop: 12,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#717171',
    marginTop: 12,
  },
});
