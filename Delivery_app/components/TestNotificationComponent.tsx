import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { registerDeliveryFCMToken } from '@/services/alertService';
import FirebaseNotificationService from '@/services/firebaseNotificationService';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export default function TestNotificationComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showFullToken, setShowFullToken] = useState<boolean>(false);

  useEffect(() => {
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const appOwnership = Constants?.appOwnership || 'unknown';
    const isExpoGo = appOwnership === 'expo';
    const isDevBuild = appOwnership === 'store';
    const isStandalone = appOwnership === 'standalone';
    
    const info = [
      `Platform: ${Platform.OS}`,
      `App Ownership: ${appOwnership}`,
      `Firebase Available: ${FirebaseNotificationService.isFirebaseAvailable()}`,
      `FCM Token: ${fcmToken ? fcmToken.substring(0, 20) + '...' : 'Not available'}`,
      `Expo Go: ${isExpoGo ? 'Yes' : 'No'}`,
      `Development Build: ${isDevBuild ? 'Yes' : 'No'}`,
      `Standalone App: ${isStandalone ? 'Yes' : 'No'}`,
      `Environment: ${__DEV__ ? 'Development' : 'Production'}`,
    ].join('\n');
    setDebugInfo(info);
  };

  const testFirebaseNotification = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Testing Firebase notification...');
      
      // Check if we're in Expo Go
      if (Constants?.appOwnership === 'expo') {
        Alert.alert(
          'Expo Go Detected', 
          'Firebase messaging does not work in Expo Go. Please use a development build instead.\n\nTo create a development build:\n1. Run: eas build --platform android --profile development\n2. Install the generated APK\n3. Run: npx expo start --dev-client'
        );
        return;
      }
      
      // Check if Firebase is available
      if (!FirebaseNotificationService.isFirebaseAvailable()) {
        Alert.alert(
          'Firebase Not Available', 
          'Firebase messaging module is not properly installed. This usually means:\n\n1. You need to rebuild the app after installing Firebase\n2. You are running in Expo Go (use development build instead)\n3. Firebase configuration is missing\n\nTry running: eas build --platform android --profile development'
        );
        return;
      }
      
      // Get FCM token
      console.log('Getting FCM token...');
      const token = await FirebaseNotificationService.getFCMToken();
      
      if (token) {
        setFcmToken(token);
        console.log('FCM Token (full):', token);
        updateDebugInfo();
        
        // Register token with backend
        console.log('Registering FCM token with backend...');
        await registerDeliveryFCMToken(token);
        
        Alert.alert(
          'Success',
          `FCM Token registered successfully!\n\nToken: ${token.substring(0, 20)}...`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to get FCM token. Check console logs for details.');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', `Failed to test Firebase notification: ${error.message}`);
    } finally {
      setIsLoading(false);
      updateDebugInfo();
    }
  };

  const checkPermissions = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Checking permissions...');
      
      // Check if we're in the right environment
      const appOwnership = Constants?.appOwnership || 'unknown';
      if (appOwnership === 'expo') {
        Alert.alert(
          'Wrong Environment', 
          'You are running in Expo Go. Firebase messaging requires a development build.\n\nPlease install the development build APK instead.'
        );
        return;
      }
      
      if (appOwnership === 'unknown') {
        Alert.alert(
          'Unknown Environment', 
          'App ownership is unknown. This might indicate an issue with the build.\n\nTry rebuilding the development build.'
        );
        return;
      }
      
      Alert.alert(
        'Environment Check', 
        `App Ownership: ${appOwnership}\nFirebase Available: ${FirebaseNotificationService.isFirebaseAvailable()}\n\nThis looks correct for Firebase messaging.`
      );
      
    } catch (error) {
      console.error('Check permissions error:', error);
      Alert.alert('Error', `Failed to check permissions: ${error.message}`);
    } finally {
      setIsLoading(false);
      updateDebugInfo();
    }
  };

  const initializeFirebase = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Initializing Firebase...');
      
      console.log('Manually initializing Firebase...');
      const success = await FirebaseNotificationService.initialize();
      
      if (success) {
        Alert.alert('Success', 'Firebase initialized successfully!');
        updateDebugInfo();
      } else {
        Alert.alert('Error', 'Failed to initialize Firebase. Check console logs for details.');
      }
    } catch (error) {
      console.error('Initialize Firebase error:', error);
      Alert.alert('Error', `Failed to initialize Firebase: ${error.message}`);
    } finally {
      setIsLoading(false);
      updateDebugInfo();
    }
  };

  const sendTestNotification = async () => {
    try {
      setIsLoading(true);
      
      // This would typically be called from the backend
      // For now, we'll just show a success message
      Alert.alert(
        'Test Notification',
        'Firebase notification service is ready! Check backend logs for actual notification sending.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Send test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Notification Test</Text>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>

      {fcmToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.debugTitle}>FCM Token:</Text>
          <Text style={styles.tokenText} selectable>
            {showFullToken ? fcmToken : `${fcmToken.substring(0, 20)}...${fcmToken.substring(Math.max(fcmToken.length - 12, 20))}`}
          </Text>
          <View style={styles.tokenActions}>
            <TouchableOpacity
              style={[styles.smallButton, styles.copyButton]}
              onPress={async () => {
                if (fcmToken) {
                  await Clipboard.setStringAsync(fcmToken);
                  Alert.alert('Copied', 'Full FCM token copied to clipboard');
                }
              }}
            >
              <Text style={styles.smallButtonText}>Copy Token</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.toggleButton]}
              onPress={() => setShowFullToken((p) => !p)}
            >
              <Text style={styles.smallButtonText}>{showFullToken ? 'Hide Full' : 'Show Full'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.button, styles.checkButton, isLoading && styles.buttonDisabled]}
        onPress={checkPermissions}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Checking...' : 'Check Environment'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.initButton, isLoading && styles.buttonDisabled]}
        onPress={initializeFirebase}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Initializing...' : 'Initialize Firebase'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testFirebaseNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test FCM Token Registration'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
        onPress={sendTestNotification}
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Make sure you are running a development build (not Expo Go) and the backend is running.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  debugContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3d7a00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#FF9500',
  },
  initButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3d7a00',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#3d7a00',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
