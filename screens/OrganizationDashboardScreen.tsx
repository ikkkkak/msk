/**
 * Organization Dashboard Screen
 * Modern Airbnb/TikTok UI - Clean, White Background, Black & White
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { useUser } from "../hooks/useUser";
import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
import { endpoints } from "../constants";
import {
  Buildings,
  Image as ImageIcon,
  UserPlus,
  Users,
  WarningCircle,
  SignOut,
  CaretRight,
  PencilSimple,
} from "phosphor-react-native";
import { InviteCodeModal } from "../components/InviteCodeModal";
import { OrgScreenHeader } from "../components/organization/OrgScreenHeader";
import { OrgSectionTitle } from "../components/organization/OrgSectionTitle";
import { orgTheme as o } from "../components/organization/orgTheme";
import { UpdateRoleModal } from "../components/UpdateRoleModal";


const COLORS = {
  background: o.bg,
  text: o.ink,
  textSecondary: o.body,
  textTertiary: o.muted,
  border: o.line,
  borderLight: o.line,
  cardBackground: o.bg,
  inactive: o.muted,
  accent: o.accent,
  accentSoft: o.accentSoft,
};

export const OrganizationDashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [updateRoleModalVisible, setUpdateRoleModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Patch: Accept either { organization: ... } or org object as root.
  // UX fix: keep previous organization during refetch so the UI never "drops" to
  // the no-org screen for ~1-2 seconds when navigating back.
  const {
    data: organizationData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-organization"],
    queryFn: async () => {
      const response = await axios.get(endpoints.organization, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });

      // Some backends return { organization: {...} }, others return the org object directly.
      if (
        response.data &&
        !response.data.organization &&
        response.data.id &&
        response.data.name
      ) {
        return { organization: response.data };
      }
      return response.data;
    },
    enabled: !!user?.accessToken,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const rawOrganization =
    organizationData &&
    (organizationData.organization ? organizationData.organization : organizationData);

  // Stable organization ref to avoid UI reset when the refetch temporarily yields no data.
  const stableOrganizationRef = useRef<any>(null);
  const rawOrganizationId = Number(rawOrganization?.id);
  const rawOrgValid = Number.isFinite(rawOrganizationId) && rawOrganizationId > 0;

  useEffect(() => {
    if (rawOrgValid) stableOrganizationRef.current = rawOrganization;
  }, [rawOrgValid, rawOrganization?.id]);

  const organization = rawOrgValid ? rawOrganization : stableOrganizationRef.current;
  const organizationId = Number(organization?.id);
  const organizationExists = Number.isFinite(organizationId) && organizationId > 0;

  const daysLeft = organizationData?.days_left || {};

  // Only query members/properties if we have a valid org id (from the stable ref).
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: async () => {
      const response = await axios.get(`${endpoints.organization}/members`, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      return response.data.members || [];
    },
    enabled: !!user?.accessToken && organizationExists,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ["organization-properties", organizationId],
    queryFn: async () => {
      // Use trailing-slash route for list endpoint (matches backend "/api/property-sales/")
      const response = await axios.get(endpoints.propertySalesRoot, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      return response.data.properties;
    },
    enabled: !!user?.accessToken && organizationExists,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // Refetch data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (user?.accessToken && organizationExists) {
        refetch().catch(() => {});
        // Invalidate with the correct query keys so we don't accidentally clear unrelated data.
        queryClient
          .invalidateQueries({ queryKey: ["organization-members", organizationId] })
          .catch(() => {});
        queryClient
          .invalidateQueries({ queryKey: ["organization-properties", organizationId] })
          .catch(() => {});
      }
    }, [
      user?.accessToken,
      organizationExists,
      refetch,
      queryClient,
      organizationId,
    ])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({
        queryKey: ["organization-members", organizationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["organization-properties", organizationId],
      }),
    ]);
    setRefreshing(false);
  };

  const handleCreateProperty = () => {
    if (!organizationExists) {
      Alert.alert(
        t("organization.noOrganization"),
        t("organization.createOrganizationFirst"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("organization.createOrganization"),
            onPress: () => navigation.navigate("CreateOrganization")
          }
        ]
      );
      return;
    }
    navigation.navigate("CreatePropertySale");
  };

  if (!user) return <SignUpOrSignInScreen />;
  const showInitialLoad = isLoading && !organizationExists;

  if (error && !organizationExists) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={styles.centerContainer}>
          <WarningCircle size={48} color={COLORS.textSecondary} />
          <Text style={styles.errorTitle}>
            {t("organization.errorLoading")}
          </Text>
          <Text style={styles.errorMessage}>
            {t("organization.errorMessage")}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.primaryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Only show "no org" screen if we are SURE there is no org (no id)
  if (!organizationExists && !showInitialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={styles.centerContainer}>
          <Buildings size={56} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>
            {t("organization.noOrganization")}
          </Text>
          <Text style={styles.emptyMessage}>
            {t("organization.createOrganizationMessage")}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("CreateOrganization")}
          >
            <Text style={styles.primaryButtonText}>
              {t("organization.createOrganization")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showInitialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <OrgScreenHeader
        title={organization?.name || t("organization.dashboard", "Agency")}
        onBack={() => navigation.goBack()}
        onEdit={() =>
          (navigation as any).navigate("EditOrganization", {
            organization,
            daysLeft,
          })
        }
        editLabel={t("common.edit", "Edit")}
        syncing={isFetching && !isLoading}
      />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.bannerContainer}>
          {organization.banner_image ? (
            <Image
              source={{ uri: organization.banner_image }}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <ImageIcon size={32} color={COLORS.textTertiary} />
            </View>
          )}
          <View style={styles.bannerAvatarsContainer}>
            <StackedAvatars members={members || []} maxVisible={3} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{members?.length || 0}</Text>
            <Text style={styles.statLabel}>
              {t("organization.members", "Members")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{properties?.length || 0}</Text>
            <Text style={styles.statLabel}>
              {t("organization.properties", "Listings")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue} numberOfLines={1}>
              {organization.business_type
                ? t(
                    `organization.businessTypes.${organization.business_type}`,
                    organization.business_type,
                  )
                : "—"}
            </Text>
            <Text style={styles.statLabel}>
              {t("organization.businessType", "Type")}
            </Text>
          </View>
        </View>

        {organization.description ? (
          <View style={styles.section}>
            <OrgSectionTitle
              title={t("organization.about", "About")}
              subtitle={
                daysLeft?.description === 0
                  ? undefined
                  : t("organization.aboutLocked", "Contact support to edit")
              }
            />
            <Text style={styles.descriptionText}>
              {organization.description}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.teamHeaderRow}>
            <OrgSectionTitle
              title={t("organization.team", "Team")}
              subtitle={t("organization.membersCount", "{{count}} members", {
                count: members?.length || 0,
              })}
            />
            {organization?.owner_id === user?.ID ? (
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => setInviteModalVisible(true)}
                activeOpacity={0.7}
              >
                <UserPlus size={16} color={COLORS.accent} weight="bold" />
                <Text style={styles.inviteButtonText}>
                  {t("organization.invite.button", "Invite")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {membersLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={COLORS.text} />
            </View>
          ) : members && members.length > 0 ? (
            <View style={styles.membersList}>
              {members.slice(0, 5).map((member: any) => {
                const isCurrentUserOwner =
                  organization?.owner_id === user?.ID ||
                  member.is_owner === true;
                const currentUserMember = members.find(
                  (m: any) => m.user_id === user?.ID
                );
                const currentUserIsAdmin =
                  currentUserMember?.role === "admin" || isCurrentUserOwner;
                const isCurrentUser = member.user_id === user?.ID;
                const isOwnerMember = member.is_owner === true;
                const canEditThisMember =
                  isCurrentUserOwner && !isCurrentUser && !isOwnerMember;

                return (
                  <TouchableOpacity
                    key={member.id || `owner-${member.user_id}`}
                    style={styles.memberCard}
                    onPress={() => {
                      if (canEditThisMember) {
                        setSelectedMember(member);
                        setUpdateRoleModalVisible(true);
                      }
                    }}
                    disabled={!canEditThisMember}
                    activeOpacity={canEditThisMember ? 0.7 : 1}
                  >
                    <View style={styles.memberAvatar}>
                      {member.user?.avatarURL ? (
                        <Image
                          source={{ uri: member.user.avatarURL }}
                          style={styles.memberAvatarImage}
                        />
                      ) : (
                        <Text style={styles.memberAvatarText}>
                          {member.user?.firstName?.[0]}
                          {member.user?.lastName?.[0]}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberInfoRow}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {member.user?.firstName} {member.user?.lastName}
                        </Text>
                        {isOwnerMember && (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>
                              {t("organization.join.owner", "Owner")}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {member.user?.email}
                      </Text>
                    </View>
                    <View style={styles.memberActions}>
                      <Text style={styles.memberRole}>
                        {t(`organization.roles.${member.role || "viewer"}`)}
                      </Text>
                      {canEditThisMember ? (
                        <TouchableOpacity
                          style={styles.editRoleButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedMember(member);
                            setUpdateRoleModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <PencilSimple
                            size={14}
                            color={COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {members.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>
                    {t("organization.viewAllMembers", "View all {{count}}", {
                      count: members.length,
                    })}
                  </Text>
                  <CaretRight size={16} color={COLORS.text} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <Users size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyStateTitle}>
                {t("organization.team.emptyTitle", "No team members yet")}
              </Text>
              <Text style={styles.emptyStateMessage}>
                {t(
                  "organization.team.emptyMessage",
                  "Invite team members to collaborate",
                )}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setInviteModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyStateButtonText}>
                  {t("organization.invite.title", "Invite Member")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Leave Agency Button */}
        {organization && organization.owner_id !== user?.ID && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.leaveAgencyButton}
              onPress={() => {
                (navigation as any).navigate("LeaveAgency", { organization });
              }}
              activeOpacity={0.8}
            >
              <SignOut size={16} color={COLORS.textSecondary} />
              <Text style={styles.leaveAgencyButtonText}>
                {t("organization.leave.button", "Leave Agency")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <InviteCodeModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />

      {updateRoleModalVisible && (
        <UpdateRoleModal
          visible={updateRoleModalVisible}
          onClose={() => {
            setUpdateRoleModalVisible(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["organization-members", organizationId],
            });
          }}
        />
      )}
    </SafeAreaView>
  );
};

