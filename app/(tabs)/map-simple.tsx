import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export default function SimpleMapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('🔍 Simple Map: Requesting location permissions...');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        console.log('🔍 Simple Map: Getting current location...');
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        console.log('🔍 Simple Map: Location obtained:', coords);
        setLocation(coords);
        setLoading(false);
      } catch (error) {
        console.error('❌ Simple Map: Error getting location:', error);
        setError('Failed to get location');
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading simple map...</Text>
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
      <Text style={styles.debugText}>
        Simple Map Test - Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
      </Text>
      
      <MapView
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
        loadingIndicatorColor="#007AFF"
        loadingBackgroundColor="#FFFFFF"
        onMapReady={() => {
          console.log('✅ Simple Map: Map is ready!');
        }}
        onError={(error) => {
          console.log('❌ Simple Map: Map error:', error);
        }}
        onMapLoaded={() => {
          console.log('✅ Simple Map: Map loaded successfully!');
        }}
      >
        <Marker
          coordinate={location}
          title="Your Location"
          description="You are here"
        />
      </MapView>
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
  debugText: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
    textAlign: 'center',
  },
});
