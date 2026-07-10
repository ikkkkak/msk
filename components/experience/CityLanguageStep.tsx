import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CreateExperienceInput, MAURITANIAN_CITIES, LANGUAGES } from '../../types/experience';

interface CityLanguageStepProps {
  experienceData: Partial<CreateExperienceInput>;
  updateExperienceData: (data: Partial<CreateExperienceInput>) => void;
  onNext: () => void;
  onPrevious: () => void;
  user: any;
}

export const CityLanguageStep: React.FC<CityLanguageStepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious,
}) => {
  const [selectedCity, setSelectedCity] = useState(experienceData.City || '');
  const [selectedLanguage, setSelectedLanguage] = useState(experienceData.Language || '');

  const handleNext = () => {
    if (selectedCity && selectedLanguage) {
      updateExperienceData({
        City: selectedCity,
        Language: selectedLanguage,
      });
      onNext();
    }
  };

  const isComplete = selectedCity && selectedLanguage;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* City Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which city will you host in?</Text>
          <Text style={styles.sectionDescription}>
            Choose the city where your experience will take place
          </Text>
          
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {MAURITANIAN_CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.optionButton,
                  selectedCity === city && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedCity(city)}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={selectedCity === city ? '#FF385C' : '#8E8E93'}
                />
                <Text style={[
                  styles.optionText,
                  selectedCity === city && styles.optionTextSelected,
                ]}>
                  {city}
                </Text>
                {selectedCity === city && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#FF385C"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which language will you use?</Text>
          <Text style={styles.sectionDescription}>
            Select the primary language for your experience
          </Text>
          
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.optionButton,
                  selectedLanguage === language && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedLanguage(language)}
              >
                <MaterialCommunityIcons
                  name="translate"
                  size={20}
                  color={selectedLanguage === language ? '#FF385C' : '#8E8E93'}
                />
                <Text style={[
                  styles.optionText,
                  selectedLanguage === language && styles.optionTextSelected,
                ]}>
                  {language}
                </Text>
                {selectedLanguage === language && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#FF385C"
                  />
                )}
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
    maxHeight: 200,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
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
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  optionTextSelected: {
    color: '#FF385C',
    fontWeight: '600',
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
