import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Sparkle } from "phosphor-react-native";
import { OrgScreenHeader } from "../components/organization/OrgScreenHeader";
import { guideTheme as G } from "../components/guide/guideTheme";
import { GuideCommentCard } from "../components/guide/GuideCommentCard";
import {
  GuideFeedFilterBar,
  type GuideFeedFilterKey,
} from "../components/guide/GuideFeedFilterBar";
import {
  useGuideFeed,
  useImplementGuideComment,
  useDismissGuideComment,
  useReplyGuideComment,
  type GuideComment,
} from "../hooks/queries/useMeskenyGuide";

function sortGuideFeed(comments: GuideComment[]): GuideComment[] {
  return [...comments].sort((a, b) => {
    const aUnread = a.status === "unread" ? 1 : 0;
    const bUnread = b.status === "unread" ? 1 : 0;
    if (bUnread !== aUnread) return bUnread - aUnread;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export const MyGuideFeedScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<GuideFeedFilterKey>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const queryParams =
    filter === "needs_action"
      ? { needsAction: true }
      : filter === "all"
        ? {}
        : { severity: filter };

  const { data, isLoading, refetch, isRefetching } = useGuideFeed(queryParams);
  const implement = useImplementGuideComment();
  const dismiss = useDismissGuideComment();
  const reply = useReplyGuideComment();

  const comments = useMemo(
    () => sortGuideFeed(data?.comments ?? []),
    [data?.comments],
  );

  const unreadCount = useMemo(
    () => comments.filter((c) => c.status === "unread").length,
    [comments],
  );

  const runAction = useCallback(
    async (id: number, action: "implement" | "dismiss" | "reply", body?: string) => {
      setBusyId(id);
      try {
        if (action === "implement") await implement.mutateAsync(id);
        else if (action === "dismiss") await dismiss.mutateAsync(id);
        else if (action === "reply" && body)
          await reply.mutateAsync({ commentId: id, body });
      } finally {
        setBusyId(null);
      }
    },
    [implement, dismiss, reply],
  );

  const openListing = (comment: GuideComment) => {
    const lid = comment.propertySaleId ?? comment.propertySale?.id;
    if (!lid) return;
    navigation.navigate("ListingGuide", {
      propertySaleId: lid,
      commentId: comment.id,
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <OrgScreenHeader
        title={t("meskenyGuide.feedTitle", "My Guide")}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Sparkle size={18} color={G.accent} weight="fill" />
        </View>
        <View style={styles.heroText}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>
              {t("meskenyGuide.feedHeroTitle", "Listing insights")}
            </Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>
                  {t("meskenyGuide.unreadBadge", "Unread")} · {unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.lead}>
            {t(
              "meskenyGuide.feedLead",
              "Newest insights first — unread items stay at the top.",
            )}
          </Text>
        </View>
      </View>

      <GuideFeedFilterBar value={filter} onChange={setFilter} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={G.accent} size="small" />
          <Text style={styles.loadingText}>
            {t("meskenyGuide.feedLoading", "Loading insights…")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={G.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t("meskenyGuide.feedEmpty", "You're caught up")}
              </Text>
              <Text style={styles.emptySub}>
                {t(
                  "meskenyGuide.feedEmptySub",
                  "New guidance appears when listing performance shifts.",
                )}
              </Text>
            </View>
          ) : (
            comments.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.92}
                onPress={() => openListing(item)}
              >
                <GuideCommentCard
                  comment={item}
                  showListingTitle
                  onImplement={() => runAction(item.id, "implement")}
                  onDismiss={() => runAction(item.id, "dismiss")}
                  onAskQuestion={(body) => runAction(item.id, "reply", body)}
                  busy={busyId === item.id}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: G.bg,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: G.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: G.line,
  },
  heroText: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: G.ink,
    letterSpacing: -0.3,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#BFDBFE",
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  lead: {
    fontSize: 14,
    color: G.muted,
    lineHeight: 20,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: G.muted,
    fontWeight: "500",
  },
  empty: {
    padding: 32,
    alignItems: "center",
    backgroundColor: G.surface,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: G.line,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: G.ink },
  emptySub: {
    fontSize: 14,
    color: G.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});

export default MyGuideFeedScreen;
