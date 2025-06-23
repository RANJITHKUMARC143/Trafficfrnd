import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updateVendorPushToken } from './src/services/api';

export default function App() {
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      let token;
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          console.log('Push notification permission not granted');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);
        // Send this token to your backend and associate with the vendor
        try {
          const response = await updateVendorPushToken(token);
          console.log('Push token update response:', response);
        } catch (e) {
          console.error('Failed to update push token:', e);
        }
      } else {
        alert('Must use physical device for Push Notifications');
        console.log('Not a physical device');
      }
    }
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification (show modal, play sound, etc.)
      console.log('Notification received:', notification);
    });
    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
} 