import 'react-native-get-random-values';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, View, Image, Alert, Platform, Linking, Dimensions, Animated, KeyboardAvoidingView, Text, Modal, FlatList, Keyboard } from 'react-native';
import { ThemedText, ThemedView } from '@/components';
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
import { menuService } from '@/services/menuService';
import { MenuItem } from '@/types/menu';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMemo } from 'react';
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
  const [searchSuggestions, setSearchSuggestions] = useState<MenuItem[]>([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

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
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingRecommended(true);
    // Fetch all menu items initially
    menuService.getAllMenuItems().then((items) => {
      if (mounted) {
        setRecommendedItems(items.filter(item => item.isAvailable));
        setLoadingRecommended(false);
      }
    });
    // Subscribe to real-time updates
    const unsubscribe = menuService.onMenuUpdate((items) => {
      if (mounted) {
        setRecommendedItems(items.filter(item => item.isAvailable));
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
        // Filter items with rating >= 4.5, or top 10 by rating
        const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const filtered = sorted.filter(item => (item.rating || 0) >= 4.5);
        setTopRatedItems(filtered.length > 0 ? filtered.slice(0, 10) : sorted.slice(0, 10));
        setLoadingTopRated(false);
      }
    });
    // Subscribe to real-time updates
    const unsubscribeTopRated = menuService.onMenuUpdate((items) => {
      if (mounted) {
        const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const filtered = sorted.filter(item => (item.rating || 0) >= 4.5);
        setTopRatedItems(filtered.length > 0 ? filtered.slice(0, 10) : sorted.slice(0, 10));
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
      router.push({
        pathname: '/search' as any,
        params: { q: searchQuery }
      });
    }
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

  const handleOrderNow = () => {
    // If in drive mode, redirect to map screen
    if (orderMode === 'drive') {
      router.push('/map');
    } else {
      // Navigate to explore screen for home mode
      router.push('/explore');
    }
  };

  const handleScroll = (event: any) => {
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
      setIsScrolling(false);
      // Show button when scrolling stops
      Animated.timing(buttonAnimation, {
        toValue: 0, // Move button back up (show)
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 150); // Adjust this value to control how quickly the button appears after stopping
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
    // Find up to 5 menu items that match the query
    const matches = recommendedItems
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
      
      {/* Main Content Scrollable Area */}
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: orderMode === 'drive' ? '#f0f6f0' : '#f8f8f8' },
          { zIndex: 1 }
        ]}
        contentContainerStyle={{ paddingTop: 25, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Unique Search Bar with Logo on Right */}
        <View style={[styles.uniqueSearchBarWrapper, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
          <View style={[styles.uniqueSearchBarCard, { flex: 1, marginRight: 10 }]}> 
            <Ionicons name="search" size={24} color="#4CAF50" style={{ marginLeft: 12, marginRight: 8 }} />
            <TextInput
              style={styles.uniqueSearchInput}
              placeholder="Search for anything..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#888"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchSuggestions([]); }} style={{ padding: 6, marginRight: 6 }}>
                <Ionicons name="close-circle" size={22} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Suggestions Dropdown (unchanged) */}
        {searchSuggestions.length > 0 && (
          <BlurView intensity={30} tint="light" style={styles.suggestionsDropdown}>
            {searchSuggestions.map((item, idx) => {
              const matchIdx = item.name.toLowerCase().indexOf(searchQuery.toLowerCase());
              const before = item.name.slice(0, matchIdx);
              const match = item.name.slice(matchIdx, matchIdx + searchQuery.length);
              const after = item.name.slice(matchIdx + searchQuery.length);
              return (
                <TouchableOpacity
                  key={item._id + idx}
                  style={styles.suggestionItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSearchQuery(item.name);
                    setSearchSuggestions([]);
                    handleSearch();
                  }}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.suggestionImage} />
                  ) : (
                    <View style={styles.suggestionImagePlaceholder} />
                  )}
                  <View style={styles.suggestionTextBlock}>
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {before}
                      <Text style={styles.suggestionTextHighlight}>{match}</Text>
                      {after}
                    </Text>
                    {item.category && (
                      <Text style={styles.suggestionCategory}>{item.category}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#bbb" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              );
            })}
          </BlurView>
        )}

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name={category.icon} size={24} color="#666" />
              </View>
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Promotion Banner */}
        <TouchableOpacity 
          style={[styles.promotionBanner, { backgroundColor: '#fffbe6', borderColor: '#FFD700', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10 }]}
          onPress={() => router.push('/promotions' as any)}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LottieView
              source={require('../../assets/animations/delivery-walk.json')}
              autoPlay
              loop
              style={{ width: 80, height: 80, marginRight: 8 }}
            />
            <View style={{ flexShrink: 1, maxWidth: '80%' }}>
              <ThemedText style={[styles.promotionText, { color: '#222', fontWeight: 'bold', flexShrink: 1, flexWrap: 'wrap' }]}>We don't wait for the traffic to clear — <ThemedText style={{ color: '#4CAF50', fontWeight: 'bold' }}>we deliver through it.</ThemedText></ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recommended Section */}
        <View style={[styles.recommendedSection, { backgroundColor: 'transparent', paddingVertical: 30 }]}> 
          <ThemedText style={styles.sectionTitle}>Recommended</ThemedText>
          {loadingRecommended ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
              <LottieView
                source={require('../../assets/animations/car-delivery.json')}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
              <ThemedText style={{ marginTop: 12, color: '#4CAF50' }}>Loading recommended...</ThemedText>
            </View>
          ) : recommendedItems.length === 0 ? (
            <ThemedText>No recommended items available.</ThemedText>
          ) : (
            <FlatList
              data={recommendedItems.slice(0, 10)}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={260}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }: { item: MenuItem }) => (
                <TouchableOpacity
                  style={styles.recommendedCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
                >
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                    style={styles.recommendedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recommendedCardContent}>
                    <ThemedText style={styles.recommendedName}>{item.name}</ThemedText>
                    <ThemedText style={styles.recommendedPrice}>₹{item.price}</ThemedText>
                    {item.description ? (
                      <ThemedText style={styles.recommendedDescription} numberOfLines={2}>{item.description}</ThemedText>
                    ) : null}
                    <View style={styles.recommendedInfoRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <ThemedText style={styles.recommendedTime}>{item.preparationTime ? `${item.preparationTime} min` : 'N/A'}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.recommendedAddButton}
                      onPress={async () => {
                        // Add to cart logic (same as in item details)
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
                      <Ionicons name="cart-outline" size={20} color="#fff" />
                      <ThemedText style={styles.recommendedAddButtonText}>Add to Cart</ThemedText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Top Rated Section */}
        <View style={[styles.recommendedSection, { backgroundColor: 'transparent', paddingVertical: 10 }]}> 
          <ThemedText style={styles.sectionTitle}>Top Rated</ThemedText>
          {loadingTopRated ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 180 }}>
              <LottieView
                source={require('../../assets/animations/car-delivery.json')}
                autoPlay
                loop
                style={{ width: 100, height: 100 }}
              />
              <ThemedText style={{ marginTop: 10, color: '#4CAF50' }}>Loading top rated...</ThemedText>
            </View>
          ) : topRatedItems.length === 0 ? (
            <ThemedText>No top rated items available.</ThemedText>
          ) : (
            <FlatList
              data={topRatedItems}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={260}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }: { item: MenuItem }) => (
                <TouchableOpacity
                  style={styles.recommendedCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
                >
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                    style={styles.recommendedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recommendedCardContent}>
                    <ThemedText style={styles.recommendedName}>{item.name}</ThemedText>
                    <ThemedText style={styles.recommendedPrice}>₹{item.price}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="star" size={15} color="#FFD700" />
                      <ThemedText style={{ fontSize: 13, color: '#333', marginLeft: 4 }}>{item.rating ? item.rating.toFixed(1) : 'N/A'}</ThemedText>
                    </View>
                    {item.description ? (
                      <ThemedText style={styles.recommendedDescription} numberOfLines={2}>{item.description}</ThemedText>
                    ) : null}
                    <View style={styles.recommendedInfoRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <ThemedText style={styles.recommendedTime}>{item.preparationTime ? `${item.preparationTime} min` : 'N/A'}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.recommendedAddButton}
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
                      <Ionicons name="cart-outline" size={20} color="#fff" />
                      <ThemedText style={styles.recommendedAddButtonText}>Add to Cart</ThemedText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryInfoContent}>
            <View style={styles.deliveryHeader}>
              <ThemedText style={styles.deliveryTitle}>Nearest Delivery Buddy</ThemedText>
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => router.push('/delivery-status' as any)}
              >
                <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {locationCoords && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
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
                    <View style={styles.deliveryMarker}>
                      <Ionicons name="bicycle" size={24} color="#1a73e8" />
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

                {/* Traffic info overlay */}
                {deliveryRoute && (
                  <View style={styles.trafficInfo}>
                    <View style={styles.trafficDetail}>
                      <Ionicons name="time-outline" size={20} color="#333" />
                      <ThemedText style={styles.trafficText}>
                        {deliveryRoute.duration}
                      </ThemedText>
                    </View>
                    <View style={styles.trafficDetail}>
                      <Ionicons name="map-outline" size={20} color="#333" />
                      <ThemedText style={styles.trafficText}>
                        {deliveryRoute.distance}
                      </ThemedText>
                    </View>
                    <View style={[styles.trafficIndicator, { backgroundColor: getRouteColor(deliveryRoute.trafficDensity) }]}>
                      <ThemedText style={styles.trafficDensityText}>
                        {deliveryRoute.trafficDensity.toUpperCase()} TRAFFIC
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buddyInfo}>
              <View style={styles.buddyDetails}>
                <View style={styles.buddyHeader}>
                  <ThemedText style={styles.buddyName}>{nearestBuddy.name}</ThemedText>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.rating}>{nearestBuddy.rating}</ThemedText>
                  </View>
                </View>
                <View style={styles.buddyStatus}>
                  <View style={[styles.statusDot, { backgroundColor: nearestBuddy.status === 'available' ? '#4CAF50' : '#666' }]} />
                  <ThemedText style={styles.statusText}>{nearestBuddy.status === 'available' ? 'Available' : 'Busy'}</ThemedText>
                  <ThemedText style={styles.distanceText}> • {nearestBuddy.distance}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Order Now Button - always above nav bar, only hides when keyboard is open */}
      {!keyboardOpen && orderMode === 'drive' && (
        <View style={styles.fabOrderContainer} pointerEvents="box-none">
          <TouchableOpacity style={styles.fabOrderButton} onPress={handleOrderNow}>
            <LottieView
              source={require('../../assets/animations/animation.json')}
              autoPlay
              loop
              style={{ width: 50, height: 50, marginRight: 8 }}
            />
            <ThemedText style={styles.fabOrderButtonText}>Order On-The-Go</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Bar - always fixed at bottom, never moves with keyboard */}
      {!keyboardOpen && (
        <View style={styles.bottomNavBar} pointerEvents="box-none">
          {/* Other nav icons in flex row */}
          <View style={styles.navBarContent}>
            <TouchableOpacity onPress={() => router.push('/explore')} style={styles.navBarButton}>
              <Ionicons name="search" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.navBarButton}>
              <Ionicons name="person" size={24} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  fabOrderContainer: {
    position: 'absolute',
    left: 20,
    right: undefined,
    bottom: 90, // above nav bar
    zIndex: 3000,
    elevation: 30,
  },
  fabOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  fabOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    zIndex: 2000,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
  },
  navBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  navBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
