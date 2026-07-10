import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function NotificationScreen() {
  const [pushToken, setPushToken] = useState('');

  const sendNotification = async () => {
    if (!pushToken) {
      Alert.alert('Please enter a push token');
      return;
    }

    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: '🔥 New Arrival!',
        body: 'Check out this amazing product!',
        data: {
          imageUrl: 'https://images.unsplash.com/photo-1606813902914-3f3e6d2e8c12', // random product image
        },
      };

      // Use Expo's push notification API endpoint
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      Alert.alert('✅ Notification sent successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Failed to send notification');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📩 Send Push Notification</Text>
      <TextInput
        placeholder="Enter Expo push token"
        value={pushToken}
        onChangeText={setPushToken}
        style={styles.input}
      />
      <Button title="Send Notification" onPress={sendNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});
