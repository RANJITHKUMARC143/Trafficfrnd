import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, View, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@cmp/ThemedView';
import { ThemedText } from '@cmp/ThemedText';
import { MenuItem } from '@lib/types/menu';
import { menuService } from '@lib/services/menuService';
import MenuItemCard from '@cmp/_components/MenuItemCard';
import { Ionicons } from '@expo/vector-icons';

export default function ItemsScreen() {
  const { vendorId, category } = useLocalSearchParams<{ vendorId: string; category: string }>();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'preparationTime'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const menuItems = await menuService.getMenuItems(vendorId);
      setItems(menuItems);
    } catch (err) {
      console.error('Error loading menu items:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();

    // Subscribe to menu updates
    const unsubscribe = menuService.onMenuUpdate((updatedItems) => {
      console.log('Received menu update:', updatedItems);
      setItems(updatedItems);
    });

    return () => {
      unsubscribe();
    };
  }, [vendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const filteredAndSortedItems = useCallback(() => {
    let filtered = items;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'preparationTime':
          comparison = (a.preparationTime || 0) - (b.preparationTime || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, searchQuery, category, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <ThemedText style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
            Name
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
          onPress={() => setSortBy('price')}
        >
          <ThemedText style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
            Price
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'preparationTime' && styles.sortButtonActive]}
          onPress={() => setSortBy('preparationTime')}
        >
          <ThemedText style={[styles.sortButtonText, sortBy === 'preparationTime' && styles.sortButtonTextActive]}>
            Time
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortOrderButton} onPress={toggleSortOrder}>
          <Ionicons
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={20}
            color="#3d7a00"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#3d7a00" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadItems}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredAndSortedItems()}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <MenuItemCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color="#666" />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'No items found matching your search' : 'No items available'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  sortButtonActive: {
    backgroundColor: '#E8F5E9',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#3d7a00',
    fontWeight: '600',
  },
  sortOrderButton: {
    padding: 6,
  },
  listContent: {
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3d7a00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
}); 