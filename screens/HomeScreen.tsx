import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useFeaturedPropertiesQuery } from "../hooks/queries/useFeaturedPropertiesQuery";
import { Property } from "../types/property";
import { LISTMARGIN } from "../constants";

const { width } = Dimensions.get("window");

export const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: featuredProperties, isLoading, refetch } = useFeaturedPropertiesQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Search for:", searchQuery);
    }
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate("PropertyDetails", {
      propertyID: property.ID,
    });
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <Card
      property={item}
      onPress={() => handlePropertyPress(item)}
      style={styles.gridCard}
    />
  );

  return (
    <Screen style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#222222"]}
            tintColor="#222222"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('home.greeting')} 👋</Text>
          <Text style={styles.subtitle}>
            {t('home.subtitle')}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color="#717171"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor="#717171"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {[
              { label: t('home.filters.all'), icon: "home" },
              { label: t('home.filters.entirePlaces'), icon: "home-outline" },
              { label: t('home.filters.privateRooms'), icon: "bed" },
              { label: t('home.filters.sharedRooms'), icon: "account-group" },
            ].map((filter, index) => (
              <TouchableOpacity key={index} style={styles.filterChip}>
                <MaterialCommunityIcons
                  name={filter.icon as any}
                  size={16}
                  color="#222222"
                />
                <Text style={styles.filterText}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featuredProperties')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('home.loadingProperties')}</Text>
            </View>
          ) : featuredProperties && featuredProperties.length > 0 ? (
            <View style={styles.propertiesGrid}>
              {featuredProperties.slice(0, 6).map((property) => (
                <Card
                  key={property.ID}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                  style={styles.gridCard}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="home-search"
                size={48}
                color="#717171"
              />
              <Text style={styles.emptyText}>
                {t('home.noProperties')}
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.exploreByType')}</Text>
          <View style={styles.categoriesGrid}>
            {[
              { title: t('home.categories.entirePlaces'), icon: "home", count: "12" },
              { title: t('home.categories.privateRooms'), icon: "bed", count: "8" },
              { title: t('home.categories.sharedRooms'), icon: "account-group", count: "5" },
              { title: t('home.categories.apartments'), icon: "building", count: "15" },
            ].map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <MaterialCommunityIcons
                    name={category.icon as any}
                    size={24}
                    color="#222222"
                  />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryCount}>{category.count} {t('home.properties')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: LISTMARGIN,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#717171",
    lineHeight: 24,
  },
  searchContainer: {
    paddingHorizontal: LISTMARGIN,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222222",
  },
  searchButton: {
    backgroundColor: "#222222",
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersContent: {
    paddingHorizontal: LISTMARGIN,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: LISTMARGIN,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },
  seeAllText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
  },
  loadingContainer: {
    paddingHorizontal: LISTMARGIN,
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#717171",
  },
  propertiesGrid: {
    paddingHorizontal: LISTMARGIN,
  },
  gridCard: {
    marginBottom: 16,
  },
  emptyContainer: {
    paddingHorizontal: LISTMARGIN,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#717171",
    marginTop: 12,
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: LISTMARGIN,
    gap: 12,
  },
  categoryCard: {
    width: (width - LISTMARGIN * 2 - 12) / 2,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    textAlign: "center",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: "#717171",
    textAlign: "center",
  },
  bottomSpacing: {
    height: 20,
  },
});
