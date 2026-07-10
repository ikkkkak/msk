import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, FlatList, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useUserExperiencesQuery } from '../hooks/queries/useUserExperiencesQuery';
import { Experience } from '../types/experience';

export const HostExperiencesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: experiences, isLoading, refetch } = useUserExperiencesQuery();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#00A699';
      case 'pending':
        return '#FF8C00';
      case 'draft':
        return '#717171';
      case 'rejected':
        return '#FF5A5F';
      default:
        return '#717171';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return t('experiences.status.live');
      case 'pending':
        return t('experiences.status.pending');
      case 'draft':
        return t('experiences.status.draft');
      case 'rejected':
        return t('experiences.status.rejected');
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return `${price} MRU`;
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

  const renderExperienceCard = ({ item }: { item: Experience }) => {
    const firstPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    
    return (
      <TouchableOpacity 
        style={styles.experienceCard}
        onPress={() => navigation.navigate('ExperienceDetails' as never, { experienceId: item.id })}
      >
        <View style={styles.imageContainer}>
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto.url }} style={styles.experienceImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="image" size={40} color="#DDDDDD" />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.experienceContent}>
          <Text style={styles.experienceTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.experienceDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={16} color="#717171" />
              <Text style={styles.detailText}>{item.city}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={16} color="#717171" />
              <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="group" size={16} color="#717171" />
              <Text style={styles.detailText}>{t('experiences.maxPeople', { count: item.groupSize })}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formatPrice(item.pricePerPerson)}</Text>
            <Text style={styles.priceUnit}>{t('experiences.perPerson')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="explore" size={64} color="#DDDDDD" />
      <Text style={styles.emptyTitle}>{t('experiences.noExperiences')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('experiences.emptySubtitle')}
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('ExperienceCreation' as never)}
      >
        <Text style={styles.createButtonText}>{t('experiences.createExperience')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('experiences.myExperiences')}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ExperienceCreation' as never)}
        >
          <MaterialIcons name="add" size={24} color="#00A699" />
        </TouchableOpacity>
      </View>

      {/* Experiences List */}
      <FlatList
        data={experiences || []}
        renderItem={renderExperienceCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  experienceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  experienceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  experienceContent: {
    padding: 16,
  },
  experienceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
    lineHeight: 24,
  },
  experienceDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00A699',
  },
  priceUnit: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#00A699',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
