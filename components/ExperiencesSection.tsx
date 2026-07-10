import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserExperiencesQuery } from '../hooks/queries/useUserExperiencesQuery';
import { ExperienceCard } from './ExperienceCard';
import { Experience } from '../types/experience';

interface ExperiencesSectionProps {
  onViewAll?: () => void;
}

export const ExperiencesSection: React.FC<ExperiencesSectionProps> = ({ 
  onViewAll 
}) => {
  const navigation = useNavigation();
  const { data: experiences, isLoading, error, refetch } = useUserExperiencesQuery();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      (navigation as any).navigate('HostExperiences');
    }
  };

  const handleCreateExperience = () => {
    (navigation as any).navigate('ExperienceCreation');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#222222" />
        <Text style={styles.loadingText}>Chargement des expériences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF5A5F" />
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorText}>
          Impossible de charger vos expériences
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="explore" size={64} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>Aucune expérience créée</Text>
        <Text style={styles.emptyText}>
          Créez votre première expérience et partagez votre passion avec des voyageurs
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateExperience}>
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Créer une expérience</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter experiences by status for better organization
  const liveExperiences = experiences.filter(exp => exp.Status === 'live');
  const pendingExperiences = experiences.filter(exp => exp.Status === 'pending');
  const draftExperiences = experiences.filter(exp => exp.Status === 'draft');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Vos expériences</Text>
          <Text style={styles.sectionSubtitle}>
            {experiences.length} expérience{experiences.length > 1 ? 's' : ''} créée{experiences.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>Voir tout</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#222222" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{liveExperiences.length}</Text>
          <Text style={styles.statLabel}>En ligne</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingExperiences.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{draftExperiences.length}</Text>
          <Text style={styles.statLabel}>Brouillons</Text>
        </View>
      </View>

      {/* Experiences List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.experiencesScroll}
        contentContainerStyle={styles.experiencesScrollContent}
      >
        {experiences.slice(0, 5).map((experience: Experience, index: number) => (
          <ExperienceCard
            key={experience.ID}
            experience={experience}
            isFirst={index === 0}
            isLast={index === Math.min(experiences.length, 5) - 1}
          />
        ))}
      </ScrollView>

      {/* Create New Experience Button */}
      <TouchableOpacity style={styles.createNewButton} onPress={handleCreateExperience}>
        <MaterialIcons name="add" size={24} color="#222222" />
        <Text style={styles.createNewText}>Créer une nouvelle expérience</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#717171',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#222222',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
  },
  statLabel: {
    fontSize: 12,
    color: '#717171',
    marginTop: 4,
  },
  experiencesScroll: {
    paddingLeft: 20,
  },
  experiencesScrollContent: {
    paddingRight: 20,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  createNewText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
  },
});
