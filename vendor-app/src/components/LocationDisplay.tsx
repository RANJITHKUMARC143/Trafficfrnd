import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useVendorLocation } from '../hooks/useVendorLocation';

export const LocationDisplay = () => {
  const { location, address, error, isLoading } = useVendorLocation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Getting location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Location</Text>
      
      {location ? (
        <>
          <View style={styles.locationContainer}>
            <Text style={styles.label}>Latitude:</Text>
            <Text style={styles.value}>{location.coords.latitude.toFixed(6)}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={styles.label}>Longitude:</Text>
            <Text style={styles.value}>{location.coords.longitude.toFixed(6)}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={styles.label}>Accuracy:</Text>
            <Text style={styles.value}>{location.coords.accuracy?.toFixed(2)} meters</Text>
          </View>
          
          {address && (
            <View style={styles.addressContainer}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.text}>No location data available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  addressContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 16,
    marginTop: 4,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  }
}); 