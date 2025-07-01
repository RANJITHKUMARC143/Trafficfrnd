import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { updatePushToken } from '../services/orderService';
import { fetchAlerts } from '../services/alertService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);

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
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // Send this token to your backend and associate with the user
        try {
          await updatePushToken(token);
        } catch (e) {
          console.error('Failed to update push token:', e);
        }
      } else {
        alert('Must use physical device for Push Notifications');
      }
    }
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification (show modal, play sound, etc.)
      console.log('Notification received:', notification);
    });
    return () => subscription.remove();
  }, []);

  // Poll unread alerts count every 10s
  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const alerts = await fetchAlerts();
        const unread = alerts.filter((a: any) => !a.read).length;
        if (mounted) setUnreadCount(unread);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 48,
          borderRadius: 0,
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="home" size={focused ? 32 : 26} color={focused ? '#111' : '#bbb'} style={{ opacity: focused ? 1 : 0.7, transform: [{ scale: focused ? 1.15 : 1 }] }} />
              {focused && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="map" size={focused ? 32 : 26} color={focused ? '#111' : '#bbb'} style={{ opacity: focused ? 1 : 0.7, transform: [{ scale: focused ? 1.15 : 1 }] }} />
              {focused && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="compass" size={focused ? 32 : 26} color={focused ? '#111' : '#bbb'} style={{ opacity: focused ? 1 : 0.7, transform: [{ scale: focused ? 1.15 : 1 }] }} />
              {focused && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={focused ? 32 : 26} color={focused ? '#111' : '#bbb'} style={{ opacity: focused ? 1 : 0.7, transform: [{ scale: focused ? 1.15 : 1 }] }} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -10,
                  backgroundColor: '#FF5252',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  zIndex: 10,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
                </View>
              )}
              {focused && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={focused ? 32 : 26} color={focused ? '#111' : '#bbb'} style={{ opacity: focused ? 1 : 0.7, transform: [{ scale: focused ? 1.15 : 1 }] }} />
              {focused && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
