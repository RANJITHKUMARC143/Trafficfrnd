import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MenuSection } from '../components/MenuSection';
import { theme } from '../theme/theme';
import { Text } from '../components/Text';
import { menuService, MenuItem } from '../services/menuService';
import { authService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

type MenuStackParamList = {
  MenuList: undefined;
  MenuItemDetail: { item: MenuItem };
  MenuItemForm: { mode: 'add' | 'edit'; initialData?: MenuItem };
};

type MenuScreenNavigationProp = NativeStackNavigationProp<MenuStackParamList>;

export const MenuScreen = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const route = useRoute();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const vendor = await authService.getCurrentVendor();
        if (!vendor) {
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigation.navigate('Login');
      }
    };

    checkAuth();
  }, [navigation]);

  // Initialize menu service and set up real-time listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupMenuService = async () => {
      try {
        await menuService.initialize();
        
        // Set up real-time listeners
        menuService.onMenuUpdate((items) => {
          setMenuItems(items);
        });

        menuService.onItemAvailabilityChange((item) => {
          setMenuItems(prevItems => 
            prevItems.map(prevItem => 
              prevItem._id === item._id ? item : prevItem
            )
          );
        });
      } catch (error) {
        console.error('Error setting up menu service:', error);
        setError('Failed to initialize menu service');
        navigation.navigate('Login');
      }
    };

    setupMenuService();

    // Cleanup
    return () => {
      menuService.disconnect();
    };
  }, [isAuthenticated, navigation]);

  // Fetch menu items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;

      const fetchMenuItems = async () => {
        try {
          setLoading(true);
          const items = await menuService.getMenuItems();
          setMenuItems(items);
          setError(null);
        } catch (error) {
          console.error('Error fetching menu items:', error);
          if (error instanceof Error && error.message === 'No authentication token found') {
            navigation.navigate('Login');
          } else {
            setError('Failed to fetch menu items');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchMenuItems();
    }, [isAuthenticated, navigation])
  );

  // Handle form submission from MenuItemForm
  useFocusEffect(
    useCallback(() => {
      const params = route.params as { formData?: any; mode?: 'add' | 'edit'; itemId?: string } | undefined;
      
      if (params?.formData) {
        const handleFormSubmission = async () => {
          try {
            setLoading(true);
            if (params.mode === 'add') {
              const response = await menuService.addMenuItem(params.formData);
              console.log('Menu item added successfully:', response);
            } else if (params.mode === 'edit' && params.itemId) {
              const response = await menuService.updateMenuItem(params.itemId, params.formData);
              console.log('Menu item updated successfully:', response);
            }
            // Clear the params after handling
            navigation.setParams({ formData: undefined, mode: undefined, itemId: undefined });
          } catch (error: any) {
            console.error('Error handling form submission:', error);
            setError(error.response?.data?.message || 'Failed to save menu item');
          } finally {
            setLoading(false);
          }
        };

        handleFormSubmission();
      }
    }, [route.params])
  );

  const handleItemPress = useCallback((item: MenuItem) => {
    navigation.navigate('MenuItemDetail', { 
      item,
      onDelete: async () => {
        try {
          await menuService.deleteMenuItem(item._id);
          // Real-time update will handle the UI update
        } catch (error) {
          console.error('Error deleting menu item:', error);
          setError('Failed to delete menu item');
        }
      },
      onEdit: async (updatedItem: MenuItem) => {
        try {
          await menuService.updateMenuItem(item._id, updatedItem);
          // Real-time update will handle the UI update
        } catch (error) {
          console.error('Error updating menu item:', error);
          setError('Failed to update menu item');
        }
      }
    });
  }, [navigation]);

  const handleAddItem = useCallback(() => {
    navigation.navigate('MenuItemForm', {
      mode: 'add'
    });
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
    }
  };

  if (!isAuthenticated) {
    return null; // Will be redirected to Login screen
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="h2" style={styles.title}>Menu Management</Text>
          <Text variant="caption" style={styles.subtitle}>Manage your restaurant's menu items</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text variant="caption" style={styles.errorText}>{error}</Text>
        </View>
      )}
      <MenuSection
        items={menuItems}
        onItemPress={handleItemPress}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: theme.colors.error + '20',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: theme.colors.error,
  },
  logoutButton: {
    padding: 8,
  },
}); 