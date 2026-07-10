// import React from 'react';
// import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
// import { Text } from '@ui-kitten/components';
// import { useMyGroups } from '../hooks/queries/useExperienceInvites';
// import { useNavigation } from '@react-navigation/native';

// const MyGroupsScreen = () => {
//   const { data: groups = [] } = useMyGroups();
//   const navigation = useNavigation();

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>My Groups</Text>
//         <Text style={styles.subtitle}>Revisit and manage your active groups.</Text>
//       </View>
//       <FlatList
//         data={groups}
//         keyExtractor={(g) => String(g.id || g.ID)}
//         ItemSeparatorComponent={() => <View style={styles.sep} />}
//         contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
//         renderItem={({ item }) => (
//           <TouchableOpacity style={styles.row} onPress={() => (navigation as any).navigate('GroupMembers', { experienceId: item.experienceID || item.ExperienceID, groupId: item.id || item.ID })}>
//             <Text style={styles.name}>{item.name || 'Group'}</Text>
//             <Text style={styles.meta}>{item.status}</Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   header: { paddingTop: '15%', paddingHorizontal: 20, paddingBottom: 8 },
//   title: { fontSize: 24, fontWeight: '800', color: '#222' },
//   subtitle: { fontSize: 13, color: '#6A6A6A', marginTop: 4 },
//   sep: { height: 1, backgroundColor: '#F0F0F0' },
//   row: { paddingVertical: 14 },
//   name: { fontSize: 16, fontWeight: '700', color: '#222' },
//   meta: { fontSize: 12, color: '#6A6A6A', marginTop: 4 },
// });

// export default MyGroupsScreen;

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useMyGroups, useGroupMembers } from '../hooks/queries/useExperienceInvites';
import { useUser } from '../hooks/useUser';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { theme } from '../theme';

export const MyGroupsScreen = () => {
  const navigation = useNavigation();
  const { data: groups = [] } = useMyGroups();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* TEH EHADER SHOUDL HAVE BORDER BOTTOM AND A BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={24} color="#222222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('groups.myGroups.title', 'My Groups')}</Text>
      </View>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('groups.myGroups.emptyTitle', 'No groups yet')}</Text>
          <Text style={styles.emptySub}>{t('groups.myGroups.emptySubtitle', 'Create a group and invite your friends to join.')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => (navigation as any).navigate('Search') }>
            <Text style={styles.primaryBtnText}>{t('groups.myGroups.explore', 'Explore experiences')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => String(g.id || g.ID)}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => <GroupRow navigation={navigation as any} group={item} />}
        />
      )}
    </View>
  );
};

const GroupRow = ({ group, navigation }: any) => {
  const groupId = group.id || group.ID;
  const experienceId = group.experienceID || group.ExperienceID;
  const { data: members = [] } = useGroupMembers(groupId);
  const firstFour = members.slice(0, 4);
  const {user} = useUser()
  
  // Check if current user has quit this group
  const currentUserMember = members.find((m: any) => m.userID === user?.ID);
  const hasQuit = currentUserMember?.status === 'quit';
  
  return (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('GroupMembers', { experienceId, groupId })}>
      <Image source={{ uri: group.photoURL || group.PhotoURL || 'https://via.placeholder.com/56x56?text=G' }} style={styles.groupPhoto} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{group.name || t('groups.myGroups.group', 'Group')}</Text>
        <View style={styles.statusContainer}>
          {hasQuit ? (
            <View style={styles.quitIndicator}>
              <Text style={styles.quitText}>{t('groups.status.quit', 'You left this group')}</Text>
            </View>
          ) : (
            <Text style={styles.meta}>{group.status || t('groups.myGroups.pending', 'pending')}</Text>
          )}
        </View>
      </View>
      <View style={styles.avatarsStack}>
        {firstFour.map((m: any, idx: number) => (
          <Image key={idx} source={{ uri: m?.user?.avatarURL || 'https://i.pravatar.cc/100' }} style={[styles.avatarSmall, { marginLeft: idx === 0 ? 0 : -10, zIndex: firstFour.length - idx }]} />
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: '15%', paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: "20%", borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 4 },
  backBtnIcon: { width: 24, height: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#222' },
  sep: { height: 1, backgroundColor: '#F0F0F0' },
  row: { paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  groupPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE' },
  name: { fontSize: 16, color: '#222', fontWeight: '700' },
  meta: { fontSize: 12, color: '#6A6A6A', marginTop: 2 },
  avatarsStack: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff', backgroundColor: '#EEE' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  emptySub: { fontSize: 13, color: '#6A6A6A', marginTop: 6, textAlign: 'center' },
  primaryBtn: { marginTop: 16, backgroundColor: theme['color-temporary-primary'], paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  statusContainer: { marginTop: 2 },
  quitIndicator: { 
    backgroundColor: theme['color-warning-100'], 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  quitText: { fontSize: 11, color: '#856404', fontWeight: '600' },
});

export default MyGroupsScreen;


