import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { OrgScreenHeader } from "../components/organization/OrgScreenHeader";
import { guideTheme as G } from "../components/guide/guideTheme";
import { GuideCommentCard } from "../components/guide/GuideCommentCard";
import {
  useListingGuideComments,
  useImplementGuideComment,
  useDismissGuideComment,
  useReplyGuideComment,
} from "../hooks/queries/useMeskenyGuide";

export const ListingGuideScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const propertySaleId = Number(route.params?.propertySaleId ?? 0);
  const highlightId = route.params?.commentId
    ? Number(route.params.commentId)
    : undefined;

  const scrollRef = useRef<ScrollView>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useListingGuideComments(
    propertySaleId,
    highlightId,
  );
  const implement = useImplementGuideComment();
  const dismiss = useDismissGuideComment();
  const reply = useReplyGuideComment();

  const comments = data?.comments ?? [];
  const listingTitle =
    comments[0]?.propertySale?.title ||
    t("meskenyGuide.listingGuide", "Listing guide");

  useEffect(() => {
    if (!highlightId || comments.length === 0) return;
    const idx = comments.findIndex((x) => x.id === highlightId);
    if (idx > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * 300, animated: true });
      }, 400);
    }
  }, [highlightId, comments]);

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

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <OrgScreenHeader
        title={t("meskenyGuide.tabTitle", "Guide")}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.hero}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listingTitle}
        </Text>
        <Text style={styles.lead}>
          {t(
            "meskenyGuide.threadLead",
            "Your private analyst — diagnosis, cause, and next steps.",
          )}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={G.accent} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={G.accent}
            />
          }
        >
          {comments.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t("meskenyGuide.emptyTitle", "No guidance yet")}
              </Text>
              <Text style={styles.emptySub}>
                {t(
                  "meskenyGuide.emptySub",
                  "When performance shifts, Meskeny Guide will post structured notes here.",
                )}
              </Text>
            </View>
          ) : (
            comments.map((item) => (
              <GuideCommentCard
                key={item.id}
                comment={item}
                highlighted={highlightId === item.id}
                onImplement={() => runAction(item.id, "implement")}
                onDismiss={() => runAction(item.id, "dismiss")}
                onAskQuestion={(body) => runAction(item.id, "reply", body)}
                busy={busyId === item.id}
              />
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: G.line,
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: G.ink,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  lead: {
    fontSize: 14,
    color: G.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    padding: 40,
    alignItems: "center",
    backgroundColor: G.surface,
    borderRadius: G.radiusLg,
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

export default ListingGuideScreen;
