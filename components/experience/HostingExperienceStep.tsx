import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CreateExperienceInput } from '../../types/experience';

interface HostingExperienceStepProps {
  experienceData: Partial<CreateExperienceInput>;
  updateExperienceData: (data: Partial<CreateExperienceInput>) => void;
  onNext: () => void;
  onPrevious: () => void;
  user: any;
}

const HOSTING_OPTIONS = [
  { value: 'friends', label: 'Friends & Family', description: 'I have hosted for friends and family' },
  { value: 'public', label: 'Publicly', description: 'I have hosted experiences publicly before' },
];

export const HostingExperienceStep: React.FC<HostingExperienceStepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious,
}) => {
  const [hasHostedBefore, setHasHostedBefore] = useState(experienceData.HasHostedBefore ?? false);
  const [hostedFor, setHostedFor] = useState(experienceData.HostedFor || '');

  const handleNext = () => {
    updateExperienceData({
      HasHostedBefore: hasHostedBefore,
      HostedFor: hostedFor,
    });
    onNext();
  };

  const isComplete = hasHostedBefore ? hostedFor !== '' : true;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Have you hosted experiences before?</Text>
          <Text style={styles.sectionDescription}>
            This helps us understand your hosting experience level
          </Text>
          
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                hasHostedBefore && styles.yesNoButtonSelected,
              ]}
              onPress={() => setHasHostedBefore(true)}
            >
              <Text style={[
                styles.yesNoText,
                hasHostedBefore && styles.yesNoTextSelected,
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                !hasHostedBefore && styles.yesNoButtonSelected,
              ]}
              onPress={() => {
                setHasHostedBefore(false);
                setHostedFor('');
              }}
            >
              <Text style={[
                styles.yesNoText,
                !hasHostedBefore && styles.yesNoTextSelected,
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>

          {hasHostedBefore && (
            <View style={styles.optionsContainer}>
              <Text style={styles.subTitle}>Who have you hosted for?</Text>
              {HOSTING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    hostedFor === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => setHostedFor(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    hostedFor === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  {hostedFor === option.value && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#FF385C"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  yesNoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF385C',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  yesNoTextSelected: {
    color: '#FF385C',
  },
  optionsContainer: {
    marginTop: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
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
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#FF385C',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
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
