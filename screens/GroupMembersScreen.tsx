import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useExperienceParticipants, useMyGroups, useUpdateGroup, useDeleteGroup, useUpdateMemberRole, useRemoveMember, useGroupMembers } from '../hooks/queries/useExperienceInvites';
import { useGroupJoinRequests, useRespondToJoinRequest } from '../hooks/queries/useGroupDiscovery';
import { useUser } from '../hooks/useUser';
import { pickImageNative } from '../utils/nativePhotoPicker';
import { cloudinary } from '../constants';
import { ArrowLeftIcon, DotsThreeVertical } from 'phosphor-react-native';
import { BottomSheet } from '../components/BottomSheet';

export const GroupMembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId, groupId, showJoinRequests } = route.params as { 
    experienceId: number; 
    groupId: number; 
    showJoinRequests?: boolean;
  };
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: myGroups = [] } = useMyGroups();
  const { user } = useUser();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const currentGroup = myGroups.find((g: any) => (g.id || g.ID) === groupId);
  const ownerId = (myGroups.find((g: any) => (g.id || g.ID) === groupId)?.ownerID)
    || (myGroups.find((g: any) => (g.ID || g.id) === groupId)?.OwnerID)
    || user?.ID;
  const isOwner = ownerId === user?.ID;
  const updateRole = useUpdateMemberRole(groupId);
  const removeMember = useRemoveMember(groupId);
  const { data: joinRequests = [] } = useGroupJoinRequests(groupId);
  const respondToJoinRequest = useRespondToJoinRequest();
  const { t } = useTranslation();

  const [showEditSheet, setShowEditSheet] = React.useState(false);
  const [editName, setEditName] = React.useState(String(currentGroup?.name || currentGroup?.Name || ''));
  const [editPhoto, setEditPhoto] = React.useState(String(currentGroup?.photoURL || currentGroup?.PhotoURL || ''));
  const [editPrivacy, setEditPrivacy] = React.useState<'public' | 'private'>((currentGroup?.privacy || currentGroup?.Privacy) === 'private' ? 'private' : 'public');
  const [tempHeaderPhoto, setTempHeaderPhoto] = React.useState<string | undefined>(currentGroup?.photoURL || currentGroup?.PhotoURL);
  const [uploading, setUploading] = React.useState(false);
  const [showMemberSheet, setShowMemberSheet] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<{ id: number; name: string; role?: string } | null>(null);
  const [showJoinRequestsSheet, setShowJoinRequestsSheet] = React.useState(false);
  const [selectedJoinRequest, setSelectedJoinRequest] = React.useState<any>(null);

  // Auto-open join requests modal if showJoinRequests parameter is true
  useEffect(() => {
    if (showJoinRequests && joinRequests.length > 0) {
      setShowJoinRequestsSheet(true);
    }
  }, [showJoinRequests, joinRequests.length]);

  const handleJoinRequest = (action: 'accept' | 'decline', requestId: number) => {
    respondToJoinRequest.mutate(
      { requestId, action },
      {
        onSuccess: () => {
          Alert.alert(
            'Success',
            `Join request ${action === 'accept' ? 'accepted' : 'declined'} successfully`
          );
          setShowJoinRequestsSheet(false);
          setSelectedJoinRequest(null);
        },
        onError: () => {
          Alert.alert('Error', `Failed to ${action} join request`);
        },
      }
    );
  };

  const pickGroupPhoto = async () => {
    try {
      // Use native picker - no permissions needed
      const res = await pickImageNative({ quality: 0.8 });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset.uri) return;
      setUploading(true);
      const form = new FormData();
      form.append('file', {
        uri: asset.uri as any,
        name: 'group.jpg',
        type: 'image/jpeg',
      } as any);
      form.append('upload_preset', cloudinary.uploadPreset);
      const uploadRes = await fetch(cloudinary.uploadUrl('image'), { method: 'POST', body: form } as any);
      const json = await uploadRes.json();
      if (json?.secure_url) {
        setEditPhoto(json.secure_url);
        setTempHeaderPhoto(json.secure_url);
        try {
          const saved = await updateGroup.mutateAsync({ groupId, data: { photoURL: json.secure_url } });
          // eslint-disable-next-line no-console
          console.log('[GROUP] photo saved', saved?.photoURL || json.secure_url);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('[GROUP] photo save failed', err);
          Alert.alert('Save failed', 'Could not save the new photo to the group.');
        }
      } else {
        Alert.alert('Upload failed', 'Could not upload image.');
      }
    } catch (e) {
      Alert.alert('Upload error', 'Unexpected error while selecting or uploading photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* REAL HEAER */}
      <View style={styles.realHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={24} color="#222222" weight="duotone" />
        </TouchableOpacity>
          <Text style={styles.backBtnText}>{t('groups.members.back', 'Back')}</Text>

      </View>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Image source={{ uri: tempHeaderPhoto || currentGroup?.photoURL || currentGroup?.PhotoURL || 'https://via.placeholder.com/80x80?text=Group' }} style={styles.groupPhoto} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>{currentGroup?.name || currentGroup?.Name || 'Group'}</Text>
            <Text style={styles.subtitle}>
              {joinRequests.length > 0 
                ? (joinRequests.length === 1 
                    ? t('groups.members.pendingRequestsOne', '1 pending join request') 
                    : t('groups.members.pendingRequestsMany', { count: joinRequests.length, defaultValue: `${joinRequests.length} pending join requests` }))
                : t('groups.members.inviteFriends', 'Invite friends; pending requests appear here')
              }
            </Text>
          </View>
          {isOwner && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {joinRequests.length > 0 && (
                <TouchableOpacity 
                  style={[styles.smallBtn, { backgroundColor: '#FF385C' }]} 
                  onPress={() => setShowJoinRequestsSheet(true)}
                >
                  <Text style={[styles.smallBtnText, { color: '#fff' }]}>
                    {joinRequests.length === 1 ? t('groups.members.requests', 'Request') : t('groups.members.requests', 'Requests')} {joinRequests.length}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.smallBtn, styles.smallBtnSecondary]} onPress={() => setShowEditSheet(true)}>
                <Text style={[styles.smallBtnText, styles.smallBtnTextSecondary]}>{t('groups.members.edit', 'Edit')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => String(m.id || m.ID)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const uid = item?.user?.ID || item?.user?.id;
          const isOwnerMember = ownerId && uid === ownerId;
          const roleLabel = isOwnerMember ? 'Owner' : ((item?.role === 'secondary' || item?.role === 'cohost') ? 'Secondary' : 'Member');
          return (
            <View style={styles.row}>
              {/* <Image source={{ uri: item?.user?.avatarURL || 'https://i.pravatar.cc/100' }} style={styles.avatar} /> */}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{(item?.user?.firstName || '') + ' ' + (item?.user?.lastName || '')}</Text>
                <Text style={styles.meta}>{roleLabel}</Text>
              </View>
              {(!isOwnerMember && ownerId === user?.ID) && (
                <TouchableOpacity style={styles.dotsBtn} onPress={() => { setSelectedMember({ id: uid, name: ((item?.user?.firstName || '') + ' ' + (item?.user?.lastName || '')), role: item?.role }); setShowMemberSheet(true); }}>
                  <DotsThreeVertical size={20} color="#222" weight="bold" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, styles.secondary]} onPress={() => (navigation as any).navigate('GroupInvite', { experienceId, capacityLeft: 50 })}>
          <Text style={[styles.ctaText, styles.secondaryText]}>{t('groups.members.inviteFriends', 'Invite friends')}</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Group Bottom Sheet */}
      <BottomSheet visible={showEditSheet} onClose={() => setShowEditSheet(false)}>
          <Text style={styles.sheetTitle}>{t('groups.members.editGroup', 'Edit group')}</Text>
          <Text style={styles.sheetSubtitle}>{t('groups.members.editGroupSubtitle', 'Change name, status and photo')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('groups.members.groupName', 'Group name')}
            value={editName}
            onChangeText={setEditName}
          />
          <TouchableOpacity style={[styles.smallBtn, styles.smallBtnSecondary, { alignSelf: 'flex-start', marginBottom: 12 }]} onPress={pickGroupPhoto}>
            <Text style={[styles.smallBtnText, styles.smallBtnTextSecondary]}>{uploading ? t('groups.members.uploading', 'Uploading...') : t('groups.members.pickPhoto', 'Pick photo')}</Text>
          </TouchableOpacity>
          
          <Text style={[styles.sheetSubtitle, { marginBottom: 8 }]}>{t('groups.members.privacy', 'Privacy')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.pill, editPrivacy === 'public' && styles.pillSelected]}
              onPress={() => setEditPrivacy('public')}
            >
              <Text style={[styles.pillText, editPrivacy === 'public' && styles.pillTextSelected]}>{t('groups.members.public', 'Public')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, editPrivacy === 'private' && styles.pillSelected]}
              onPress={() => setEditPrivacy('private')}
            >
              <Text style={[styles.pillText, editPrivacy === 'private' && styles.pillTextSelected]}>{t('groups.members.private', 'Private')}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.sheetPrimary}
            onPress={() => {
              updateGroup.mutate({ groupId, data: { name: editName, photoURL: editPhoto, privacy: editPrivacy } });
              setTempHeaderPhoto(editPhoto);
              setShowEditSheet(false);
            }}
          >
            <Text style={styles.sheetPrimaryText}>{t('groups.members.save', 'Save')}</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <Text style={[styles.sheetSubtitle, { marginBottom: 8 }]}>{t('groups.members.status', 'Status')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <TouchableOpacity
              style={[styles.pill, (currentGroup?.status || currentGroup?.Status) === 'pending' && styles.pillSelected]}
              onPress={() => updateGroup.mutate({ groupId, data: { status: 'pending' } })}
            >
              <Text style={[styles.pillText, (currentGroup?.status || currentGroup?.Status) === 'pending' && styles.pillTextSelected]}>{t('groups.members.statusPending', 'Pending')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, (currentGroup?.status || currentGroup?.Status) === 'ready' && styles.pillSelected]}
              onPress={() => updateGroup.mutate({ groupId, data: { status: 'ready' } })}
            >
              <Text style={[styles.pillText, (currentGroup?.status || currentGroup?.Status) === 'ready' && styles.pillTextSelected]}>{t('groups.members.statusActive', 'Active')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.btnDangerOutline}
            onPress={() => { Alert.alert(t('groups.members.deleteGroup', 'Delete group'), t('groups.members.deleteConfirmMessage', 'Are you sure you want to delete this group?'), [ { text: t('groups.members.cancel', 'Cancel'), style: 'cancel' }, { text: t('groups.members.deleteGroup', 'Delete group'), style: 'destructive', onPress: () => deleteGroup.mutate(groupId, { onSuccess: () => (navigation as any).goBack() }) }, ]); }}
          >
            <Text style={styles.btnDangerOutlineText}>{t('groups.members.deleteGroup', 'Delete group')}</Text>
          </TouchableOpacity>
        <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowEditSheet(false)}>
          <Text style={styles.sheetCancelText}>{t('groups.members.cancel', 'Cancel')}</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Member actions Bottom Sheet */}
      <BottomSheet visible={showMemberSheet} onClose={() => setShowMemberSheet(false)}>
          <Text style={styles.sheetTitle}>{selectedMember?.name}</Text>
          <Text style={styles.sheetSubtitle}>{t('groups.members.manageRole', 'Manage role or remove')}</Text>
          <TouchableOpacity style={styles.sheetSecondaryBtn} onPress={() => { if (selectedMember) { updateRole.mutate({ memberId: selectedMember.id, role: 'secondary' }); } setShowMemberSheet(false); }}>
            <Text style={styles.sheetSecondaryBtnText}>{t('groups.members.makeSecondary', 'Make Secondary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetSecondaryBtn} onPress={() => { if (selectedMember) { updateRole.mutate({ memberId: selectedMember.id, role: 'member' }); } setShowMemberSheet(false); }}>
            <Text style={styles.sheetSecondaryBtnText}>{t('groups.members.setMember', 'Set as Member')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDangerOutline} onPress={() => { if (selectedMember) { removeMember.mutate(selectedMember.id); } setShowMemberSheet(false); }}>
            <Text style={styles.btnDangerOutlineText}>{t('groups.members.removeFromGroup', 'Remove from group')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowMemberSheet(false)}>
            <Text style={styles.sheetCancelText}>{t('groups.members.cancel', 'Cancel')}</Text>
          </TouchableOpacity>
      </BottomSheet>

      {/* Join Requests Bottom Sheet */}
      <BottomSheet visible={showJoinRequestsSheet} onClose={() => setShowJoinRequestsSheet(false)}>
        <Text style={styles.sheetTitle}>{t('groups.members.joinRequests', 'Join Requests')}</Text>
        <Text style={styles.sheetSubtitle}>
          {joinRequests.length === 1 ? t('groups.members.pendingRequestsOne', '1 pending join request') : t('groups.members.pendingRequestsMany', { count: joinRequests.length, defaultValue: `${joinRequests.length} pending join requests` })}
        </Text>
        
        {joinRequests.map((request: any) => (
          <View key={request.id || request.ID} style={styles.joinRequestItem}>
            <Image 
              source={{ uri: request.requester?.avatarURL || 'https://i.pravatar.cc/100' }} 
              style={styles.joinRequestAvatar} 
            />
            <View style={styles.joinRequestContent}>
              <Text style={styles.joinRequestName}>
                {request.requester?.firstName || ''} {request.requester?.lastName || ''}
              </Text>
              {request.requester?.bio && (
                <Text style={styles.joinRequestBio} numberOfLines={2}>
                  {request.requester.bio}
                </Text>
              )}
              <Text style={styles.joinRequestMessage}>
                {request.message || t('groups.members.wantsToJoin', 'Wants to join your group')}
              </Text>
              <Text style={styles.joinRequestTime}>
                {new Date(request.createdAt || request.CreatedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.joinRequestActions}>
              <TouchableOpacity 
                style={[styles.joinRequestBtn, styles.acceptBtn]}
                onPress={() => handleJoinRequest('accept', request.id || request.ID)}
                disabled={respondToJoinRequest.isLoading}
              >
                <Text style={styles.acceptBtnText}>{t('groups.members.accept', 'Accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.joinRequestBtn, styles.declineBtn]}
                onPress={() => handleJoinRequest('decline', request.id || request.ID)}
                disabled={respondToJoinRequest.isLoading}
              >
                <Text style={styles.declineBtnText}>{t('groups.members.decline', 'Decline')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowJoinRequestsSheet(false)}>
          <Text style={styles.sheetCancelText}>{t('groups.members.close', 'Close')}</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: '15%', paddingHorizontal: 20, paddingBottom: 8 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  groupPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEE' },
  title: { fontSize: 24, fontWeight: '800', color: '#222' },
  subtitle: { fontSize: 13, color: '#6A6A6A', marginTop: 4 },
  ownerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  smallBtnSecondary: { backgroundColor: '#F7F7F7' },
  smallBtnTextSecondary: { color: '#222' },
  smallBtnDanger: { backgroundColor: '#FF385C' },
  sep: { height: 1, backgroundColor: '#F0F0F0' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#EEE' },
  name: { fontSize: 16, color: '#222', fontWeight: '700' },
  meta: { fontSize: 12, color: '#6A6A6A', marginTop: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  cta: { backgroundColor: '#FF385C', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: '#F7F7F7' },
  secondaryText: { color: '#222' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E5E5', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4, textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, color: '#717171', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  sheetPrimary: { backgroundColor: '#FF385C', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  sheetPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F7F7F7' },
  pillSelected: { backgroundColor: '#FFE3E8' },
  pillText: { color: '#222', fontWeight: '600' },
  pillTextSelected: { color: '#FF385C' },
  btnDangerOutline: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FF385C', marginTop: 4 },
  btnDangerOutlineText: { color: '#FF385C', fontWeight: '700' },
  sheetCancel: { paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { color: '#717171', fontSize: 16, fontWeight: '600' },
  dotsBtn: { padding: 8 },
  sheetSecondaryBtn: { backgroundColor: '#F7F7F7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  sheetSecondaryBtnText: { color: '#222', fontSize: 16, fontWeight: '600' },
  realHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: "15%",
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  backBtnText: { color: '#222', fontSize: 16, fontWeight: '600' },
  backBtnIcon: { width: 24, height: 24 },
  joinRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  joinRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  joinRequestContent: {
    flex: 1,
  },
  joinRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  joinRequestBio: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  joinRequestMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinRequestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  joinRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinRequestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptBtn: {
    backgroundColor: '#00A699',
  },
  declineBtn: {
    backgroundColor: '#FF5A5F',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  declineBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GroupMembersScreen;


