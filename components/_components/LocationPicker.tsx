import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { API_URL } from '@src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';

type LocationPickerProps = {
  onLocationSelected?: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
};

export default function LocationPicker({ onLocationSelected, initialLocation }: LocationPickerProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(initialLocation || null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && !initialLocation) {
      initializeLocation();
    }
  }, [isInitialized, initialLocation]);

  const initializeLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if we have initialLocation
      if (initialLocation) {
        setLocation(initialLocation);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Then try to get the user's saved location
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const token = await AsyncStorage.getItem('token');
          
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`${API_URL}/api/users/${user.id}/location`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.location) {
              setLocation({
                latitude: data.location.latitude,
                longitude: data.location.longitude
              });
              setAddress(data.location.address || '');
              setIsLoading(false);
              setIsInitialized(true);
              return;
            }
          }
        }
      } catch (storageError) {
        console.log('Could not fetch saved location:', storageError);
        // Continue to get current location
      }

      // If no saved location, get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });

      // Get address from coordinates
      try {
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });

        if (addressResult) {
          const formattedAddress = [
            addressResult.street,
            addressResult.city,
            addressResult.region,
            addressResult.country
          ].filter(Boolean).join(', ');
          setAddress(formattedAddress);
        }
      } catch (geocodeError) {
        console.log('Could not get address:', geocodeError);
        // Continue without address
      }

      setIsLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing location:', error);
      setError('Failed to get location');
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });

    try {
      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addressResult) {
        const formattedAddress = [
          addressResult.street,
          addressResult.city,
          addressResult.region,
          addressResult.country
        ].filter(Boolean).join(', ');
        setAddress(formattedAddress);

        // Save location to backend
        try {
          const userData = await AsyncStorage.getItem('user');
          const token = await AsyncStorage.getItem('token');
          
          if (!userData || !token) {
            console.log('No user data or token available for saving location');
            return;
          }

          const user = JSON.parse(userData);
          const response = await fetch(`${API_URL}/api/users/${user.id}/location`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude,
              longitude,
              address: formattedAddress
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save location');
          }

          // Notify parent component if callback provided
          if (onLocationSelected) {
            onLocationSelected({
              latitude,
              longitude,
              address: formattedAddress
            });
          }

          Alert.alert('Success', 'Location saved successfully');
        } catch (saveError) {
          console.error('Error saving location:', saveError);
          Alert.alert('Error', 'Failed to save location. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error handling map press:', error);
      Alert.alert('Error', 'Failed to process location. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3d7a00" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location || {
          latitude: 0,
          longitude: 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Selected Location"
            description={address}
          />
        )}
      </MapView>
      {address && (
        <ThemedView style={styles.addressContainer}>
          <ThemedText style={styles.addressText}>{address}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 300,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
}); 