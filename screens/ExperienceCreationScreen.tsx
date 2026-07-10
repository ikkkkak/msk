import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Text } from '@ui-kitten/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Screen } from '../components/Screen';
import { CreateExperienceInput, EXPERIENCE_STEPS } from '../types/experience';
import { useUser } from '../hooks/useUser';

// Step Components
import { CityLanguageStep } from '../components/experience/CityLanguageStep';
import { ExperienceFocusStep } from '../components/experience/ExperienceFocusStep';
import { HostingExperienceStep } from '../components/experience/HostingExperienceStep';
import { ExperienceDescriptionStep } from '../components/experience/ExperienceDescriptionStep';
import {
  WhatWeDoStep,
  DurationStep,
  HostProfileStep,
  WhatToBringStep,
  WhoCanAttendStep,
  ActivityLevelStep,
  DifficultyLevelStep,
  ExperienceNameStep,
  PhotosStep,
  GroupSizeTimingStep,
  PricingStep,
  GroupDiscountsStep,
  ArrivalTimeStep,
  CancellationPolicyStep,
  VideoDemoStep,
  IdentityVerificationStep,
  ReviewSubmitStep,
} from '../components/experience/PlaceholderSteps';

const { width } = Dimensions.get('window');

export const ExperienceCreationScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [experienceData, setExperienceData] = useState<Partial<CreateExperienceInput>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Update completed steps when data changes
  useEffect(() => {
    const newCompletedSteps = new Set<number>();
    
    // Check each step for completion
    if (experienceData.City && experienceData.Language) newCompletedSteps.add(1);
    if (experienceData.Focus) newCompletedSteps.add(2);
    if (experienceData.HasHostedBefore !== undefined && experienceData.HostedFor) newCompletedSteps.add(3);
    if (experienceData.Description) newCompletedSteps.add(4);
    if (experienceData.WhatWeDo) newCompletedSteps.add(5);
    if (experienceData.Duration && experienceData.Duration > 0) newCompletedSteps.add(6);
    if (user?.FirstName && user?.LastName) newCompletedSteps.add(7);
    if (experienceData.BringRequired !== undefined) newCompletedSteps.add(8);
    if (experienceData.MinAge && experienceData.MaxAge) newCompletedSteps.add(9);
    if (experienceData.ActivityLevel) newCompletedSteps.add(10);
    if (experienceData.DifficultyLevel) newCompletedSteps.add(11);
    if (experienceData.Title) newCompletedSteps.add(12);
    // Photos step - check if at least 5 photos are added
    if ((experienceData as any).photos && (experienceData as any).photos.length >= 5) newCompletedSteps.add(13);
    if (experienceData.GroupSize && experienceData.StartTime && experienceData.EndTime) newCompletedSteps.add(14);
    if (experienceData.PricePerPerson && experienceData.PricePerPerson > 0) newCompletedSteps.add(15);
    if (experienceData.GroupDiscounts) newCompletedSteps.add(16);
    if (experienceData.ArrivalTime && experienceData.ArrivalTime > 0) newCompletedSteps.add(17);
    if (experienceData.CancellationPolicy) newCompletedSteps.add(18);
    if (experienceData.VideoURL) newCompletedSteps.add(19);
    if (user?.IdentityVerified) newCompletedSteps.add(20);
    
    setCompletedSteps(newCompletedSteps);
  }, [experienceData, user]);

  const updateExperienceData = (data: Partial<CreateExperienceInput>) => {
    setExperienceData(prev => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep < EXPERIENCE_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= EXPERIENCE_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      experienceData,
      updateExperienceData,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      user,
      navigation,
    };

    switch (currentStep) {
      case 1: return <CityLanguageStep {...stepProps} />;
      case 2: return <ExperienceFocusStep {...stepProps} />;
      case 3: return <HostingExperienceStep {...stepProps} />;
      case 4: return <ExperienceDescriptionStep {...stepProps} />;
      case 5: return <WhatWeDoStep {...stepProps} />;
      case 6: return <DurationStep {...stepProps} />;
      case 7: return <HostProfileStep {...stepProps} />;
      case 8: return <WhatToBringStep {...stepProps} />;
      case 9: return <WhoCanAttendStep {...stepProps} />;
      case 10: return <ActivityLevelStep {...stepProps} />;
      case 11: return <DifficultyLevelStep {...stepProps} />;
      case 12: return <ExperienceNameStep {...stepProps} />;
      case 13: return <PhotosStep {...stepProps} />;
      case 14: return <GroupSizeTimingStep {...stepProps} />;
      case 15: return <PricingStep {...stepProps} />;
      case 16: return <GroupDiscountsStep {...stepProps} />;
      case 17: return <ArrivalTimeStep {...stepProps} />;
      case 18: return <CancellationPolicyStep {...stepProps} />;
      case 19: return <VideoDemoStep {...stepProps} />;
      case 20: return <IdentityVerificationStep {...stepProps} />;
      case 21: return <ReviewSubmitStep {...stepProps} />;
      default: return <CityLanguageStep {...stepProps} />;
    }
  };

  const currentStepInfo = EXPERIENCE_STEPS[currentStep - 1];

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.stepTitle}>{currentStepInfo.title}</Text>
          <Text style={styles.stepDescription}>{currentStepInfo.description}</Text>
        </View>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>{currentStep}</Text>
          <Text style={styles.stepTotal}>/ {EXPERIENCE_STEPS.length}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / EXPERIENCE_STEPS.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((currentStep / EXPERIENCE_STEPS.length) * 100)}% Complete
        </Text>
      </View>

      {/* Step Navigation */}
      {/* <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.stepNavigation}
        contentContainerStyle={styles.stepNavigationContent}
      >
        {EXPERIENCE_STEPS.map((step, index) => (
          <TouchableOpacity
            key={step.step}
            style={[
              styles.stepButton,
              currentStep === step.step && styles.stepButtonActive,
              completedSteps.has(step.step) && styles.stepButtonCompleted,
            ]}
            onPress={() => goToStep(step.step)}
          >
            <MaterialCommunityIcons
              name={completedSteps.has(step.step) ? "check" : "circle-outline"}
              size={16}
              color={
                currentStep === step.step 
                  ? "#FFFFFF" 
                  : completedSteps.has(step.step) 
                    ? "#4CAF50" 
                    : "#8E8E93"
              }
            />
            <Text style={[
              styles.stepButtonText,
              currentStep === step.step && styles.stepButtonTextActive,
              completedSteps.has(step.step) && styles.stepButtonTextCompleted,
            ]}>
              {step.step}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView> */}

      {/* Current Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </Screen>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF385C',
  },
  stepTotal: {
    fontSize: 12,
    color: '#8E8E93',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF385C',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  stepNavigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  stepNavigationContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    minWidth: 40,
    justifyContent: 'center',
  },
  stepButtonActive: {
    backgroundColor: '#FF385C',
  },
  stepButtonCompleted: {
    backgroundColor: '#E8F5E8',
  },
  stepButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 4,
  },
  stepButtonTextActive: {
    color: '#FFFFFF',
  },
  stepButtonTextCompleted: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
