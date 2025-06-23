import 'react-native-get-random-values';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, View, Image, Alert, Platform, Linking, Dimensions, Animated, KeyboardAvoidingView, Text, Modal } from 'react-native';
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
  const scrollTimeout = React.useRef<NodeJS.Timeout>();
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
    let unsubscribe: (() => void) | undefined;
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
    unsubscribe = menuService.onMenuUpdate((items) => {
      if (mounted) {
        setRecommendedItems(items.filter(item => item.isAvailable));
      }
    });
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
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
    router.push({
      pathname: `/category/${category.id}`,
      params: {
        id: category.id.toString(),
        name: category.name
      }
    });
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

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>Traffic Frnd</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/search' as any)}
          >
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/profile' as any)}
          >
            <Ionicons name="person" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity 
          style={[
            styles.modeToggleButton, 
            orderMode === 'home' && styles.modeToggleButtonActive
          ]}
          onPress={toggleOrderMode}
        >
          <Ionicons 
            name="home" 
            size={20} 
            color={orderMode === 'home' ? '#fff' : '#666'} 
          />
          <ThemedText 
            style={[
              styles.modeToggleText,
              orderMode === 'home' && styles.modeToggleTextActive
            ]}
          >
            Home
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.modeToggleButton, 
            orderMode === 'drive' && styles.modeToggleButtonActive
          ]}
          onPress={toggleOrderMode}
        >
          <Ionicons 
            name="car" 
            size={20} 
            color={orderMode === 'drive' ? '#fff' : '#666'} 
          />
          <ThemedText 
            style={[
              styles.modeToggleText,
              orderMode === 'drive' && styles.modeToggleTextActive
            ]}
          >
            Drive & Order
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[
          styles.scrollView,
          { backgroundColor: orderMode === 'drive' ? '#f0f6f0' : '#f8f8f8' },
          { zIndex: 1 }
        ]} 
        showsVerticalScrollIndicator={false} 
        onScroll={handleScroll} 
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search" 
              size={20} 
              color="#666" 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Order Now Button */}
        <View style={styles.orderButtonContainer}>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
            <ThemedText style={styles.orderButtonText}>Order Now</ThemedText>
          </TouchableOpacity>
        </View>

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
          style={styles.promotionBanner}
          onPress={() => router.push('/promotions' as any)}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.promotionText}>
            🔥 Fastest Delivery in Your Jam Zone!
          </ThemedText>
        </TouchableOpacity>

        {/* Recommended Section */}
        <View style={styles.recommendedSection}>
          <ThemedText style={styles.sectionTitle}>Recommended</ThemedText>
          <View style={styles.recommendedGrid}>
            {loadingRecommended ? (
              <ThemedText>Loading recommended items...</ThemedText>
            ) : recommendedItems.length === 0 ? (
              <ThemedText>No recommended items available.</ThemedText>
            ) : (
              recommendedItems.slice(0, 10).map((item) => (
                <TouchableOpacity 
                  key={item._id} 
                  style={styles.recommendedItem}
                  onPress={() => handleItemPress({
                    id: item._id,
                    name: item.name,
                    image: { uri: item.image },
                    price: `₹${item.price}`,
                    time: item.preparationTime ? `${item.preparationTime} min` : 'N/A',
                    type: 'S-scoter', // You can adjust this if you have a type field
                  })}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemPrice}>{`₹${item.price}`}</ThemedText>
                  <View style={styles.itemInfoContainer}>
                    <View style={styles.itemTimeContainer}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <ThemedText style={styles.itemTime}>{item.preparationTime ? `${item.preparationTime} min` : 'N/A'}</ThemedText>
                    </View>
                    <View style={styles.itemTypeContainer}>
                      <Ionicons name={'bicycle'} size={14} color="#666" />
                      <ThemedText style={styles.itemType}>S-scoter</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
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

      <Animated.View
        style={[
          styles.orderButtonContainer,
          {
            transform: [{ translateY: buttonAnimation }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.orderButton,
            { backgroundColor: orderMode === 'drive' ? '#4CAF50' : '#1a1a1a' }
          ]}
          onPress={handleOrderNow}
        >
          <ThemedText style={styles.orderButtonText}>
            {orderMode === 'drive' ? 'Order On-The-Go' : 'Order Now'}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 5,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  modeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  modeToggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeToggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  modeToggleTextActive: {
    color: '#fff',
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
    marginBottom: 20,
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
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recommendedItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
  },
  itemInfoContainer: {
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  itemTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
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
    bottom: 20,
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
});
