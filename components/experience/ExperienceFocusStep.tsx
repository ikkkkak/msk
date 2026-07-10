import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CreateExperienceInput } from '../../types/experience';

interface ExperienceFocusStepProps {
  experienceData: Partial<CreateExperienceInput>;
  updateExperienceData: (data: Partial<CreateExperienceInput>) => void;
  onNext: () => void;
  onPrevious: () => void;
  user: any;
}

const EXPERIENCE_FOCUSES = [
  { value: 'culture', label: 'Culture & History', icon: 'castle', description: 'Share local traditions, history, and cultural insights' },
  { value: 'food', label: 'Food & Drink', icon: 'food', description: 'Cooking classes, food tours, and culinary experiences' },
  { value: 'nature', label: 'Nature & Outdoor', icon: 'tree', description: 'Hiking, wildlife, outdoor adventures, and nature walks' },
  { value: 'art', label: 'Arts & Crafts', icon: 'palette', description: 'Art workshops, craft making, and creative experiences' },
  { value: 'music', label: 'Music & Entertainment', icon: 'music', description: 'Music lessons, performances, and entertainment' },
  { value: 'sports', label: 'Sports & Fitness', icon: 'dumbbell', description: 'Sports activities, fitness classes, and athletic experiences' },
  { value: 'wellness', label: 'Wellness & Relaxation', icon: 'spa', description: 'Yoga, meditation, spa experiences, and relaxation' },
  { value: 'adventure', label: 'Adventure & Extreme', icon: 'rocket-launch', description: 'Extreme sports, adventure activities, and thrilling experiences' },
  { value: 'education', label: 'Education & Learning', icon: 'school', description: 'Language lessons, skill building, and educational experiences' },
  { value: 'social', label: 'Social & Community', icon: 'account-group', description: 'Community events, social gatherings, and networking' },
];

export const ExperienceFocusStep: React.FC<ExperienceFocusStepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious,
}) => {
  const [selectedFocus, setSelectedFocus] = useState(experienceData.Focus || '');

  const handleNext = () => {
    if (selectedFocus) {
      updateExperienceData({ Focus: selectedFocus });
      onNext();
    }
  };

  const isComplete = selectedFocus !== '';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will your experience focus on?</Text>
          <Text style={styles.sectionDescription}>
            Choose the main theme or focus area for your experience
          </Text>
          
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {EXPERIENCE_FOCUSES.map((focus) => (
              <TouchableOpacity
                key={focus.value}
                style={[
                  styles.optionButton,
                  selectedFocus === focus.value && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedFocus(focus.value)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <MaterialCommunityIcons
                      name={focus.icon as any}
                      size={24}
                      color={selectedFocus === focus.value ? '#FF385C' : '#8E8E93'}
                    />
                    <Text style={[
                      styles.optionTitle,
                      selectedFocus === focus.value && styles.optionTitleSelected,
                    ]}>
                      {focus.label}
                    </Text>
                    {selectedFocus === focus.value && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color="#FF385C"
                      />
                    )}
                  </View>
                  <Text style={styles.optionDescription}>
                    {focus.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !isComplete && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!isComplete}
        >
          <Text style={[
            styles.nextButtonText,
            !isComplete && styles.nextButtonTextDisabled,
          ]}>
            Next
          </Text>
          <MaterialCommunityIcons 
            name="arrow-right" 
            size={20} 
            color={isComplete ? '#FFFFFF' : '#C7C7CC'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionButtonSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF385C',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  optionTitleSelected: {
    color: '#FF385C',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginLeft: 36,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  previousButton: {
    backgroundColor: '#F8F9FA',
  },
  previousButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  nextButton: {
    backgroundColor: '#FF385C',
  },
  nextButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#C7C7CC',
  },
});
