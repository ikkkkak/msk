import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Experience } from '../types/experience';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

interface ExperienceCardProps {
  experience: Experience;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ 
  experience, 
  isFirst, 
  isLast 
}) => {
  const navigation = useNavigation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePress = () => {
    (navigation as any).navigate('ExperienceDetails', { 
      experienceId: experience.ID 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#00A699';
      case 'pending':
        return '#FFB400';
      case 'approved':
        return '#00A699';
      case 'rejected':
        return '#FF5A5F';
      case 'draft':
        return '#717171';
      default:
        return '#717171';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'En ligne';
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  // Parse photos from JSON string or array
  const getPhotos = () => {
    if (experience.Photos && Array.isArray(experience.Photos)) {
      return experience.Photos;
    }
    if (experience.Photos && typeof experience.Photos === 'string') {
      try {
        return JSON.parse(experience.Photos);
      } catch {
        return [];
      }
    }
    return [];
  };

  const photos = getPhotos();
  const currentPhoto = photos[currentImageIndex];

  return (
    <TouchableOpacity 
      style={[
        styles.experienceCard,
        isFirst && styles.firstCard,
        isLast && styles.lastCard
      ]}
      onPress={handlePress}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {currentPhoto ? (
          <Image
            source={{ uri: currentPhoto.url }}
            style={styles.experienceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={40} color="#E0E0E0" />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(experience.Status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(experience.Status)}
          </Text>
        </View>

        {/* Image Dots */}
        {photos.length > 1 && (
          <View style={styles.imageDots}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
        )}

        {/* Heart Button */}
        <TouchableOpacity style={styles.heartButton}>
          <MaterialIcons name="favorite-border" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Title and Location */}
        <Text style={styles.experienceTitle} numberOfLines={2}>
          {experience.Title}
        </Text>
        
        <Text style={styles.locationText}>
          {experience.City} • {experience.Language}
        </Text>

        {/* Host Info */}
        <View style={styles.hostInfo}>
          <View style={styles.hostAvatar}>
            {experience.Host?.AvatarURL ? (
              <Image
                source={{ uri: experience.Host.AvatarURL }}
                style={styles.hostAvatarImage}
              />
            ) : (
              <MaterialIcons name="person" size={16} color="#717171" />
            )}
          </View>
          <Text style={styles.hostName}>
            {experience.Host?.FirstName} {experience.Host?.LastName}
          </Text>
          {experience.Host?.IdentityVerified && (
            <MaterialIcons name="verified" size={16} color="#00A699" />
          )}
        </View>

        {/* Experience Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#717171" />
            <Text style={styles.detailText}>
              {formatDuration(experience.Duration)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialIcons name="group" size={16} color="#717171" />
            <Text style={styles.detailText}>
              Jusqu'à {experience.GroupSize} personnes
            </Text>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.activityLevel}>
          <Text style={styles.activityText}>
            Niveau {experience.ActivityLevel} • {experience.DifficultyLevel}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            {formatPrice(experience.PricePerPerson)}
          </Text>
          <Text style={styles.priceUnit}> par personne</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  experienceCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 0,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  experienceImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
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
  contentContainer: {
    padding: 16,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
    lineHeight: 22,
  },
  locationText: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hostName: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#717171',
  },
  activityLevel: {
    marginBottom: 12,
  },
  activityText: {
    fontSize: 12,
    color: '#717171',
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  priceUnit: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 4,
  },
});
