import 'react-native-get-random-values';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, View, Image, Alert, Platform, Linking, Dimensions, Animated, KeyboardAvoidingView, Text, Modal, FlatList, Keyboard } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapViewDirections from 'react-native-maps-directions';
import { menuService } from '@lib/services/menuService';
import { sendClickToCall } from '@lib/services/callService';
import { MenuItem } from '@lib/types/menu';
import LottieView from '@cmp/LottieFallback';
import { useFocusEffect } from '@react-navigation/native';
import { useMemo } from 'react';
import { fetchUserOrders } from '@lib/services/orderService';
import { BlurView } from 'expo-blur';

type Category = {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type RecommendedItem = {
  id: number;
  name: string;
  image: any;
  price: string;
  time: string;
  type: 'S-scoter' | 'E-scoter' | 'Walker';
};

type DeliveryBuddy = {
  id: string;
  name: string;
  distance: string;
  rating: number;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'available' | 'busy';
};

type DeliveryRoute = {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  duration: string;
  distance: string;
  trafficDensity: 'low' | 'medium' | 'high';
};

type RoutePoint = {
  latitude: number;
  longitude: number;
  address: string;
};

type TrafficLocation = {
  id: string;
  name: string;
  type: 'traffic' | 'busstop' | 'signal';
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
};

type GroceryCategory = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: number;
};

type RouteOption = {
  id: string;
  name: string;
  duration: string;
  distance: string;
  trafficDensity: 'low' | 'medium' | 'high';
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
};

