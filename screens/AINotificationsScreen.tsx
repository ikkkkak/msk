import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAINotifications } from "../hooks/useAINotifications";

export function AINotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { items, loading, refresh, markRead } = useAINotifications();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>
        {t("modelX46.notifications.title", "AI notifications")}
      </Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#DA8050" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {t("modelX46.notifications.empty", "No AI notifications yet")}
          </Text>
          <Text style={styles.emptyHint}>
            {t(
              "modelX46.notifications.emptyHint",
              "When Model X46 finds a highly relevant match, you'll see it here.",
            )}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshing={loading}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.status === "read" && styles.cardRead]}
              onPress={() => markRead(item.id)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAEFE9", paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginVertical: 16, color: "#111827" },
  empty: { marginTop: 40, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  emptyHint: { marginTop: 8, textAlign: "center", color: "#6B7280", lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  cardRead: { opacity: 0.7 },
  cardTitle: { fontWeight: "700", color: "#111827" },
  cardBody: { marginTop: 6, color: "#4B5563", lineHeight: 18 },
});
