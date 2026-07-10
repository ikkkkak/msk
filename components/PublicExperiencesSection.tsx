import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePublicExperiencesQuery } from "../hooks/queries/usePublicExperiencesQuery";
import { PublicExperienceCard } from "./PublicExperienceCard";
import { Experience } from "../types/experience";

interface PublicExperiencesSectionProps {
  onViewAll?: () => void;
}

export const PublicExperiencesSection: React.FC<
  PublicExperiencesSectionProps
> = ({ onViewAll }) => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchCity, setSearchCity] = useState("");

  const {
    data: experiencesData,
    isLoading,
    error,
    refetch
  } = usePublicExperiencesQuery({
    page: 1,
    limit: 10,
    city: searchCity || undefined
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Navigate to full experiences screen
      (navigation as any).navigate("ExperiencesList");
    }
  };

  const handleSearch = (city: string) => {
    setSearchCity(city);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#222222" />
        <Text style={styles.loadingText}>Découverte des expériences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF5A5F" />
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorText}>
          Impossible de charger les expériences
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const experiences = experiencesData?.experiences || [];

  if (experiences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="explore" size={64} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>Aucune expérience trouvée</Text>
        <Text style={styles.emptyText}>
          {searchCity
            ? `Aucune expérience disponible à ${searchCity}`
            : "Aucune expérience disponible pour le moment"}
        </Text>
        {searchCity && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchCity("")}
          >
            <Text style={styles.clearSearchText}>Effacer la recherche</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Expériences</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {["Toutes", "Art", "Cuisine", "Nature", "Culture", "Sport"].map(
            (category) => (
              <TouchableOpacity key={category} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Experiences List */}
      <View style={styles.experiencesContainer}>
        {experiences.map((experience: Experience, index: number) => (
          <PublicExperienceCard
            key={experience.ID}
            experience={experience}
            isFirst={index === 0}
            isLast={index === experiences.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#717171",
    fontWeight: "500"
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  errorText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: "#222222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center"
  },
  emptyText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24
  },
  clearSearchButton: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  clearSearchText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "500"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222"
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginTop: 2
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  viewAllText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500"
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222222"
  },
  categoriesContainer: {
    paddingBottom: 16
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8
  },
  categoryChip: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  categoryText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500"
  },
  experiencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "space-between"
  },
  viewAllBottomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8
  },
  viewAllBottomText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "500"
  }
});
