import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function SimpleWorkingMapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [useGoogle, setUseGoogle] = useState(true);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('🔍 Simple Working Map: Requesting location permissions...');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        console.log('🔍 Simple Working Map: Getting current location...');
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        console.log('🔍 Simple Working Map: Location obtained:', coords);
        setLocation(coords);
        setLoading(false);
      } catch (error) {
        console.error('❌ Simple Working Map: Error getting location:', error);
        setError('Failed to get location');
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  // Force map ready after 2 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ Simple Working Map: Forcing map ready');
      setMapReady(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Force tiles loaded after 4 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ Simple Working Map: Forcing tiles loaded');
      setTilesLoaded(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const switchProvider = () => {
    console.log('🔄 Simple Working Map: Switching provider');
    setUseGoogle(!useGoogle);
    setMapReady(false);
    setTilesLoaded(false);
    setMapKey(prev => prev + 1);
  };

  const retryMap = () => {
    console.log('🔄 Simple Working Map: Retrying map');
    setMapReady(false);
    setTilesLoaded(false);
    setMapKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading simple working map...</Text>
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

  return (
    <View style={styles.container}>
      {/* Debug Info */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>🗺️ Simple Working Map</Text>
        <Text style={styles.debugText}>
          Provider: {useGoogle ? 'Google Maps' : 'Default'}
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

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={switchProvider}>
          <Ionicons name="swap-horizontal" size={20} color="white" />
          <Text style={styles.buttonText}>Switch Provider</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={retryMap}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.buttonText}>Retry Map</Text>
        </TouchableOpacity>
      </View>

      {/* Map with simple configuration */}
      <MapView
        key={`simple-map-${useGoogle ? 'google' : 'default'}-${mapKey}`}
        style={styles.map}
        provider={useGoogle ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
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
        loadingIndicatorColor="#007AFF"
        loadingBackgroundColor="#FFFFFF"
        onMapReady={() => {
          console.log('✅ Simple Working Map: Map is ready!');
          setMapReady(true);
        }}
        onError={(error) => {
          console.log('❌ Simple Working Map: Map error:', error);
        }}
        onMapLoaded={() => {
          console.log('✅ Simple Working Map: Map loaded successfully!');
          setTilesLoaded(true);
        }}
      >
        <Marker
          coordinate={location}
          title="Your Location"
          description="You are here"
        />
      </MapView>

      {/* Status Overlay */}
      {!tilesLoaded && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            {useGoogle ? 'Google Maps' : 'Default'} map loading...
          </Text>
        </View>
      )}

      {/* Success Overlay */}
      {tilesLoaded && (
        <View style={styles.successOverlay}>
          <Text style={styles.successText}>
            ✅ Map is working! Tiles loaded successfully.
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
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#007AFF',
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
});
