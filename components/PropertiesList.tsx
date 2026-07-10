import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { 
  House,
  Star,
  Heart,
  MapPin,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Full width minus padding
const CARD_HEIGHT = 320; // Increased height for Airbnb style

interface PropertiesListProps {
  properties: any[];
  isLoading: boolean;
  error?: any;
  onPropertyPress?: (propertyId: number) => void;
}

export const PropertiesList: React.FC<PropertiesListProps> = ({
  properties,
  isLoading,
  error,
  onPropertyPress
}) => {
  const navigation = useNavigation();

  const handlePropertyPress = (propertyId: number) => {
    if (onPropertyPress) {
      onPropertyPress(propertyId);
    } else {
      (navigation as any).navigate('PropertyDetails', { propertyID: propertyId });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={({ item: index }) => (
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonText1} />
                <View style={styles.skeletonText2} />
                <View style={styles.skeletonText3} />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    );
  }

  if (error && !properties.length) {
    return (
      <View style={styles.errorContainer}>
        <House size={48} color="#E0E0E0" weight="duotone" />
        <Text style={styles.errorText}>Erreur lors de la recherche</Text>
        <Text style={styles.errorSubtext}>Veuillez réessayer</Text>
      </View>
    );
  }

  if (properties.length === 0) {
    return (
      <View style={styles.emptyState}>
        <House size={48} color="#E0E0E0" weight="duotone" />
        <Text style={styles.emptyText}>Aucune propriété trouvée</Text>
        <Text style={styles.emptySubtext}>Essayez d'élargir votre recherche ou de changer de zone</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={properties}
      renderItem={({ item: property, index }) => (
        <PropertyCard
          property={property}
          onPress={() => handlePropertyPress(property.id || property.ID)}
          isFirst={index === 0}
        />
      )}
      keyExtractor={(item, index) => (item.id || item.ID || index).toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.flatListContainer}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      removeClippedSubviews={false}
      maxToRenderPerBatch={10}
      initialNumToRender={5}
      windowSize={10}
    />
  );
};

interface PropertyCardProps {
  property: any;
  onPress: () => void;
  isFirst?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, isFirst }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case 'entire_place':
        return 'Logement entier';
      case 'private_room':
        return 'Chambre privée';
      case 'shared_room':
        return 'Chambre partagée';
      default:
        return 'Logement';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.propertyCard, isFirst && { marginTop: 0 }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <House size={32} color="#CFCFCF" />
          </View>
        )}
        
        {/* Heart Button */}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color="#FFFFFF" weight="fill" />
        </TouchableOpacity>
        
        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            {formatPrice(property.nightlyPrice || property.NightlyPrice || 0)}
          </Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Title and Rating Row */}
        <View style={styles.titleRow}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {property.title || property.Title || 'Propriété'}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#222" weight="fill" />
            <Text style={styles.ratingText}>{(property.rating || 4.8).toFixed(1)}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={14} color="#717171" weight="bold" />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.city || property.City || 'Nouakchott'}
          </Text>
        </View>

        {/* Property Type */}
        <Text style={styles.propertyType} numberOfLines={1}>
          {getPropertyTypeText(property.propertyType || property.PropertyType || 'entire_place')}
        </Text>

        {/* Features Row */}
        <View style={styles.featuresRow}>
          <Text style={styles.featuresText}>
            {property.bedrooms || property.Bedrooms || 1} chambre{property.bedrooms > 1 ? 's' : ''} • 
            {property.bathrooms || property.Bathrooms || 1} salle{property.bathrooms > 1 ? 's' : ''} de bain
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  
  // Airbnb-style Property Card
  propertyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Image Container
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Card Content
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    flex: 1,
    marginRight: 8,
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginLeft: 4,
  },
  
  // Location Row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#717171',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Property Type
  propertyType: {
    fontSize: 15,
    color: '#717171',
    marginBottom: 8,
    fontWeight: '500',
  },
  
  // Features Row
  featuresRow: {
    marginTop: 'auto',
  },
  featuresText: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
  },

  // Loading States
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  skeletonImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonText1: {
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '70%',
    marginBottom: 8,
  },
  skeletonText2: {
    height: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '50%',
    marginBottom: 8,
  },
  skeletonText3: {
    height: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '40%',
  },

  // Error and Empty States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5A5F',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 15,
    color: '#717171',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#717171',
    marginTop: 8,
    textAlign: 'center',
  },
});