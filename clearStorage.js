// Simple script to clear AsyncStorage for testing
// Run this with: node clearStorage.js

const AsyncStorage = require('@react-native-async-storage/async-storage');

const clearStorage = async () => {
  try {
    console.log('🧹 Clearing AsyncStorage for testing...');
    
    // Clear language selection
    await AsyncStorage.removeItem('appLanguage');
    console.log('✅ Cleared appLanguage');
    
    // Clear onboarding completion (use the correct key from useOnboarding hook)
    await AsyncStorage.removeItem('hasSeenOnboarding');
    console.log('✅ Cleared hasSeenOnboarding');
    
    // Clear any other onboarding-related keys
    await AsyncStorage.removeItem('onboardingCompleted');
    console.log('✅ Cleared onboardingCompleted');
    
    console.log('🎉 Storage cleared successfully!');
    console.log('📱 Restart your app to see the language selection modal and onboarding flow.');
    
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Run the clear function
clearStorage();