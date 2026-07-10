import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Alert, RefreshControl } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import { useDiscoverGroups, useRequestJoinGroup } from '../hooks/queries/useGroupDiscovery';
import { useUser } from '../hooks/useUser';
import { useProfileStatus } from '../hooks/queries/useProfileStatus';
import { useUserProfile } from '../hooks/queries/useUserProfile';
import { ArrowLeft, MagnifyingGlass, MapPin, Users, Calendar, Lock, LockOpen, Heart } from 'phosphor-react-native';
import { BottomSheet } from '../components/BottomSheet';

const INTERESTS = [
  'Art', 'Culture', 'Food', 'Nature', 'Adventure', 'Photography', 
  'Music', 'History', 'Sports', 'Wellness', 'Technology', 'Fashion'
];

export const GroupSearchScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const { data: profileStatus } = useProfileStatus();
  const { data: userProfile } = useUserProfile();
  const discoverGroups = useDiscoverGroups();
  const requestJoinGroup = useRequestJoinGroup();
  
  const [searchFilters, setSearchFilters] = useState({
    privacy: 'all' as 'public' | 'private' | 'all',
    location: '',
    interests: '',
    limit: 20,
    offset: 0
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [joinMessage, setJoinMessage] = useState('');

  // Auto-search on component mount to show suggestions
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    console.log('GroupSearch - Profile Status:', profileStatus);
    console.log('GroupSearch - User Profile:', userProfile);
    
    // Check profile status first - be more lenient for now
    if (profileStatus?.status?.canDiscoverGroups === false) {
      console.log('GroupSearch - Profile check failed, canDiscoverGroups:', profileStatus?.status?.canDiscoverGroups);
      Alert.alert(
        'Profile Incomplete', 
        profileStatus?.status?.message || 'Please complete your profile to discover groups.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile', onPress: () => (navigation as any).navigate('ProfileCreation') }
        ]
      );
      return;
    }
    
    // If profile status is not loaded yet, proceed anyway (backend will handle validation)
    if (!profileStatus) {
      console.log('GroupSearch - Profile status not loaded yet, proceeding with search');
    }

    setIsSearching(true);
    try {
      // If no specific filters, show all available groups
      const filters = {
        ...searchFilters,
        privacy: searchFilters.privacy === 'all' ? undefined : searchFilters.privacy,
        location: searchFilters.location.trim() || undefined,
        interests: searchFilters.interests.trim() || undefined,
      };
      
      const result = await discoverGroups.mutateAsync(filters);
      console.log('GroupSearch - Search result:', result);
      if (result.success) {
        console.log('GroupSearch - Found groups:', result.groups?.length || 0);
        setSearchResults(result.groups || []);
      } else if (result.error === 'profile_incomplete') {
        Alert.alert(
          'Profile Incomplete', 
          'Please add your name to your profile before discovering groups.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete Profile', onPress: () => (navigation as any).navigate('ProfileCreation') }
          ]
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Failed', 'Could not search for groups. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!selectedGroup) return;
    
    try {
      await requestJoinGroup.mutateAsync({
        groupID: selectedGroup.id || selectedGroup.ID,
        message: joinMessage
      });
      Alert.alert('Request Sent', 'Your join request has been sent to the group owner.');
      setSelectedGroup(null);
      setJoinMessage('');
    } catch (error) {
      Alert.alert('Request Failed', 'Could not send join request. Please try again.');
    }
  };

  const renderGroupCard = ({ item }: { item: any }) => {
    const group = item;
    const experience = group.experience || group.Experience || {};
    const owner = group.owner || group.Owner || {};
    const isPrivate = (group.privacy || group.Privacy) === 'private';
    
    return (
      <TouchableOpacity 
        style={styles.groupCard}
        onPress={() => setSelectedGroup(group)}
      >
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: group.photoURL || group.PhotoURL || 'https://via.placeholder.com/60x60?text=Group' }} 
            style={styles.groupAvatar} 
          />
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.groupName}>{group.name || group.Name}</Text>
              {isPrivate ? (
                <Lock size={16} color="#666" weight="fill" />
              ) : (
                <LockOpen size={16} color="#666" weight="fill" />
              )}
            </View>
            <Text style={styles.experienceTitle}>{experience.title || experience.Title}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <MapPin size={14} color="#666" weight="duotone" />
                <Text style={styles.metaText}>{experience.city || experience.City}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={14} color="#666" weight="duotone" />
                <Text style={styles.metaText}>{experience.groupSize || experience.GroupSize} people</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.ownerText}>Hosted by {owner.firstName || owner.FirstName} {owner.lastName || owner.LastName}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>${experience.pricePerPerson || experience.PricePerPerson}/person</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover Groups</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Status Indicator */}
      {profileStatus && (
        <View style={styles.profileStatusContainer}>
          <View style={styles.profileStatusRow}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileStatusText}>
                {userProfile?.profile?.firstName || profileStatus?.profile?.firstName} {userProfile?.profile?.lastName || profileStatus?.profile?.lastName}
              </Text>
              <Text style={styles.profileStatusSubtext}>
                {profileStatus?.status?.message || 'Profile status loading...'}
              </Text>
            </View>
            <View style={[
              styles.profileStatusBadge,
              { backgroundColor: profileStatus?.status?.canDiscoverGroups ? '#E8F5E8' : '#FFE8E8' }
            ]}>
              <Text style={[
                styles.profileStatusBadgeText,
                { color: profileStatus?.status?.canDiscoverGroups ? '#2E7D32' : '#D32F2F' }
              ]}>
                {profileStatus?.status?.completionPercentage || 0}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MagnifyingGlass size={20} color="#666" weight="duotone" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, interests..."
            value={searchFilters.location}
            onChangeText={(text) => setSearchFilters(prev => ({ ...prev, location: text }))}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => String(item.id || item.ID)}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={isSearching} onRefresh={handleSearch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Heart size={64} color="#E0E0E0" weight="duotone" />
            <Text style={styles.emptyTitle}>
              {isSearching ? 'Searching for groups...' : 'No groups found'}
            </Text>
            <Text style={styles.emptyMessage}>
              {isSearching 
                ? 'Finding groups that match your profile...'
                : 'Try adjusting your search filters or check back later for new groups'
              }
            </Text>
            {!isSearching && (
              <TouchableOpacity style={styles.refreshBtn} onPress={handleSearch}>
                <Text style={styles.refreshBtnText}>Refresh Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filters Bottom Sheet */}
      <BottomSheet visible={showFilters} onClose={() => setShowFilters(false)}>
        <Text style={styles.sheetTitle}>Search Filters</Text>
        
        <Text style={styles.filterLabel}>Privacy</Text>
        <View style={styles.filterRow}>
          {['all', 'public', 'private'].map((privacy) => (
            <TouchableOpacity
              key={privacy}
              style={[
                styles.filterPill,
                searchFilters.privacy === privacy && styles.filterPillActive
              ]}
              onPress={() => setSearchFilters(prev => ({ ...prev, privacy: privacy as any }))}
            >
              <Text style={[
                styles.filterPillText,
                searchFilters.privacy === privacy && styles.filterPillTextActive
              ]}>
                {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Interests</Text>
        <View style={styles.interestsContainer}>
          {INTERESTS.map((interest) => {
            const isSelected = searchFilters.interests.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestPill,
                  isSelected && styles.interestPillActive
                ]}
                onPress={() => {
                  const currentInterests = searchFilters.interests.split(',').filter(Boolean);
                  if (isSelected) {
                    const newInterests = currentInterests.filter(i => i !== interest);
                    setSearchFilters(prev => ({ ...prev, interests: newInterests.join(',') }));
                  } else {
                    const newInterests = [...currentInterests, interest];
                    setSearchFilters(prev => ({ ...prev, interests: newInterests.join(',') }));
                  }
                }}
              >
                <Text style={[
                  styles.interestPillText,
                  isSelected && styles.interestPillTextActive
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => {
            setShowFilters(false);
            handleSearch();
          }}
        >
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Join Request Bottom Sheet */}
      <BottomSheet visible={!!selectedGroup} onClose={() => setSelectedGroup(null)}>
        <Text style={styles.sheetTitle}>Request to Join</Text>
        <Text style={styles.sheetSubtitle}>
          Send a message to {selectedGroup?.owner?.firstName} {selectedGroup?.owner?.lastName} 
          about joining "{selectedGroup?.name}"
        </Text>
        
        <TextInput
          style={styles.messageInput}
          placeholder="Tell them why you'd like to join..."
          value={joinMessage}
          onChangeText={setJoinMessage}
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={handleRequestJoin}
          disabled={requestJoinGroup.isLoading}
        >
          <Text style={styles.joinBtnText}>
            {requestJoinGroup.isLoading ? 'Sending...' : 'Send Request'}
          </Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: '15%',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#222', flex: 1 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F7F7F7', borderRadius: 16 },
  filterBtnText: { color: '#222', fontSize: 14, fontWeight: '600' },
  
  profileStatusContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  profileStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  profileStatusText: { fontSize: 16, fontWeight: '600', color: '#222' },
  profileStatusSubtext: { fontSize: 12, color: '#666', marginTop: 2 },
  profileStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileStatusBadgeText: { fontSize: 12, fontWeight: '700' },
  
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#222' },
  searchBtn: { backgroundColor: '#FF385C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  
  resultsContainer: { padding: 20 },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  groupAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  groupName: { fontSize: 18, fontWeight: '700', color: '#222', flex: 1 },
  experienceTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ownerText: { fontSize: 12, color: '#666' },
  priceContainer: { backgroundColor: '#F7F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceText: { fontSize: 14, fontWeight: '600', color: '#222' },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#222', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  refreshBtn: { backgroundColor: '#FF385C', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  refreshBtnText: { color: '#fff', fontWeight: '600' },
  
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4, textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  filterLabel: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 8, marginTop: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F7F7F7' },
  filterPillActive: { backgroundColor: '#FFE3E8' },
  filterPillText: { color: '#222', fontWeight: '600' },
  filterPillTextActive: { color: '#FF385C' },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  interestPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F7F7F7' },
  interestPillActive: { backgroundColor: '#FFE3E8' },
  interestPillText: { color: '#222', fontSize: 14, fontWeight: '500' },
  interestPillTextActive: { color: '#FF385C' },
  applyBtn: { backgroundColor: '#FF385C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  joinBtn: { backgroundColor: '#FF385C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default GroupSearchScreen;
