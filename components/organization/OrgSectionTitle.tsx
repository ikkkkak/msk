import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { orgTheme as o } from "./orgTheme";

type Props = {
  title: string;
  count?: number;
  subtitle?: string;
};

/** Section title without decorative icons — clean hierarchy. */
export function OrgSectionTitle({ title, count, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {typeof count === "number" && count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: o.ink,
    letterSpacing: -0.25,
  },
  subtitle: {
    fontSize: 13,
    color: o.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: o.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: o.line,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: o.body,
  },
});
