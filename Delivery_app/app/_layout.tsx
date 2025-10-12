import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerDeliveryPushToken } from '@/services/alertService';
import FirebaseNotificationService from '@/services/firebaseNotificationService';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { 
  Poppins_400Regular,
  Poppins_500Medium, 
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import LoadingAnimation from '../../components/LoadingAnimation';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Fail-safe: force-hide splash after 5s so app never hangs on logo
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        SplashScreen.hideAsync();
      } catch {}
      setIsAppLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      // Add a small delay to show the loading animation
      setTimeout(() => {
        setIsAppLoading(false);
      }, 1000);
    }
  }, [fontsLoaded, fontError]);

  // Initialize Firebase notifications (non-blocking)
  useEffect(() => {
    // Don't block the app if Firebase fails to initialize
    if (!Device.isDevice) return;
    
    // Initialize Firebase in the background without blocking the UI
    setTimeout(async () => {
      try {
        console.log('Initializing Firebase notifications...');
        
        // Initialize Firebase notification service
        const initialized = await FirebaseNotificationService.initialize();
        
        if (initialized) {
          console.log('Firebase notifications initialized successfully');
          
          // Setup token refresh listener
          FirebaseNotificationService.setupTokenRefreshListener();
        } else {
          console.log('Failed to initialize Firebase notifications');
        }
      } catch (error) {
        console.error('Error initializing Firebase notifications:', error);
      }
    }, 1000); // Delay by 1 second to let the app load first
  }, []);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <OrderProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" backgroundColor="#3d7a00" />
        </SafeAreaProvider>
        <LoadingAnimation visible={isAppLoading} size="large" />
      </GestureHandlerRootView>
      </OrderProvider>
    </AuthProvider>
  );
}