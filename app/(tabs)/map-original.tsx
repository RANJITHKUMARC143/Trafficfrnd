import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, Animated, Modal, ScrollView, Linking, PanResponder, Dimensions, Text } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { StatusBar } from 'react-native';
import { API_URL } from '../../src/config';
import { useRouter } from 'expo-router';
import { fetchDeliveryPoints } from '@lib/services/orderService';
import { useIsFocused } from '@react-navigation/native';

type RoutePoint = {
  latitude: number;
  longitude: number;
  address: string;
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

type TrafficPoint = {
  id: string;
  type: 'congestion' | 'accident' | 'construction';
  severity: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  timestamp: number;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

// Replace <your-backend> with your actual backend IP and port
const BACKEND_URL = API_URL; // use centralized API URL

async function saveDeliveryPointToBackend(destination, deliveryPoint) {
  const token = await AsyncStorage.getItem('token');
  const userId = await AsyncStorage.getItem('userId');
  const payload = { userId, destination, deliveryPoint };
  console.log('Saving delivery point to backend:', payload);
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/delivery-point`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log('Backend response for delivery point save:', data);
    if (!res.ok) throw new Error(data.message || 'Failed to save delivery point');
    return data;
  } catch (error) {
    console.error('Error saving delivery point to backend:', error);
    throw error;
  }
}

async function fetchLatestDeliveryPoint(destination) {
  const token = await AsyncStorage.getItem('token');
  const userId = await AsyncStorage.getItem('userId');
  const res = await fetch(`${BACKEND_URL}/api/users/${userId}/delivery-point?destination=${encodeURIComponent(destination)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('No delivery point found');
  const data = await res.json();
  return data.deliveryPoint;
}

export default function MapScreen() {
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<any[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      try {
        locationSubscription = await setupLocation();
      } catch (error) {
        console.error('Error in location initialization:', error);
      }
    };

    initLocation();

    // Cleanup function
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Load saved destination in a separate effect
  useEffect(() => {
    loadSavedDestination();
  }, []);

  useEffect(() => {
    if (destination && locationCoords) {
      generateRouteOptions();
    }
  }, [destination, locationCoords]);

  // Add effect to check for destination changes
  useEffect(() => {
    const checkDestination = async () => {
      try {
        const savedDestination = await AsyncStorage.getItem('destination');
        if (savedDestination) {
          const parsedDestination = JSON.parse(savedDestination);
          if (!destination || 
              parsedDestination.latitude !== destination.latitude || 
              parsedDestination.longitude !== destination.longitude) {
            setDestination(parsedDestination);
            if (locationCoords) {
              generateRouteOptions();
            }
          }
        }
      } catch (error) {
        console.error('Error checking destination:', error);
      }
    };

    const interval = setInterval(checkDestination, 1000);
    return () => clearInterval(interval);
  }, [destination, locationCoords]);

  useEffect(() => {
    if (destination) {
      setShowOrderButton(true);
      setShowTrafficPoints(false); // Reset traffic points when new destination is selected
    } else {
      setShowOrderButton(false);
    }
  }, [destination]);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Add new useEffect for initial auth check
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert(
            'Authentication Required',
            'Please log in to access map features and place orders.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.push('/(tabs)/profile')
              },
              {
                text: 'Cancel',
                onPress: () => router.replace('/(tabs)')
              }
            ],
            { cancelable: false }
          );
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
      }
    };

    checkInitialAuth();
  }, []);

  useEffect(() => {
    setNearbyLocations([]); // Clear old points
    if (selectedRoute && destination && locationCoords) {
      findNearbyLocations();
    }
  }, [selectedRoute, destination, locationCoords]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const setupLocation = async () => {
    try {
      // First check if location services are enabled
      const providerStatus = await Location.hasServicesEnabledAsync();
      if (!providerStatus) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
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
        return null;
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your position on the map.',
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
        return null;
      }

      // Get last known location first for immediate response
      const lastLocation = await Location.getLastKnownPositionAsync({});
      if (lastLocation) {
        const { latitude, longitude } = lastLocation.coords;
        setLocationCoords({ latitude, longitude });
        
        // Update map immediately with last known location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      }

      // Then get current location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Accept locations no older than 10 seconds
        timeout: 5000 // Timeout after 5 seconds
      });

      const { latitude, longitude } = location.coords;
      setLocationCoords({ latitude, longitude });

      // Animate to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      // Set up location subscription for updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10 // Update every 10 meters
        },
        (updatedLocation) => {
          const { latitude, longitude } = updatedLocation.coords;
          setLocationCoords({ latitude, longitude });
        }
      );

      return subscription;

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your device settings and try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  };

  const loadSavedDestination = async () => {
    try {
      const savedDestination = await AsyncStorage.getItem('destination');
      if (savedDestination) {
        const parsedDestination = JSON.parse(savedDestination);
        setDestination(parsedDestination);
        
        // Update map region to show both points if we have location
        if (locationCoords && mapRef.current) {
          const midLat = (locationCoords.latitude + parsedDestination.latitude) / 2;
          const midLng = (locationCoords.longitude + parsedDestination.longitude) / 2;
          const latDelta = Math.abs(locationCoords.latitude - parsedDestination.latitude) * 2;
          const lngDelta = Math.abs(locationCoords.longitude - parsedDestination.longitude) * 2;

          mapRef.current.animateToRegion({
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: Math.max(latDelta, 0.02),
            longitudeDelta: Math.max(lngDelta, 0.02),
          }, 1000);
        }

        // Generate route options for the loaded destination
        if (locationCoords) {
          generateRouteOptions();
        }
      }
    } catch (error) {
      console.error('Error loading destination:', error);
    }
  };

  const generateRouteOptions = async () => {
    if (!locationCoords || !destination) return;

    try {
      // Fetch route options from Google Maps Directions API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${locationCoords.latitude},${locationCoords.longitude}&destination=${destination.latitude},${destination.longitude}&alternatives=true&departure_time=now&traffic_model=best_guess&key=AIzaSyAW74HcfPLqNz7kmr7EK4LM6TTmCnJ3pXM`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        let options: RouteOption[] = data.routes.map((route: any, index: number) => {
          const durationInTraffic = route.legs[0].duration_in_traffic?.text || route.legs[0].duration.text;
          const normalDuration = route.legs[0].duration.text;
          const distance = route.legs[0].distance.text;
          
          // Calculate traffic density based on the difference between normal and traffic duration
          const trafficDensity = calculateTrafficDensity(
            route.legs[0].duration.value,
            route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value
          );

          // Decode polyline to get coordinates
          const coordinates = decodePolyline(route.overview_polyline.points);

          return {
            id: `route${index + 1}`,
            name: index === 0 ? 'Fastest Route' : `Alternative Route ${index}`,
            duration: durationInTraffic,
            distance: distance,
            trafficDensity: trafficDensity,
            coordinates: coordinates
          };
        });

        // Only keep the first two routes
        options = options.slice(0, 2);

        // If we have fewer than 2 routes, generate an alternative
        while (options.length < 2) {
          const baseRoute = options[0];
          const index = options.length;
          // Create a slightly modified version of the base route
          const offset = 0.002 * (index); // Increase offset for each additional route
          const modifiedCoordinates = baseRoute.coordinates.map(coord => ({
            latitude: coord.latitude + (Math.random() > 0.5 ? offset : -offset),
            longitude: coord.longitude + (Math.random() > 0.5 ? offset : -offset)
          }));
          // Calculate new duration and distance based on the modification
          const durationMultiplier = 1 + (0.1 * index); // 10% longer for each additional route
          const distanceMultiplier = 1 + (0.15 * index); // 15% longer for each additional route
          const baseDuration = parseInt(baseRoute.duration.replace(/\D/g, ''));
          const baseDistance = parseFloat(baseRoute.distance.replace(/[^0-9.]/g, ''));
          options.push({
            id: `route${index + 1}`,
            name: `Alternative Route ${index}`,
            duration: `${Math.round(baseDuration * durationMultiplier)} mins`,
            distance: `${(baseDistance * distanceMultiplier).toFixed(1)} km`,
            trafficDensity: 'medium',
            coordinates: modifiedCoordinates
          });
        }

        setRouteOptions(options);
        setShowRouteOptions(true);
        return options;
      }
    } catch (error) {
      console.error('Error fetching route options:', error);
      // Fallback to default routes if API call fails
      const defaultOptions: RouteOption[] = [
        {
          id: 'route1',
          name: 'Fastest Route',
          duration: '25 mins',
          distance: '3.2 km',
          trafficDensity: 'low',
          coordinates: [
            locationCoords,
            { latitude: destination.latitude, longitude: destination.longitude }
          ]
        },
        {
          id: 'route2',
          name: 'Alternative Route 1',
          duration: '30 mins',
          distance: '3.8 km',
          trafficDensity: 'medium',
          coordinates: [
            locationCoords,
            { 
              latitude: destination.latitude + 0.001, 
              longitude: destination.longitude + 0.001 
            },
            { latitude: destination.latitude, longitude: destination.longitude }
          ]
        }
      ];

      setRouteOptions(defaultOptions);
      setShowRouteOptions(true);
      return defaultOptions;
    }
  };

  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let shift = 0, result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }
    return points;
  };

  const calculateTrafficDensity = (normalDuration: number, trafficDuration: number) => {
    const delayPercentage = ((trafficDuration - normalDuration) / normalDuration) * 100;
    
    if (delayPercentage < 10) return 'low';
    if (delayPercentage < 30) return 'medium';
    return 'high';
  };

  const generateTrafficPoints = async (origin: { latitude: number; longitude: number }, dest: { latitude: number; longitude: number }) => {
    try {
      // First attempt to get real-time traffic data from Google Maps API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&departure_time=now&traffic_model=best_guess&key=AIzaSyAW74HcfPLqNz7kmr7EK4LM6TTmCnJ3pXM`
      );
      const data = await response.json();

      if (data.routes && data.routes[0] && data.routes[0].legs && data.routes[0].legs[0].steps) {
        const points: TrafficPoint[] = [];
        const steps = data.routes[0].legs[0].steps;

        // Look for steps with significant traffic
        steps.forEach((step: any, index: number) => {
          if (step.duration_in_traffic && step.duration) {
            const delay = step.duration_in_traffic.value - step.duration.value;
            if (delay > 300) { // More than 5 minutes delay
              points.push({
                id: `traffic_${index}`,
                type: 'congestion',
                severity: delay > 900 ? 'high' : delay > 600 ? 'medium' : 'low',
                location: {
                  latitude: step.start_location.lat,
                  longitude: step.start_location.lng
                },
                description: `Heavy traffic delay: ${Math.round(delay / 60)} minutes`,
                timestamp: Date.now()
              });
            }
          }
        });

        // If we found real traffic points, return them
        if (points.length > 0) {
          return points;
        }
      }

      // If no real traffic points found, fall back to bus stops
      return generateBusStops(origin, dest);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      // On error, fall back to bus stops
      return generateBusStops(origin, dest);
    }
  };

  const generateBusStops = (origin: { latitude: number; longitude: number }, dest: { latitude: number; longitude: number }) => {
    const points: TrafficPoint[] = [];
    const numPoints = Math.floor(Math.random() * 2) + 2; // 2-3 points
    
    // Calculate the bounding box between origin and destination
    const minLat = Math.min(origin.latitude, dest.latitude);
    const maxLat = Math.max(origin.latitude, dest.latitude);
    const minLng = Math.min(origin.longitude, dest.longitude);
    const maxLng = Math.max(origin.longitude, dest.longitude);
    
    // Generate bus stop points
    for (let i = 0; i < numPoints; i++) {
      const lat = minLat + (Math.random() * (maxLat - minLat));
      const lng = minLng + (Math.random() * (maxLng - minLng));
      
      points.push({
        id: `busstop_${i}`,
        type: 'construction', // Using construction type to represent bus stops
        severity: 'medium',
        location: { latitude: lat, longitude: lng },
        description: `Bus Stop ${i + 1} - Regular stops may cause delays`,
        timestamp: Date.now()
      });
    }
    
    return points;
  };

  const getTrafficDescription = (type: TrafficPoint['type']) => {
    switch (type) {
      case 'congestion':
        return 'Heavy traffic congestion';
      case 'accident':
        return 'Traffic accident reported';
      case 'construction':
        return 'Road construction ahead';
      default:
        return 'Traffic incident';
    }
  };

  const getTrafficMarkerColor = (severity: TrafficPoint['severity']) => {
    switch (severity) {
      case 'low':
        return '#FFC107';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      default:
        return '#F44336';
    }
  };

  const getTrafficMarkerIcon = (type: TrafficPoint['type']) => {
    switch (type) {
      case 'congestion':
        return 'car';
      case 'accident':
        return 'warning';
      case 'construction':
        return 'construct';
      default:
        return 'warning';
    }
  };

  const getMarkerIcon = (type: TrafficLocation['type']) => {
    switch (type) {
      case 'traffic':
        return 'car';
      case 'busstop':
        return 'bus';
      case 'signal':
        return 'stop-circle';
      default:
        return 'location';
    }
  };

  const getMarkerColor = (type: TrafficLocation['type']) => {
    switch (type) {
      case 'traffic': return '#FF9800';
      case 'busstop': return '#2196F3';
      case 'signal': return '#F44336';
      default: return '#4CAF50';
    }
  };

  const renderDestinationSearch = () => {
    // Only show the banner or search prompt, NOT the search input/overlay
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.destinationInputContainer,
          { top: Platform.OS === 'ios' ? 100 : 68 }
        ]}
      >
        {destination ? (
          <View style={styles.destinationBanner}>
            <View style={styles.destinationInfo}>
              <View style={styles.destinationIconContainer}>
                <Ionicons name="navigate" size={20} color="#4CAF50" />
              </View>
              <View style={styles.destinationTextContainer}>
                <ThemedText style={styles.destinationLabel}>Destination</ThemedText>
                <ThemedText style={styles.destinationText} numberOfLines={2}>
                  {destination.address}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.changeDestinationButton}
              onPress={() => setShowDestinationInput(true)}
            >
              <ThemedText style={styles.changeDestinationText}>Change</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.searchInputButton}
            onPress={() => setShowDestinationInput(true)}
          >
            <View style={styles.searchInputContent}>
              <Ionicons name="search" size={20} color="#666" />
              <ThemedText style={styles.searchInputText}>Where do you want to go?</ThemedText>
            </View>
            <View style={styles.searchInputIcon}>
              <Ionicons name="navigate-outline" size={20} color="#4CAF50" />
            </View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    );
  };

  const renderRouteOptions = () => {
    if (!showRouteOptions) return null;
    if (!routeOptions || routeOptions.length === 0) return null;
    return (
      <>
        {/* Dimmed overlay */}
        {showDimOverlay && (
          <TouchableOpacity
            style={styles.dimOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowRouteOptions(false);
              setShowDimOverlay(false);
            }}
          />
        )}
        <Animated.View
          style={[
            styles.routeOptionsBottomSheet,
            { maxHeight: MAX_SHEET_HEIGHT, transform: [{ translateY: routeSheetY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          <Text style={styles.routeOptionsTitle}>Select Your Route</Text>
          <ScrollView style={styles.routeOptionsList} contentContainerStyle={{ paddingBottom: 24 }}>
            {routeOptions.map((route, index) => (
              <View key={route.id} style={styles.routeOptionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={styles.routeMetricText}>{route.duration}</Text>
                    <Ionicons name="map-outline" size={18} color="#666" style={{ marginLeft: 16 }} />
                    <Text style={styles.routeMetricText}>{route.distance}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <View style={[styles.trafficBadge, { backgroundColor: route.trafficDensity === 'low' ? '#4CAF50' : route.trafficDensity === 'medium' ? '#FFA000' : '#F44336' }] }>
                    <Text style={styles.trafficText}>{route.trafficDensity.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => handleRouteSelect(route)}
                  >
                    <Text style={styles.selectButtonText}>Select</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowRouteOptions(false);
              setShowDimOverlay(false);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  };

  const renderLocationSelection = () => {
    if (!showLocationSelection) return null;

    return (
      <View style={styles.locationSelectionContainer}>
        <ThemedText style={styles.locationSelectionTitle}>Select Delivery Point</ThemedText>
        {nearbyLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationOption}
            onPress={() => handleLocationSelect(location)}
          >
            <View style={[styles.locationIcon, { backgroundColor: getMarkerColor(location.type) }]}>
              <Ionicons name={getMarkerIcon(location.type)} size={20} color="#fff" />
            </View>
            <View style={styles.locationInfo}>
              <ThemedText style={styles.locationName}>{location.name}</ThemedText>
              <ThemedText style={styles.locationDistance}>{location.distance.toFixed(1)} km away</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  };

  const onDirectionsReady = (result: any) => {
    const { distance, duration, duration_in_traffic } = result;
    const trafficDensity = calculateTrafficDensity(duration, duration_in_traffic);
    
    setRouteDetails({
      distance: `${distance.toFixed(1)} km`,
      duration: formatDuration(duration),
      durationInTraffic: formatDuration(duration_in_traffic),
      trafficDensity,
    });
  };

  const checkPointsAlongRoute = (route: { latitude: number; longitude: number }[], point: { latitude: number; longitude: number }, threshold: number = 0.001) => {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      
      // Check if point is near the line segment between start and end
      const distance = pointToLineDistance(
        point,
        start,
        end
      );
      
      if (distance < threshold) {
        return true;
      }
    }
    return false;
  };

  const pointToLineDistance = (
    point: { latitude: number; longitude: number },
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ) => {
    const A = point.latitude - start.latitude;
    const B = point.longitude - start.longitude;
    const C = end.latitude - start.latitude;
    const D = end.longitude - start.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = start.latitude;
      yy = start.longitude;
    } else if (param > 1) {
      xx = end.latitude;
      yy = end.longitude;
    } else {
      xx = start.latitude + param * C;
      yy = start.longitude + param * D;
    }

    const dx = point.latitude - xx;
    const dy = point.longitude - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const generateSignalsAndStops = (route: { latitude: number; longitude: number }[]) => {
    const points: TrafficPoint[] = [];
    const numPoints = Math.floor(Math.random() * 2) + 2; // 2-3 points
    
    // Divide route into segments to ensure even distribution
    const routeSegments = Math.floor(route.length / numPoints);
    
    for (let i = 0; i < numPoints; i++) {
      // Get a point from each segment of the route
      const segmentStart = i * routeSegments;
      const segmentEnd = Math.min((i + 1) * routeSegments, route.length - 1);
      const routeIndex = segmentStart + Math.floor(Math.random() * (segmentEnd - segmentStart));
      const basePoint = route[routeIndex];
      
      // Add small random offset (50-100 meters)
      const offset = 0.0005 + (Math.random() * 0.0005);
      const type = Math.random() > 0.5 ? 'signal' : 'busstop';
      
      const point: TrafficPoint = {
        id: `${type}_${i}`,
        type: type === 'signal' ? 'congestion' : 'construction',
        severity: 'medium',
        location: {
          latitude: basePoint.latitude + (Math.random() > 0.5 ? offset : -offset),
          longitude: basePoint.longitude + (Math.random() > 0.5 ? offset : -offset)
        },
        description: type === 'signal' ? 
          'Traffic Signal Junction - Moderate Wait Time' : 
          'Bus Stop Area - Frequent Stops',
        timestamp: Date.now()
      };
      
      points.push(point);
    }
    
    return points;
  };

  const handleRouteSelect = async (route: any) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to select a route and manage orders.',
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

    setSelectedRoute(route);
    setShowRouteOptions(false);
    setShowOrderButton(true);

    // Update the map region to show the entire route
    if (mapRef.current && locationCoords && destination) {
      const bounds = {
        northEast: {
          latitude: Math.max(locationCoords.latitude, destination.latitude),
          longitude: Math.max(locationCoords.longitude, destination.longitude),
        },
        southWest: {
          latitude: Math.min(locationCoords.latitude, destination.latitude),
          longitude: Math.min(locationCoords.longitude, destination.longitude),
        },
      };

      const padding = { top: 100, right: 50, bottom: 100, left: 50 };
      mapRef.current.fitToCoordinates(
        [
          { latitude: bounds.northEast.latitude, longitude: bounds.northEast.longitude },
          { latitude: bounds.southWest.latitude, longitude: bounds.southWest.longitude },
        ],
        { edgePadding: padding, animated: true }
      );
    }

    try {
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No auth token available, skipping route save');
        return;
      }

      // Decode token to get user ID
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', payload);

      // Prepare route data according to backend schema (no automated checkpoints)
      const routeData = {
        startLocation: {
          latitude: locationCoords?.latitude,
          longitude: locationCoords?.longitude,
          address: 'Current Location'
        },
        destination: {
          latitude: destination?.latitude,
          longitude: destination?.longitude,
          address: destination?.address || 'Selected Destination'
        },
        checkpoints: [], // Required by backend, even if empty
        distance: parseFloat(route.distance.replace(/[^0-9.]/g, '')),
        duration: parseInt(route.duration.replace(/\D/g, ''))
      };

      console.log('Saving route with data:', JSON.stringify(routeData, null, 2));

      // Save the route to backend
      const routeResponse = await fetch(`${API_URL}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(routeData)
      });

      if (!routeResponse.ok) {
        const errorText = await routeResponse.text();
        console.error('Route save error response:', errorText);
        throw new Error('Failed to save route: ' + errorText);
      }

      const routeResponseData = await routeResponse.json();
      console.log('Route save response:', JSON.stringify(routeResponseData, null, 2));

      if (!routeResponseData?.route?._id) {
        throw new Error('Invalid route response: missing route ID');
      }

      // Store the route ID from the response
      await AsyncStorage.setItem('currentRouteId', routeResponseData.route._id);
      console.log('Route saved successfully with ID:', routeResponseData.route._id);

      // Save journey data (no checkpoints)
      const journeyData = {
        currentLocation: {
          latitude: locationCoords?.latitude,
          longitude: locationCoords?.longitude,
          address: 'Current Location'
        },
        finalDestination: {
          latitude: destination?.latitude,
          longitude: destination?.longitude,
          address: destination?.address || 'Selected Destination'
        }
      };
      // Explicitly remove any stray fields
      delete journeyData.checkpoints;
      delete journeyData.selectedCheckpoint;

      console.log('Sending journey data:', journeyData);
      console.log('Using user ID:', payload.userId || payload.id);

      const journeyResponse = await fetch(`${API_URL}/api/users/journey/${payload.userId || payload.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(journeyData)
      });

      if (!journeyResponse.ok) {
        const errorText = await journeyResponse.text();
        console.error('Journey save error response:', errorText);
        throw new Error('Failed to save journey: ' + errorText);
      }

      const journeyResponseData = await journeyResponse.json();
      console.log('Journey save response:', JSON.stringify(journeyResponseData, null, 2));

      // Create route session
      const sessionData = {
        route: routeResponseData.route._id,
        currentLocation: {
          latitude: locationCoords?.latitude,
          longitude: locationCoords?.longitude,
          updatedAt: new Date()
        },
        destination: {
          latitude: destination?.latitude,
          longitude: destination?.longitude,
          address: destination?.address || 'Selected Destination'
        },
        selectedCheckpoints: []
      };

      const sessionResponse = await fetch(`${API_URL}/api/users/route-session/${payload.userId || payload.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('Session save error response:', errorText);
        throw new Error('Failed to save route session: ' + errorText);
      }

      const sessionResponseData = await sessionResponse.json();
      console.log('Route session save response:', JSON.stringify(sessionResponseData, null, 2));

    } catch (error) {
      console.error('Error saving route data:', error);
      Alert.alert(
        'Error',
        'Failed to save route data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const findNearestCheckpoint = (location: { latitude: number; longitude: number }, checkpoints: any[]) => {
    if (!checkpoints || checkpoints.length === 0) return null;

    let nearestCheckpoint = checkpoints[0];
    let minDistance = calculateDistance(location, {
      latitude: checkpoints[0].location.latitude,
      longitude: checkpoints[0].location.longitude
    });

    for (let i = 1; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
      const distance = calculateDistance(location, {
        latitude: checkpoint.location.latitude,
        longitude: checkpoint.location.longitude
      });

      if (distance < minDistance) {
        minDistance = distance;
        nearestCheckpoint = checkpoint;
      }
    }

    // Only return if within 100 meters (0.1 km)
    return minDistance <= 0.1 ? nearestCheckpoint : null;
  };

  const handleLocationSelect = async (selectedLocation: any) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to select a destination and explore products.',
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

    console.log('Handling location select:', selectedLocation);
    setShowLocationSelection(false);
    setSelectedDeliveryPoint(selectedLocation);

    // Normalize and save selected delivery point to AsyncStorage
    const normalizedDeliveryPoint = {
      id: selectedLocation.id,
      name: selectedLocation.name,
      address: selectedLocation.address || selectedLocation.name,
      latitude: selectedLocation.location.latitude,
      longitude: selectedLocation.location.longitude,
      type: selectedLocation.type,
    };
    console.log('Saving delivery point to AsyncStorage:', normalizedDeliveryPoint);
    // Save to AsyncStorage for use in the order process
    await AsyncStorage.setItem('selectedDeliveryPoint', JSON.stringify(normalizedDeliveryPoint));
    let destinationAddress = null;
    try {
      const destinationStr = await AsyncStorage.getItem('destination');
      if (destinationStr) {
        const parsedDestination = JSON.parse(destinationStr);
        destinationAddress = parsedDestination.address;
      }
    } catch {}
    if (destinationAddress) {
      try {
        await saveDeliveryPointToBackend(destinationAddress, normalizedDeliveryPoint);
        console.log('Delivery point saved successfully.');
      } catch (e) {
        console.error('Failed to save delivery point:', e);
      }
    } else {
      console.warn('No destination address found when trying to save delivery point.');
    }
    // Show confirmation dialog at the end
    console.log('Showing Alert for delivery point selection.');
    Alert.alert(
      'Delivery Point Selected',
      'Do you want to explore items now?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.push('/explore') }
      ]
    );
  };

  const findNearbyLocations = async () => {
    if (!locationCoords || !selectedRoute || !selectedRoute.coordinates) return;

    // Fetch admin-defined delivery points from backend
    let adminDeliveryPoints = [];
    try {
      adminDeliveryPoints = await fetchDeliveryPoints();
    } catch (err) {
      setNearbyLocations([]);
      setShowLocationSelection(true);
      Alert.alert('Error', 'Failed to fetch delivery points from server.');
        return;
      }
      
    // Get points along the route
    const routePoints = selectedRoute.coordinates;

    // Helper to interpolate points between two coordinates
    function interpolatePoints(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }, maxDistanceMeters = 50) {
      const points = [start];
      const distance = calculateDistance(start, end) * 1000; // in meters
      if (distance <= maxDistanceMeters) {
        points.push(end);
        return points;
      }
      const numPoints = Math.ceil(distance / maxDistanceMeters);
      for (let i = 1; i < numPoints; i++) {
        const lat = start.latitude + (end.latitude - start.latitude) * (i / numPoints);
        const lng = start.longitude + (end.longitude - start.longitude) * (i / numPoints);
        points.push({ latitude: lat, longitude: lng });
      }
      points.push(end);
      return points;
    }

    // Helper to densify a route polyline
    function densifyRoute(route: { latitude: number; longitude: number }[], maxDistanceMeters = 50) {
      if (!route || route.length < 2) return route;
      const densified: { latitude: number; longitude: number }[] = [];
      for (let i = 0; i < route.length - 1; i++) {
        const segment = interpolatePoints(route[i], route[i + 1], maxDistanceMeters);
        if (i === 0) {
          densified.push(...segment);
        } else {
          densified.push(...segment.slice(1)); // avoid duplicate point
        }
      }
      return densified;
    }

    // Densify the route for accurate proximity checks
    const densifiedRoute = densifyRoute(routePoints, 50); // 50 meters between points

    // Find unique delivery points within 100m of the densified route
    const uniquePointsMap = new Map();
    adminDeliveryPoints.forEach((point: any) => {
      const isNearRoute = densifiedRoute.some((routePoint: any, idx: number) => {
        if (idx === 0) return false;
        const prev = densifiedRoute[idx - 1];
        const dist = pointToLineDistance(
          { latitude: point.latitude, longitude: point.longitude },
          prev,
          routePoint
        );
        return dist <= 0.0009;
      });
      if (isNearRoute && !uniquePointsMap.has(point._id)) {
        uniquePointsMap.set(point._id, point);
      }
    });
    const pointsWithin100m = Array.from(uniquePointsMap.values());

    if (pointsWithin100m.length === 0) {
      setNearbyLocations([]);
      setShowLocationSelection(true);
      if (!noDeliveryPointsAlertShown && isFocused) {
        Alert.alert(
          'No delivery points available',
          'No delivery points are available within 100 meters of your route. Please change your route to continue.',
          [
            { text: 'OK', onPress: () => setNoDeliveryPointsAlertShown(true) }
          ]
        );
      }
      return;
    }

    // Map to TrafficLocation type for display, with correct distance from current location
    let deliveryPoints: TrafficLocation[] = pointsWithin100m.map((point: any, idx: number) => ({
      id: point._id,
      name: point.name,
      type: 'signal', // or use point.type if available
        location: {
          latitude: point.latitude,
          longitude: point.longitude
        },
      distance: locationCoords ? calculateDistance(locationCoords, { latitude: point.latitude, longitude: point.longitude }) : 0
    }));

    // Sort by distance (ascending)
    deliveryPoints = deliveryPoints.sort((a, b) => a.distance - b.distance);
    
    setNearbyLocations(deliveryPoints);
    setShowLocationSelection(true);
  };

  // Helper function to calculate distance between two points in kilometers
  const calculateDistance = (point1: { latitude: number; longitude: number }, 
                           point2: { latitude: number; longitude: number }) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getRouteColor = (density: DeliveryRoute['trafficDensity']) => {
    switch (density) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFA000';
      case 'high': return '#D32F2F';
      default: return '#4CAF50';
    }
  };

  const generateHighTrafficPoints = (origin: { latitude: number; longitude: number }, dest: { latitude: number; longitude: number }) => {
    const points: TrafficPoint[] = [];
    const numPoints = Math.floor(Math.random() * 2) + 2; // 2-3 high traffic points
    
    // Calculate the bounding box between origin and destination
    const minLat = Math.min(origin.latitude, dest.latitude);
    const maxLat = Math.max(origin.latitude, dest.latitude);
    const minLng = Math.min(origin.longitude, dest.longitude);
    const maxLng = Math.max(origin.longitude, dest.longitude);
    
    // Generate points with high traffic severity
    for (let i = 0; i < numPoints; i++) {
      const lat = minLat + (Math.random() * (maxLat - minLat));
      const lng = minLng + (Math.random() * (maxLng - minLng));
      
      points.push({
        id: `traffic_${i}`,
        type: 'congestion',
        severity: 'high',
        location: { latitude: lat, longitude: lng },
        description: 'Heavy traffic congestion reported',
        timestamp: Date.now()
      });
    }
    
    return points;
  };

  const handleTrafficPointSelect = (point: TrafficPoint) => {
    if (selectableTrafficPoints) {
      // Show detailed traffic information in an alert
      Alert.alert(
        `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} Details`,
        `Location Type: ${point.type}\nSeverity: ${point.severity.toUpperCase()}\nDescription: ${point.description}\nReported: ${new Date(point.timestamp).toLocaleTimeString()}`,
        [
          {
            text: 'View on Map',
            onPress: () => {
              setShowTrafficPointsModal(false);
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: point.location.latitude,
                  longitude: point.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    }
  };

  const renderTrafficPointsModal = () => {
    if (!showTrafficPointsModal) return null;

    const sortedPoints = [...trafficPoints].sort((a, b) => {
      // Sort by severity first (high to low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by type (congestion first)
      const typeOrder = { congestion: 3, accident: 2, construction: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTrafficPointsModal}
        onRequestClose={() => setShowTrafficPointsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <ThemedText style={styles.modalTitle}>Traffic Points</ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {`${sortedPoints.length} point${sortedPoints.length !== 1 ? 's' : ''} detected`}
                </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowTrafficPointsModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <ThemedText style={styles.legendText}>High Impact</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <ThemedText style={styles.legendText}>Medium Impact</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
                <ThemedText style={styles.legendText}>Low Impact</ThemedText>
              </View>
            </View>

            <ScrollView style={styles.trafficPointsList}>
              {sortedPoints.map((point) => (
                <TouchableOpacity
                  key={point.id}
                  style={[
                    styles.trafficPointItem,
                    { borderLeftWidth: 4, borderLeftColor: getTrafficMarkerColor(point.severity) }
                  ]}
                  onPress={() => {
                    handleTrafficPointSelect(point);
                    setShowTrafficPointsModal(false);
                  }}
                >
                  <View style={[
                    styles.trafficPointIcon,
                    { backgroundColor: getTrafficMarkerColor(point.severity) }
                  ]}>
                    <Ionicons 
                      name={getTrafficMarkerIcon(point.type)} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.trafficPointInfo}>
                    <ThemedText style={styles.trafficPointType}>
                      {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                    </ThemedText>
                    <ThemedText style={styles.trafficPointDescription}>
                      {point.description}
                    </ThemedText>
                    <View style={styles.trafficPointSeverity}>
                      <View style={[
                        styles.severityIndicator,
                        { backgroundColor: getTrafficMarkerColor(point.severity) }
                      ]}>
                        <ThemedText style={styles.severityText}>
                          {point.severity.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.selectButtonContainer}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                    <ThemedText style={styles.selectText}>Details</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowTrafficPointsModal(false)}
            >
              <ThemedText style={styles.closeModalButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // PanResponder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          routeSheetY.setValue(gestureState.dy);
          setIsDraggingSheet(true);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDraggingSheet(false);
        if (gestureState.dy > 100) {
          Animated.spring(routeSheetY, { toValue: MAX_SHEET_HEIGHT, useNativeDriver: true }).start(() => {
            setShowRouteOptions(false);
            setShowDimOverlay(false);
            routeSheetY.setValue(0);
          });
        } else {
          Animated.spring(routeSheetY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (showRouteOptions) {
      setShowDimOverlay(true);
      Animated.spring(routeSheetY, { toValue: 0, useNativeDriver: true }).start();
    } else {
      setShowDimOverlay(false);
    }
  }, [showRouteOptions]);

  // Modal search overlay
  const renderDestinationSearchModal = () => {
    if (!showDestinationInput) return null;
    return (
      <Modal
        visible={showDestinationInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestinationInput(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            {/* Only the search input, not the banner */}
            <View style={styles.searchHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowDestinationInput(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <ThemedText style={styles.searchTitle}>Enter Destination</ThemedText>
            </View>
            <GooglePlacesAutocomplete
              placeholder='Search for a location...'
              onPress={(data, details = null) => {
                if (details) {
                  const { geometry, formatted_address } = details;
                  const newDestination = {
                    latitude: geometry.location.lat,
                    longitude: geometry.location.lng,
                    address: formatted_address,
                  };
                  setDestination(newDestination);
                  setShowDestinationInput(false);
                  AsyncStorage.setItem('destination', JSON.stringify(newDestination));
                  // Clear selected delivery point when destination changes
                  AsyncStorage.removeItem('selectedDeliveryPoint');
                  if (locationCoords) {
                    // Generate and show high traffic points immediately after destination selection
                    const highTrafficPoints = generateHighTrafficPoints(locationCoords, {
                      latitude: geometry.location.lat,
                      longitude: geometry.location.lng
                    });
                    setTrafficPoints(highTrafficPoints);
                    setShowTrafficPoints(true);
                    // Update map region to show both points
                    const midLat = (locationCoords.latitude + geometry.location.lat) / 2;
                    const midLng = (locationCoords.longitude + geometry.location.lng) / 2;
                    const latDelta = Math.abs(locationCoords.latitude - geometry.location.lat) * 2;
                    const lngDelta = Math.abs(locationCoords.longitude - geometry.location.lng) * 2;
                    mapRef.current?.animateToRegion({
                      latitude: midLat,
                      longitude: midLng,
                      latitudeDelta: Math.max(latDelta, 0.02),
                      longitudeDelta: Math.max(lngDelta, 0.02),
                    }, 1000);
                    generateRouteOptions();
                  }
                }
              }}
              fetchDetails={true}
              query={{
                key: 'AIzaSyAW74HcfPLqNz7kmr7EK4LM6TTmCnJ3pXM',
                language: 'en',
                components: 'country:in',
              }}
              enablePoweredByContainer={false}
              styles={{
                container: styles.googlePlacesContainer,
                textInput: styles.googlePlacesInput,
                listView: styles.googlePlacesList,
                row: styles.googlePlacesRow,
                description: styles.googlePlacesDescription,
                separator: styles.googlePlacesSeparator,
              }}
              renderRow={(rowData) => {
                return (
                  <View style={styles.searchResultRow}>
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="location" size={20} color="#666" />
                    </View>
                    <View style={styles.searchResultText}>
                      <ThemedText style={styles.searchResultMainText}>{rowData.structured_formatting.main_text}</ThemedText>
                      <ThemedText style={styles.searchResultSecondaryText}>{rowData.structured_formatting.secondary_text}</ThemedText>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Reset the alert flag when route or destination changes
  useEffect(() => {
    setNoDeliveryPointsAlertShown(false);
  }, [selectedRoute, destination]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Location Header */}
      <View style={[styles.locationHeader, { zIndex: 9998 }]}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={24} color="white" />
          <ThemedText style={styles.locationText}>
            {locationCoords ? 'Location found' : 'Detecting location...'}
          </ThemedText>
          <TouchableOpacity onPress={setupLocation}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Always show the destination search bar/banner at the top */}
      {renderDestinationSearch()}

      {/* Modal for destination search input */}
      {renderDestinationSearchModal()}

      {destination && (
        <>
          <View style={styles.destinationBanner}>
            <View style={styles.destinationInfo}>
              <Ionicons name="navigate" size={20} color="#4CAF50" />
              <ThemedText style={styles.destinationText} numberOfLines={1}>
                Destination: {destination.address}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.changeDestination}
              onPress={() => setShowDestinationInput(true)}
            >
              <ThemedText style={styles.changeDestinationText}>Change</ThemedText>
            </TouchableOpacity>
          </View>

          {locationCoords && typeof locationCoords.latitude === 'number' && typeof locationCoords.longitude === 'number' && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: locationCoords.latitude,
                  longitude: locationCoords.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                {/* Origin Marker */}
                <Marker
                  coordinate={locationCoords}
                  title="Your Location"
                >
                  <View style={styles.originMarker}>
                    <Ionicons name="location" size={24} color="#4CAF50" />
                  </View>
                </Marker>

                {/* Destination marker */}
                {destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && (
                  <Marker
                    coordinate={{
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                    }}
                    title="Destination"
                    description={destination.address}
                  >
                    <View style={styles.destinationMarker}>
                      <Ionicons name="location" size={24} color="#D32F2F" />
                    </View>
                  </Marker>
                )}

                {/* Nearby Locations */}
                {nearbyLocations.filter(loc => loc && loc.location && typeof loc.location.latitude === 'number' && typeof loc.location.longitude === 'number').map((location) => (
                  <Marker
                    key={location.id}
                    coordinate={location.location}
                    title={location.name}
                    description={`${location.distance.toFixed(1)} km away`}
                  >
                    <View style={[styles.locationMarker, { backgroundColor: getMarkerColor(location.type) }]}> 
                      <Ionicons name={getMarkerIcon(location.type)} size={20} color="#fff" />
                    </View>
                  </Marker>
                ))}

                {/* Selected Delivery Point Marker */}
                {selectedDeliveryPoint && selectedDeliveryPoint.location && typeof selectedDeliveryPoint.location.latitude === 'number' && typeof selectedDeliveryPoint.location.longitude === 'number' && (
                  <Marker
                    coordinate={selectedDeliveryPoint.location}
                    title={selectedDeliveryPoint.name}
                    description={`${selectedDeliveryPoint.distance.toFixed(1)} km away`}
                  >
                    <View style={[styles.locationMarker, { 
                      backgroundColor: getMarkerColor(selectedDeliveryPoint.type),
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                      transform: [{ scale: 1.2 }]
                    }]}> 
                      <Ionicons name={getMarkerIcon(selectedDeliveryPoint.type)} size={24} color="#fff" />
                    </View>
                  </Marker>
                )}

                {/* Selected route */}
                {selectedRoute && (
                  <Polyline
                    coordinates={selectedRoute.coordinates}
                    strokeWidth={4}
                    strokeColor={getRouteColor(selectedRoute.trafficDensity)}
                  />
                )}
              </MapView>
            </View>
          )}
        </>
      )}

      {showRouteOptions && renderRouteOptions()}
      {showLocationSelection && renderLocationSelection()}
      {renderTrafficPointsModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a73e8',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    zIndex: 1000,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  destinationBanner: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  destinationText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  changeDestination: {
    padding: 4,
  },
  changeDestinationText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 100 : 68,
  },
  map: {
    flex: 1,
  },
  originMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  destinationMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    marginLeft: 4,
    fontSize: 14,
  },
  trafficIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trafficDensityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalCloseButton: {
    padding: 8,
  },
  trafficPointsList: {
    maxHeight: '80%',
  },
  trafficPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  trafficPointIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trafficPointInfo: {
    flex: 1,
  },
  trafficPointType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trafficPointDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trafficPointSeverity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  selectButtonContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  selectText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  closeModalButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  locationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  selectableTrafficMarker: {
    borderColor: '#4CAF50',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  selectableIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  destinationInputContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 68,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  destinationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationTextContainer: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  searchInputButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInputText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  searchInputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: -16,
    right: -16,
    bottom: -800,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  searchContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  googlePlacesContainer: {
    flex: 0,
    paddingHorizontal: 16,
  },
  googlePlacesInput: {
    height: 48,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    color: '#333',
  },
  googlePlacesList: {
    backgroundColor: 'white',
    marginTop: 8,
  },
  googlePlacesRow: {
    padding: 0,
  },
  googlePlacesDescription: {
    color: '#333',
  },
  googlePlacesSeparator: {
    height: 1,
    backgroundColor: '#eee',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultMainText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  searchResultSecondaryText: {
    fontSize: 14,
    color: '#666',
  },
  locationSelectionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeOptionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  routeOptionsHeader: {
    marginBottom: 16,
  },
  routeOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  routeOptionsList: {
    gap: 12,
  },
  routeOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  selectedRoute: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  routeNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trafficBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  routeMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeMetricText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  selectButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  routeOptionsBottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 2000,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginVertical: 6,
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
  },
  searchModalContent: {
    marginTop: 60,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    minHeight: '60%',
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 1999,
  },
  routeOptionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#222',
  },
  routeOptionsList: {
    flexGrow: 0,
    marginBottom: 8,
  },
  routeOptionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  routeMetricText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#666',
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 12,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
}); 