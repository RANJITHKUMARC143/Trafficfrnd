import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { MenuItemDetailScreen } from '../screens/MenuItemDetailScreen';
import { MenuItemFormScreen } from '../screens/MenuItemFormScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { AuthNavigator } from './AuthNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

const MenuStackNavigator = () => (
  <MenuStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <MenuStack.Screen name="MenuList" component={MenuScreen} />
    <MenuStack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
    <MenuStack.Screen name="MenuItemForm" component={MenuItemFormScreen} />
  </MenuStack.Navigator>
);

const OrdersStackNavigator = () => (
  <OrdersStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
    <OrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
  </OrdersStack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Orders':
            iconName = focused ? 'receipt' : 'receipt-outline';
            break;
          case 'Menu':
            iconName = focused ? 'restaurant' : 'restaurant-outline';
            break;
          case 'Analytics':
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'help-outline';
        }
        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Orders" component={OrdersStackNavigator} />
    <Tab.Screen 
      name="Menu" 
      component={MenuStackNavigator}
      options={{
        headerShown: false,
      }}
    />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [checkAuthStatus]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 