import React, { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Text } from "@ui-kitten/components";
import {
  Bell,
  ChatCircle,
  UserPlus,
  UsersThreeIcon,
  UserCheck,
} from "phosphor-react-native";
import {
  useNavigation,
  useRoute,
  useIsFocused,
} from "@react-navigation/native";
import axios from "axios";
import { endpoints } from "../constants";

import { NotificationsScreen } from "./NotificationsScreen";
import { MessagesScreen } from "./MessagesScreen";
import { InvitesScreen } from "./InvitesScreen";
import { useTranslation } from "react-i18next";
import { JoinGroupModal } from "../components/JoinGroupModal";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";
import StoriesInbox, { StoryInboxItem } from "../components/StoriesInbox";
import { StoryClip } from "../components/StoryViewer";
import { useStoryViewer } from "../contexts/StoryViewerContext";
import { useUser } from "../hooks/useUser";
import { useHostMode } from "../contexts/HostModeContext";
// import HostSuggestionsScreen from "./HostSuggestionsScreen";

const { width } = Dimensions.get("window");

export const InboxScreen = () => {
  // Default to "messages"
  const [activeTab, setActiveTab] = useState<
    "messages" | "invites" // | "suggestions"
  >("messages");
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { unreadCount } = useUnreadMessageCount();
  const isFocused = useIsFocused();
  const { user } = useUser();
  const { isHostMode } = useHostMode();
  /*
  // Suggestions tab disabled
  const canSeeSuggestionsTab =
    isHostMode ||
    !!user?.ID ||
    ["host", "admin", "super_admin"].includes(
      String(user?.role || "").toLowerCase(),
    );
  const hasThreeTabs = canSeeSuggestionsTab;
  const [suggestionsUnreadCount, setSuggestionsUnreadCount] = useState(0);
  */
  // When suggestions tab is commented, always just two tabs:
  const canSeeSuggestionsTab = false;
  const hasThreeTabs = false;
  // const [suggestionsUnreadCount, setSuggestionsUnreadCount] = useState(0);

  const markStoryAsSeen = useCallback((storyUserId: number) => {
    setStoriesInbox((prev) =>
      prev.map((item) =>
        item.userId === storyUserId ? { ...item, hasUnseen: false } : item,
      ),
    );
  }, []);

  // Stories Inbox state and handlers
  const [storiesInbox, setStoriesInbox] = useState<StoryInboxItem[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  /** After first successful load, refetches stay silent (no full-row skeleton → no tab jump). */
  const storiesReadyRef = useRef(false);
  const storiesUserIdRef = useRef<number | undefined>(undefined);
  const { openViewer } = useStoryViewer();

  // Auto-select messages tab if opened from reservation confirmation
  useEffect(() => {
    const params = route.params as any;
    if (params?.openMessagesTab) {
      setActiveTab("messages");
    }
  }, [route.params]);

  const renderContent = () => {
    if (activeTab === "messages") return <MessagesScreen />;
    // if (activeTab === "suggestions") return <HostSuggestionsScreen />;
    return <InvitesScreen />;
  };

  // Commented out suggestions unread count polling effect
  /*
  useEffect(() => {
    if (!user?.accessToken || !canSeeSuggestionsTab) {
      setSuggestionsUnreadCount(0);
      return;
    }
    let cancelled = false;
    const root = endpoints.baseURL.replace(/\/+$/, "");
    const candidates = root.endsWith("/api")
      ? [`${root}/host/suggestions/pending-count`, `${root.replace(/\/api$/, "")}/host/suggestions/pending-count`]
      : [`${root}/api/host/suggestions/pending-count`, `${root}/host/suggestions/pending-count`];

    const fetchCount = async () => {
      for (const url of candidates) {
        try {
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            timeout: 15000
          });
          const c = Number(res?.data?.pending_count ?? 0);
          if (!cancelled) setSuggestionsUnreadCount(Number.isFinite(c) ? c : 0);
          return;
        } catch (e: any) {
          if (e?.response?.status !== 404) break;
        }
      }
    };

    if (isFocused) {
      fetchCount();
    }
    const id = setInterval(() => {
      if (isFocused) fetchCount();
    }, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.accessToken, canSeeSuggestionsTab, isFocused]);
  */

  // Fetch Stories Inbox — public; auth optional (for unseen flags)
  useEffect(() => {
    if (user?.ID != null && storiesUserIdRef.current !== user.ID) {
      storiesUserIdRef.current = user.ID;
      storiesReadyRef.current = false;
      setStoriesInbox([]);
    }

    let cancelled = false;
    const fetchInbox = async () => {
      const showSkeleton = !storiesReadyRef.current;
      if (showSkeleton) {
        setStoriesLoading(true);
      }
      try {
        const headers: Record<string, string> = {};
        if (user?.accessToken) {
          headers.Authorization = `Bearer ${user.accessToken}`;
        }
        const res = await axios.get(`${endpoints.baseURL}/stories/inbox`, {
          headers,
          timeout: 15000,
        });
        if (!cancelled) {
          const list = (res.data?.inbox || []).map((it: any) => ({
            userId: it.user_id,
            username: it.username,
            avatarURL: it.avatar_url,
            hasUnseen: !!it.has_unseen,
            firstThumb: it.first_thumb || it.thumb_url,
            isVideo: it.is_video || it.first_type === "video",
          })) as StoryInboxItem[];
          setStoriesInbox(list);
          storiesReadyRef.current = true;
        }
      } catch {
        if (!cancelled && !storiesReadyRef.current) {
          setStoriesInbox([]);
          storiesReadyRef.current = true;
        }
      } finally {
        if (!cancelled) {
          setStoriesLoading(false);
        }
      }
    };

    if (isFocused) {
      fetchInbox();
    }
    return () => {
      cancelled = true;
    };
  }, [user?.accessToken, user?.ID, isFocused]);

  const handleOpenUserStories = async (
    userId: number,
    origin?: { x: number; y: number; size: number },
  ) => {
    const meta = storiesInbox.find((s) => s.userId === userId);
    const defaultOrigin = origin || { x: 80, y: 100, size: 64 };

    try {
      const res = await axios.get(`${endpoints.baseURL}/stories/${userId}`, {
        timeout: 15000,
      });
      const clips = (res.data?.stories || []).map((s: any) => ({
        id: s.id,
        type: s.type || "image",
        mediaURL: s.media_url,
        thumbURL: s.thumb_url,
        durationSeconds: s.duration_seconds || 5,
        caption: s.caption,
      })) as StoryClip[];

      if (clips.length === 0) {
        console.warn("[InboxScreen] No stories found for user:", userId);
        return;
      }

      openViewer({
        username: meta?.username || "Story",
        avatarURL: meta?.avatarURL || meta?.firstThumb || "",
        clips,
        origin: defaultOrigin,
        onViewed: () => markStoryAsSeen(userId),
      });
    } catch (e) {
      console.warn("[InboxScreen] Failed to fetch stories:", e);
    }
  };

  const showStoriesStrip =
    storiesLoading || (storiesInbox && storiesInbox.length > 0);

  // Modern Airbnb-like tab item with pill design and subtle shadow
  const TabButton = ({
    isActive,
    icon,
    label,
    onPress,
    unreadCount,
    testID,
    compact = false,
  }: {
    isActive: boolean;
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    unreadCount?: number;
    testID?: string;
    compact?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#f2f2f2", borderless: true }}
      style={({ pressed }) => [
        styles.tabPill,
        compact && styles.tabPillCompact,
        isActive && styles.tabPillActive,
        pressed && { opacity: 0.6 },
      ]}
      testID={testID}
    >
      <View style={styles.pillContent}>
        {icon}
        <Text
          style={[
            styles.pillLabel,
            compact && styles.pillLabelCompact,
            isActive && styles.pillLabelActive,
          ]}
        >
          {label}
        </Text>
        {typeof unreadCount === "number" && unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          marginTop: Platform.OS === "ios" ? "13%" : 28,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("inbox.title")}</Text>
          {/* <View style={styles.headerActions}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setShowJoinGroupModal(true)}>
              <UserPlus size={18} color="#222222" weight="duotone" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => (navigation as any).navigate('MyGroups')}>
              <UsersThreeIcon size={18} color="#222222" weight="duotone" />
              <Text style={styles.linkText}>{t('inbox.myGroups')}</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Stories row: fixed layout slot avoids tabs jumping when skeleton ↔ list ↔ empty */}
        <View
          style={[
            styles.storiesContainer,
            !showStoriesStrip && styles.storiesContainerCollapsed,
          ]}
        >
          <StoriesInbox
            data={storiesInbox}
            onOpenUserStories={handleOpenUserStories}
            loading={storiesLoading}
          />
        </View>

        {/* Modern Tabs - like Airbnb (above scroll content; stable z-index vs stories) */}
        <View style={styles.tabsRowOuter}>
          <View
            style={[
              styles.tabsRowInner,
              hasThreeTabs && styles.tabsRowInnerCompact,
            ]}
          >
            <TabButton
              isActive={activeTab === "messages"}
              icon={
                <ChatCircle
                  size={18}
                  color={activeTab === "messages" ? "#222" : "#AAA"}
                  weight={activeTab === "messages" ? "fill" : "duotone"}
                />
              }
              label={t("inbox.messages")}
              onPress={() => setActiveTab("messages")}
              unreadCount={unreadCount}
              testID="TabMessages"
              compact={hasThreeTabs}
            />
            <TabButton
              isActive={activeTab === "invites"}
              icon={
                <UserPlus
                  size={18}
                  color={activeTab === "invites" ? "#222" : "#AAA"}
                  weight={activeTab === "invites" ? "fill" : "duotone"}
                  style={{ marginRight: 1 }}
                />
              }
              label={t("inbox.invitations")}
              onPress={() => setActiveTab("invites")}
              testID="TabInvites"
              compact={hasThreeTabs}
            />
            {/* {canSeeSuggestionsTab && (
              <TabButton
                isActive={activeTab === "suggestions"}
                icon={
                  <UserCheck
                    size={18}
                    color={activeTab === "suggestions" ? "#222" : "#AAA"}
                    weight={activeTab === "suggestions" ? "fill" : "duotone"}
                  />
                }
                label={t("inbox.suggestions", "Suggestions")}
                onPress={() => setActiveTab("suggestions")}
                unreadCount={suggestionsUnreadCount}
                testID="TabSuggestions"
                compact={hasThreeTabs}
              />
            )} */}
          </View>
        </View>

        <View style={styles.content}>{renderContent()}</View>

        <JoinGroupModal
          visible={showJoinGroupModal}
          onClose={() => setShowJoinGroupModal(false)}
          onSuccess={() => {
            setShowJoinGroupModal(false);
            (navigation as any).navigate("MyGroups");
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
  },
  headerActions: { flexDirection: "row", gap: 8 },
  linkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  linkText: { color: "#222", fontWeight: "500", fontSize: 11 },

  // Modern Airbnb tabs
  tabsRowOuter: {
    paddingHorizontal: 0,
    paddingVertical: 13,
    backgroundColor: "#FFF",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F7F7F7",
    zIndex: 2,
  },
  tabsRowInner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 40,
    padding: 3,
    alignSelf: "center",
    minWidth: 180,
    marginTop: 0,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  tabsRowInnerCompact: {
    gap: 4,
    padding: 2,
  },
  tabPill: {
    height: 36,
    borderRadius: 20,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64,
    flexDirection: "row",
    marginVertical: 0,
    shadowColor: "transparent", // No shadow by default
    position: "relative",
  },
  tabPillCompact: {
    height: 32,
    minWidth: 52,
    paddingHorizontal: 8,
  },
  tabPillActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8A8A8A",
    marginLeft: 7,
    letterSpacing: 0.1,
    paddingTop: Platform.select({ ios: 1, android: 0 }),
  },
  pillLabelCompact: {
    fontSize: 12.5,
    marginLeft: 5,
  },
  pillLabelActive: {
    color: "#222",
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF385C",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: -15,
    top: -8,
    borderWidth: 1.5,
    borderColor: "#FFF",
    paddingHorizontal: 4,
    zIndex: 10,
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },

  content: {
    flex: 1,
  },
  storiesContainer: {
    paddingBottom: 6,
    marginTop: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    zIndex: 0,
  },
  storiesContainerCollapsed: {
    paddingBottom: 0,
    marginTop: 0,
    borderBottomWidth: 0,
    minHeight: 0,
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#717171",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyCtas: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  primaryCta: {
    backgroundColor: "#222222",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryCta: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryCtaText: {
    color: "#222222",
    fontWeight: "700",
  },
});
