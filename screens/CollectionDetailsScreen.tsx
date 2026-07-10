import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { Property } from "../types/property";
import { useCollectionPropertiesQuery } from "../hooks/queries/useCollectionPropertiesQuery";

const { width: screenWidth } = Dimensions.get("window");

export const CollectionDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { collectionID, collectionName } = route.params as { 
    collectionID: number; 
    collectionName: string; 
  };
  
  console.log("🔍 CollectionDetailsScreen params:", { collectionID, collectionName });
  
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: properties, isLoading, refetch } = useCollectionPropertiesQuery(collectionID);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <Card
      property={item}
      style={styles.card}
      onPress={() =>
        navigation.navigate("PropertyDetails", { propertyID: item.ID })
      }
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons
          name="folder-outline"
          size={80}
          color="#E8E8E8"
        />
      </View>
      <Text style={styles.emptyTitle}>Aucune propriété</Text>
      <Text style={styles.emptyDescription}>
        Cette collection ne contient aucune propriété pour le moment.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Search")}
      >
        <Text style={styles.browseButtonText}>Parcourir les propriétés</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{collectionName}</Text>
          <Text style={styles.headerSubtitle}>
            {properties?.length || 0} propriété{(properties?.length || 0) > 1 ? 's' : ''}
          </Text>
        </View>
       
      </View>

      {/* Properties List */}
      {properties && properties.length > 0 ? (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.ID.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF385C"]}
              tintColor="#FF385C"
              progressBackgroundColor="#F7F7F7"
            />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginTop: 4,
    fontWeight: "500",
  },
  optionsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF385C",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
