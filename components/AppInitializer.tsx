import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useOnboarding } from '../hooks/useOnboarding';
import { SplashLoadingScreen } from './SplashLoadingScreen';
import { SPLASH_BACKGROUND_COLOR } from '../constants';
import { resolveDevicePreferencesGate } from '../services/devicePreferences';
import { DevicePersonalizationModal } from './DevicePersonalizationModal';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLanguageReady, showLanguageModal } = useLanguage();
  const { isFirstTime, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [prefsChecked, setPrefsChecked] = useState(false);

  if (__DEV__) {
    console.log('🔄 AppInitializer render:', {
      isLanguageReady,
      showLanguageModal,
      isFirstTime,
      isLoading: onboardingLoading,
      isTransitioning,
    });
  }

  // After onboarding is complete (or returning user), decide whether we need personalization.
  // Keep this hook above all conditional returns to preserve hook order across renders.
  useEffect(() => {
    let cancelled = false;
    if (!isLanguageReady) return;
    if (onboardingLoading) return;
    if (isFirstTime) return; // onboarding will run first
    if (showLanguageModal) return;
    if (prefsChecked) return;

    (async () => {
      try {
        const { shouldShowModal } = await resolveDevicePreferencesGate();
        if (cancelled) return;
        setShowPersonalize(shouldShowModal);
      } catch {
        // Do not show personalization modal on resolver errors (offline/storage).
        if (!cancelled) setShowPersonalize(false);
      } finally {
        if (!cancelled) setPrefsChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLanguageReady, onboardingLoading, isFirstTime, showLanguageModal, prefsChecked]);

  // Same art as native splash — never an empty/black root while language/onboarding resolve
  if (!isLanguageReady) {
    return <SplashLoadingScreen />;
  }

  if (onboardingLoading) {
    return <SplashLoadingScreen />;
  }

  if (isTransitioning) {
    return <SplashLoadingScreen />;
  }

  // If language modal is showing, render a blank view (modal is rendered by LanguageContext on top)
  // For first-time users, we don't want to show the main app yet - just let the modal display
  if (showLanguageModal) {
    if (isFirstTime) {
      // For first-time users, show blank view (modal will be on top)
      return <View style={styles.container} />;
    } else {
      // For returning users changing language, show main app (modal on top)
      return <>{children}</>;
    }
  }

  // Show onboarding for first-time users AFTER language selection
  if (isFirstTime && !showLanguageModal) {
    return (
      <View style={styles.container}>
        <OnboardingScreen 
          onComplete={async () => {
            setIsTransitioning(true);
            
            try {
              await completeOnboarding();
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setIsTransitioning(false);
                });
              });
            } catch (error) {
              console.error('❌ Error completing onboarding:', error);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setIsTransitioning(false);
                });
              });
            }
          }} 
        />
      </View>
    );
  }

  // CRITICAL: Never return null in production - always return a valid React element
  return (
    <>
      {children}
      <DevicePersonalizationModal
        visible={showPersonalize}
        onDone={() => setShowPersonalize(false)}
      />
    </>
  );
};

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  return (
    <LanguageProvider>
      <AppContent>{children}</AppContent>
    </LanguageProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
  },
});
