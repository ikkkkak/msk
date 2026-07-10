import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface SimpleCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