// Stacked Avatars Component
interface StackedAvatarsProps {
  members: any[];
  maxVisible?: number;
}

const StackedAvatars: React.FC<StackedAvatarsProps> = ({
  members,
  maxVisible = 3
}) => {
  if (!members || members.length === 0) return null;

  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);

  const getInitials = (member: any) => {
    const firstName = member.user?.firstName || "";
    const lastName = member.user?.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  return (
    <View style={styles.stackedAvatarsContainer}>
      {visibleMembers.map((member, index) => (
        <View
          key={member.id || `member-${member.user_id}`}
          style={[
            styles.stackedAvatar,
            { marginLeft: index > 0 ? -8 : 0, zIndex: maxVisible - index }
          ]}
        >
          {member.user?.avatarURL ? (
            <Image
              source={{ uri: member.user.avatarURL }}
              style={styles.stackedAvatarImage}
            />
          ) : (
            <View style={styles.stackedAvatarPlaceholder}>
              <Text style={styles.stackedAvatarText}>
                {getInitials(member)}
              </Text>
            </View>
          )}
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.stackedAvatar,
            styles.stackedAvatarMore,
            { marginLeft: -8, zIndex: 0 }
          ]}
        >
          <Text style={styles.stackedAvatarMoreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 32
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: COLORS.border,
  },
  teamHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  // Banner
  bannerContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: COLORS.borderLight
  },
  banner: {
    width: "100%",
    height: "100%"
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderLight
  },
  bannerAvatarsContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 24
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "400"
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22
  },
  // Team
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 28,
    marginRight: 0,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.accent,
  },
  membersList: {
    gap: 12
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 12
  },
  memberAvatarImage: {
    width: "100%",
    height: "100%"
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.background
  },
  memberInfo: {
    flex: 1,
    marginRight: 12
  },
  memberInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text
  },
  ownerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.text
  },
  memberEmail: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  memberRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500"
  },
  editRoleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center"
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 4,
    gap: 6
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600"
  },
  // Stacked Avatars
  stackedAvatarsContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  stackedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.background,
    overflow: "hidden",
    backgroundColor: COLORS.borderLight
  },
  stackedAvatarImage: {
    width: "100%",
    height: "100%"
  },
  stackedAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.text
  },
  stackedAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.background
  },
  stackedAvatarMore: {
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center"
  },
  stackedAvatarMoreText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.background
  },
  // Empty States
  loadingState: {
    paddingVertical: 32,
    alignItems: "center"
  },
  emptyStateCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: "dashed"
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  emptyStateMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20
  },
  emptyStateButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.background
  },
  // Leave Agency
  leaveAgencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  leaveAgencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text
  },
  // Error & Empty States
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.3
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.background
  },
  bottomSpacing: {
    height: 24
  }
});

export default OrganizationDashboardScreen;
