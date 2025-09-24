import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken } from '@lib/services/alertService';
import { useColorScheme } from 'react-native';
import { socketService } from '@lib/services/socketService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
        if (!Device.isDevice) return;
        // Avoid calling remote push APIs on Android Expo Go (SDK 53+) — requires dev build
        if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
          console.log('Skipping push token on Android Expo Go. Use a dev build.');
          return;
        }
        const Notifications = await import('expo-notifications');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        const projectId = (Constants?.expoConfig?.extra as any)?.eas?.projectId || (Constants as any)?.easConfig?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await registerPushToken(token);
      } catch (e) {
        // ignore
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
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
