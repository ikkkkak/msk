import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, FloppyDisk } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useListAvailability } from '../hooks/queries/useExperienceInvites';
// import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
// import { SimpleAvailabilityCalendar } from '../components/SimpleAvailabilityCalendar';
import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';

export const ExperienceEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId } = route.params as { experienceId: number };
  
  const [activeTab, setActiveTab] = useState<'details' | 'availability'>('details');
  const [experienceData, setExperienceData] = useState({
    title: '',
    description: '',
    price: '',
    capacity: '',
    location: '',
  });

  const { data: availability = [] } = useListAvailability(experienceId);

  useEffect(() => {
    // TODO: Fetch experience details and populate form
    // This would typically come from a useExperienceDetails hook
  }, [experienceId]);

  const handleSave = () => {
    // TODO: Implement save functionality
    Alert.alert('Success', 'Experience updated successfully!');
  };

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            value={experienceData.title}
            onChangeText={(text) => setExperienceData(prev => ({ ...prev, title: text }))}
            placeholder="Enter experience title"
            placeholderTextColor="#9B9B9B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={experienceData.description}
            onChangeText={(text) => setExperienceData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your experience"
            placeholderTextColor="#9B9B9B"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Price per person</Text>
            <TextInput
              style={styles.textInput}
              value={experienceData.price}
              onChangeText={(text) => setExperienceData(prev => ({ ...prev, price: text }))}
              placeholder="0"
              placeholderTextColor="#9B9B9B"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Capacity</Text>
            <TextInput
              style={styles.textInput}
              value={experienceData.capacity}
              onChangeText={(text) => setExperienceData(prev => ({ ...prev, capacity: text }))}
              placeholder="0"
              placeholderTextColor="#9B9B9B"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={experienceData.location}
            onChangeText={(text) => setExperienceData(prev => ({ ...prev, location: text }))}
            placeholder="Enter location"
            placeholderTextColor="#9B9B9B"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderAvailabilityTab = () => (
    <View style={styles.tabContent}>
      <ProfessionalAvailabilityCalendar experienceId={experienceId} isHost={true} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#222222" weight="bold" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Experience</Text>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <FloppyDisk size={20} color="#FF385C" weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'details' && styles.activeTabItem]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabLabel, activeTab === 'details' && styles.activeTabLabel]}>
            Details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'availability' && styles.activeTabItem]}
          onPress={() => setActiveTab('availability')}
        >
          <Calendar size={18} color={activeTab === 'availability' ? '#FF385C' : '#9B9B9B'} weight="duotone" />
          <Text style={[styles.tabLabel, activeTab === 'availability' && styles.activeTabLabel]}>
            Availability
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'details' ? renderDetailsTab() : renderAvailabilityTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  saveButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTabItem: {
    backgroundColor: '#FFF5F5',
  },
  tabLabel: {
    fontSize: 14,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#FF385C',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
