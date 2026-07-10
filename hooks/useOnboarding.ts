import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOnboarding = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      // CRITICAL: In Android production, AsyncStorage can return null on first frame
      // Always check for null/undefined and default safely
      const isFirstTime = hasSeenOnboarding === null || hasSeenOnboarding === undefined || hasSeenOnboarding !== 'true';
      setIsFirstTime(isFirstTime);
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // CRITICAL: Default to showing onboarding on error (safer for first-time users)
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      // CRITICAL: Set AsyncStorage first, then update state
      // This ensures persistence even if state update fails
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      
      // CRITICAL: Use setTimeout to ensure state update happens after AsyncStorage completes
      // This prevents race conditions in Android production
      setTimeout(() => {
        setIsFirstTime(false);
      }, 0);
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // CRITICAL: Even on error, try to update state to prevent stuck onboarding
      // User can manually reset if needed
      setTimeout(() => {
        setIsFirstTime(false);
      }, 0);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      setIsFirstTime(true);
    } catch (error) {
      console.log('Error resetting onboarding:', error);
    }
  };

  return {
    isFirstTime,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
};
