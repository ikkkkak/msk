import React from 'react';
import { Marker } from "react-native-maps";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MapMarkerProps {
  lat: number;
  lng: number;
  onPress?: () => void;
  price: number;
  isSelected?: boolean;
  isVerified?: boolean;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  lat,
  lng,
  onPress,
  price,
  isSelected = false,
  isVerified = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Marker 
      coordinate={{ latitude: lat, longitude: lng }} 
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <TouchableOpacity 
        style={[
          styles.markerContainer,
          isSelected && styles.selectedMarker
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.marker,
          isSelected && styles.selectedMarkerStyle
        ]}>
          <Text style={[
            styles.priceText,
            isSelected && styles.selectedPriceText
          ]}>
            {formatPrice(price)}
          </Text>
          {isVerified && (
            <View style={styles.verifiedIndicator}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>
        {isSelected && <View style={styles.pointer} />}
      </TouchableOpacity>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedMarker: {
    transform: [{ scale: 1.1 }],
  },
  selectedMarkerStyle: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
  },
  selectedPriceText: {
    color: '#FFFFFF',
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000000',
    marginTop: -1,
  },
  verifiedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00A699',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
