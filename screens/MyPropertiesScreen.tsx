import React, { useCallback, useMemo, useRef } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Plus, CaretRight, House, CloudSlash } from "phosphor-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HostOnboardingSheet } from "../components/host-onboarding/HostOnboardingSheet";

import { useUser } from "../hooks/useUser";
import { MyPropertiesSkeleton } from "../components/my-properties/MyPropertiesSkeleton";
import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
import { useMyPropertiesQuery } from "../hooks/queries/useMyPropertiesQuery";
import {
  getApiErrorUserMessage,
  logApiError,
  parseApiError,
} from "../utils/apiError";
import { isHostStudioAuthError } from "../components/host-studio/hostStudioAuth";
import { HostStudioAuthPrompt } from "../components/host-studio/HostStudioAuthPrompt";
import { tokenStorage } from "../services/tokenStorage";
import {
  MyPropertyCard,
  type MyPropertyCardProperty,
} from "../components/my-properties/MyPropertyCard";
import { mp } from "../components/my-properties/myPropertiesTheme";
import type { Property } from "../types/property";

function getPropertyStatus(p: Property): string | undefined {
  return (p as Property & { status?: string }).status;
}

function isLiveProperty(p: Property): boolean {
  const s = (getPropertyStatus(p) || "").toLowerCase();
  if (s === "approved" || s === "live" || s === "published") return true;
  if (s === "rejected" || s === "pending") return false;
  return p.isActive === true;
}

function isPendingProperty(p: Property): boolean {
  const s = (getPropertyStatus(p) || "").toLowerCase();
  if (s === "pending" || s === "rejected") return true;
  if (s === "approved" || s === "live" || s === "published") return false;
  return p.isActive !== true;
}

type StatsStripProps = {
  total: number;
  live: number;
  pending: number;
};

function StatsStrip({ total, live, pending }: StatsStripProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.statsCard}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{total}</Text>
        <Text style={styles.statLabel}>
          {t("myProperties.statTotal", "Total")}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.stat}>
        <Text style={[styles.statValue, styles.statLive]}>{live}</Text>
        <Text style={styles.statLabel}>
          {t("myProperties.status.live", "Live")}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.stat}>
        <Text style={[styles.statValue, styles.statPending]}>{pending}</Text>
        <Text style={styles.statLabel}>
          {t("myProperties.status.pending", "Pending")}
        </Text>
      </View>
    </View>
  );
}

