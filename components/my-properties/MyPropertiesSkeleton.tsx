import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SkeletonBase } from "../SkeletonUI";
import { mp } from "./myPropertiesTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_MARGIN = 16;
const IMAGE_W = SCREEN_W - CARD_H_MARGIN * 2;
const IMAGE_H = Math.round(IMAGE_W * (9 / 16));

function StatSkeleton() {
  return (
    <View style={styles.stat}>
      <SkeletonBase height={22} width={28} style={styles.statNum} />
      <SkeletonBase height={11} width={48} style={styles.statLabel} />
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBase width={IMAGE_W} height={IMAGE_H} style={styles.image} />
      <View style={styles.body}>
        <SkeletonBase height={22} width={120} />
        <SkeletonBase height={14} width={140} style={styles.gap} />
        <SkeletonBase height={16} width="88%" style={styles.gap} />
        <SkeletonBase height={13} width="62%" style={styles.gap} />
      </View>
    </View>
  );
}

export function MyPropertiesSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.statsRow}>
        <StatSkeleton />
        <View style={styles.statDivider} />
        <StatSkeleton />
        <View style={styles.statDivider} />
        <StatSkeleton />
      </View>
      {[0, 1, 2].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: CARD_H_MARGIN,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: mp.radiusLg,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statNum: {
    borderRadius: 4,
    backgroundColor: mp.borderLight,
  },
  statLabel: {
    borderRadius: 4,
    backgroundColor: mp.borderLight,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: mp.border,
    marginVertical: 4,
  },
  card: {
    marginHorizontal: CARD_H_MARGIN,
    marginBottom: 16,
    borderRadius: mp.radiusLg,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
    overflow: "hidden",
  },
  image: {
    backgroundColor: mp.borderLight,
  },
  body: {
    padding: 14,
  },
  gap: {
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: mp.borderLight,
  },
});
