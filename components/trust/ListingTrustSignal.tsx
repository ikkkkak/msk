import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "@ui-kitten/components";
import { trustColors as c } from "./trustTokens";

export type ListingTrustSignalProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  isLast?: boolean;
};

/**
 * Single trust line — quiet, readable, no loud fills (Airbnb-style).
 */
export function ListingTrustSignal({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  isLast,
}: ListingTrustSignalProps) {
  const content = (
    <>
      <View style={styles.iconSlot}>{icon}</View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </>
  );

  const row = onPress ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.row, !isLast && styles.rowBorder]}>{content}</View>
  );

  return row;
}

type ListingTrustBlockProps = {
  children: React.ReactNode;
  heading?: string;
};

export function ListingTrustBlock({ children, heading }: ListingTrustBlockProps) {
  return (
    <View style={styles.block}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 8,
    marginBottom: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.line,
  },
  rowPressed: {
    backgroundColor: "#FAFAFA",
  },
  iconSlot: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.15,
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: c.muted,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
    color: c.body,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