export const MyPropertiesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const properties = useMyPropertiesQuery();
  const hostOnboardingSheetRef = useRef<BottomSheetModal | null>(null);

  const openHostOnboarding = useCallback(() => {
    requestAnimationFrame(() => {
      hostOnboardingSheetRef.current?.present();
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.ID) {
        void properties.refetch();
      }
      return () => {
        hostOnboardingSheetRef.current?.dismiss();
      };
    }, [user?.ID, properties.refetch]),
  );

  const accessToken = user?.accessToken || tokenStorage.getAccess();
  const goSignIn = useCallback(() => {
    navigation.navigate("UnifiedAuth");
  }, [navigation]);

  const onRefresh = useCallback(() => {
    void properties.refetch();
  }, [properties.refetch]);

  const data = properties.data ?? [];

  const { liveCount, pendingCount } = useMemo(() => {
    let live = 0;
    let pending = 0;
    for (const p of data) {
      if (isLiveProperty(p)) live += 1;
      else if (isPendingProperty(p)) pending += 1;
    }
    return { liveCount: live, pendingCount: pending };
  }, [data]);

  const openProperty = useCallback(
    (propertyID: number) => {
      navigation.navigate("EditProperty", { propertyID });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Property }) => (
      <MyPropertyCard
        property={item as MyPropertyCardProperty}
        onPress={() => openProperty(item.ID)}
      />
    ),
    [openProperty],
  );

  const keyExtractor = useCallback((item: Property) => String(item.ID), []);

  const listHeader = useMemo(() => {
    if (data.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <StatsStrip
          total={data.length}
          live={liveCount}
          pending={pendingCount}
        />
        {pendingCount > 0 ? (
          <Text style={styles.pendingHint}>
            {t("myProperties.summaryPending", {
              count: pendingCount,
              defaultValue: "{{count}} awaiting review",
            })}
          </Text>
        ) : (
          <Text style={styles.pendingHint}>
            {t(
              "myProperties.summarySub",
              "Tap a listing to edit details and pricing.",
            )}
          </Text>
        )}
        <TouchableOpacity
          style={styles.toolsRow}
          onPress={() => navigation.navigate("HostSuggestions")}
          activeOpacity={0.75}
        >
          <Text style={styles.toolsLabel}>
            {t("hostSuggestions.entryTitle", "AI buyer suggestions")}
          </Text>
          <CaretRight size={16} color={mp.inkMuted} weight="bold" />
        </TouchableOpacity>
      </View>
    );
  }, [data.length, liveCount, pendingCount, navigation, t]);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <House size={28} color={mp.inkSecondary} weight="duotone" />
        </View>
        <Text style={styles.emptyTitle}>{t("myProperties.emptyTitle")}</Text>
        <Text style={styles.emptySub}>{t("myProperties.emptySubtitle")}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={openHostOnboarding}
          activeOpacity={0.88}
        >
          <Plus size={18} color="#FFFFFF" weight="bold" />
          <Text style={styles.primaryBtnText}>
            {t("myProperties.addProperty")}
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [openHostOnboarding, t],
  );

  if (!user || !accessToken) return <SignUpOrSignInScreen />;

  if (properties.isError) {
    const err = properties.error;
    if (isHostStudioAuthError(err)) {
      logApiError("myProperties.auth", err);
      return (
        <View style={styles.container}>
          <HostStudioAuthPrompt
            variant="session"
            onSignIn={goSignIn}
            title={t("myProperties.sessionExpiredTitle", "Sign in again")}
            subtitle={t(
              "myProperties.sessionExpiredSub",
              "Your session ended. Sign in again to view your rental listings.",
            )}
          />
        </View>
      );
    }
    logApiError("myProperties.screen", err);
    const parsed = parseApiError(err);
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeTop}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("myProperties.title", "My listings")}
            </Text>
          </View>
        </SafeAreaView>
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <CloudSlash size={32} color={mp.inkMuted} weight="duotone" />
            <Text style={styles.errorTitle}>
              {t("myProperties.loadErrorTitle", "Could not load your listings")}
            </Text>
            <Text style={styles.errorSub}>
              {getApiErrorUserMessage(parsed, t)}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.retryBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>
                {t("dashboard.tryAgain", "Try again")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isInitialLoad = properties.isLoading && !properties.data;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {t("myProperties.title", "My listings")}
            </Text>
            <Text style={styles.subtitle}>
              {user?.firstName
                ? t("hostStudio.welcomeUser", "Hi, {{name}}", {
                    name: user.firstName,
                  })
                : t("dashboard.host", "Host")}
              {data.length > 0
                ? ` · ${data.length} ${t("myProperties.rentalCount", "rentals")}`
                : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openHostOnboarding}
            activeOpacity={0.88}
          >
            <Plus size={17} color="#000000" weight="bold" />
            <Text style={styles.addBtnText}>
              {t("myProperties.addProperty", "Add")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isInitialLoad ? (
        <MyPropertiesSkeleton />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={[
            styles.listContent,
            data.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={6}
          windowSize={7}
          initialNumToRender={4}
          refreshControl={
            <RefreshControl
              refreshing={properties.isRefetching && !isInitialLoad}
              onRefresh={onRefresh}
              tintColor={mp.accent}
              colors={[mp.accent]}
            />
          }
        />
      )}

      <HostOnboardingSheet
        sheetRef={hostOnboardingSheetRef}
        modalName="hostOnboardingMyProperties"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mp.page,
  },
  safeTop: {
    backgroundColor: mp.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mp.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 6 : 12,
    paddingBottom: 14,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: mp.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: mp.inkSecondary,
    marginTop: 2,
    fontWeight: "400",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E8E8",
    backgroundColor: "#fff",
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121212",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listHeader: {
    marginBottom: 4,
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 16,
    borderRadius: mp.radiusLg,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: mp.ink,
    letterSpacing: -0.3,
  },
  statLive: {
    color: mp.live,
  },
  statPending: {
    color: mp.pending,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: mp.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: mp.border,
    marginVertical: 6,
  },
  pendingHint: {
    fontSize: 13,
    color: mp.inkSecondary,
    marginHorizontal: 16,
    marginBottom: 12,
    lineHeight: 18,
  },
  toolsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: mp.radius,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
  },
  toolsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: mp.ink,
  },
  emptyWrap: {
    backgroundColor: "#FFF",
    marginHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: mp.ink,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: 14,
    color: mp.inkSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: mp.radius,
    backgroundColor: "#FFF",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
  },
  errorCard: {
    marginHorizontal: 24,
    padding: 28,
    borderRadius: mp.radiusLg,
    backgroundColor: mp.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.border,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: mp.ink,
    textAlign: "center",
    marginTop: 14,
  },
  errorSub: {
    fontSize: 14,
    color: mp.inkSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: mp.accent,
  },
});
