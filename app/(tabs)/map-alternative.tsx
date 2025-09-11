import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

type MapProvider = 'google' | 'default' | 'openstreetmap' | 'mapbox' | 'custom';

export default function AlternativeMapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<MapProvider>('google');
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('🔍 Alternative Map: Requesting location permissions...');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        console.log('🔍 Alternative Map: Getting current location...');
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        console.log('🔍 Alternative Map: Location obtained:', coords);
        setLocation(coords);
        setLoading(false);
      } catch (error) {
        console.error('❌ Alternative Map: Error getting location:', error);
        setError('Failed to get location');
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  // Auto-switch providers if current one fails
  useEffect(() => {
    if (mapReady && !tilesLoaded) {
      const timeout = setTimeout(() => {
        console.log('⏰ Alternative Map: Provider timeout, switching...');
        switchToNextProvider();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [mapReady, tilesLoaded, currentProvider]);

  const switchToNextProvider = () => {
    const providers: MapProvider[] = ['google', 'default', 'openstreetmap', 'mapbox', 'custom'];
    const currentIndex = providers.indexOf(currentProvider);
    const nextIndex = (currentIndex + 1) % providers.length;
    const nextProvider = providers[nextIndex];
    
    console.log(`🔄 Alternative Map: Switching from ${currentProvider} to ${nextProvider}`);
    setCurrentProvider(nextProvider);
    setMapReady(false);
    setTilesLoaded(false);
    setMapKey(prev => prev + 1);
  };

  const switchProvider = (provider: MapProvider) => {
    console.log(`🔄 Alternative Map: Manually switching to ${provider}`);
    setCurrentProvider(provider);
    setMapReady(false);
    setTilesLoaded(false);
    setMapKey(prev => prev + 1);
  };

  const retryMap = () => {
    console.log('🔄 Alternative Map: Retrying current provider');
    setMapReady(false);
    setTilesLoaded(false);
    setMapKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading alternative map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No location available</Text>
      </View>
    );
  }

  const renderMap = () => {
    switch (currentProvider) {
      case 'google':
        return (
          <MapView
            key={`google-map-${mapKey}`}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
            loadingEnabled={true}
            onMapReady={() => {
              console.log('✅ Google Maps: Map ready');
              setMapReady(true);
            }}
            onMapLoaded={() => {
              console.log('✅ Google Maps: Tiles loaded');
              setTilesLoaded(true);
            }}
            onError={(error) => {
              console.log('❌ Google Maps: Error', error);
              switchToNextProvider();
            }}
          >
            <Marker
              coordinate={location}
              title="Your Location"
              description="You are here"
            />
          </MapView>
        );

      case 'default':
        return (
          <MapView
            key={`default-map-${mapKey}`}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
            loadingEnabled={true}
            onMapReady={() => {
              console.log('✅ Default Map: Map ready');
              setMapReady(true);
            }}
            onMapLoaded={() => {
              console.log('✅ Default Map: Tiles loaded');
              setTilesLoaded(true);
            }}
            onError={(error) => {
              console.log('❌ Default Map: Error', error);
              switchToNextProvider();
            }}
          >
            <Marker
              coordinate={location}
              title="Your Location"
              description="You are here"
            />
          </MapView>
        );

      case 'openstreetmap':
        return (
          <WebView
            key={`osm-map-${mapKey}`}
            style={styles.map}
            source={{
              html: `
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
                    const map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                    L.marker([${location.latitude}, ${location.longitude}])
                      .addTo(map)
                      .bindPopup('Your Location')
                      .openPopup();
                    setTimeout(() => {
                      window.ReactNativeWebView.postMessage('mapReady');
                    }, 1000);
                  </script>
                </body>
                </html>
              `
            }}
            onMessage={(event) => {
              if (event.nativeEvent.data === 'mapReady') {
                console.log('✅ OpenStreetMap: Map ready');
                setMapReady(true);
                setTilesLoaded(true);
              }
            }}
            onError={(error) => {
              console.log('❌ OpenStreetMap: Error', error);
              switchToNextProvider();
            }}
          />
        );

      case 'mapbox':
        return (
          <WebView
            key={`mapbox-map-${mapKey}`}
            style={styles.map}
            source={{
              html: `
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
                      center: [${location.longitude}, ${location.latitude}],
                      zoom: 15
                    });
                    new mapboxgl.Marker()
                      .setLngLat([${location.longitude}, ${location.latitude}])
                      .setPopup(new mapboxgl.Popup().setHTML('<b>Your Location</b>'))
                      .addTo(map);
                    map.on('load', () => {
                      setTimeout(() => {
                        window.ReactNativeWebView.postMessage('mapReady');
                      }, 1000);
                    });
                  </script>
                </body>
                </html>
              `
            }}
            onMessage={(event) => {
              if (event.nativeEvent.data === 'mapReady') {
                console.log('✅ Mapbox: Map ready');
                setMapReady(true);
                setTilesLoaded(true);
              }
            }}
            onError={(error) => {
              console.log('❌ Mapbox: Error', error);
              switchToNextProvider();
            }}
          />
        );

      case 'custom':
        return (
          <View style={styles.customMapContainer}>
            <View style={styles.customMapContent}>
              <Text style={styles.customMapTitle}>📍 Custom Map View</Text>
              <Text style={styles.customMapSubtitle}>
                Your Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
              <Text style={styles.customMapText}>
                Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.customMapText}>
                Provider: Custom Fallback
              </Text>
              <TouchableOpacity 
                style={styles.customMapButton}
                onPress={() => switchProvider('google')}
              >
                <Text style={styles.customMapButtonText}>Try Google Maps Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Debug Info */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>🗺️ Alternative Map Providers</Text>
        <Text style={styles.debugText}>
          Current: {currentProvider.toUpperCase()}
        </Text>
        <Text style={styles.debugText}>
          Map: {mapReady ? '✅ Ready' : '⏳ Loading...'}
        </Text>
        <Text style={styles.debugText}>
          Tiles: {tilesLoaded ? '✅ Loaded' : '⏳ Loading...'}
        </Text>
        <Text style={styles.debugText}>
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Provider Buttons */}
      <View style={styles.providerButtons}>
        {['google', 'default', 'openstreetmap', 'mapbox', 'custom'].map((provider) => (
          <TouchableOpacity
            key={provider}
            style={[
              styles.providerButton,
              currentProvider === provider && styles.activeProviderButton
            ]}
            onPress={() => switchProvider(provider as MapProvider)}
          >
            <Text style={[
              styles.providerButtonText,
              currentProvider === provider && styles.activeProviderButtonText
            ]}>
              {provider.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={switchToNextProvider}>
          <Ionicons name="arrow-forward" size={20} color="white" />
          <Text style={styles.buttonText}>Next Provider</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={retryMap}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {renderMap()}

      {/* Status Overlay */}
      {!tilesLoaded && mapReady && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            {currentProvider.toUpperCase()} map loading...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  providerButtons: {
    position: 'absolute',
    top: 200,
    left: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    zIndex: 1000,
  },
  providerButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 60,
    alignItems: 'center',
  },
  activeProviderButton: {
    backgroundColor: '#007AFF',
  },
  providerButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  activeProviderButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    top: 280,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  customMapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customMapContent: {
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
  customMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  customMapSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  customMapText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  customMapButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  customMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
