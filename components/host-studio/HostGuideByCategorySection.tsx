import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Sparkle, CaretDown, CaretUp } from "phosphor-react-native";
import {
  useGuideGrouped,
  type GuideComment,
} from "../../hooks/queries/useMeskenyGuide";
import { studio } from "./studioTheme";

export function HostGuideByCategorySection({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { data, isLoading, isRefetching } = useGuideGrouped(enabled);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    photo: true,
    engagement: true,
  });

  const groups = data?.groups ?? [];
  if (!enabled) return null;
  if (!isLoading && groups.length === 0) return null;

  const openComment = (comment: GuideComment) => {
    const saleId = comment.propertySaleId ?? comment.propertySale?.id;
    if (!saleId) return;
    navigation.navigate("ListingGuide", {
      propertySaleId: saleId,
      commentId: comment.id,
    });
  };

  const categoryLabel = (cat: string) =>
    t(`meskenyGuide.category.${cat}`, cat);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Sparkle size={18} color={studio.ink} weight="fill" />
        <Text style={styles.title}>
          {t("meskenyGuide.dashboardTitle", "AI guidance")}
        </Text>
        {(isLoading || isRefetching) && (
          <ActivityIndicator size="small" color={studio.muted} />
        )}
      </View>
      <Text style={styles.sub}>
        {t(
          "meskenyGuide.dashboardSub",
          "Grouped by type — tap View more for the full note.",
        )}
      </Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginVertical: 16 }} color={studio.ink} />
      ) : (
        groups.map((group) => {
          const open = expandedCats[group.category] !== false;
          return (
            <View key={group.category} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHead}
                onPress={() =>
                  setExpandedCats((p) => ({
                    ...p,
                    [group.category]: !open,
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={styles.groupTitle}>
                  {categoryLabel(group.category)} ({group.count})
                </Text>
                {open ? (
                  <CaretUp size={16} color={studio.muted} />
                ) : (
                  <CaretDown size={16} color={studio.muted} />
                )}
              </TouchableOpacity>
              {open
                ? group.comments.map((c) => (
                    <View key={c.id} style={styles.item}>
                      <Text style={styles.itemListing} numberOfLines={1}>
                        {c.propertySale?.title ??
                          t("meskenyGuide.listing", "Listing")}
                      </Text>
                      <Text style={styles.itemPreview} numberOfLines={2}>
                        {c.diagnosis}
                      </Text>
                      <TouchableOpacity
                        onPress={() => openComment(c)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemAction}>
                          {t("meskenyGuide.viewMore", "View more")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: studio.ink,
  },
  sub: {
    fontSize: 13,
    color: studio.muted,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 18,
  },
  group: {
    marginBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: studio.border,
    paddingTop: 10,
  },
  groupHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.ink,
  },
  item: {
    paddingVertical: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#2563EB",
    marginBottom: 4,
  },
  itemListing: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.ink,
    marginBottom: 4,
  },
  itemPreview: {
    fontSize: 14,
    color: studio.inkSecondary,
    lineHeight: 20,
    fontStyle: "italic",
  },
  itemAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#008489",
    marginTop: 6,
  },
});
