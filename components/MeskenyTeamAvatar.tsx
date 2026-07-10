import React, { memo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { SealCheck } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

export const MESKENY_TEAM_LOGO = require("../assets/logo.png");

type Props = {
  size?: number;
  style?: ViewStyle;
  showBadge?: boolean;
  badgeSize?: "sm" | "md";
};

/** Official Meskeny Team avatar — memoized + cached to prevent inbox blink on refetch. */
export const MeskenyTeamAvatar = memo(function MeskenyTeamAvatar({
  size = 50,
  style,
  showBadge = false,
  badgeSize = "sm",
}: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={MESKENY_TEAM_LOGO}
        style={[
          styles.logo,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        recyclingKey="meskeny-team-logo"
      />
      {showBadge ? (
        <View
          style={[
            styles.badge,
            badgeSize === "md" ? styles.badgeMd : styles.badgeSm,
          ]}
        >
          <SealCheck
            size={badgeSize === "md" ? 12 : 10}
            color="#FFF"
            weight="fill"
          />
        </View>
      ) : null}
    </View>
  );
});

export const MeskenyTeamNameRow = memo(function MeskenyTeamNameRow({
  nameStyle,
  badgeStyle,
}: {
  nameStyle?: object;
  badgeStyle?: object;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.nameRow}>
      <Text style={[styles.name, nameStyle]} numberOfLines={1}>
        {t("messages.meskenyTeam", "Meskeny Team")}
      </Text>
      <View style={[styles.verifiedPill, badgeStyle]}>
        <SealCheck size={11} color="#047857" weight="fill" />
        <Text style={styles.verifiedText}>
          {t("messages.meskenyTeamVerified", "Verified")}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  logo: {
    backgroundColor: "#FAEFE9",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E4DC",
  },
  badge: {
    position: "absolute",
    backgroundColor: "#047857",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  badgeSm: {
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
  },
  badgeMd: {
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flexShrink: 1,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
  },
});
