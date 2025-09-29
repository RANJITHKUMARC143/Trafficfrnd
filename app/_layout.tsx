import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken } from '@lib/services/alertService';
import { useColorScheme } from 'react-native';
import { socketService } from '@lib/services/socketService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingAnimation from '../components/LoadingAnimation';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Display notifications while app is foregrounded (lazy import to avoid Expo Go Android crash)
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return;
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Add a small delay to show the loading animation
      setTimeout(() => {
        setIsAppLoading(false);
      }, 1000);
    }
  }, [loaded]);

  // Configure Android channel for heads-up notifications
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          if (Constants.appOwnership === 'expo') return; // Expo Go Android limitation
          const Notifications = await import('expo-notifications');
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: (await import('expo-notifications')).AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!Device.isDevice) {
          console.log('Push notifications require a physical device');
          return;
        }
        
        // Avoid calling remote push APIs on Android Expo Go (SDK 53+) — requires dev build
        if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
          console.log('Skipping push token on Android Expo Go. Use a dev build.');
          return;
        }
        
        const Notifications = await import('expo-notifications');
        
        // Check current permission status
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Current notification permission status:', existingStatus);
        
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          console.log('Requesting notification permissions...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('Permission request result:', status);
        }
        
        if (finalStatus !== 'granted') {
          console.log('Notification permission not granted:', finalStatus);
          return;
        }
        
        console.log('Notification permission granted, fetching push token...');
        
        // Get projectId from app config
        const projectId = (Constants?.expoConfig?.extra as any)?.eas?.projectId || (Constants as any)?.easConfig?.projectId;
        console.log('Using projectId:', projectId);
        
        // Fetch Expo push token
        let token;
        try {
          // Try without projectId first to avoid Firebase issues
          const tokenResponse = await Notifications.getExpoPushTokenAsync();
          token = tokenResponse.data;
          console.log('Successfully fetched Expo push token (no projectId):', token);
        } catch (tokenError) {
          console.error('Failed to get Expo push token without projectId:', tokenError);
          // Try with projectId as fallback
          try {
            const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
            token = tokenResponse.data;
            console.log('Successfully fetched Expo push token (with projectId):', token);
          } catch (fallbackError) {
            console.error('Failed to get Expo push token (with projectId):', fallbackError);
            console.log('Firebase not configured. Please set up FCM credentials.');
            return;
          }
        }
        
        if (!token) {
          console.log('No push token received');
          return;
        }
        
        console.log('Registering push token with backend...');
        await registerPushToken(token);
        console.log('Push token registered successfully');
        
      } catch (e) {
        console.error('Error in push notification setup:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // Socket service will be initialized when user logs in
    // No automatic initialization to prevent connection errors
    console.log('App started - socket will initialize on login');
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
        <LoadingAnimation visible={isAppLoading} size="large" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Mode selection disabled to go straight to home */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            title: '',
            headerTitle: '',
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
