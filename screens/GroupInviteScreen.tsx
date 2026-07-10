import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { api } from '../services/api';
import { endpoints, experienceInviteEndpoints } from '../constants';
import { useCreateExperienceInvites } from '../hooks/queries/useExperienceInvites';
import { useUser } from '../hooks/useUser';

export const GroupInviteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId, capacityLeft } = route.params as { experienceId: number; capacityLeft: number };
  const { user } = useUser();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const createInvites = useCreateExperienceInvites(experienceId);

  const canInviteCount = Math.max(0, Math.min(capacityLeft || 0, selected.length));

  const searchUsers = async (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    try {
      setLoading(true);
      const res = await api.get(`/user/search?q=${encodeURIComponent(text)}&limit=20`);
      setResults(res.data?.users ?? []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSendInvites = async () => {
    if (canInviteCount === 0) return;
    try {
      const ids = selected.slice(0, capacityLeft || 0);
      console.log('[INVITE] sending to userIDs=', ids);
      const res = await createInvites.mutateAsync({ inviteeUserIDs: ids });
      console.log('[INVITE] server response=', res);
      navigation.goBack();
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backPill} onPress={() => (navigation as any).goBack()}>
          <Text style={styles.backPillText}>{t('groups.invite.close', 'Close')}</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{t('groups.invite.title', 'Invite friends')}</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('groups.invite.inviteToExperience', 'Invite to this experience')}</Text>
        <View style={styles.metaRow}>
          <View style={styles.chip}><Text style={styles.chipText}>{t('groups.invite.seatsLeft', { count: capacityLeft, defaultValue: `Seats left: ${capacityLeft}` })}</Text></View>
          <View style={[styles.chip, styles.darkChip]}><Text style={[styles.chipText, styles.darkChipText]}>{t('groups.invite.selected', { count: canInviteCount, defaultValue: `Selected: ${canInviteCount}` })}</Text></View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={searchUsers}
          style={styles.input}
          placeholder={t('groups.invite.searchPlaceholder', 'Search by name or email')}
          placeholderTextColor="#9B9B9B"
        />
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.ID || item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.row, selected.includes(item.ID || item.id) && styles.rowSelected]} onPress={() => toggleSelect(item.ID || item.id)}>
            <Image source={{ uri: item.avatarURL || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
            <View style={styles.rowContent}>
              <Text style={styles.name}>{item.firstName || ''} {item.lastName || ''}</Text>
              {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
            </View>
            <View style={[styles.selectBadge, selected.includes(item.ID || item.id) && styles.selectBadgeActive]}>
              <Text style={[styles.selectBadgeText, selected.includes(item.ID || item.id) && styles.selectBadgeTextActive]}>
                {selected.includes(item.ID || item.id) ? t('groups.invite.selectedBadge', 'Selected') : t('groups.invite.select', 'Select')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom action */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.sendBtn, canInviteCount === 0 && styles.sendBtnDisabled]} onPress={handleSendInvites} disabled={canInviteCount === 0 || createInvites.isPending}>
          <Text style={[styles.sendText, canInviteCount === 0 && styles.sendTextDisabled]}>{t('groups.invite.sendInvites', { count: canInviteCount, defaultValue: `Send invites (${canInviteCount})` })}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: "15%", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F7F7F7' },
  backPillText: { color: '#222', fontWeight: '600' },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 14, color: '#6A6A6A', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F7F7F7' },
  chipText: { fontSize: 12, color: '#6A6A6A', fontWeight: '600' },
  darkChip: { backgroundColor: '#222' },
  darkChipText: { color: '#fff' },
  searchRow: { paddingHorizontal: 20, paddingVertical: 8 },
  input: { borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#222' },
  separator: { height: 1, backgroundColor: '#F5F5F5' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowSelected: { backgroundColor: '#F4FAF8' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#EEE' },
  rowContent: { flex: 1 },
  name: { fontSize: 16, color: '#222', fontWeight: '600' },
  email: { fontSize: 13, color: '#6A6A6A' },
  selectBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#EBEBEB' },
  selectBadgeActive: { backgroundColor: '#00A699', borderColor: '#00A699' },
  selectBadgeText: { fontSize: 12, color: '#222', fontWeight: '700' },
  selectBadgeTextActive: { color: '#fff' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: '#EBEBEB', backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#00A699', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#CDEBE3' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sendTextDisabled: { color: '#f8f8f8' },
});


