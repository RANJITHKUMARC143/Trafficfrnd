import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { BlurView } from 'expo-blur';
import { Text } from './Text';
import { MenuItem } from '../services/menuService';
import { useNavigation } from '@react-navigation/native';
import { menuService } from '../services/menuService';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MenuStackParamList = {
  MenuList: undefined;
  MenuItemDetail: { item: MenuItem };
  MenuItemForm: { mode: 'add' | 'edit'; initialData?: MenuItem };
};

type TabParamList = {
  Menu: undefined;
};

type MenuSectionNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MenuStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

interface MenuSectionProps {
  items: MenuItem[];
  onItemPress: (item: MenuItem) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  items,
  onItemPress,
  loading = false,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigation = useNavigation<MenuSectionNavigationProp>();

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)));
    return ['All', ...uniqueCategories];
  }, [items]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || selectedCategory === null || 
                            item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleAddItem = () => {
    navigation.navigate('Menu', {
      screen: 'MenuItemForm',
      params: {
        mode: 'add'
      }
    });
  };

  const handleEditItem = (item: MenuItem) => {
    navigation.navigate('Menu', {
      screen: 'MenuItemForm',
      params: {
        mode: 'edit',
        initialData: item,
      }
    });
  };

  const handleDeleteItem = async (item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await menuService.deleteMenuItem(item._id);
              onRefresh?.();
            } catch (error) {
              console.error('Error deleting menu item:', error);
              Alert.alert('Error', 'Failed to delete menu item');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuService.updateMenuItem(item._id, {
        ...item,
        isAvailable: !item.isAvailable,
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error updating item availability:', error);
      Alert.alert('Error', 'Failed to update item availability');
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => onItemPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={styles.itemImage}
      />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text variant="body" style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity
            style={[
              styles.availabilityBadge,
              { backgroundColor: item.isAvailable ? theme.colors.success : theme.colors.error }
            ]}
            onPress={() => handleToggleAvailability(item)}
          >
            <Text variant="caption" style={styles.availabilityText}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text variant="caption" style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.itemFooter}>
          <Text variant="body" style={styles.itemPrice}>₹{item.price}</Text>
          <Text variant="caption" style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditItem(item)}
          >
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Ionicons name="trash" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" style={styles.loadingText}>Loading menu items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
          >
            <Text 
              variant="caption"
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Menu Items */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={theme.colors.textSecondary} />
            <Text variant="body" style={styles.emptyText}>No items found</Text>
          </View>
        }
      />

      {/* Add Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <BlurView intensity={80} style={styles.addButtonBlur}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  itemCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  addButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
  },
}); 