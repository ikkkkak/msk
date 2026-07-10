import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LAI } from "./listingAiTheme";

type Props = {
  title: string;
  subtitle?: string;
};

export function ListingAiStepIntro({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: LAI.text,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: LAI.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
