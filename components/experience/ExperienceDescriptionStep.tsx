import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CreateExperienceInput } from '../../types/experience';

interface ExperienceDescriptionStepProps {
  experienceData: Partial<CreateExperienceInput>;
  updateExperienceData: (data: Partial<CreateExperienceInput>) => void;
  onNext: () => void;
  onPrevious: () => void;
  user: any;
}

export const ExperienceDescriptionStep: React.FC<ExperienceDescriptionStepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious,
}) => {
  const [description, setDescription] = useState(experienceData.Description || '');

  const handleNext = () => {
    updateExperienceData({ Description: description });
    onNext();
  };

  const isComplete = description.trim().length >= 50;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe your experience</Text>
          <Text style={styles.sectionDescription}>
            Tell guests what makes your experience special and unique
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your experience in detail. What will guests learn, see, or do? What makes it special?"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {description.length}/1000 characters
              </Text>
            </View>
          </View>

          {description.length > 0 && description.length < 50 && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                Please provide at least 50 characters for a good description
              </Text>
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
  inputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    flex: 1,
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
