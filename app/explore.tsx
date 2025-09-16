import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
const API_URL = 'https://trafficfrnd-2.onrender.com';

type Vendor = {
  _id: string;
  businessName: string;
  // Add other vendor properties you might use
};

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  customizationOptions: any[];
  nutritionalInfo: any;
  allergens: string[];
  vendorId: string;
  vendorName: string; // Added to easily display vendor info with menu item
};

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allFetchedVendors, setAllFetchedVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // --- API Fetching Functions ---
  const fetchVendors = async (): Promise<Vendor[]> => {
    try {
      console.log('fetchVendors: Fetching public vendors from:', `${API_URL}/api/vendors/public`);
      const response = await fetch(`${API_URL}/api/vendors/public`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('fetchVendors: Fetched vendors count:', data.length);
      setAllFetchedVendors(data); // Store all fetched vendors

      // Optionally, set the first vendor as selected initially
      if (data.length > 0 && data[0]._id) {
        setSelectedVendor(data[0]);
      } else {
        setSelectedVendor(null);
      }
      return data;
    } catch (err) {
      console.error('fetchVendors: Error fetching vendors:', err);
      Alert.alert('Error', 'Failed to fetch vendors. Please try again.');
      return [];
    }
  };

  const fetchMenuItemsForVendor = async (vendorId: string): Promise<MenuItem[]> => {
    if (!vendorId) {
      console.log('fetchMenuItemsForVendor: No vendor ID provided, skipping fetch.');
      return [];
    }
    try {
      const url = `${API_URL}/api/vendors/menu/public/${vendorId}`;
      console.log('fetchMenuItemsForVendor: Fetching menu items from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`fetchMenuItemsForVendor: Fetched ${data.length} items for vendor ${vendorId}`);
      return data;
    } catch (err) {
      console.error(`fetchMenuItemsForVendor: Error fetching menu items for vendor ${vendorId}:`, err);
      return [];
    }
  };

  const fetchAndCombineAllMenuItems = async (currentVendors: Vendor[]) => {
    setLoadingMenu(true);
    try {
      console.log('fetchAndCombineAllMenuItems: Starting to fetch all menu items...');
      const response = await fetch(`${API_URL}/api/vendors/menu/public/explore/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`fetchAndCombineAllMenuItems: Fetched ${data.length} menu items`);
      
      // Update vendors state to only include those with menu items
      const vendorsWithMenuItems = currentVendors.filter(vendor => 
        data.some((item: MenuItem) => item.vendorId === vendor._id)
      );
      setVendors(vendorsWithMenuItems);
      setMenuItems(data);

      // Extract unique categories from menu items
      const uniqueCategories = Array.from(new Set(data.map((item: MenuItem) => item.category)));
      setCategories(uniqueCategories);
      
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('fetchAndCombineAllMenuItems: Error fetching menu items:', error);
      Alert.alert('Error', 'Failed to fetch menu items. Please try again.');
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  // --- Initial Data Load (Vendors & Menu Items) ---
  useEffect(() => {
    const initializeData = async () => {
      console.log('initializeData: Starting initial data fetch...');
      setLoadingInitialData(true);
      try {
        const vendorsData = await fetchVendors(); // This sets allFetchedVendors and selectedVendor
        await fetchAndCombineAllMenuItems(vendorsData); // Fetch menus for all these vendors
      } catch (error) {
        console.error('initializeData: Error during initial data fetch:', error);
      } finally {
        setLoadingInitialData(false);
      }
    };
    initializeData();
  }, []); // Runs only once on component mount

  // --- Refresh Logic ---
  const refreshData = useCallback(async () => {
    console.log('refreshData: Starting refresh...');
    setRefreshing(true);
    try {
      const refreshedVendors = await fetchVendors(); // Fetches and updates allFetchedVendors & selectedVendor
      await fetchAndCombineAllMenuItems(refreshedVendors);
      setLastUpdateTime(new Date());
      console.log('refreshData: Refresh completed successfully.');
    } catch (error) {
      console.error('refreshData: Error during refresh:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []); // No dependencies here, as it fetches everything fresh

  const onRefresh = useCallback(() => {
    console.log('onRefresh: Manual refresh triggered.');
    refreshData();
  }, [refreshData]); // Dependency on refreshData to avoid stale closure

  // --- Periodic Refresh ---
  useEffect(() => {
    console.log('useEffect[periodic]: Setting up periodic refresh.');
    const intervalId = setInterval(() => {
      console.log('useEffect[periodic]: Periodic refresh triggered.');
      refreshData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      console.log('useEffect[periodic]: Cleaning up periodic refresh.');
      clearInterval(intervalId);
    };
  }, [refreshData]); // Dependency on refreshData

  // --- Handlers ---
  const handleCategoryPress = (categoryName: string) => {
    // You can filter menu items by category here, or navigate to a dedicated category screen
    router.push({
      pathname: '/items', // Assuming an items screen to show filtered items
      params: { category: categoryName }
    });
  };

  const handleItemPress = (item: MenuItem) => {
    // Remove or refactor any code that navigates to '/item/[id]'.
    // If there is a handleItemPress or similar, either remove it or replace it with inline/modal detail logic.
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { query: searchQuery }
      });
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={[styles.vendorPicker, { backgroundColor: '#E8F5E9' }]}
          onPress={() => setVendorModalVisible(true)}
        >
          <Ionicons name="storefront" size={20} color="#4CAF50" />
          <ThemedText style={[styles.vendorPickerText, { color: '#4CAF50' }]}>
            {selectedVendor ? selectedVendor.businessName : loadingInitialData ? 'Loading vendors...' : 'Select Vendor'}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Vendor Picker Modal */}
      <Modal
        visible={vendorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVendorModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVendorModalVisible(false)}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Select a Vendor</ThemedText>
            {loadingInitialData ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : allFetchedVendors.length === 0 ? (
              <ThemedText style={styles.emptyText}>No vendors available.</ThemedText>
            ) : (
              <FlatList
                data={allFetchedVendors} // Display all vendors in modal
                keyExtractor={v => v._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.vendorOption}
                    onPress={() => handleVendorSelect(item)}
                  >
                    <Ionicons name="storefront" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.vendorName}>{item.businessName}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      <FlatList
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
            title="Refreshing..."
            titleColor="#4CAF50"
          />
        }
        data={[
          { type: 'header', id: 'header' },
          { type: 'categories', id: 'categories' },
          { type: 'menu', id: 'menu' }
        ]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.lastUpdateContainer}>
                <ThemedText style={styles.lastUpdateText}>
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </ThemedText>
                {refreshing && (
                  <View style={styles.refreshIndicator}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <ThemedText style={styles.refreshText}>Refreshing...</ThemedText>
                  </View>
                )}
              </View>
            );
          }
          
          if (item.type === 'categories') {
            return (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
                <View style={styles.categoriesGrid}>
                  {loadingInitialData ? (
                    <ActivityIndicator size="large" color="#4CAF50" />
                  ) : categories.length === 0 ? (
                    <ThemedText style={styles.emptyText}>No categories available</ThemedText>
                  ) : (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={styles.categoryCard}
                        onPress={() => handleCategoryPress(category)}
                      >
                        <View style={styles.categoryIcon}>
                          <Ionicons 
                            name={getCategoryIcon(category)} 
                            size={28} 
                            color="#4CAF50" 
                          />
                        </View>
                        <ThemedText style={styles.categoryName}>{category}</ThemedText>
                        <ThemedText style={styles.categoryItems}>
                          {menuItems.filter(item => item.category === category).length} items
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            );
          }
          
          if (item.type === 'menu') {
            return (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                  {selectedVendor ? `${selectedVendor.businessName}'s Menu` : 'All Menu Items'}
                </ThemedText>
                {loadingInitialData || loadingMenu ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : menuItems.length === 0 ? (
                  <ThemedText style={styles.emptyText}>No menu items available.</ThemedText>
                ) : (
                  menuItems
                    .filter(item => !selectedVendor || item.vendorId === selectedVendor._id)
                    .map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.itemCard}
                        onPress={() => handleItemPress(item)}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemImage}
                          defaultSource={{ uri: 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image' }}
                        />
                        <View style={styles.itemInfo}>
                          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                          <ThemedText style={styles.itemVendorName}>{item.vendorName}</ThemedText>
                          <ThemedText style={styles.itemDescription} numberOfLines={2}>
                            {item.description}
                          </ThemedText>
                          <View style={styles.itemFooter}>
                            <ThemedText style={styles.itemPrice}>₹{item.price.toFixed(2)}</ThemedText>
                            <ThemedText style={styles.preparationTime}>
                              {item.preparationTime} mins
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                )}
              </View>
            );
          }
          
          return null;
        }}
      />
    </ThemedView>
  );
}

// Helper function to get category icon
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Fast Food': 'fast-food',
    'Groceries': 'basket',
    'Pharmacy': 'medical',
    'Electronics': 'phone-portrait',
    'Beverages': 'cafe',
    'Desserts': 'ice-cream',
    'Snacks': 'pizza',
    'Main Course': 'restaurant',
    'Appetizers': 'wine',
    'default': 'restaurant'
  };
  return categoryIcons[category] || categoryIcons.default;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  vendorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Light green background for visibility
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
    justifyContent: 'center',
  },
  vendorPickerText: {
    flex: 1,
    fontSize: 16,
    color: '#4CAF50', // Green text for visibility
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '70%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  vendorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  lastUpdateContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 5,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryItems: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemVendorName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  preparationTime: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 