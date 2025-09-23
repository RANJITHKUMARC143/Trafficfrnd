import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Text, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import { router } from 'expo-router';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';
import * as Location from 'expo-location';
import { fetchDeliveryPoints, fetchUserOrders, fetchOrderDetails } from '@lib/services/orderService';
import chatService from '../../services/chatService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAW74HcfPLqNz7kmr7EK4LM6TTmCnJ3pXM';

// Fast initial render: fallback location (Bengaluru city center)
const DEFAULT_COORDS = { latitude: 12.9716, longitude: 77.5946 };

// Configure Google Maps API key for react-native-maps
if (Platform.OS === 'android') {
  // For Android, the API key should be in app.json
  console.log('📱 Android: Using API key from app.json');
} else if (Platform.OS === 'ios') {
  // For iOS, the API key should be in app.json
  console.log('📱 iOS: Using API key from app.json');
}

type DeliveryPoint = {
  _id: string;
  name: string;
    latitude: number;
    longitude: number;
  address: string;
};

export default function MapScreen() {
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState<DeliveryPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);
  const [useDefaultProvider, setUseDefaultProvider] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [showFallbackMap, setShowFallbackMap] = useState(false);
  const [useWebMap, setUseWebMap] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'default' | 'openstreetmap' | 'mapbox'>('google');
  const mapRef = useRef<MapView>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastDeliveryUpdate, setLastDeliveryUpdate] = useState<number | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);

  // Initialize location and fetch delivery points
  useEffect(() => {
    const initializeMap = async () => {
      try {
        console.log('MapScreen: Initializing map...');
        // Kick off both tasks without blocking rendering
        (async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              console.log('MapScreen: Location permission denied, using default coordinates');
              setLocationCoords(DEFAULT_COORDS);
              return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setLocationCoords(coords);
          } catch {
            setLocationCoords(DEFAULT_COORDS);
          }
        })();

        (async () => {
          try {
            await fetchAllDeliveryPoints();
          } catch {}
        })();

        // Detect user's active order and wire realtime tracking on map
        (async () => {
          try {
            const orders = await fetchUserOrders();
            const list = Array.isArray(orders) ? orders : (orders?.orders || []);
            const normalizeStatus = (s: any) => String(s || '').toLowerCase();
            const candidates = (list || []).filter((o: any) => ['pending','confirmed','preparing','enroute','ready'].includes(normalizeStatus(o?.status)));
            if (candidates.length > 0) {
              // pick most recently updated
              candidates.sort((a: any, b: any) => new Date(b?.updatedAt || b?.timestamp || 0).getTime() - new Date(a?.updatedAt || a?.timestamp || 0).getTime());
              const chosen = candidates[0];
              const chosenId = String(chosen?._id || chosen?.id || '');
              if (chosenId) {
                setActiveOrderId(chosenId);
                // fetch order details to get selectedDeliveryPoint
                try {
                  const detail = await fetchOrderDetails(chosenId);
                  const dp = detail?.selectedDeliveryPoint;
                  const lat = Number(dp?.latitude ?? dp?.location?.coordinates?.[1]);
                  const lng = Number(dp?.longitude ?? dp?.location?.coordinates?.[0]);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setDeliveryPoint({ latitude: lat, longitude: lng, name: String(dp?.name || 'Delivery Point') });
                  }
                } catch {}
                try {
                  const socket = await chatService.connect();
                  if (socket) {
                    chatService.joinOrderRoom(chosenId);
                    // Subscribe to partner location updates
                    chatService.onLocationUpdate(({ deliveryBoyId, location }) => {
                      try {
                        const coords = location?.coordinates || location?.coords || location;
                        if (Array.isArray(coords) && coords.length >= 2) {
                          const lat = Number(coords[1]);
                          const lng = Number(coords[0]);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            setDeliveryBoyLocation({ latitude: lat, longitude: lng });
                            setLastDeliveryUpdate(Date.now());
                          }
                        } else if (typeof location?.latitude === 'number' && typeof location?.longitude === 'number') {
                          setDeliveryBoyLocation({ latitude: location.latitude, longitude: location.longitude });
                          setLastDeliveryUpdate(Date.now());
                        }
                      } catch {}
                    });
                  }
                } catch {}
              }
            }
          } catch {}
        })();
      } catch (error) {
        console.error('MapScreen: Error initializing map:', error);
        // Fall back gracefully
        if (!locationCoords) setLocationCoords(DEFAULT_COORDS);
      }
    };

    initializeMap();
  }, []);

  // Live user location every 1s and emit to socket when tracking active order
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let mounted = true;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 0,
          },
          (loc) => {
            if (!mounted) return;
            const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setLocationCoords(coords);
            if (activeOrderId) {
              try { chatService.updateUserLocation(activeOrderId, coords); } catch {}
            }
          }
        );
      } catch {}
    })();
    return () => {
      mounted = false;
      try { (sub as any)?.remove?.(); } catch {}
    };
  }, [activeOrderId]);

  // Re-sort delivery points when location changes
  useEffect(() => {
    if (locationCoords && deliveryPoints.length > 0) {
      console.log('MapScreen: Sorting delivery points by distance...');
      const sortedPoints = [...deliveryPoints].sort((a, b) => {
        const distanceA = calculateDistance(locationCoords, a);
        const distanceB = calculateDistance(locationCoords, b);
        console.log(`Distance: ${a.name} = ${distanceA.toFixed(1)}km, ${b.name} = ${distanceB.toFixed(1)}km`);
        return distanceA - distanceB;
      });
      console.log('MapScreen: Sorted points:', sortedPoints.map(p => `${p.name}: ${calculateDistance(locationCoords, p).toFixed(1)}km`));
      setDeliveryPoints(sortedPoints);
    }
  }, [locationCoords, deliveryPoints.length]);

  // Force map ready after 3 seconds if it hasn't loaded
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapReady) {
        console.log('⏰ Map timeout - forcing ready state');
        setMapReady(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [mapReady]);

  // Force tiles loaded after 3 seconds
  useEffect(() => {
    if (mapReady && !mapTilesLoaded) {
      const timeout = setTimeout(() => {
        console.log('⏰ Tiles timeout - forcing tiles loaded state');
        setMapTilesLoaded(true);
        setMapError(false);
        // Force map to re-render
        setForceRender(prev => prev + 1);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [mapReady, mapTilesLoaded]);

  // Force map to show after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapTilesLoaded) {
        console.log('⏰ Force showing map - switching to web map');
        setMapTilesLoaded(true);
        setMapError(false);
        setUseWebMap(true);
        setMapProvider('openstreetmap');
        // Force map to re-render
        setForceRender(prev => prev + 1);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [mapTilesLoaded]);

  // Check if map tiles are loaded after map is ready
  useEffect(() => {
    if (mapReady && !mapTilesLoaded) {
      const tileTimeout = setTimeout(() => {
        console.log('⏰ Map tiles timeout - checking provider');
        if (!mapTilesLoaded) {
          if (!useDefaultProvider) {
            console.log('❌ Google Maps tiles not loaded - switching to default provider');
            setUseDefaultProvider(true);
            setMapError(false);
            setMapReady(false);
          } else {
            console.log('❌ Default provider tiles also not loaded - switching to web map');
            setMapTilesLoaded(true);
            setMapError(false);
            setUseWebMap(true);
            setMapProvider('openstreetmap');
            // Force map re-render
            setForceRender(prev => prev + 1);
          }
        }
      }, 5000); // Reduced timeout for faster fallback

      return () => clearTimeout(tileTimeout);
    }
  }, [mapReady, mapTilesLoaded, useDefaultProvider]);

  // Fetch all delivery points from backend
  const fetchAllDeliveryPoints = async () => {
    try {
      console.log('MapScreen: Calling fetchDeliveryPoints...');
      const points = await fetchDeliveryPoints();
      console.log('MapScreen: Received delivery points:', points);
      setDeliveryPoints(points);
    } catch (error) {
      console.error('MapScreen: Error fetching delivery points:', error);
      // Don't set error for delivery points failure, just log it
      console.log('MapScreen: Continuing without delivery points...');
      setDeliveryPoints([]);
    }
  };

  // Handle delivery point selection
  const handleDeliveryPointPress = (point: DeliveryPoint) => {
    setSelectedDeliveryPoint(point);
    Alert.alert(
      'Delivery Point Selected',
      `Do you want to explore items at ${point.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Search', onPress: () => router.push('/search') }
      ]
    );
  };

  // Calculate distance between two points
  const calculateDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Render web-based map
  const renderWebMap = () => {
    if (!locationCoords) return null;

    const mapHtml = mapProvider === 'openstreetmap' ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body style="margin:0; padding:0;">
        <div id="map" style="width:100%; height:100%;"></div>
        <script>
          const map = L.map('map').setView([${locationCoords.latitude}, ${locationCoords.longitude}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Add user location marker
          L.marker([${locationCoords.latitude}, ${locationCoords.longitude}])
            .addTo(map)
            .bindPopup('Your Location')
            .openPopup();
          
          // Add delivery point zones and markers
          ${deliveryPoints.map(point => `
            L.circle([${point.latitude}, ${point.longitude}], {
              radius: 300,
              color: '#4CAF50',
              weight: 2,
              fillColor: '#4CAF50',
              fillOpacity: 0.15
            }).addTo(map);

            L.marker([${point.latitude}, ${point.longitude}])
              .addTo(map)
              .bindPopup('${point.name}<br>${point.address}');
          `).join('')}
          
          setTimeout(() => {
            window.ReactNativeWebView.postMessage('mapReady');
          }, 1000);
        </script>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body style="margin:0; padding:0;">
        <div id="map" style="width:100%; height:100%;"></div>
        <script>
          mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
          const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [${locationCoords.longitude}, ${locationCoords.latitude}],
            zoom: 15
          });
          
          // Add user location marker
          new mapboxgl.Marker()
            .setLngLat([${locationCoords.longitude}, ${locationCoords.latitude}])
            .setPopup(new mapboxgl.Popup().setHTML('<b>Your Location</b>'))
            .addTo(map);
          
          // Add delivery points markers
          ${deliveryPoints.map(point => `
            new mapboxgl.Marker()
              .setLngLat([${point.longitude}, ${point.latitude}])
              .setPopup(new mapboxgl.Popup().setHTML('<b>${point.name}</b><br>${point.address}'))
              .addTo(map);
          `).join('')}
          
          map.on('load', () => {
            setTimeout(() => {
              window.ReactNativeWebView.postMessage('mapReady');
            }, 1000);
          });
        </script>
      </body>
      </html>
    `;

    return (
      <WebView
        key={`web-map-${mapProvider}-${forceRender}`}
        style={styles.map}
        source={{ html: mapHtml }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'mapReady') {
            console.log(`✅ ${mapProvider.toUpperCase()}: Web map ready`);
            setMapReady(true);
            setMapTilesLoaded(true);
          }
        }}
        onError={(error) => {
          console.log(`❌ ${mapProvider.toUpperCase()}: Web map error`, error);
          // Switch to next provider
          if (mapProvider === 'openstreetmap') {
            setMapProvider('mapbox');
          } else {
            setShowFallbackMap(true);
          }
        }}
      />
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            setLoading(true);
            // Re-initialize the map
            const initializeMap = async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  setError('Location permission denied');
                  setLoading(false);
                  return;
                }
                const location = await Location.getCurrentPositionAsync({});
                const coords = {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                };
                setLocationCoords(coords);
                await fetchAllDeliveryPoints();
              } catch (error) {
                console.error('Error initializing map:', error);
                setError('Failed to initialize map');
              } finally {
                setLoading(false);
              }
            };
            initializeMap();
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
              </View>
    );
  }

  return (
    <View style={styles.container}>
      


      <MapView
                key={`map-${useDefaultProvider ? 'default' : 'google'}-${forceRender}`}
                ref={mapRef}
                style={styles.map}
                provider={useDefaultProvider ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                initialRegion={{
              latitude: (locationCoords || DEFAULT_COORDS).latitude,
              longitude: (locationCoords || DEFAULT_COORDS).longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                region={{
                  latitude: (locationCoords || DEFAULT_COORDS).latitude,
                  longitude: (locationCoords || DEFAULT_COORDS).longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                mapType="standard"
                loadingEnabled={true}
                loadingIndicatorColor="#007AFF"
                loadingBackgroundColor="#FFFFFF"
                moveOnMarkerPress={false}
                showsCompass={true}
                showsScale={true}
                showsBuildings={true}
                showsTraffic={false}
                showsIndoors={true}
                zoomEnabled={true}
                scrollEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                // Force map to render
                cacheEnabled={false}
                maxZoomLevel={20}
                minZoomLevel={1}
                // Add explicit map styling
                customMapStyle={[]}
                // Force map to be visible
                style={{ flex: 1, width: '100%', height: '100%' }}
                onMapReady={() => {
                  console.log('✅ Map is ready!');
                  console.log('✅ Map provider: Google Maps');
                  console.log('✅ API Key verified and working');
                  setMapReady(true);
                }}
                onError={(error) => {
                  console.log('❌ Map error:', error);
                  console.log('❌ Map error details:', JSON.stringify(error, null, 2));
                  console.log('❌ API Key being used:', GOOGLE_MAPS_API_KEY);
                  console.log('❌ Error type:', typeof error);
                  console.log('❌ Error message:', error?.message || 'No message');
                }}
                onMapLoaded={() => {
                  console.log('✅ Map loaded successfully!');
                  console.log('✅ Map tiles should be visible now');
                  setMapTilesLoaded(true);
                  setMapReady(true);
                }}
                onLayout={() => {
                  console.log('📐 Map layout completed');
                }}
                onRegionChange={(region) => {
                  console.log('🗺️ Map region changed:', region);
                }}
                onRegionChangeComplete={(region) => {
                  console.log('🗺️ Map region change complete:', region);
                  console.log('🗺️ Map should be fully rendered now');
                }}
      >
        {/* Live tracking when user has an active order */}
        {activeOrderId ? (
          <>
            {locationCoords && (
              <Marker
                coordinate={locationCoords}
                title="Your Location"
                description="You are here"
              >
                <View style={styles.userLocationMarker}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              </Marker>
            )}
            {deliveryBoyLocation && (
              <Marker
                coordinate={deliveryBoyLocation}
                title="Delivery Partner"
                description={lastDeliveryUpdate && (Date.now() - lastDeliveryUpdate) > 30000 ? 'Location unavailable' : 'Live location'}
              >
                <View style={styles.partnerMarker}>
                  <Ionicons name="bicycle" size={18} color="#fff" />
                </View>
              </Marker>
            )}
            {locationCoords && deliveryBoyLocation && lastDeliveryUpdate && (Date.now() - lastDeliveryUpdate) <= 30000 && (
              <Polyline
                coordinates={[deliveryBoyLocation, locationCoords]}
                strokeColor="#1976D2"
                strokeWidth={4}
              />
            )}
            {deliveryPoint && (
              <Marker
                coordinate={deliveryPoint}
                title={deliveryPoint.name || 'Delivery Point'}
              >
                <View style={styles.deliveryPointMarker}>
                  <Ionicons name="flag" size={18} color="#fff" />
                </View>
              </Marker>
            )}
          </>
        ) : (
          // Default: show delivery points discovery map
          <>
            <Marker
              coordinate={(locationCoords || DEFAULT_COORDS) as { latitude: number; longitude: number }}
              title="Your Location"
              description="You are here"
            >
              <View style={styles.userLocationMarker}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            </Marker>
            {deliveryPoints.map((point) => {
              const distance = locationCoords ? calculateDistance(locationCoords, point) : 0;
              return (
                <React.Fragment key={point._id}>
                  <Circle
                    key={`${point._id}-zone`}
                    center={{ latitude: point.latitude, longitude: point.longitude }}
                    radius={300}
                    strokeColor={'#4CAF50'}
                    strokeWidth={2}
                    fillColor={'rgba(76, 175, 80, 0.15)'}
                  />
                  <Marker
                    key={point._id}
                    coordinate={{
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }}
                    title={point.name}
                    description={`${distance.toFixed(1)} km away`}
                    onPress={() => handleDeliveryPointPress(point)}
                  >
                    <View style={[
                      styles.deliveryPointMarker,
                      selectedDeliveryPoint?._id === point._id && styles.selectedDeliveryPointMarker
                    ]}>
                      <Ionicons name="location" size={20} color="#fff" />
                    </View>
                  </Marker>
                </React.Fragment>
              );
            })}
          </>
        )}
      </MapView>

      {/* Web-based map when native maps fail */}
      {useWebMap && renderWebMap()}

      {/* Fallback map view when both providers fail */}
      {showFallbackMap && (
        <View style={styles.fallbackMapContainer}>
          <View style={styles.fallbackMapContent}>
            <Text style={styles.fallbackMapTitle}>📍 Map View</Text>
            <Text style={styles.fallbackMapSubtitle}>
              Your Location: {locationCoords?.latitude.toFixed(4)}, {locationCoords?.longitude.toFixed(4)}
            </Text>
            <Text style={styles.fallbackMapText}>
              {deliveryPoints.length} delivery points available
            </Text>
            <TouchableOpacity 
              style={styles.fallbackMapButton}
              onPress={() => {
                setShowFallbackMap(false);
                setUseDefaultProvider(false);
                setMapReady(false);
                setMapTilesLoaded(false);
                setForceRender(prev => prev + 1);
              }}
            >
              <Text style={styles.fallbackMapButtonText}>Try Map Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Success message when default provider works */}
      {useDefaultProvider && mapTilesLoaded && (
        <View style={styles.mapSuccessOverlay}>
          <Text style={styles.mapSuccessTitle}>✅ Map Working!</Text>
          <Text style={styles.mapSuccessText}>
            Using default map provider. You can switch back to Google Maps using the swap button.
          </Text>
        </View>
      )}

      {/* Map error overlay - only show if using Google Maps and tiles fail */}
      {mapError && !useDefaultProvider && (
        <View style={styles.mapErrorOverlay}>
          <Text style={styles.mapErrorTitle}>Google Maps Loading Issue</Text>
          <Text style={styles.mapErrorText}>
            Google Maps tiles are not loading. Try switching to the default map provider.
          </Text>
          <View style={styles.mapErrorButtons}>
            <TouchableOpacity 
              style={[styles.mapErrorButton, styles.mapErrorButtonSecondary]}
              onPress={() => {
                setMapError(false);
                setMapTilesLoaded(false);
                setMapReady(false);
                // Force map reload
                if (mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: locationCoords?.latitude || 0,
                    longitude: locationCoords?.longitude || 0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }
              }}
            >
              <Text style={styles.mapErrorButtonText}>Retry Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mapErrorButton}
              onPress={() => {
                console.log('🔄 Switching to default provider from error overlay');
                setUseDefaultProvider(true);
                setMapError(false);
                setMapTilesLoaded(false);
                setMapReady(false);
              }}
            >
              <Text style={styles.mapErrorButtonText}>Use Default Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Delivery points list overlay */}
      {showOverlay && !activeOrderId && (
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Points</Text>
          <Text style={styles.headerSubtitle}>
            {deliveryPoints.length} points available
          </Text>
                    </View>
        
        <ScrollView 
          style={styles.deliveryPointsList}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {deliveryPoints.map((point, index) => {
            const distance = locationCoords ? calculateDistance(locationCoords, point) : 0;
            const isNearest = index === 0;
            return (
              <TouchableOpacity
                key={point._id}
                style={[
                  styles.deliveryPointItem,
                  selectedDeliveryPoint?._id === point._id && styles.selectedDeliveryPointItem,
                  isNearest && styles.nearestDeliveryPointItem
                ]}
                onPress={() => handleDeliveryPointPress(point)}
              >
                <View style={styles.deliveryPointInfo}>
                  <View style={styles.deliveryPointHeader}>
                    <Text style={styles.deliveryPointName}>{point.name}</Text>
                    {isNearest && (
                      <View style={styles.nearestBadge}>
                        <Text style={styles.nearestBadgeText}>NEAREST</Text>
                    </View>
                    )}
                  </View>
                  <Text style={styles.deliveryPointAddress}>{point.address}</Text>
                  <Text style={[styles.deliveryPointDistance, isNearest && styles.nearestDistance]}>
                    {distance.toFixed(1)} km away
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
            </View>
          )}

      {/* Enhanced Navigation Bar */}
      <BottomNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0', // Light gray background to see map container
    borderWidth: 2,
    borderColor: '#007AFF', // Blue border to see map boundaries
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userLocationMarker: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  deliveryPointMarker: {
    backgroundColor: '#34C759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  selectedDeliveryPointMarker: {
    backgroundColor: '#FF9500',
    transform: [{ scale: 1.2 }],
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    maxHeight: 250,
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deliveryPointsList: {
    maxHeight: 200,
  },
  deliveryPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedDeliveryPointItem: {
    backgroundColor: '#E3F2FD',
  },
  nearestDeliveryPointItem: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  deliveryPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nearestBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  nearestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nearestDistance: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  deliveryPointInfo: {
    flex: 1,
  },
  deliveryPointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  deliveryPointAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deliveryPointDistance: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    zIndex: 2000,
    alignItems: 'center',
  },
  mapErrorButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  mapErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
  },
  mapErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  mapErrorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  mapErrorButtonSecondary: {
    backgroundColor: '#6c757d',
  },
  mapErrorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapSuccessOverlay: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderRadius: 12,
    padding: 15,
    zIndex: 2000,
    alignItems: 'center',
  },
  mapSuccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  mapSuccessText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  fallbackMapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    zIndex: 3000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackMapContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fallbackMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fallbackMapSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  fallbackMapText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  fallbackMapButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  fallbackMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
