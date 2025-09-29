import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../config/api';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Conditionally import Firebase messaging
let messaging: any = null;
let isFirebaseAvailable = false;

try {
  if (Constants?.appOwnership !== 'expo' && Platform.OS !== 'web') {
    // First try to require the app module
    require('@react-native-firebase/app');
    // Then try to require messaging
    messaging = require('@react-native-firebase/messaging').default;
    isFirebaseAvailable = true;
    console.log('Firebase messaging loaded successfully');
  } else {
    console.log('Firebase messaging not available - running in Expo Go or web');
  }
} catch (error) {
  console.warn('Firebase messaging not available:', error);
  isFirebaseAvailable = false;
}

const TOKEN_KEY = '@traffic_friend_token';
const FCM_TOKEN_KEY = '@fcm_token';
const API_URL = getBaseUrl();

export class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private fcmToken: string | null = null;

  public static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  // Check if Firebase is available
  isFirebaseAvailable(): boolean {
    return isFirebaseAvailable && messaging !== null;
  }

  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    try {
      if (!isFirebaseAvailable || !messaging) {
        console.log('Firebase messaging not available, skipping permission request');
        return false;
      }
      
      console.log('Requesting Firebase notification permission...');
      
      // Check current permission status first
      const currentAuthStatus = await messaging().hasPermission();
      console.log('Current permission status:', currentAuthStatus);
      
      if (currentAuthStatus === messaging.AuthorizationStatus.AUTHORIZED) {
        console.log('Permission already granted');
        return true;
      }
      
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
        criticalAlert: false,
      });
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('Firebase notification permission status:', authStatus);
      console.log('Firebase notification permission granted:', enabled);
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      console.error('Permission error details:', error.message);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      if (!isFirebaseAvailable || !messaging) {
        console.log('Firebase messaging not available, skipping token retrieval');
        return null;
      }
      
      if (this.fcmToken) {
        console.log('Using cached FCM token');
        return this.fcmToken;
      }

      console.log('Getting FCM token...');
      const token = await messaging().getToken();
      
      if (token) {
        console.log('FCM Token retrieved successfully:', token.substring(0, 20) + '...');
        
        // Store token locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        this.fcmToken = token;
        
        return token;
      } else {
        console.log('FCM token is null or empty');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Register FCM token with backend
  async registerFCMToken(): Promise<boolean> {
    try {
      const token = await this.getFCMToken();
      if (!token) {
        console.log('No FCM token available');
        return false;
      }

      const authToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!authToken) {
        console.log('No auth token available');
        return false;
      }

      const response = await fetch(`${API_URL}/delivery-alerts/register-fcm-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      if (response.ok) {
        console.log('FCM token registered successfully');
        return true;
      } else {
        console.error('Failed to register FCM token:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  }

  // Setup notification handlers
  setupNotificationHandlers() {
    if (!isFirebaseAvailable || !messaging) {
      console.log('Firebase messaging not available, skipping notification handlers setup');
      return;
    }
    
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      
      // Handle the notification data
      if (remoteMessage.data) {
        await this.handleNotificationData(remoteMessage.data);
      }
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages so users see an alert banner
      try {
        const title = remoteMessage.notification?.title || 'New Notification';
        const body = remoteMessage.notification?.body || 'You have a new update';
        await Notifications.setNotificationChannelAsync?.('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data: remoteMessage.data || {} },
          trigger: null,
        });
      } catch (e) {
        console.warn('Failed to show local notification:', e);
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      
      if (remoteMessage.data) {
        this.handleNotificationData(remoteMessage.data);
      }
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          
          if (remoteMessage.data) {
            this.handleNotificationData(remoteMessage.data);
          }
        }
      });
  }

  // Handle notification data
  private async handleNotificationData(data: any) {
    try {
      console.log('Handling notification data:', data);
      
      // Handle different types of notifications
      switch (data.type) {
        case 'order-update':
          // Handle order update notification
          console.log('Order update notification:', data);
          break;
        case 'new-order':
          // Handle new order notification
          console.log('New order notification:', data);
          break;
        case 'alert':
          // Handle alert notification
          console.log('Alert notification:', data);
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error handling notification data:', error);
    }
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Firebase notification service...');
      console.log('Firebase available:', this.isFirebaseAvailable());
      
      if (!this.isFirebaseAvailable()) {
        console.log('Firebase is not available, skipping initialization');
        return false;
      }
      
      // Request permission (with timeout)
      console.log('Requesting notification permission...');
      const hasPermission = await Promise.race([
        this.requestPermission(),
        new Promise<boolean>((resolve) => setTimeout(() => {
          console.log('Permission request timeout');
          resolve(false);
        }, 10000))
      ]);
      
      if (!hasPermission) {
        console.log('Notification permission denied or timeout');
        return false;
      }

      // Get FCM token (with timeout)
      console.log('Getting FCM token...');
      const token = await Promise.race([
        this.getFCMToken(),
        new Promise<string | null>((resolve) => setTimeout(() => {
          console.log('FCM token request timeout');
          resolve(null);
        }, 10000))
      ]);
      
      if (!token) {
        console.log('Failed to get FCM token or timeout');
        return false;
      }

      // Setup handlers (non-blocking)
      try {
        this.setupNotificationHandlers();
        console.log('Notification handlers setup completed');
      } catch (error) {
        console.error('Error setting up notification handlers:', error);
      }

      // Register token with backend (non-blocking)
      this.registerFCMToken().then(success => {
        if (success) {
          console.log('FCM token registered with backend successfully');
        } else {
          console.log('Failed to register FCM token with backend');
        }
      }).catch(error => {
        console.error('Error registering FCM token:', error);
      });

      console.log('Firebase notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Firebase notification service:', error);
      return false;
    }
  }

  // Refresh FCM token
  async refreshToken(): Promise<string | null> {
    try {
      if (!isFirebaseAvailable || !messaging) {
        console.log('Firebase messaging not available, skipping token refresh');
        return null;
      }
      
      const newToken = await messaging().getToken();
      console.log('FCM token refreshed:', newToken);
      
      this.fcmToken = newToken;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      
      // Register new token with backend
      await this.registerFCMToken();
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  // Listen for token refresh
  setupTokenRefreshListener() {
    if (!isFirebaseAvailable || !messaging) {
      console.log('Firebase messaging not available, skipping token refresh listener');
      return;
    }
    
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await this.registerFCMToken();
    });
  }
}

export default FirebaseNotificationService.getInstance();
