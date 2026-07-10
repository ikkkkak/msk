import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HEADER_HEIGHT = 120;

interface ModernSearchHeaderProps {
  scrollAnimation: Animated.Value;
  mapShown: boolean;
  setMapShown: (bool: boolean) => void;
  location: string;
  availableProperties?: number;
  onSearchPress?: () => void;
}

export const ModernSearchHeader: React.FC<ModernSearchHeaderProps> = ({
  scrollAnimation,
  mapShown,
  setMapShown,
  location,
  availableProperties,
  onSearchPress,
}) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  const headerOpacity = scrollAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const searchBarScale = scrollAnimation.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      navigation.navigate("FindLocations");
    }
  };

  const handleFilterPress = () => {
    // TODO: Implement filter functionality
    console.log("Filter pressed");
  };

  const handleMapToggle = () => {
    setMapShown(!mapShown);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Bar */}
      
      <View style={styles.topBar}>
         <View style={styles.locationContainer}>
         <Image source={require("../assets/logo/logo-plain.png")} style={{
          width: 150,
          height: 100,
          resizeMode: "contain",
          marginRight: 10,
          position: "absolute",
        }} />
        {/*
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color="#222222"
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {location || "Où voulez-vous aller ?"}
          </Text>
          */}
        </View>
        {/* I WANNA ADD AN IMAGE LOGO PLEASE */}
       
        
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFilterPress}>
            <MaterialCommunityIcons
              name="tune"
              size={20}
              color="#222222"
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleMapToggle}>
            <MaterialCommunityIcons
              name={mapShown ? "format-list-bulleted" : "map"}
              size={20}
              color="#222222"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [{ scale: searchBarScale }],
          },
        ]}
      >
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
          <View style={styles.searchIconContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="#717171"
            />
          </View>
          
          <View style={styles.searchContent}>
            <Text style={styles.searchPlaceholder}>
              Rechercher des destinations
            </Text>
            <Text style={styles.searchSubtext}>
              Où voulez-vous aller ?
            </Text>
          </View>
          
          <View style={styles.searchActions}>
            <TouchableOpacity style={styles.searchActionButton}>
              <MaterialCommunityIcons
                name="microphone"
                size={18}
                color="#717171"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Results Info */}
      {availableProperties !== undefined && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {availableProperties} propriété{availableProperties > 1 ? "s" : ""} trouvée{availableProperties > 1 ? "s" : ""}
          </Text>
          <View style={styles.resultsDivider} />
          <Text style={styles.resultsSubtext}>
            {mapShown ? "Vue carte" : "Vue liste"}
          </Text>
        </View>
      )}

      {/* Quick Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScroll}>
          {[
            { label: "Tout", icon: "home", active: true },
            { label: "Logements entiers", icon: "home-outline", active: false },
            { label: "Chambres privées", icon: "bed", active: false },
            { label: "Chambres partagées", icon: "account-group", active: false },
            { label: "Appartements", icon: "building", active: false },
          ].map((filter, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterChip,
                filter.active && styles.filterChipActive,
              ]}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={filter.active ? "#FFFFFF" : "#222222"}
              />
              <Text
                style={[
                  styles.filterText,
                  filter.active && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 8,
    flex: 1,
  },
  topActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchContent: {
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
  },
  searchSubtext: {
    fontSize: 14,
    color: "#717171",
  },
  searchActions: {
    flexDirection: "row",
    gap: 8,
  },
  searchActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  resultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
  },
  resultsDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 12,
  },
  resultsSubtext: {
    fontSize: 14,
    color: "#717171",
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filtersScroll: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#222222",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
});
