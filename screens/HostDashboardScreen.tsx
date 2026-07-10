import React, { useCallback, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";

import { Plus, Buildings, Upload, Users, Sparkle } from "phosphor-react-native";
import {
  useGuideUnreadCount,
  GUIDE_GROUPED_KEY,
  GUIDE_PREVIEWS_KEY,
} from "../hooks/queries/useMeskenyGuide";
import { useQueryClient } from "@tanstack/react-query";

import { useNavigation } from "@react-navigation/native";

import { useTranslation } from "react-i18next";

import { useUser } from "../hooks/useUser";

import { tokenStorage } from "../services/tokenStorage";

import { studio } from "../components/host-studio/studioTheme";

import type { StudioRangeDays } from "../components/host-studio/studioTrendUtils";

import {
  isHostStudioAuthError,
  getHostStudioErrorMessage,
  type HostStudioListing,
  type HostStudioVideo
} from "../hooks/queries/useHostStudioQuery";

import { useHostStudioLive } from "../hooks/queries/useHostStudioLive";

import { countHostStudioListingsByKind } from "../hooks/queries/hostStudioCounts";

import { HostStudioAuthPrompt } from "../components/host-studio/HostStudioAuthPrompt";

import { HostStudioDashboardSkeleton } from "../components/host-studio/HostStudioDashboardSkeleton";

import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";

import { HostStudioOverviewPanel } from "../components/host-studio/HostStudioOverviewPanel";
import { HostStudioInsightsPlain } from "../components/host-studio/HostStudioInsightsPlain";
import { HostDashboardPropertiesFooter } from "../components/host-studio/HostDashboardPropertiesFooter";

import { HostStudioMainTabs } from "../components/host-studio/HostStudioMainTabs";

import type { HostStudioMainTab } from "../components/host-studio/HostStudioMainTabs";

import {
  HostStudioPropertyKindTabs,
  type HostStudioPropertyKind
} from "../components/host-studio/HostStudioPropertyKindTabs";

import { HostStudioPropertiesList } from "../components/host-studio/HostStudioPropertiesList";

import { HostStudioVideosPanel } from "../components/host-studio/HostStudioVideosPanel";

import { HostStudioAiPromoSection } from "../components/host-studio/HostStudioAiPromoSection";

import { HostBrokerVerificationCard } from "../components/broker/HostBrokerVerificationCard";
import { GuideFeaturedTipBanner } from "../components/guide/GuideFeaturedTipBanner";

export const HostDashboardScreen: React.FC = () => {
  const navigation = useNavigation();

  const { user } = useUser();
  const queryClient = useQueryClient();

  const { t } = useTranslation();

  const [range, setRange] = useState<StudioRangeDays>(7);

  const [mainTab, setMainTab] = useState<HostStudioMainTab>("overview");

  const [propertyKind, setPropertyKind] =
    useState<HostStudioPropertyKind>("rent");

  const accessToken = user?.accessToken || tokenStorage.getAccess();

  const canLoadStudio = Boolean(user?.ID && accessToken);
  const { data: guideUnread = 0 } = useGuideUnreadCount(canLoadStudio);

  const {
    studio: studioData,

    showInitialSkeleton,

    showBlockingError,

    isSyncing,

    isRefetching,

    refetch,

    error
  } = useHostStudioLive(canLoadStudio);

  const goSignIn = useCallback(() => {
    (navigation as any).navigate("UnifiedAuth");
  }, [navigation]);

  const onRefresh = useCallback(() => {
    void refetch();
    queryClient.invalidateQueries({ queryKey: GUIDE_GROUPED_KEY });
    queryClient.invalidateQueries({ queryKey: GUIDE_PREVIEWS_KEY });
  }, [refetch, queryClient]);

  const openListing = useCallback(
    (listing: HostStudioListing) => {
      (navigation as any).navigate("HostListingStudio", { listing });
    },
    [navigation],
  );

  const openVideo = useCallback(
    (video: HostStudioVideo) => {
      if (video.kind === "rent" && video.property_id) {
        (navigation as any).navigate("PropertyDetails", {
          propertyID: video.property_id
        });

        return;
      }

      if (video.kind === "sale" && video.property_sale_id) {
        (navigation as any).navigate("PropertySaleDetails", {
          propertyId: video.property_sale_id
        });
      }
    },

    [navigation]
  );

  const listings = studioData?.listings ?? [];

  const guideSaleTitleById = useMemo(() => {
    const map = new Map<number, string>();
    for (const listing of listings) {
      if (listing.kind === "sale" && listing.id > 0 && listing.title) {
        map.set(listing.id, listing.title);
      }
    }
    return map;
  }, [listings]);

  const videos = studioData?.videos ?? [];

  const { rent: rentCount, sale: buyCount } = useMemo(
    () => countHostStudioListingsByKind(studioData?.listings),

    [studioData?.listings]
  );

  const openAddWithAi = useCallback(() => {
    Alert.alert(
      t("listingAi.promoTitle", { defaultValue: "Add with AI" }),

      t("myProperties.choosePropertyType", {
        defaultValue: "What would you like to list?"
      }),

      [
        {
          text: t("myProperties.rentalProperty", { defaultValue: "Rental" }),

          onPress: () => (navigation as any).navigate("AddProperty")
        },

        {
          text: t("myProperties.saleProperty", {
            defaultValue: "Property for sale"
          }),

          onPress: () => (navigation as any).navigate("CreatePropertySale")
        },

        {
          text: t("common.cancel", { defaultValue: "Cancel" }),

          style: "cancel"
        }
      ]
    );
  }, [navigation, t]);

  if (!user || !accessToken) {
    return <SignUpOrSignInScreen />;
  }

  const authError = Boolean(error && isHostStudioAuthError(error));

  const hasStudio = studioData != null;

  const showAiPromo =
    hasStudio && !authError && !showBlockingError && listings.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>
              {t("hostStudio.brand", "Host Studio")}
            </Text>

            {isSyncing ? (
              <View style={styles.syncRow}>
                <ActivityIndicator size="small" color={studio.muted} />

                <Text style={styles.syncText}>
                  {t("hostStudio.syncing", "Updating…")}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => (navigation as any).navigate("AddProperty")}
            activeOpacity={0.85}
          >
            <Plus size={18} color={studio.ink} weight="bold" />

            <Text style={styles.uploadText}>
              {t("hostStudio.upload", "Upload")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.welcome}>
          {user?.firstName
            ? t("hostStudio.welcomeUser", "Hi, {{name}}", {
                name: user.firstName
              })
            : t("dashboard.host", "Host")}
        </Text>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !showInitialSkeleton}
            onRefresh={onRefresh}
            tintColor={studio.ink}
          />
        }
      >
        {hasStudio && !authError ? (
          <GuideFeaturedTipBanner
            titleBySaleId={guideSaleTitleById}
            enabled={canLoadStudio}
          />
        ) : null}

        {showAiPromo ? (
          <HostStudioAiPromoSection onPress={openAddWithAi} />
        ) : null}

        <View style={{ marginHorizontal: 16 }}>
          {hasStudio && !authError ? (
            <HostBrokerVerificationCard
              data={studioData.broker_verification}
              onPress={() => (navigation as any).navigate("BrokerVerification")}
            />
          ) : null}
        </View>

        {showInitialSkeleton ? (
          <HostStudioDashboardSkeleton />
        ) : authError ? (
          <HostStudioAuthPrompt variant="session" onSignIn={goSignIn} />
        ) : showBlockingError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {t("hostStudio.loadError", "Could not load your stats")}
            </Text>

            <Text style={styles.emptySub}>
              {getHostStudioErrorMessage(error, t)}
            </Text>

            <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>
                {t("dashboard.tryAgain", "Try again")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : hasStudio ? (
          <>
            <HostStudioMainTabs value={mainTab} onChange={setMainTab} />

            {mainTab === "overview" ? (
              <>
                <HostStudioOverviewPanel
                  summary={studioData.summary}
                  range={range}
                  onRangeChange={setRange}
                />
                <HostStudioInsightsPlain
                  pendingReservations={studioData.summary?.pending_reservations}
                />
              </>
            ) : mainTab === "videos" ? (
              <HostStudioVideosPanel
                videos={videos}
                videoSummary={studioData.video_summary}
                onPressVideo={openVideo}
              />
            ) : (
              <>
                <HostStudioPropertyKindTabs
                  value={propertyKind}
                  onChange={setPropertyKind}
                  rentCount={rentCount}
                  buyCount={buyCount}
                />

                <HostStudioPropertiesList
                  listings={listings}
                  kind={propertyKind}
                  onPressListing={openListing}
                />
              </>
            )}
          </>
        ) : null}

        {hasStudio && !authError && !showBlockingError ? (
          <HostDashboardPropertiesFooter
            listings={listings}
            onPressListing={openListing}
          />
        ) : null}

        <View style={styles.toolsSection}>
          <Text style={styles.toolsLabel}>
            {t("hostStudio.quickTools", "Quick tools")}
          </Text>

          <View style={styles.toolsRow}>
            <ToolChip
              icon={<Buildings size={22} color={studio.ink} />}
              label={t("dashboard.myListings", "Listings")}
              onPress={() => (navigation as any).navigate("MyProperties")}
            />

            <ToolChip
              icon={<Upload size={22} color={studio.ink} />}
              label={t("dashboard.uploadVideo", "Video")}
              onPress={() => (navigation as any).navigate("VideoUpload")}
            />

            <ToolChip
              icon={<Users size={22} color={studio.ink} />}
              label={t("hostSuggestions.quickAction", "Matches")}
              onPress={() => (navigation as any).navigate("HostSuggestions")}
            />

            <ToolChip
              icon={<Sparkle size={22} color={studio.ink} weight="fill" />}
              label={
                guideUnread > 0
                  ? `${t("meskenyGuide.feedTitle", "My Guide")} (${guideUnread})`
                  : t("meskenyGuide.feedTitle", "My Guide")
              }
              onPress={() => (navigation as any).navigate("MyGuideFeed")}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

function ToolChip({
  icon,

  label,

  onPress
}: {
  icon: React.ReactNode;

  label: string;

  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.toolChip}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}

      <Text style={styles.toolLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: studio.bg
  },

  safeTop: {
    backgroundColor: studio.bg
  },

  header: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    paddingHorizontal: 16,

    paddingTop: Platform.OS === "ios" ? 8 : 12
  },

  headerLeft: {
    flex: 1,

    gap: 4,

    paddingRight: 12
  },

  brand: {
    fontSize: 20,

    fontWeight: "700",

    color: studio.ink,

    letterSpacing: -0.3
  },

  syncRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6
  },

  syncText: {
    fontSize: 12,

    color: studio.muted,

    fontWeight: "500"
  },

  uploadBtn: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: studio.border,

    backgroundColor: studio.bg
  },

  uploadText: {
    fontSize: 14,

    fontWeight: "600",

    color: studio.ink
  },

  welcome: {
    fontSize: 14,

    color: studio.muted,

    paddingHorizontal: 16,

    paddingBottom: 8,

    marginTop: 4
  },

  scroll: {
    flex: 1
  },

  scrollContent: {
    paddingBottom: 40
  },

  empty: {
    marginHorizontal: 16,

    padding: 28,

    borderRadius: 12,

    backgroundColor: studio.surface,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: studio.border,

    alignItems: "center"
  },

  emptyTitle: {
    fontSize: 15,

    fontWeight: "600",

    color: studio.ink
  },

  emptySub: {
    fontSize: 13,

    color: studio.muted,

    textAlign: "center",

    marginTop: 6,

    lineHeight: 18
  },

  retryBtn: {
    marginTop: 14,

    paddingHorizontal: 16,

    paddingVertical: 8
  },

  retryText: {
    fontSize: 14,

    fontWeight: "600",

    color: studio.trend
  },

  toolsSection: {
    marginTop: 24,

    paddingHorizontal: 16
  },

  toolsLabel: {
    fontSize: 14,

    fontWeight: "600",

    color: studio.inkSecondary,

    marginBottom: 12
  },

  toolsRow: {
    flexDirection: "row",

    gap: 10
  },

  toolChip: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: studio.surface,

    borderRadius: 12,

    paddingVertical: 16,

    paddingHorizontal: 8,

    gap: 8,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: studio.border
  },

  toolLabel: {
    fontSize: 11,

    fontWeight: "500",

    color: studio.inkSecondary,

    textAlign: "center"
  }
});
