import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CaretLeft, ChartLine } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { fetchPropertySaleGoldInsights } from "../services/propertyManagement";

const BG = "#FFFFFF";
const TEXT = "#222222";
const SUB = "#717171";
const BORDER = "#EBEBEB";
const CARD = "#FAFAFA";

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export const PropertySaleGoldInsightsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const propertyId = route.params?.propertyId as number | undefined;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) {
      setError(t("organization.insightsLoadError", "Could not load insights"));
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const d = await fetchPropertySaleGoldInsights(propertyId);
      setData(d);
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          e?.message ||
          t("organization.insightsLoadError", "Could not load insights")
      );
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const title =
    (data?.title as string) ||
    t("organization.goldInsightsTitle", "Listing insights");

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            navigation.goBack();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <CaretLeft size={24} color={TEXT} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ChartLine size={18} color={SUB} weight="regular" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t("organization.goldInsightsTitle", "Listing insights")}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={TEXT} />
        </View>
      ) : error && !data ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>
              {t("common.retry", "Retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.listingTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtle}>
            {data?.is_gold
              ? t(
                  "organization.goldStatusOn",
                  "Gold distribution is on for this listing."
                )
              : t(
                  "organization.goldStatusOff",
                  "Gold distribution is off. Turn on Gold from your agency listing to boost reach."
                )}
          </Text>

          <View style={styles.grid}>
            <MetricRow
              label={t(
                "organization.metricTotalViews",
                "Total profile views"
              )}
              value={formatCount(Number(data?.view_count ?? 0))}
            />
            <MetricRow
              label={t(
                "organization.metricFeedImpressions",
                "Feed impressions"
              )}
              value={formatCount(Number(data?.feed_impressions ?? 0))}
            />
            <MetricRow
              label={t(
                "organization.metricDetailViews",
                "Detail opens"
              )}
              value={formatCount(Number(data?.detail_views ?? 0))}
            />
            <MetricRow
              label={t(
                "organization.metricNotificationsSent",
                "Push notifications sent"
              )}
              value={formatCount(Number(data?.notifications_sent ?? 0))}
            />
            <MetricRow
              label={t(
                "organization.metricFeedToDetail",
                "Feed → detail rate"
              )}
              value={`${Number(data?.feed_to_detail_rate_pct ?? 0).toFixed(1)}%`}
            />
          </View>

          {data?.stats_updated_at ? (
            <Text style={styles.footerNote}>
              {t("organization.statsUpdatedAt", "Metrics updated")}:{" "}
              {String(data.stats_updated_at).slice(0, 16).replace("T", " ")}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    maxWidth: "85%",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: SUB,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: TEXT },
  listingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtle: {
    fontSize: 14,
    color: SUB,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: { gap: 10 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: SUB,
    flex: 1,
    paddingRight: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  footerNote: {
    marginTop: 20,
    fontSize: 12,
    color: SUB,
  },
});
