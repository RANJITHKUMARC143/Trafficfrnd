import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: COLORS.gray,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: styles.tabBar,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: true,
          tabBarIconStyle: styles.tabBarIcon,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color }) => <FontAwesome name="money" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="deliveryProfile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          }}
        />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.ultraLightGray,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...Platform.select({
      web: {
        height: 65, 
        paddingBottom: 10
      }
    }),
  },
  tabBarLabel: {
    ...FONTS.body4,
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 4,
  },
});