import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageClearButton: React.FC = () => {
  const clearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'This will clear language and onboarding data for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Clearing AsyncStorage...');
              
              await AsyncStorage.removeItem('appLanguage');
              await AsyncStorage.removeItem('hasSeenOnboarding');
              await AsyncStorage.removeItem('onboardingCompleted');
              
              console.log('✅ Storage cleared!');
              Alert.alert('Success', 'Storage cleared! Restart the app to see the language modal.');
            } catch (error) {
              console.error('❌ Error:', error);
              Alert.alert('Error', 'Failed to clear storage');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={clearStorage}>
      <Text style={styles.text}>Clear Storage for Testing</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});
