import React, { useMemo, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Image, FlatList } from "react-native";
import { Text } from "@ui-kitten/components";
import { useListInvites, useAcceptInvite, useDeclineInvite } from "../hooks/queries/useExperienceInvites";
import { useUser } from "../hooks/useUser";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export const InvitesScreen = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const { data: invites = [], refetch, isFetching } = useListInvites();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();
  const { user } = useUser();
  const myId = user?.ID;

  const onRefresh = () => { refetch(); };

  const receivedInvites = useMemo(() => invites.filter((i: any) => (i.InviteeUserID ?? i.inviteeUserID) === myId), [invites, myId]);
  const sentInvites = useMemo(() => invites.filter((i: any) => (i.InviterID ?? i.inviterID) === myId), [invites, myId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFB400";
      case "accepted":
        return "#00A699";
      case "declined":
        return "#FF5A5F";
      default:
        return "#767676";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t('invites.status.pending');
      case "accepted":
        return t('invites.status.accepted');
      case "declined":
        return t('invites.status.declined');
      default:
        return status;
    }
  };

  const renderInvite = (invite: any, isReceived: boolean) => (
    <TouchableOpacity key={invite.id} style={styles.inviteItem}>
      <View style={styles.inviteHeader}>
        <View style={styles.userInfo}>
          {isReceived ? (
            <>
              {invite.Inviter?.AvatarURL || invite.inviter?.avatarURL ? (
                <Image source={{ uri: invite.Inviter?.AvatarURL || invite.inviter?.avatarURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={24} color="#999" />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{invite.Inviter?.FirstName || invite.inviter?.firstName || t('invites.inviter')}</Text>
                <Text style={styles.inviteTime}>{invite.createdAt || invite.CreatedAt || ''}</Text>
              </View>
            </>
          ) : (
            <>
              {invite.Invitee?.AvatarURL || invite.invitee?.avatarURL ? (
                <Image source={{ uri: invite.Invitee?.AvatarURL || invite.invitee?.avatarURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={24} color="#999" />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{invite.Invitee?.FirstName || invite.invitee?.firstName || t('invites.guest')}</Text>
                <Text style={styles.inviteTime}>{invite.createdAt || invite.CreatedAt || ''}</Text>
              </View>
            </>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invite.Status || invite.status) }]}>
          <Text style={styles.statusText}>{getStatusText(invite.Status || invite.status)}</Text>
        </View>
      </View>


      {isReceived && (invite.Status === "pending" || invite.status === "pending") && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.declineButton} onPress={() => declineInvite.mutate(invite.ID || invite.id)}>
            <MaterialIcons name="close" size={20} color="#FF5A5F" />
            <Text style={styles.declineText}>{t('invites.decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={() => acceptInvite.mutate(invite.ID || invite.id)}>
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.acceptText}>{t('invites.accept')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const currentInvites = activeTab === 'received' ? receivedInvites : sentInvites;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('inbox.invitations')}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            {t('invites.received')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            {t('invites.sent')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentInvites}
        keyExtractor={(invite: any) => String(invite.id || invite.ID)}
        renderItem={({ item }) => renderInvite(item, activeTab === 'received')}
        contentContainerStyle={styles.content}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
<Image
          source={require('../assets/Profile.jpg')}
          style={{
            width: 50,
            height: 50
          }}
          />
            <Text style={styles.emptyTitle}>
              {activeTab === 'received' ? t('invites.emptyReceivedTitle') : t('invites.emptySentTitle')}
            </Text>
            <Text style={styles.emptyMessage}>
              {activeTab === 'received'
                ? t('invites.emptyReceivedSubtitle')
                : t('invites.emptySentSubtitle')}
            </Text>
          </View>
        )}
        refreshing={isFetching}
        onRefresh={onRefresh}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#00A699",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#767676",
  },
  activeTabText: {
    color: "#00A699",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  inviteItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },
  inviteTime: {
    fontSize: 12,
    color: "#767676",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  propertyInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  propertyImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
  },
  inviteMessage: {
    fontSize: 14,
    color: "#767676",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5A5F",
    gap: 6,
  },
  declineText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5A5F",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#00A699",
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#767676",
    textAlign: "center",
    lineHeight: 24,
  },
});
