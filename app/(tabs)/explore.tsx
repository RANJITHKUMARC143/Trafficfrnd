import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, TextInput, Alert, Modal, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { ThemedText, ThemedView } from '@/components';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { API_URL } from '../../vendor-app/src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: number;
};

type PopularItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  rating: number;
};

// Assuming these types are defined elsewhere or need to be defined here
interface Vendor {
  _id: string;
  businessName: string;
  location?: any;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  vendorId: string;
  rating?: number;
}

// Skeleton loader component
const Skeleton = ({ style }: { style?: any }) => (
  <View style={[{ backgroundColor: '#e0e0e0', borderRadius: 8 }, style]} />
);

const VendorItem = React.memo(({ vendor, selectedVendor, onSelect }: any) => (
  <TouchableOpacity
    style={styles.vendorItem}
    onPress={() => onSelect(vendor)}
  >
    <Ionicons name="storefront-outline" size={24} color="#4CAF50" />
    <ThemedText style={styles.vendorName}>{vendor.businessName}</ThemedText>
    <Ionicons 
      name={selectedVendor?._id === vendor._id ? "checkmark-circle" : "ellipse-outline"}
      size={20} 
      color={selectedVendor?._id === vendor._id ? "#4CAF50" : "#ccc"}
    />
  </TouchableOpacity>
));

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
    backgroundColor: '#f0f6f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  vendorPickerText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  vendorList: {
    maxHeight: 300,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
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
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    backgroundColor: '#E8F5E9',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryItems: {
    fontSize: 14,
    color: '#666',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
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
    color: '#4CAF50',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  destinationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  destinationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  destinationModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
  destinationModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  destinationModalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  destinationModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabCartContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 2000,
    elevation: 20,
  },
  fabCart: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  fabCartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  fabCartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendedAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  recommendedAddButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const params = useLocalSearchParams();
  const { locationId = '', locationType = '', locationName = '' } = params;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const [categoryCounts, setCategoryCounts] = useState<{ [cat: string]: number }>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [itemsToShow, setItemsToShow] = useState(4); // For infinite scroll
  const [showSelectDestinationModal, setShowSelectDestinationModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  // Check for destination when component mounts or after login
  useEffect(() => {
    const checkDestination = async () => {
      try {
        if (!isAuthenticated) return;
        const savedDestination = await AsyncStorage.getItem('destination');
        if (!savedDestination) {
          setShowSelectDestinationModal(true);
        } else {
          setShowSelectDestinationModal(false);
        }
      } catch (error) {
        setShowSelectDestinationModal(false);
      }
    };
    checkDestination();
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchCartCount = async () => {
        try {
          const cartData = await AsyncStorage.getItem('cart');
          const cartItems = cartData ? JSON.parse(cartData) : [];
          setCartCount((cartItems as { quantity?: number }[]).reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0));
        } catch {
          setCartCount(0);
        }
      };
      fetchCartCount();
      const interval = setInterval(fetchCartCount, 2000);
      return () => clearInterval(interval);
    }, [])
  );

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
      setSelectedVendor(null); // Default to all vendors
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
      const response = await fetch(`${API_URL}/api/vendors/menu/public/explore/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Update vendors state to only include those with menu items
      const vendorsWithMenuItems = currentVendors.filter(vendor => 
        data.some((item: MenuItem) => item.vendorId === vendor._id)
      );
      setVendors(vendorsWithMenuItems);
      setMenuItems(data);
      // Precompute category counts
      const counts: { [cat: string]: number } = {};
      data.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      setCategoryCounts(counts);
      // Extract unique categories from menu items
      const uniqueCategories = Array.from(new Set(data.map((item: MenuItem) => item.category)));
      setCategories(uniqueCategories as string[]);
      setLastUpdateTime(new Date());
    } catch (error) {
      setMenuItems([]);
      setCategories([]);
      setCategoryCounts({});
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
    };
  }, []); // No dependencies here, as it fetches everything fresh

  const onRefresh = useCallback(() => {
    console.log('onRefresh: Manual refresh triggered.');
    refreshData();
  }, [refreshData]); // Dependency on refreshData to avoid stale closure

  // --- Periodic Refresh ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 120000); // 2 minutes
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshData]);

  // Move handleSearch definition above its first use
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { query: searchQuery }
      });
    }
  }, [searchQuery, router]);

  // Debounced search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (text.trim()) {
        handleSearch();
      }
    }, 400);
  }, [handleSearch]);

  // Memoized handlers
  const memoizedHandleCategoryPress = useCallback((categoryName: string) => {
    router.push({
      pathname: '/category/[id]',
      params: { 
        id: categoryName,
        name: categoryName,
        locationId,
        locationType,
        locationName
      }
    });
  }, [locationId, locationType, locationName, router]);

  const memoizedHandleItemPress = useCallback((item: MenuItem) => {
    // Remove or refactor any code that navigates to '/item/[id]'.
    // If there is a handleItemPress or similar, either remove it or replace it with inline/modal detail logic.
  }, []);

  // Memoized data for FlatList
  const availableMenuItems = useMemo(() => menuItems.filter(item => item.isAvailable).slice(0, 4), [menuItems]);

  // Infinite scroll handler for popular items
  const handleLoadMoreItems = useCallback(() => {
    if (availableMenuItems.length > itemsToShow) {
      setItemsToShow((prev) => Math.min(prev + 4, availableMenuItems.length));
    }
  }, [availableMenuItems, itemsToShow]);

  // Memoized visible items for FlatList
  const visibleMenuItems = useMemo(() => availableMenuItems.slice(0, itemsToShow), [availableMenuItems, itemsToShow]);

  // Memoize filteredMenuItems for FlatList
  const filteredMenuItems = useMemo(() => (
    selectedVendor
      ? menuItems.filter(item => item.vendorId === selectedVendor._id)
      : menuItems
  ), [selectedVendor, menuItems]);

  // Helper for FlatList optimization
  const ITEM_HEIGHT = 120;
  const getItemLayout = (_: unknown, index: number): { length: number; offset: number; index: number } => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  // --- Handlers ---
  const handleAddToCart = async (item: any) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to add items to cart.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.push('/(tabs)/profile')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // ... rest of the existing handleAddToCart code ...
  };

  const handleVendorSelect = async (vendor: Vendor | null) => {
    setSelectedVendor(vendor);
    setVendorModalVisible(false);
    setLoadingMenu(true);
    try {
      if (!vendor) {
        // All Vendors selected
        await fetchAndCombineAllMenuItems(allFetchedVendors);
      } else {
        const items = await fetchMenuItemsForVendor(vendor._id);
        setMenuItems(items);
        // Update categories and categoryCounts for this vendor
        const uniqueCategories = Array.from(new Set(items.map((item: MenuItem) => item.category)));
        setCategories(uniqueCategories as string[]);
        const counts: { [cat: string]: number } = {};
        items.forEach(item => {
          counts[item.category] = (counts[item.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    } catch (error) {
      setMenuItems([]);
      setCategories([]);
      setCategoryCounts({});
    } finally {
      setLoadingMenu(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              value={searchQuery}
              onChangeText={handleSearchChange}
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
          animationType="slide"
          transparent={true}
          onRequestClose={() => setVendorModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setVendorModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Select a Vendor</ThemedText>
              <FlatList
                data={[{ _id: 'all', businessName: 'All Vendors' }, ...allFetchedVendors]}
                keyExtractor={vendor => vendor._id}
                renderItem={({ item }) => (
                  <VendorItem
                    vendor={item}
                    selectedVendor={selectedVendor}
                    onSelect={(v: Vendor) => handleVendorSelect(item._id === 'all' ? null : item)}
                  />
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No vendors available.</ThemedText>}
                style={styles.vendorList}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal for select destination */}
        <Modal
          visible={showSelectDestinationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.destinationModalOverlay}>
            <View style={styles.destinationModalContent}>
              <Ionicons name="navigate" size={48} color="#4CAF50" style={{ marginBottom: 16 }} />
              <ThemedText style={styles.destinationModalTitle}>Select Destination</ThemedText>
              <ThemedText style={styles.destinationModalText}>
                Please select a destination on the map to explore items.
              </ThemedText>
              <TouchableOpacity
                style={styles.destinationModalButton}
                onPress={() => {
                  setShowSelectDestinationModal(false);
                  router.replace('/(tabs)/map');
                }}
              >
                <ThemedText style={styles.destinationModalButtonText}>Go to Map</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Category Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
          {loadingInitialData ? (
            <FlatList
              data={[1,2,3,4]}
              keyExtractor={(item: number) => item.toString()}
              numColumns={2}
              renderItem={(_: { item: number }) => (
                <Skeleton style={{ width: '47%', height: 90, marginBottom: 10 }} />
              )}
              columnWrapperStyle={{ justifyContent: 'space-between', gap: 15, marginBottom: 10 }}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          ) : categories.length === 0 ? (
            <ThemedText style={styles.emptyText}>No categories available</ThemedText>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item: string) => item}
              numColumns={2}
              renderItem={({ item: category }: { item: string }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => memoizedHandleCategoryPress(category)}
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
                    {categoryCounts[category] || 0} items
                  </ThemedText>
                </TouchableOpacity>
              )}
              getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
              initialNumToRender={4}
              windowSize={5}
              removeClippedSubviews={true}
              maxToRenderPerBatch={4}
              columnWrapperStyle={{ justifyContent: 'space-between', gap: 15, marginBottom: 10 }}
              ListEmptyComponent={<ThemedText style={styles.emptyText}>No categories available</ThemedText>}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )}
        </View>

        {/* Menu Items Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Popular Items</ThemedText>
          {loadingInitialData ? (
            <FlatList
              data={[1,2,3,4]}
              keyExtractor={(item: number) => item.toString()}
              renderItem={(_: { item: number }) => (
                <Skeleton style={{ height: 100, borderRadius: 12, marginBottom: 16 }} />
              )}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          ) : visibleMenuItems.length === 0 ? (
            <ThemedText style={styles.emptyText}>No menu items available.</ThemedText>
          ) : (
            <FlatList
              data={filteredMenuItems.slice(0, itemsToShow)}
              keyExtractor={(item: MenuItem) => item._id}
              renderItem={({ item }: { item: MenuItem }) => (
                <TouchableOpacity
                  style={styles.itemCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
                >
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                    <View style={styles.itemFooter}>
                      <ThemedText style={styles.itemPrice}>₹{item.price}</ThemedText>
                      <View style={styles.rating}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '4.5'}</ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.recommendedAddButton}
                      onPress={async (e) => {
                        e.stopPropagation();
                        try {
                          const cartData = await AsyncStorage.getItem('cart');
                          let cartItems = cartData ? JSON.parse(cartData) : [];
                          const existingItemIndex = cartItems.findIndex((i: any) => i.id === item._id);
                          if (existingItemIndex !== -1) {
                            cartItems[existingItemIndex].quantity += 1;
                          } else {
                            cartItems.push({
                              id: item._id,
                              name: item.name,
                              price: item.price,
                              quantity: 1,
                              imageUrl: item.image,
                              vendorId: item.vendorId,
                            });
                          }
                          await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
                          Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
                        } catch (error) {
                          Alert.alert('Error', 'Failed to add item to cart');
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="cart-outline" size={20} color="#fff" />
                      <ThemedText style={styles.recommendedAddButtonText}>Add to Cart</ThemedText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              getItemLayout={getItemLayout}
              initialNumToRender={6}
              windowSize={7}
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              onEndReached={handleLoadMoreItems}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<ThemedText style={styles.emptyText}>No menu items available.</ThemedText>}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )}
        </View>
      </ScrollView>
      {/* Floating Cart Button */}
      <View style={styles.fabCartContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fabCart}
          onPress={() => router.push('/cart')}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={28} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.fabCartBadge}>
              <ThemedText style={styles.fabCartBadgeText}>{cartCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>
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
