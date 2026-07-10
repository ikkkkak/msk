import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useCreateOrOpenGroup } from '../hooks/queries/useExperienceInvites';
import { theme } from '../theme';
import Toast from '../components/CustomToast';

const SUGGESTIONS = [
  'Wanderlust Warriors',
  'Roamers',
  'Tripsters',
  'Adventure Seekers',
  'Journey Junkies',
  'Wander Family',
  'Travel Tribe',
];

export const GroupCreateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId, capacityLeft } = route.params as { experienceId: number; capacityLeft: number };
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const createGroup = useCreateOrOpenGroup(experienceId);
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  };

  const continueNext = async () => {
    try {
      setIsPending(true);
      const group = await createGroup.mutateAsync({ name, privacy });
      (navigation as any).reset({
        index: 1,
        routes: [
          {
            name: 'Root',
            state: {
              index: 3,
              routes: [
                { name: 'Search' },
                { name: 'Videos' },
                { name: 'UserTrips' },
                { name: 'Inbox' },
                { name: 'AccountRoot' },
              ],
            },
          },
          {
            name: 'GroupMembers',
            params: { experienceId, groupId: group.id },
          },
        ],
      });
    } catch (err: any) {
      // Handle 401 (User not found) error
      let status = err?.response?.status || err?.status;
      if (status === 401) {
        showToast(
            t('groups.create.userNotFoundMsg'),
          'error'
        );
        setTimeout(() => {
          setToast((prev) => ({ ...prev, visible: false }));
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 2600);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('groups.create.title')}</Text>
        <Text style={styles.subtitle}>{t('groups.create.subtitle')}</Text>
      </View>

      <Text style={styles.label}>{t('groups.create.yourVersion')}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={t('groups.create.typeName')} placeholderTextColor="#9B9B9B" style={styles.input} />

      <Text style={[styles.label, { marginTop: 16 }]}>{t('groups.create.suggestion')}</Text>
      <Text style={[styles.label, { marginTop: 16 }]}>{t('groups.create.privacy')}</Text>
      <View style={styles.privacyRow}>
        <TouchableOpacity onPress={() => setPrivacy('public')} style={[styles.privacyPill, privacy === 'public' && styles.privacyPillActive]}>
          <Text style={[styles.privacyText, privacy === 'public' && styles.privacyTextActive]}>{t('groups.members.public')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPrivacy('private')} style={[styles.privacyPill, privacy === 'private' && styles.privacyPillActive]}>
          <Text style={[styles.privacyText, privacy === 'private' && styles.privacyTextActive]}>{t('groups.members.private')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={SUGGESTIONS}
        keyExtractor={(s) => s}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
        <TouchableOpacity style={styles.suggestion} onPress={() => setName(item)}>
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, !name.trim() && styles.ctaDisabled]} disabled={!name.trim() || isPending} onPress={continueNext}>
          <Text style={styles.ctaText}>{t('groups.create.continue')}</Text>
        </TouchableOpacity>
      </View>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2500}
          onHide={() => setToast((p) => ({ ...p, visible: false }))}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: '15%', paddingHorizontal: 20 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#222' },
  subtitle: { fontSize: 13, color: '#6A6A6A', marginTop: 4 },
  label: { fontSize: 13, color: '#6A6A6A', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme['color-temporary-primary'], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#222' },
  suggestion: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 8 },
  suggestionText: { color: '#222', fontWeight: '600' },
  privacyRow: { flexDirection: 'row', gap: 8 },
  privacyPill: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEB' },
  privacyPillActive: { backgroundColor: '#FFECEF', borderColor: '#FF385C' },
  privacyText: { color: '#6A6A6A', fontWeight: '600' },
  privacyTextActive: { color: '#FF385C' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  cta: { backgroundColor: theme['color-temporary-primary'], paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaDisabled: { backgroundColor: theme['color-temporary-primary'] },
  ctaText: { color: "#FFF", fontWeight: '700', fontSize: 16 },
});

export default GroupCreateScreen;

