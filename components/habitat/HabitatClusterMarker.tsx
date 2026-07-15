import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import type { LatLng } from "../../types/habitat";

interface HabitatClusterMarkerProps {
  id: string;
  coordinate: LatLng;
  count: number;
  onPress?: () => void;
}

export const HabitatClusterMarker = React.memo(
  function HabitatClusterMarker({
    id,
    coordinate,
    count,
    onPress,
  }: HabitatClusterMarkerProps) {
    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={coordinate}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={styles.clusterContainer}>
          <View style={styles.clusterBadge}>
            <Text style={styles.clusterText}>{count}</Text>
          </View>
        </View>
      </Marker>
    );
  },
);

const styles = StyleSheet.create({
  clusterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  clusterBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E91E63", // vibrant magenta
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
