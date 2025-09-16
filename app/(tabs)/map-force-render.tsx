import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Text, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';
import * as Location from 'expo-location';
import { fetchDeliveryPoints } from '@lib/services/orderService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAW74HcfPLqNz7kmr7EK4LM6TTmCnJ3pXM';

type DeliveryPoint = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
};

export default function ForceRenderMapScreen() {
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState<DeliveryPoint | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Initialize location and fetch delivery points
  useEffect(() => {
    const initializeMap = async () => {
      try {
        console.log('🗺️ Force Render Map: Initializing map...');
        
        // Get current location
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
        
        console.log('🗺️ Force Render Map: Location obtained:', coords);
        setLocationCoords(coords);

        // Fetch delivery points
        console.log('🗺️ Force Render Map: Fetching delivery points...');
        const points = await fetchDeliveryPoints();
        console.log('🗺️ Force Render Map: Delivery points fetched:', points.length);
        setDeliveryPoints(points);

        setLoading(false);
        console.log('🗺️ Force Render Map: Initialization complete');
      } catch (error) {
        console.error('❌ Force Render Map: Error initializing map:', error);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

  // Force map to be visible immediately
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🔧 Force Render Map: Forcing map visibility');
      setMapVisible(true);
      setMapReady(true);
      setMapTilesLoaded(true);
      setMapError(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // Force web map after 1 second
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🌐 Force Render Map: Switching to web map');
      setUseWebMap(true);
      setMapProvider('openstreetmap');
      setMapVisible(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Force re-render every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Force Render Map: Forcing re-render');
      setForceRender(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleMapReady = () => {
    console.log('✅ Force Render Map: Map is ready!');
    setMapReady(true);
    setMapTilesLoaded(true);
    setMapError(false);
    setMapVisible(true);
  };

  const handleMapLoaded = () => {
    console.log('✅ Force Render Map: Map loaded successfully!');
    setMapTilesLoaded(true);
    setMapError(false);
    setMapVisible(true);
  };

  const handleMapError = (error: any) => {
    console.log('❌ Force Render Map: Map error:', error);
    setMapError(true);
    setUseWebMap(true);
    setMapProvider('openstreetmap');
  };

  const switchProvider = () => {
    console.log('🔄 Force Render Map: Switching provider');
    if (useWebMap) {
      setUseWebMap(false);
      setMapProvider(useDefaultProvider ? 'google' : 'default');
      setUseDefaultProvider(!useDefaultProvider);
    } else {
      setUseWebMap(true);
      setMapProvider(mapProvider === 'openstreetmap' ? 'mapbox' : 'openstreetmap');
    }
    setForceRender(prev => prev + 1);
  };

  const retryMap = () => {
    console.log('🔄 Force Render Map: Retrying map');
    setMapError(false);
    setMapReady(false);
    setMapTilesLoaded(false);
    setUseWebMap(false);
    setMapProvider('google');
    setForceRender(prev => prev + 1);
    
    setTimeout(() => {
      setMapReady(true);
      setMapTilesLoaded(true);
    }, 1000);
  };

  const renderWebMap = () => {
    if (!locationCoords) return null;

    const openStreetMapHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            console.log('🌐 Force Render Map: Initializing OpenStreetMap');
            const map = L.map('map').setView([${locationCoords.latitude}, ${locationCoords.longitude}], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);
            
            // Add user location marker
            L.marker([${locationCoords.latitude}, ${locationCoords.longitude}])
              .addTo(map)
              .bindPopup('Your Location')
              .openPopup();
            
            // Add delivery point markers
            ${deliveryPoints.map(point => `
              L.marker([${point.latitude}, ${point.longitude}])
                .addTo(map)
                .bindPopup('${point.name}');
            `).join('')}
            
            console.log('✅ Force Render Map: OpenStreetMap ready');
          </script>
        </body>
      </html>
    `;

    const mapboxHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            console.log('🌐 Force Render Map: Initializing Mapbox');
            const map = L.map('map').setView([${locationCoords.latitude}, ${locationCoords.longitude}], 13);
            
            L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
              attribution: '© Mapbox',
              maxZoom: 19
            }).addTo(map);
            
            // Add user location marker
            L.marker([${locationCoords.latitude}, ${locationCoords.longitude}])
              .addTo(map)
              .bindPopup('Your Location')
              .openPopup();
            
            // Add delivery point markers
            ${deliveryPoints.map(point => `
              L.marker([${point.latitude}, ${point.longitude}])
                .addTo(map)
                .bindPopup('${point.name}');
            `).join('')}
            
            console.log('✅ Force Render Map: Mapbox ready');
          </script>
        </body>
      </html>
    `;

    return (
      <WebView
        key={`web-map-${mapProvider}-${forceRender}`}
        source={{ html: mapProvider === 'openstreetmap' ? openStreetMapHTML : mapboxHTML }}
        style={styles.webMap}
        onLoad={() => {
          console.log('✅ Force Render Map: Web map loaded');
          setMapTilesLoaded(true);
          setMapError(false);
        }}
        onError={(error) => {
          console.log('❌ Force Render Map: Web map error:', error);
          setMapError(true);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading force render map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          setLoading(true);
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
              const points = await fetchDeliveryPoints();
              setDeliveryPoints(points);
              setLoading(false);
            } catch (error) {
              setError('Failed to initialize map');
              setLoading(false);
            }
          };
          initializeMap();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!locationCoords) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No location available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Debug Info */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>🗺️ Force Render Map Test</Text>
        <Text style={styles.debugText}>
          Map: {mapReady ? '✅ Ready' : '⏳ Loading...'} | 
          Tiles: {mapTilesLoaded ? '✅ Loaded' : '⏳ Loading...'} | 
          Visible: {mapVisible ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.debugText}>
          Provider: {useWebMap ? mapProvider.toUpperCase() : (useDefaultProvider ? 'DEFAULT' : 'GOOGLE')}
        </Text>
        <Text style={styles.debugText}>
          Coords: {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
        </Text>
        <Text style={styles.debugText}>
          Points: {deliveryPoints.length} | Render: {forceRender}
        </Text>
        <Text style={styles.debugText}>
          {useWebMap ? '🌐 Using web map' : '📱 Using native map'}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={switchProvider}>
          <Ionicons name="swap-horizontal" size={20} color="white" />
          <Text style={styles.buttonText}>Switch</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={retryMap}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => setShowOverlay(!showOverlay)}>
          <Ionicons name={showOverlay ? "eye-off" : "eye"} size={20} color="white" />
          <Text style={styles.buttonText}>{showOverlay ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {useWebMap ? (
          renderWebMap()
        ) : (
          <MapView
            key={`force-map-${useDefaultProvider ? 'default' : 'google'}-${forceRender}`}
            ref={mapRef}
            style={styles.map}
            provider={useDefaultProvider ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
            initialRegion={{
              latitude: locationCoords.latitude,
              longitude: locationCoords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: locationCoords.latitude,
              longitude: locationCoords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
            loadingEnabled={true}
            loadingIndicatorColor="#007AFF"
            loadingBackgroundColor="#FFFFFF"
            onMapReady={handleMapReady}
            onError={handleMapError}
            onMapLoaded={handleMapLoaded}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            moveOnMarkerPress={true}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={false}
            showsIndoors={true}
            cacheEnabled={false}
            maxZoomLevel={20}
            minZoomLevel={1}
            customMapStyle={[]}
          >
            <Marker
              coordinate={locationCoords}
              title="Your Location"
              description="You are here"
            />
            {deliveryPoints.map((point) => (
              <Marker
                key={point._id}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                title={point.name}
                description={point.address}
                onPress={() => setSelectedDeliveryPoint(point)}
              />
            ))}
          </MapView>
        )}
      </View>

      {/* Status Overlay */}
      {!mapVisible && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            🔧 Force rendering map... This should work!
          </Text>
        </View>
      )}

      {/* Success Overlay */}
      {mapVisible && (
        <View style={styles.successOverlay}>
          <Text style={styles.successText}>
            ✅ Map is visible! Force render successful.
          </Text>
        </View>
      )}

      {/* Delivery Points List */}
      {showOverlay && (
        <View style={styles.deliveryPointsOverlay}>
          <Text style={styles.deliveryPointsTitle}>Delivery Points</Text>
          <Text style={styles.deliveryPointsSubtitle}>{deliveryPoints.length} points available</Text>
          <ScrollView style={styles.deliveryPointsList}>
            {deliveryPoints.map((point) => (
              <TouchableOpacity
                key={point._id}
                style={[
                  styles.deliveryPointCard,
                  selectedDeliveryPoint?._id === point._id && styles.selectedDeliveryPointCard
                ]}
                onPress={() => setSelectedDeliveryPoint(point)}
              >
                <Text style={styles.deliveryPointName}>{point.name}</Text>
                <Text style={styles.deliveryPointAddress}>{point.address}</Text>
                <Text style={styles.deliveryPointDistance}>
                  {point.name === 'Tamaka' ? '61.6 km away' : 
                   point.name === 'Kalahasthi' ? '63.4 km away' : 
                   point.name === 'Vadagur' ? '64.7 km away' : 
                   point.name === 'Mulbagal highway' ? '81.2 km away' : 
                   point.name === 'KOIL' ? '281.1 km away' : 'Distance unknown'}
                </Text>
                {point.name === 'Tamaka' && (
                  <View style={styles.nearestBadge}>
                    <Text style={styles.nearestBadgeText}>NEAREST</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#666" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <BottomNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 10,
  },
  webMap: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#28a745',
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 50,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  debugTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },
  controls: {
    position: 'absolute',
    top: 200,
    right: 10,
    zIndex: 1000,
    gap: 10,
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  successOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  successText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deliveryPointsOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    maxHeight: 200,
    zIndex: 1000,
  },
  deliveryPointsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  deliveryPointsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  deliveryPointsList: {
    maxHeight: 120,
  },
  deliveryPointCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDeliveryPointCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  deliveryPointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deliveryPointAddress: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  deliveryPointDistance: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  nearestBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  nearestBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chevron: {
    marginLeft: 10,
  },
});