export default function HomeScreen() {
  const [location, setLocation] = useState<string>("Detecting your location...");
  const [locationCoords, setLocationCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [nearestBuddy, setNearestBuddy] = useState<DeliveryBuddy>({
    id: 'DB1',
    name: 'Rahul S.',
    distance: '500 m',
    rating: 4.8,
    location: {
      latitude: 12.9716,  // Default coordinates (will be updated)
      longitude: 77.5946,
    },
    status: 'available'
  });
  const [deliveryRoute, setDeliveryRoute] = useState<DeliveryRoute | null>(null);
  const buttonAnimation = React.useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [appMode, setAppMode] = useState<'travel' | 'home'>('home');
  const [orderMode, setOrderMode] = useState<'drive' | 'home'>('drive');
  const [nearbyLocations, setNearbyLocations] = useState<TrafficLocation[]>([]);
  const [showLocationSelection, setShowLocationSelection] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TrafficLocation | null>(null);
  const [showGroceryCategories, setShowGroceryCategories] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [trafficLocations, setTrafficLocations] = useState<TrafficLocation[]>([]);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [topRatedItems, setTopRatedItems] = useState<MenuItem[]>([]);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  // One-time provider token initializer for Expo Go runtime
  useEffect(() => {
    (async () => {
      try {
        const key = 'provider_access_token';
        const existing = await AsyncStorage.getItem(key);
        if (!existing) {
          await AsyncStorage.setItem(key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE3NTgxLCJ1c2VybmFtZSI6IlJhbmppdGg2OTk0MiIsIm1haW5fdXNlciI6MTc1ODEsImlhdCI6MTc1NTA3ODYyN30.smgBagz6Kv91uwx__ZtaL6ZPnICOevmp__FXPp4aWys');
        }
      } catch {}
    })();
  }, []);
  const handleClickToCall = async (fromNumber: string, toNumber: string) => {
    try {
      if (!fromNumber || !toNumber) {
        Alert.alert('Click To Call', 'Both from and to numbers are required.');
        return;
      }
      const res = await sendClickToCall({ from_number: fromNumber, to_number: toNumber });
      if (res.success) {
        Alert.alert('Click To Call', res.message || 'Call initiated successfully');
      } else {
        Alert.alert('Click To Call Failed', res.message || 'Unable to initiate call');
      }
    } catch (e: any) {
      Alert.alert('Click To Call Error', e?.message || 'Unexpected error');
    }
  };
  const [searchSuggestions, setSearchSuggestions] = useState<MenuItem[]>([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [heroAnimation] = useState(new Animated.Value(0));
  const [cardAnimations] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [callButtonAnimation] = useState(new Animated.Value(0));
  const [callButtonPulse] = useState(new Animated.Value(1));
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches] = useState(['Chicken Biryani', 'Chicken Curry', 'Chicken Tikka', 'Pizza', 'Burger', 'Coffee', 'Snacks', 'Drinks']);
  const [searchAnimation] = useState(new Animated.Value(0));

  // Load user's active order and update every 20s
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const loadActiveOrder = async () => {
        try {
          const orders = await fetchUserOrders();
          const active = (orders || []).find((o: any) =>
            ['confirmed','preparing','enroute','ready'].includes(String(o?.status || '').toLowerCase())
          );
          if (mounted) setActiveOrderId(active?._id || null);
        } catch (e) {
          if (mounted) setActiveOrderId(null);
        }
      };
      loadActiveOrder();
      const t = setInterval(loadActiveOrder, 20000);
      return () => { mounted = false; clearInterval(t); };
    }, [])
  );

  const [searchFilters, setSearchFilters] = useState({
    category: '',
    priceRange: '',
    rating: '',
    sortBy: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchBarFloating, setSearchBarFloating] = useState(false);
  const [searchBarAnimation] = useState(new Animated.Value(0));

  // Fallback menu items for when API is down
  const fallbackMenuItems: MenuItem[] = [
    {
      _id: '1',
      name: 'Chicken Biryani',
      description: 'Spicy and aromatic rice with tender chicken',
      price: 250,
      category: 'Main Course',
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d4d9?w=400',
      vendorId: 'vendor1',
      rating: 4.5,
      isAvailable: true,
      preparationTime: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      name: 'Chicken Curry',
      description: 'Rich and creamy chicken curry with spices',
      price: 180,
      category: 'Main Course',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      vendorId: 'vendor2',
      rating: 4.3,
      isAvailable: true,
      preparationTime: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '3',
      name: 'Chicken Tikka',
      description: 'Grilled chicken pieces with aromatic spices',
      price: 220,
      category: 'Appetizer',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
      vendorId: 'vendor3',
      rating: 4.7,
      isAvailable: true,
      preparationTime: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '4',
      name: 'Mutton Biryani',
      description: 'Fragrant basmati rice with tender mutton',
      price: 300,
      category: 'Main Course',
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d4d9?w=400',
      vendorId: 'vendor1',
      rating: 4.6,
      isAvailable: true,
      preparationTime: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '5',
      name: 'Paneer Butter Masala',
      description: 'Creamy tomato curry with soft paneer',
      price: 200,
      category: 'Main Course',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      vendorId: 'vendor2',
      rating: 4.4,
      isAvailable: true,
      preparationTime: 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  useEffect(() => {
    getCurrentLocation();
    // Set up location subscription
    let locationSubscription: Location.LocationSubscription;
    
    const setupLocationUpdates = async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            setLocationCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            updateAddress(location.coords);
          }
        );
      } catch (error) {
        console.error('Error setting up location updates:', error);
      }
    };

    setupLocationUpdates();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    loadAppMode();
    loadSearchHistory();
    
    // Start hero animation
    Animated.timing(heroAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Start card animations with delay
    Animated.timing(cardAnimations, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Start floating button animations
    Animated.timing(callButtonAnimation, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();
    
    // Start call button pulse animation
    const createCallPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(callButtonPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(callButtonPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => createCallPulseAnimation());
    };
    createCallPulseAnimation();
    
    // Start pulse animation for add buttons
    const createPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => createPulseAnimation());
    };
    createPulseAnimation();
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingRecommended(true);
    // Fetch all menu items initially
    menuService.getAllMenuItems().then((items) => {
      if (mounted) {
        if (items.length > 0) {
        // Recommend the last added (newest) products
        const sortedByDate = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecommendedItems(sortedByDate.slice(0, 10));
        } else {
          // Use fallback data if no items from API
          setRecommendedItems(fallbackMenuItems.slice(0, 10));
        }
        setLoadingRecommended(false);
      }
    }).catch((error) => {
      console.error('Error fetching recommended items:', error);
      if (mounted) {
        // Use fallback data on error
        setRecommendedItems(fallbackMenuItems.slice(0, 10));
        setLoadingRecommended(false);
      }
    });
    // Subscribe to real-time updates
    const unsubscribe = menuService.onMenuUpdate((items) => {
      if (mounted) {
        if (items.length > 0) {
        const sortedByDate = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecommendedItems(sortedByDate.slice(0, 10));
        } else {
          setRecommendedItems(fallbackMenuItems.slice(0, 10));
        }
      }
    });
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingTopRated(true);
    menuService.getAllMenuItems().then((items) => {
      if (mounted) {
        if (items.length > 0) {
          // Top Rated: show 10 most popular items by rating
          const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTopRatedItems(sorted.slice(0, 10));
        } else {
          // Use fallback data if no items from API
          setTopRatedItems(fallbackMenuItems.slice(0, 10));
        }
        setLoadingTopRated(false);
      }
    }).catch((error) => {
      console.error('Error fetching top-rated items:', error);
      if (mounted) {
        // Use fallback data on error
        setTopRatedItems(fallbackMenuItems.slice(0, 10));
        setLoadingTopRated(false);
      }
    });
    // Subscribe to real-time updates
    const unsubscribeTopRated = menuService.onMenuUpdate((items) => {
      if (mounted) {
        if (items.length > 0) {
        const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTopRatedItems(sorted.slice(0, 10));
        } else {
          setTopRatedItems(fallbackMenuItems.slice(0, 10));
        }
      }
    });
    return () => {
      mounted = false;
      if (unsubscribeTopRated) unsubscribeTopRated();
    };
  }, []);

  const loadAppMode = async () => {
    try {
      const mode = await AsyncStorage.getItem('appMode');
      if (mode === 'travel' || mode === 'home') {
        setAppMode(mode);
      }
    } catch (error) {
      console.error('Error loading app mode:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (query: string) => {
    try {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const updateAddress = async (coords: { latitude: number; longitude: number }) => {
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results[0]) {
        const result = results[0];
        let addressComponents = [];

        // Build address based on available components
        if (result.name) addressComponents.push(result.name);
        if (result.street) {
          // If name is part of street address, don't duplicate it
          if (!result.name || !result.street.includes(result.name)) {
            addressComponents.push(result.street);
          }
        }
        if (result.subregion) addressComponents.push(result.subregion);
        if (result.district) addressComponents.push(result.district);
        if (result.city) addressComponents.push(result.city);
        
        // Filter out any undefined or empty strings and join with commas
        const address = addressComponents
          .filter(Boolean)
          .join(', ');

        setLocation(address || 'Location not found');
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      setLocation('Error getting address');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocation('Fetching location...');
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location services in your device settings to get delivery options in your area.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Platform.OS === 'ios' ? 
                Linking.openURL('app-settings:') : 
                Linking.openSettings() 
            }
          ]
        );
        return;
      }

      // Get initial location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setLocationCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      await updateAddress(location.coords);

    } catch (error) {
      console.error('Error getting location:', error);
      setLocation('Error getting location');
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your device settings and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const categories: Category[] = [
    { id: 1, name: 'Snacks', icon: 'cafe-outline' },
    { id: 2, name: 'Cool Drinks', icon: 'beer-outline' },
    { id: 3, name: 'Pharmacy', icon: 'medical-outline' },
    { id: 4, name: 'Electronics', icon: 'phone-portrait-outline' }
  ];

  const handleCategoryPress = (category: Category) => {
    // Only allow navigation for the first 4 categories
    if ([1, 2, 3, 4].includes(category.id)) {
      router.push({
        pathname: '/explore',
        params: { category: category.name }
      });
    }
  };

  const handleItemPress = (item: RecommendedItem) => {
    router.push({
      pathname: `/item/${item.id}`,
      params: {
        itemId: item.id.toString(),
        itemName: item.name,
        itemPrice: item.price,
        itemImageUrl: item.image.uri,
        itemDescription: `Delivery Time: ${item.time} • Delivery Type: ${item.type}`,
        category: 'Recommended'
      }
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim());
      router.push({
        pathname: '/search' as any,
        params: { q: searchQuery }
      });
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    // Add a small delay to allow for suggestion taps
    setTimeout(() => {
      setSearchFocused(false);
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 150);
  };

  const handleSuggestionPress = (item: MenuItem) => {
    setSearchQuery(item.name);
    setSearchSuggestions([]);
    saveSearchHistory(item.name);
    router.push({ pathname: '/item/[id]', params: { id: item._id } });
  };

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    setSearchSuggestions([]);
    router.push({
      pathname: '/search' as any,
      params: { q: query }
    });
  };

  const handlePopularSearchPress = (query: string) => {
    setSearchQuery(query);
    setSearchSuggestions([]);
    saveSearchHistory(query);
    router.push({
      pathname: '/search' as any,
      params: { q: query }
    });
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      'Status Changed',
      `You are now ${!isOnline ? 'online' : 'offline'}`,
      [{ text: 'OK' }]
    );
  };

  // Update nearest buddy location based on user's location
  useEffect(() => {
    if (locationCoords) {
      // In a real app, you would fetch the nearest buddy from your backend
      // For now, we'll simulate a buddy nearby
      setNearestBuddy(prev => ({
        ...prev,
        location: {
          latitude: locationCoords.latitude + 0.001, // Slightly offset from user
          longitude: locationCoords.longitude + 0.001,
        }
      }));
    }
  }, [locationCoords]);

  // Update delivery route when location changes
  useEffect(() => {
    if (locationCoords && nearestBuddy) {
      // Simulate a route between user and delivery buddy
      // In a real app, you would use a routing service
      const simulatedRoute = {
        coordinates: [
          locationCoords,
          { 
            latitude: (locationCoords.latitude + nearestBuddy.location.latitude) / 2,
            longitude: (locationCoords.longitude + nearestBuddy.location.longitude) / 2
          },
          nearestBuddy.location
        ],
        duration: '15 mins',
        distance: '2.5 km',
        trafficDensity: 'medium' as const
      };
      setDeliveryRoute(simulatedRoute);
    }
  }, [locationCoords, nearestBuddy]);

  const getRouteColor = (density: DeliveryRoute['trafficDensity']) => {
    switch (density) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFA000';
      case 'high': return '#D32F2F';
      default: return '#4CAF50';
    }
  };

  const findNearbyLocations = async () => {
    if (!locationCoords) return;

    // Generate random delivery points around the user's current location
    const generateRandomPoint = (baseLat: number, baseLng: number, radiusKm: number) => {
      const radiusDegrees = radiusKm / 111.32;
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusDegrees;
      
      const lat = baseLat + (distance * Math.cos(angle));
      const lng = baseLng + (distance * Math.sin(angle));
      
      return { latitude: lat, longitude: lng };
    };

    // Generate 3 random delivery points with distinct names and types
    const deliveryPoints: TrafficLocation[] = [
      // Traffic Signal Point
      {
        id: 'traffic_1',
        name: 'Main Street Signal',
        type: 'traffic',
        location: generateRandomPoint(locationCoords.latitude, locationCoords.longitude, 0.5),
        distance: Math.random() * 0.5 + 0.1, // 0.1-0.6 km
      },
      // Bus Stop Point
      {
        id: 'busstop_1',
        name: 'Central Bus Stop',
        type: 'busstop',
        location: generateRandomPoint(locationCoords.latitude, locationCoords.longitude, 0.8),
        distance: Math.random() * 0.8 + 0.2, // 0.2-1.0 km
      },
      // Signal Junction Point
      {
        id: 'signal_1',
        name: 'Market Junction',
        type: 'signal',
        location: generateRandomPoint(locationCoords.latitude, locationCoords.longitude, 1.2),
        distance: Math.random() * 1.2 + 0.3, // 0.3-1.5 km
      }
    ];

    // Sort by distance (closest first)
    deliveryPoints.sort((a, b) => a.distance - b.distance);
    
    // Update state with all three points
    setNearbyLocations(deliveryPoints);
    setShowLocationSelection(true);
  };

  const groceryCategories: GroceryCategory[] = [
    { id: 'snacks', name: 'Chips & Nuts', icon: 'cafe-outline', items: 45 },
    { id: 'drinks', name: 'Cool Drinks', icon: 'beer-outline', items: 38 },
    { id: 'pharmacy', name: 'Health Care', icon: 'medical-outline', items: 56 },
    { id: 'electronics', name: 'Gadgets', icon: 'phone-portrait-outline', items: 32 }
  ];

  const handleLocationSelect = async (selectedLocation: TrafficLocation) => {
    // Save selected location to AsyncStorage
    try {
      await AsyncStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    } catch (error) {
      console.error('Error saving selected location:', error);
    }

    // Update state
    setSelectedLocation(selectedLocation);
    setShowLocationSelection(false);
    
    // Create a new destination object
    const newDestination = {
      latitude: selectedLocation.location.latitude,
      longitude: selectedLocation.location.longitude,
      address: selectedLocation.name
    };
    setTrafficLocations([]);
    
    // Find nearby locations
    findNearbyLocations();
  };

  const handleGroceryCategorySelect = (category: GroceryCategory) => {
    router.push({
      pathname: '/items',
      params: {
        locationId: selectedLocation?.id,
        locationType: selectedLocation?.type,
        locationName: selectedLocation?.name,
        categoryId: category.id,
        categoryName: category.name
      },
    });
  };

  const generateRouteOptions = () => {
    if (!locationCoords) return [];

    // Generate 3 different route options with varying traffic conditions
    const options: RouteOption[] = [
      {
        id: 'route1',
        name: 'Fastest Route',
        duration: '25 mins',
        distance: '3.2 km',
        trafficDensity: 'low',
        coordinates: [
          locationCoords,
          { latitude: locationCoords.latitude, longitude: locationCoords.longitude }
        ]
      },
      {
        id: 'route2',
        name: 'Alternative Route',
        duration: '30 mins',
        distance: '3.8 km',
        trafficDensity: 'medium',
        coordinates: [
          locationCoords,
          { 
            latitude: locationCoords.latitude + 0.001, 
            longitude: locationCoords.longitude + 0.001 
          },
          { latitude: locationCoords.latitude, longitude: locationCoords.longitude }
        ]
      },
      {
        id: 'route3',
        name: 'Scenic Route',
        duration: '35 mins',
        distance: '4.1 km',
        trafficDensity: 'high',
        coordinates: [
          locationCoords,
          { 
            latitude: locationCoords.latitude - 0.001, 
            longitude: locationCoords.longitude - 0.001 
          },
          { latitude: locationCoords.latitude, longitude: locationCoords.longitude }
        ]
      }
    ];

    return options;
  };

  const handleRouteSelect = (route: RouteOption) => {
    setSelectedRoute(route);
    setDeliveryRoute({
      coordinates: route.coordinates,
      duration: route.duration,
      distance: route.distance,
      trafficDensity: route.trafficDensity
    });
    setShowRouteOptions(false);
    findNearbyLocations();
  };

  // Ensures Indian numbers are sent in strict E.164 format: +91XXXXXXXXXX
  const sanitizeIndianNumber = (input: string): string => {
    if (!input) return input;
    // Keep leading + if present for quick checks, but build from digits
    const digits = (input.match(/\d+/g) || []).join('');
    if (!digits) return input;

    // Remove leading zeros
    const trimmed = digits.replace(/^0+/, '');

    // Already starts with 91 and has 12 digits total -> +91XXXXXXXXXX
    if (/^91\d{10}$/.test(trimmed)) {
      return `+${trimmed}`;
    }

    // If 10-digit mobile, prefix +91
    if (/^\d{10}$/.test(trimmed)) {
      return `+91${trimmed}`;
    }

    // If user typed +91 but parser lost +, or variations like 0XXXXXXXXXX
    const last10 = trimmed.slice(-10);
    if (/^\d{10}$/.test(last10)) {
      return `+91${last10}`;
    }

    // Fallback: if input already looked like +91..., preserve it; else return with + prefix
    if (input.startsWith('+')) return input;
    return `+${trimmed}`;
  };

  // Formats number as provider expects: always send 10-digit local number to provider
  const formatForProvider = (input: string): string => {
    const digits = (input.match(/\d+/g) || []).join('');
    return digits.slice(-10);
  };

  const handleDirectCall = async () => {
    // Fetch restaurant number from backend
    let restaurantNumber = '+91-9876543210'; // Default fallback
    
    try {
      console.log('Fetching restaurant phone number from API...');
      const { API_URL } = await import('@src/config');
      const response = await fetch(`${API_URL}/api/settings/phone-number`);
      if (response.ok) {
        const data = await response.json();
        restaurantNumber = data.phoneNumber || restaurantNumber;
        console.log('Restaurant phone number:', restaurantNumber);
    } else {
        console.log('API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error fetching restaurant phone number:', error);
      // Use default number if API fails
    }
    
    // Get user phone number from auth storage; fallback to default if missing
    let userPhoneNumber = '+91-9876543211';
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.phone) {
          userPhoneNumber = String(parsedUser.phone);
        }
      }
    } catch (e) {
      console.log('Could not read user phone from storage, using fallback');
    }
    const sanitizedFrom = sanitizeIndianNumber(userPhoneNumber);
    const sanitizedTo = sanitizeIndianNumber(restaurantNumber);
    
    Alert.alert(
      'Call to Order',
      `Connect to Traffic Frnd to place your order`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          onPress: () => initiateClickToCall(sanitizedFrom, sanitizedTo)
        }
      ]
    );
  };

  const initiateClickToCall = async (fromNumber: string, toNumber: string) => {
    const fromSanitized = sanitizeIndianNumber(fromNumber);
    const toSanitized = sanitizeIndianNumber(toNumber);
    const fromForProvider = formatForProvider(fromSanitized);
    const toForProvider = formatForProvider(toSanitized);
    console.log('Initiating click to call:', { fromNumber: fromSanitized, toNumber: toSanitized });
    
    try {
      Alert.alert('Connecting...', 'Please wait while we connect your call');
      // Try with E.164 normalization, include provider auth token if present
      let token: string | null = null;
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        token = (await AsyncStorage.getItem('provider_access_token')) || (await AsyncStorage.getItem('access_token')) || null;
      } catch {}
      // Fallback: use hardcoded token if provided via env/config
      const providedToken = process.env.EXPO_PUBLIC_CALL_TOKEN || token || undefined;

      let result = await sendClickToCall(
        { from_number: fromForProvider, to_number: toForProvider },
        { authToken: providedToken }
      );
      if (!result?.success && result?.statusCode === 401) {
        // Provide clearer guidance for 401
        Alert.alert('Unauthorized (401)', 'The call service rejected the request. Please ensure your provider credentials are configured and try again.');
      }
      if (!result?.success) {
        // Retry with raw sanitized numbers without forcing 10-digit
        result = await sendClickToCall(
          { from_number: fromSanitized, to_number: toSanitized },
          { authToken: providedToken }
        );
      }
      if (result?.success) {
        Alert.alert(
          'Call Initiated!',
          (result as any)?.message || 'You will receive a call shortly.',
          [{ text: 'OK' }]
        );
      } else {
        const message = (result as any)?.message || 'Unable to connect your call. Please try again or call directly.';
        Alert.alert(
          'Call Failed',
          message,
          [
            { text: 'OK' },
            {
              text: 'Call Directly',
              onPress: () => {
                const url = `tel:${toSanitized}`;
                console.log('Direct call to:', toSanitized);
                Alert.alert('Calling...', 'Connecting you to Traffic Frnd...');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Click to Call Error:', error);
      const message = error?.message || 'Unable to connect your call. Please try again or call directly.';
      Alert.alert(
        'Call Failed',
        message,
        [
          { text: 'OK' },
          {
            text: 'Call Directly',
            onPress: () => {
              const url = `tel:${toSanitized}`;
              console.log('Direct call to:', toSanitized);
              Alert.alert('Calling...', 'Connecting you to Traffic Frnd...');
            }
          }
        ]
      );
    }
  };


  const scrollTickingRef = useRef(false);
  const handleScroll = (event: any) => {
    if (scrollTickingRef.current) return;
    // Capture value immediately; RN events are pooled and become null asynchronously
    const capturedY = event?.nativeEvent?.contentOffset?.y ?? 0;
    scrollTickingRef.current = true;
    requestAnimationFrame(() => {
      const scrollY = capturedY;

      // Show floating search bar when scrolled down
      if (scrollY > 100) {
        if (!searchBarFloating) {
          setSearchBarFloating(true);
          Animated.timing(searchBarAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } else {
        if (searchBarFloating) {
          setSearchBarFloating(false);
          Animated.timing(searchBarAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }

      if (!isScrolling) {
        setIsScrolling(true);
        // Hide button when scrolling starts
        Animated.timing(buttonAnimation, {
          toValue: 100, // Move button down (hide)
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set new timeout
      scrollTimeout.current = setTimeout(() => {
        if (isScrolling) setIsScrolling(false);
        // Show button when scrolling stops
        Animated.timing(buttonAnimation, {
          toValue: 0, // Move button back up (show)
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 150);

      scrollTickingRef.current = false;
    });
  };

  const toggleOrderMode = () => {
    const newMode = orderMode === 'home' ? 'drive' : 'home';
    setOrderMode(newMode);
    Alert.alert(
      'Mode Changed',
      newMode === 'drive' 
        ? 'Drive & Order mode activated. You can now order while on the move!' 
        : 'Home Order mode activated. Order from your comfort zone.',
      [{ text: 'OK' }]
    );
  };

  // Add this function to calculate traffic density
  const calculateTrafficDensity = (normalDuration: number, trafficDuration: number) => {
    const ratio = trafficDuration / normalDuration;
    if (ratio <= 1.2) return 'low';
    if (ratio <= 1.5) return 'medium';
    return 'high';
  };

  // Add this function to format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  };

  // Update the route details when directions are loaded
  const onDirectionsReady = (result: any) => {
    const { distance, duration, duration_in_traffic } = result;
    const trafficDensity = calculateTrafficDensity(duration, duration_in_traffic);
    
    // Update delivery route with the new information
    setDeliveryRoute({
      coordinates: result.coordinates,
      duration: `${duration.toFixed(0)} mins`,
      distance: `${distance.toFixed(1)} km`,
      trafficDensity,
    });
  };

  // Add function to load saved destination
  const loadSavedDestination = async () => {
    try {
      const savedDestination = await AsyncStorage.getItem('destination');
      if (savedDestination) {
        setTrafficLocations([JSON.parse(savedDestination)]);
      }
    } catch (error) {
      console.error('Error loading destination:', error);
    }
  };

  useEffect(() => {
    loadSavedDestination();
  }, []);

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


  // Compute suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchSuggestions([]);
      return;
    }
    
    // Use recommendedItems if available, otherwise use fallback data
    const searchData = recommendedItems.length > 0 ? recommendedItems : fallbackMenuItems;
    
    // Find up to 5 menu items that match the query
    const matches = searchData
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
    
    setSearchSuggestions(matches);
  }, [searchQuery, recommendedItems]);

  useEffect(() => {
    const showSub1 = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub1 = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    const showSub2 = Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true));
    const hideSub2 = Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false));
    return () => {
      showSub1.remove();
      hideSub1.remove();
      showSub2.remove();
      hideSub2.remove();
    };
  }, []);

  useEffect(() => {
    console.log('Keyboard open:', keyboardOpen);
  }, [keyboardOpen]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      
      {/* Touch handler to close suggestions */}
      {(searchSuggestions.length > 0 || searchFocused) && (
        <TouchableOpacity
          style={styles.suggestionsOverlay}
          activeOpacity={1}
          onPress={() => {
            setSearchFocused(false);
            setSearchSuggestions([]);
          }}
        />
      )}

      {/* Main Content Scrollable Area */}
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: orderMode === 'drive' ? '#f0f6f0' : '#f8fafc' },
          { zIndex: 1 }
        ]}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Modern Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: heroAnimation,
              transform: [{
                translateY: heroAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.heroGradient}>
            {/* Decorative Background Elements */}
            <View style={styles.heroDecoration1} />
            <View style={styles.heroDecoration2} />
            <View style={styles.heroDecoration3} />
            
            <View style={styles.heroContent}>
              <Animated.View 
                style={[
                  styles.heroHeader,
                  {
                    opacity: heroAnimation,
                    transform: [{
                      translateX: heroAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.heroTextContainer}>
                  <ThemedText style={styles.heroTitle}>Welcome to Traffic Frnd</ThemedText>
                  <ThemedText style={styles.heroSubtitle}>Your delivery companion through traffic</ThemedText>
                </View>
                <Animated.View 
                  style={[
                    styles.heroLogoContainer,
                    {
                      transform: [{
                        scale: heroAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        })
                      }]
                    }
                  ]}
                >
                  <Image source={require('../../assets/images/icon.png')} style={styles.heroLogo} resizeMode="contain" />
                </Animated.View>
              </Animated.View>
              
              {/* Enhanced Search Bar */}
              <Animated.View 
                style={[
                  styles.enhancedSearchContainer,
                  {
                    opacity: heroAnimation,
                    transform: [{
                      translateY: heroAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.searchBarWrapper}>
                  <Animated.View 
                    style={[
                      styles.enhancedSearchBar,
                      {
                        transform: [{
                          scale: searchAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.03],
                          })
                        }],
                        shadowOpacity: searchAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.35],
                        }),
                        elevation: searchAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [15, 25],
                        }),
                        borderColor: searchAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['rgba(255, 255, 255, 0.3)', 'rgba(76, 175, 80, 0.5)'],
                        }),
                      }
                    ]}
                  >
                    <View style={styles.searchIconContainer}>
                      <Ionicons 
                        name="search" 
                        size={24} 
                        color={searchFocused ? "#4CAF50" : "#6B7280"} 
                      />
                    </View>
            <TextInput
                      style={styles.enhancedSearchInput}
                      placeholder="Search for food, drinks, or anything..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
                      onFocus={handleSearchFocus}
                      onBlur={handleSearchBlur}
                      placeholderTextColor="#9CA3AF"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => { setSearchQuery(''); setSearchSuggestions([]); }} 
                        style={styles.enhancedClearButton}
                      >
                        <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            )}
                    <TouchableOpacity 
                      style={styles.searchActionButton}
                      onPress={handleSearch}
                    >
                      <Ionicons name="search" size={18} color="#fff" />
                      <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {/* Search Quick Actions */}
                  <View style={styles.searchQuickActions}>
                    <TouchableOpacity 
                      style={styles.quickActionChip}
                      onPress={() => handlePopularSearchPress('Pizza')}
                    >
                      <Ionicons name="pizza" size={16} color="#4CAF50" />
                      <Text style={styles.quickActionText}>Pizza</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionChip}
                      onPress={() => handlePopularSearchPress('Coffee')}
                    >
                      <Ionicons name="cafe" size={16} color="#4CAF50" />
                      <Text style={styles.quickActionText}>Coffee</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionChip}
                      onPress={() => handlePopularSearchPress('Burger')}
                    >
                      <Ionicons name="restaurant" size={16} color="#4CAF50" />
                      <Text style={styles.quickActionText}>Burger</Text>
                    </TouchableOpacity>
          </View>
        </View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Search Suggestions Dropdown */}
        {(searchSuggestions.length > 0 || searchFocused) && (
          <Animated.View 
            style={[
              searchBarFloating ? styles.floatingSuggestionsDropdown : styles.enhancedSuggestionsDropdown,
              {
                opacity: searchAnimation,
                transform: [{
                  translateY: searchAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  })
                }]
              }
            ]}
          >
            <BlurView intensity={20} tint="light" style={styles.suggestionsBlurContainer}>
              {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="search" size={16} color="#4CAF50" />
                    <Text style={styles.suggestionsSectionTitle}>Search Results</Text>
                  </View>
              {searchSuggestions.map((item, idx) => {
                const matchIdx = item.name.toLowerCase().indexOf(searchQuery.toLowerCase());
                const before = item.name.slice(0, matchIdx);
                const match = item.name.slice(matchIdx, matchIdx + searchQuery.length);
                const after = item.name.slice(matchIdx + searchQuery.length);
                return (
                  <TouchableOpacity
                    key={item._id + idx}
                        style={styles.modernSuggestionItem}
                        activeOpacity={0.8}
                        onPress={() => handleSuggestionPress(item)}
                      >
                        <View style={styles.suggestionImageContainer}>
                    {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.modernSuggestionImage} />
                    ) : (
                            <View style={styles.modernSuggestionImagePlaceholder}>
                              <Ionicons name="restaurant" size={20} color="#9CA3AF" />
                            </View>
                    )}
                        </View>
                        <View style={styles.modernSuggestionTextBlock}>
                          <Text style={styles.modernSuggestionText} numberOfLines={1}>
                        {before}
                            <Text style={styles.modernSuggestionTextHighlight}>{match}</Text>
                        {after}
                      </Text>
                          <View style={styles.suggestionMeta}>
                            <Text style={styles.modernSuggestionCategory}>{item.category || 'Food'}</Text>
                            <Text style={styles.modernSuggestionPrice}>₹{item.price}</Text>
                    </View>
                        </View>
                        <Ionicons name="arrow-forward" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                );
              })}
                </View>
              )}

              {/* Search History */}
              {searchQuery.length === 0 && searchHistory.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.suggestionsSectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={() => setSearchHistory([])}>
                      <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  {searchHistory.map((query, idx) => (
            <TouchableOpacity 
                      key={idx}
                      style={styles.modernHistoryItem}
                      activeOpacity={0.8}
                      onPress={() => handleHistoryPress(query)}
                    >
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.modernHistoryText}>{query}</Text>
                      <Ionicons name="arrow-up" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Search Filters */}
              {searchQuery.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="filter" size={16} color="#4CAF50" />
                    <Text style={styles.suggestionsSectionTitle}>Quick Filters</Text>
                    <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                      <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filtersContainer}>
                    <TouchableOpacity
                      style={[styles.filterChip, searchFilters.category === 'snacks' && styles.activeFilterChip]}
                      onPress={() => setSearchFilters(prev => ({ ...prev, category: prev.category === 'snacks' ? '' : 'snacks' }))}
                    >
                      <Ionicons name="cafe" size={14} color={searchFilters.category === 'snacks' ? '#fff' : '#4CAF50'} />
                      <Text style={[styles.filterChipText, searchFilters.category === 'snacks' && styles.activeFilterChipText]}>Snacks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, searchFilters.category === 'drinks' && styles.activeFilterChip]}
                      onPress={() => setSearchFilters(prev => ({ ...prev, category: prev.category === 'drinks' ? '' : 'drinks' }))}
                    >
                      <Ionicons name="beer" size={14} color={searchFilters.category === 'drinks' ? '#fff' : '#4CAF50'} />
                      <Text style={[styles.filterChipText, searchFilters.category === 'drinks' && styles.activeFilterChipText]}>Drinks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, searchFilters.priceRange === 'under-100' && styles.activeFilterChip]}
                      onPress={() => setSearchFilters(prev => ({ ...prev, priceRange: prev.priceRange === 'under-100' ? '' : 'under-100' }))}
                    >
                      <Ionicons name="pricetag" size={14} color={searchFilters.priceRange === 'under-100' ? '#fff' : '#4CAF50'} />
                      <Text style={[styles.filterChipText, searchFilters.priceRange === 'under-100' && styles.activeFilterChipText]}>Under ₹100</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, searchFilters.rating === '4+' && styles.activeFilterChip]}
                      onPress={() => setSearchFilters(prev => ({ ...prev, rating: prev.rating === '4+' ? '' : '4+' }))}
                    >
                      <Ionicons name="star" size={14} color={searchFilters.rating === '4+' ? '#fff' : '#4CAF50'} />
                      <Text style={[styles.filterChipText, searchFilters.rating === '4+' && styles.activeFilterChipText]}>4+ Rating</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Popular Searches */}
              {searchQuery.length === 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="trending-up" size={16} color="#4CAF50" />
                    <Text style={styles.suggestionsSectionTitle}>Popular Searches</Text>
                  </View>
                  <View style={styles.popularSearchesContainer}>
                    {popularSearches.map((query, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.popularSearchChip}
                        activeOpacity={0.8}
                        onPress={() => handlePopularSearchPress(query)}
                      >
                        <Text style={styles.popularSearchText}>{query}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Empty State */}
              {searchQuery.length > 0 && searchSuggestions.length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptySearchText}>No results found for "{searchQuery}"</Text>
                  <Text style={styles.emptySearchSubtext}>Try searching for something else</Text>
                </View>
              )}
            </BlurView>
          </Animated.View>
        )}

        {/* Modern Categories Section */}
        <Animated.View 
          style={[
            styles.categoriesSection,
            {
              opacity: cardAnimations,
              transform: [{
                translateY: cardAnimations.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Quick Access</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.modernCategoriesContainer}
            contentContainerStyle={styles.categoriesContentContainer}
          >
            {categories.map((category, index) => (
              <Animated.View
              key={category.id} 
                style={{
                  opacity: cardAnimations,
                  transform: [{
                    translateX: cardAnimations.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (index + 1), 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity 
                  style={styles.modernCategoryItem}
              onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.8}
            >
                  <View style={styles.modernCategoryIconContainer}>
                    <Ionicons name={category.icon} size={26} color="#4CAF50" />
              </View>
                  <ThemedText style={styles.modernCategoryName}>{category.name}</ThemedText>
                  <View style={styles.categoryIndicator} />
            </TouchableOpacity>
              </Animated.View>
          ))}
        </ScrollView>
        </Animated.View>

        {/* Modern Promotion Banner */}
        <TouchableOpacity 
          style={styles.modernPromotionBanner}
          onPress={() => router.push('/promotions' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.promotionGradient}>
            <View style={styles.promotionContent}>
              <View style={styles.promotionAnimationContainer}>
            <LottieView
              source={require('../../assets/animations/delivery-walk.json')}
              autoPlay
              loop
                  style={styles.promotionAnimation}
                />
              </View>
              <View style={styles.promotionTextContainer}>
                <ThemedText style={styles.modernPromotionTitle}>
                  We don't wait for traffic to clear
                </ThemedText>
                <ThemedText style={styles.modernPromotionSubtitle}>
                  We deliver through it
                </ThemedText>
                <View style={styles.promotionCta}>
                  <ThemedText style={styles.promotionCtaText}>Explore Offers</ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Modern Recommended Section */}
        <View style={styles.modernRecommendedSection}> 
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.modernSectionTitle}>Recommended for You</ThemedText>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>
          {loadingRecommended ? (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require('../../assets/animations/car-delivery.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <ThemedText style={styles.loadingText}>Loading recommended...</ThemedText>
            </View>
          ) : recommendedItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyStateText}>No recommended items available</ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.modernScrollView}
              contentContainerStyle={styles.modernScrollContent}
            >
              {recommendedItems.slice(0, 10).map((item: MenuItem) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.modernRecommendedCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
                >
                  <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                      style={styles.modernRecommendedImage}
                    resizeMode="cover"
                  />
                    <View style={styles.cardOverlay}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '4.5'}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.modernCardContent}>
                    <ThemedText style={styles.modernItemName} numberOfLines={1}>{item.name}</ThemedText>
                    <ThemedText style={styles.modernItemPrice}>₹{item.price}</ThemedText>
                    {item.description && (
                      <ThemedText style={styles.modernItemDescription} numberOfLines={2}>{item.description}</ThemedText>
                    )}
                    <View style={styles.modernInfoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <ThemedText style={styles.modernInfoText}>{item.preparationTime ? `${item.preparationTime} min` : 'N/A'}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.modernAddButton}
                      onPress={async () => {
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
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Modern Top Rated Section */}
        <View style={styles.modernTopRatedSection}> 
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.modernSectionTitle}>Top Rated Items</ThemedText>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>
          {loadingTopRated ? (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require('../../assets/animations/car-delivery.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <ThemedText style={styles.loadingText}>Loading top rated...</ThemedText>
            </View>
          ) : topRatedItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="star-outline" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyStateText}>No top rated items available</ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.modernScrollView}
              contentContainerStyle={styles.modernScrollContent}
            >
              {topRatedItems.map((item: MenuItem) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.modernTopRatedCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
                >
                  <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                      style={styles.modernRecommendedImage}
                    resizeMode="cover"
                  />
                    <View style={styles.cardOverlay}>
                      <View style={styles.topRatedBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>TOP</ThemedText>
                    </View>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '4.5'}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.modernCardContent}>
                    <ThemedText style={styles.modernItemName} numberOfLines={1}>{item.name}</ThemedText>
                    <ThemedText style={styles.modernItemPrice}>₹{item.price}</ThemedText>
                    {item.description && (
                      <ThemedText style={styles.modernItemDescription} numberOfLines={2}>{item.description}</ThemedText>
                    )}
                    <View style={styles.modernInfoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <ThemedText style={styles.modernInfoText}>{item.preparationTime ? `${item.preparationTime} min` : 'N/A'}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.modernAddButton}
                      onPress={async () => {
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
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Modern Delivery Info */}
        <View style={styles.modernDeliveryInfo}>
          <View style={styles.modernDeliveryContent}>
            <View style={styles.modernDeliveryHeader}>
              <View style={styles.deliveryTitleContainer}>
                <Ionicons name="bicycle" size={24} color="#4CAF50" />
                <ThemedText style={styles.modernDeliveryTitle}>Nearest Delivery Buddy</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.modernViewDetailsButton}
                onPress={() => router.push('/delivery-status' as any)}
              >
                <ThemedText style={styles.modernViewDetailsText}>View Details</ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {locationCoords && (
              <View style={styles.modernMapContainer}>
                <MapView
                  style={styles.modernMap}
                  initialRegion={{
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsCompass={true}
                  showsTraffic={true}
                >
                  {/* Delivery buddy's marker */}
                  <Marker
                    coordinate={nearestBuddy.location}
                    title={`${nearestBuddy.name} (${nearestBuddy.distance} away)`}
                    description={`Estimated arrival: ${deliveryRoute?.duration || 'Calculating...'}`}
                  >
                    <View style={styles.modernDeliveryMarker}>
                      <Ionicons name="bicycle" size={24} color="#4CAF50" />
                    </View>
                  </Marker>

                  {/* Delivery route */}
                  {deliveryRoute && (
                    <Polyline
                      coordinates={deliveryRoute.coordinates}
                      strokeWidth={4}
                      strokeColor={getRouteColor(deliveryRoute.trafficDensity)}
                      lineDashPattern={[1]}
                    />
                  )}
                </MapView>

                {/* Modern Traffic info overlay */}
                {deliveryRoute && (
                  <View style={styles.modernTrafficInfo}>
                    <View style={styles.modernTrafficCard}>
                      <View style={styles.modernTrafficDetail}>
                        <Ionicons name="time-outline" size={18} color="#4CAF50" />
                        <ThemedText style={styles.modernTrafficText}>
                        {deliveryRoute.duration}
                      </ThemedText>
                    </View>
                      <View style={styles.modernTrafficDetail}>
                        <Ionicons name="map-outline" size={18} color="#4CAF50" />
                        <ThemedText style={styles.modernTrafficText}>
                        {deliveryRoute.distance}
                      </ThemedText>
                    </View>
                    </View>
                    <View style={[styles.modernTrafficIndicator, { backgroundColor: getRouteColor(deliveryRoute.trafficDensity) }]}>
                      <ThemedText style={styles.modernTrafficDensityText}>
                        {deliveryRoute.trafficDensity.toUpperCase()} TRAFFIC
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modernBuddyInfo}>
              <View style={styles.modernBuddyCard}>
                <View style={styles.modernBuddyHeader}>
                  <View style={styles.buddyAvatar}>
                    <ThemedText style={styles.buddyInitial}>{nearestBuddy.name.charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.buddyInfoContainer}>
                    <ThemedText style={styles.modernBuddyName}>{nearestBuddy.name}</ThemedText>
                    <View style={styles.modernBuddyStatus}>
                      <View style={[styles.modernStatusDot, { backgroundColor: nearestBuddy.status === 'available' ? '#4CAF50' : '#6B7280' }]} />
                      <ThemedText style={styles.modernStatusText}>{nearestBuddy.status === 'available' ? 'Available' : 'Busy'}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.modernRatingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.modernRating}>{nearestBuddy.rating}</ThemedText>
                  </View>
                </View>
                <View style={styles.modernDistanceInfo}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <ThemedText style={styles.modernDistanceText}>{nearestBuddy.distance} away</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>


      {/* Enhanced Navigation Bar - Modern Design */}
      <BottomNavigationBar keyboardOpen={keyboardOpen} />

      {selectedLocation && (
        <TouchableOpacity 
          style={styles.selectedLocationBanner}
          onPress={() => setShowGroceryCategories(true)}
        >
          <View style={styles.selectedLocationInfo}>
            <View style={styles.locationIconContainer}>
              <Ionicons
                name={
                  selectedLocation.type === 'traffic'
                    ? 'alert-circle'
                    : selectedLocation.type === 'busstop'
                    ? 'bus-outline'
                    : 'stop-circle-outline'
                }
                size={24}
                color="#4CAF50"
              />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
              <Text style={styles.selectedLocationDistance}>
                {selectedLocation.distance.toFixed(1)} km away
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      )}

      {showGroceryCategories && (
        <View style={styles.groceryCategoriesContainer}>
          <View style={styles.groceryHeader}>
            <Text style={styles.groceryTitle}>Select Category</Text>
            <TouchableOpacity
              onPress={() => setShowGroceryCategories(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {groceryCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.groceryCategoryItem}
              onPress={() => handleGroceryCategorySelect(category)}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons
                  name={category.icon}
                  size={24}
                  color="#4CAF50"
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.itemCount}>{category.items} items</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showRouteOptions && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showRouteOptions}
          onRequestClose={() => setShowRouteOptions(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Your Route</Text>
              <ScrollView>
                {routeOptions.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={styles.routeOption}
                    onPress={() => handleRouteSelect(route)}
                  >
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      <View style={styles.routeDetails}>
                        <View style={styles.routeDetail}>
                          <Ionicons name="time-outline" size={16} color="#666" />
                          <Text style={styles.routeDetailText}>{route.duration}</Text>
                        </View>
                        <View style={styles.routeDetail}>
                          <Ionicons name="map-outline" size={16} color="#666" />
                          <Text style={styles.routeDetailText}>{route.distance}</Text>
                        </View>
                        <View style={[styles.trafficIndicator, { backgroundColor: getRouteColor(route.trafficDensity) }]} />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRouteOptions(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Search Bar */}
      {searchBarFloating && (
        <Animated.View 
          style={[
            styles.floatingSearchContainer,
            {
              opacity: searchBarAnimation,
              transform: [{
                translateY: searchBarAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.floatingSearchBar}>
            <Ionicons name="search" size={20} color="#4CAF50" />
            <TextInput
              style={styles.floatingSearchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
        <TouchableOpacity
                onPress={() => { setSearchQuery(''); setSearchSuggestions([]); }} 
                style={styles.floatingClearButton}
              >
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.floatingSearchActionButton}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.floatingActionContainer}>
        {/* Call Button */}
        <Animated.View
          style={[
            styles.floatingCallButton,
            {
              opacity: callButtonAnimation,
              transform: [{
                translateY: callButtonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }, {
                scale: callButtonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          {/* Glow Effect */}
          <View style={styles.callButtonGlow} />
          <Animated.View
            style={{
              transform: [{
                scale: callButtonPulse
              }]
            }}
          >
            <TouchableOpacity
              style={styles.floatingCallButtonInner}
              onPress={handleDirectCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={28} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        
        {/* Cart Button */}
        {cartCount > 0 && (
          <Animated.View
            style={[
              styles.floatingCartButton,
              {
                opacity: callButtonAnimation,
                transform: [{
                  translateY: callButtonAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }, {
                  scale: callButtonAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.floatingCartButtonInner}
          onPress={() => router.push('/cart')}
              activeOpacity={0.8}
        >
              <Ionicons name="cart" size={24} color="#fff" />
          {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
          </Animated.View>
        )}

        {/* Active Order Track Button */}
        {activeOrderId && (
          <Animated.View
            style={[
              styles.floatingCartButton,
              {
                opacity: callButtonAnimation,
                transform: [{
                  translateY: callButtonAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }, {
                  scale: callButtonAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.floatingCartButtonInner, { backgroundColor: '#1976D2' }]}
              onPress={() => router.push(`/order-details/${activeOrderId}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="bicycle" size={22} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', marginTop: 4, fontSize: 12 }}>Track</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 35,
  },
  categoryIconContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  promotionBanner: {
    marginHorizontal: 20,
    marginBottom: 1,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  recommendedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  recommendedCard: {
    width: 240,
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  recommendedImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#eee',
  },
  recommendedCardContent: {
    padding: 10,
  },
  recommendedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  recommendedPrice: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendedDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginTop: 1,
  },
  recommendedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  recommendedTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recommendedAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  recommendedAddButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  deliveryInfo: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 30,
  },
  deliveryInfoContent: {
    paddingHorizontal: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  deliveryMarker: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trafficInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trafficDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 5,
  },
  trafficText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  trafficIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trafficDensityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buddyInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
  },
  buddyDetails: {
    gap: 8,
  },
  buddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buddyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buddyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  orderButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  orderButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedLocationBanner: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedLocationDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  groceryCategoriesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  groceryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  groceryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  groceryCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  routeInfo: {
    flex: 1,
    marginRight: 10,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  routeDetailText: {
    marginLeft: 5,
    color: '#666',
  },
  closeButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  fabCartContainer: {
    position: 'absolute',
    bottom: 90,
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
  suggestionsDropdown: {
    position: 'relative',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 100,
    marginTop: 6,
    paddingRight: 40,
    maxHeight: 260,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  suggestionImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  suggestionImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  suggestionTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  suggestionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  suggestionTextHighlight: {
    color: '#111',
    backgroundColor: '#e0e7ef',
    borderRadius: 3,
    paddingHorizontal: 1,
  },
  suggestionCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  logo: {
    width: 80,
    height: 80,
  },
  uniqueSearchBarWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  uniqueSearchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    width: '92%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  uniqueSearchInput: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    borderRadius: 30,
  },
  
  // Modern Hero Section Styles
  heroSection: {
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroGradient: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: 40,
    height: 40,
  },
  
  // Hero Decorative Elements
  heroDecoration1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroDecoration2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroDecoration3: {
    position: 'absolute',
    top: 50,
    right: 50,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Modern Search Bar Styles
  modernSearchContainer: {
    width: '100%',
    paddingHorizontal: 0,
  },
  modernSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIcon: {
    marginRight: 12,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Modern Categories Styles
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  modernCategoriesContainer: {
    marginTop: 15,
  },
  categoriesContentContainer: {
    paddingRight: 20,
  },
  modernCategoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  modernCategoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernCategoryName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  
  // Modern Promotion Banner Styles
  modernPromotionBanner: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  promotionGradient: {
    backgroundColor: '#FFD700',
    padding: 24,
    position: 'relative',
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionAnimationContainer: {
    marginRight: 15,
  },
  promotionAnimation: {
    width: 80,
    height: 80,
  },
  promotionTextContainer: {
    flex: 1,
  },
  modernPromotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernPromotionSubtitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 12,
  },
  promotionCta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionCtaText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  
  // Modern Section Styles
  modernRecommendedSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modernTopRatedSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  loadingText: {
    marginTop: 12,
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Modern Scroll Views
  modernScrollView: {
    marginTop: 0,
  },
  modernScrollContent: {
    paddingRight: 20,
  },
  
  // Modern Card Styles
  modernRecommendedCard: {
    width: 220,
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  modernTopRatedCard: {
    width: 220,
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
  },
  cardImageContainer: {
    position: 'relative',
  },
  modernRecommendedImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  modernCardContent: {
    padding: 12,
    position: 'relative',
  },
  modernItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernItemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modernItemDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  modernAddButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  // Modern Delivery Info Styles
  modernDeliveryInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  modernDeliveryContent: {
    padding: 20,
  },
  modernDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  deliveryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernDeliveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  modernViewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modernViewDetailsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  
  // Modern Map Styles
  modernMapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modernMap: {
    width: '100%',
    height: '100%',
  },
  modernDeliveryMarker: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modernTrafficInfo: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernTrafficCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    gap: 12,
  },
  modernTrafficDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernTrafficText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  modernTrafficIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernTrafficDensityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Modern Buddy Info Styles
  modernBuddyInfo: {
    marginTop: 0,
  },
  modernBuddyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernBuddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buddyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buddyInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buddyInfoContainer: {
    flex: 1,
  },
  modernBuddyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernBuddyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  modernStatusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 4,
  },
  modernDistanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernDistanceText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  
  // Enhanced Search Bar Layout Styles
  enhancedSearchContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 20,
  },
  searchBarWrapper: {
    width: '100%',
  },
  enhancedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  enhancedClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    gap: 6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchQuickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Enhanced Search Suggestions Styles
  enhancedSuggestionsDropdown: {
    position: 'absolute',
    top: 280,
    left: 20,
    right: 20,
    zIndex: 1000,
    maxHeight: 450,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 25,
  },
  floatingSuggestionsDropdown: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 2000,
    maxHeight: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 30,
  },
  suggestionsBlurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    maxHeight: 400,
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  suggestionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  modernSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  suggestionImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  modernSuggestionImage: {
    width: '100%',
    height: '100%',
  },
  modernSuggestionImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernSuggestionTextBlock: {
    flex: 1,
    marginRight: 8,
  },
  modernSuggestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modernSuggestionTextHighlight: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontWeight: 'bold',
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernSuggestionCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modernSuggestionPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modernHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  modernHistoryText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  popularSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularSearchChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  popularSearchText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Filter Styles
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  
  // Floating Search Bar Styles
  floatingSearchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 2000,
    elevation: 30,
  },
  floatingSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  floatingSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    marginRight: 8,
  },
  floatingClearButton: {
    padding: 4,
  },
  floatingSearchActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  
  // Suggestions Overlay
  suggestionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  
  // Floating Action Buttons
  floatingActionContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
    alignItems: 'flex-end',
    gap: 12,
  },
  floatingCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#fff',
    position: 'relative',
  },
  callButtonGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 43,
    backgroundColor: 'rgba(37, 211, 102, 0.3)',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 0,
  },
  floatingCallButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  floatingCartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  floatingCartButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
