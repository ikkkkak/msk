import React, { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import { MessageCircle, MessageSquare } from "lucide-react-native";
import { theme } from "../theme";
import { ChatCenteredIcon } from "phosphor-react-native";

const TT_RED = theme["color-temporary-primary"];

export type MessagesTabUnreadIndicatorProps = {
  count: number;
  onPress: () => void;
  screenWidth: number;
  insetsBottom?: number;
  tabCount?: number;
  inboxIndex?: number;
  bottomOffset?: number;
};

export const MessagesTabUnreadIndicator = memo(
  ({
    count,
    onPress,
    screenWidth,
    insetsBottom = 0,
    tabCount = 5,
    inboxIndex = 3,
    bottomOffset = -25,
  }: MessagesTabUnreadIndicatorProps) => {
    const { t } = useTranslation();

    if (!count || count === 0) return null;

    const display = count > 99 ? "99+" : String(count);

    const inboxCenterX = useMemo(
      () => (screenWidth * (inboxIndex + 0.5)) / tabCount,
      [screenWidth, inboxIndex, tabCount],
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t("inbox.newMessagesHint", {
          defaultValue: "{{count}} new messages",
          count: display,
        })}
        style={[
          styles.wrap,
          { left: inboxCenterX, bottom: bottomOffset + insetsBottom },
        ]}
      >
        <View style={styles.pill}>
          <ChatCenteredIcon weight="fill" size={15} color="#fff" />
          <Text style={styles.text}>{display}</Text>
        </View>
        <View style={styles.caret} />
      </TouchableOpacity>
    );
  },
);

MessagesTabUnreadIndicator.displayName = "MessagesTabUnreadIndicator";

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 12050,
    alignItems: "center",
    transform: [{ translateX: -22 }],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: TT_RED,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  caret: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TT_RED,
  },
});
