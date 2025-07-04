import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { connectSocket, getSocket, updateDeliveryLocation } from '@/utils/socket';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/order';
import { useLocalSearchParams } from 'expo-router';

export default function MapScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  // Extract delivery location from params if present
  const deliveryLat = params.deliveryLat ? Number(params.deliveryLat) : null;
  const deliveryLng = params.deliveryLng ? Number(params.deliveryLng) : null;
  const orderId = params.orderId || null;

  useEffect(() => {
    // Connect to socket with user info
    connectSocket(user);

    // Request location permissions
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this app.');
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);

      // Update delivery boy's location
      if (user?.id) {
        updateDeliveryLocation(user.id, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();

    // Set up location tracking
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
        if (user?.id) {
          updateDeliveryLocation(user.id, {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      }
    );

    // Set up socket listeners
    const socket = getSocket();
    if (socket) {
      socket.on('orderCreated', (newOrder: Order) => {
        setOrders((prev) => [...prev, newOrder]);
      });

      socket.on('orderStatusUpdated', (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
        setActiveOrders((prev) =>
          prev.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      });
    }

    // Cleanup
    return () => {
      locationSubscription.then((sub) => sub.remove());
      if (socket) {
        socket.off('orderCreated');
        socket.off('orderStatusUpdated');
      }
    };
  }, [user?.id]);

  if (!location) {
    return null;
  }

  return (
    <View style={styles.container}>
          <MapView
        provider={PROVIDER_GOOGLE}
            style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Delivery boy marker */}
            <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
              title="Your Location"
          description="You are here"
        />

        {/* Delivery location marker if params present */}
        {deliveryLat && deliveryLng && (
          <Marker
            coordinate={{ latitude: deliveryLat, longitude: deliveryLng }}
            title={orderId ? `Delivery Point for Order #${orderId.toString().slice(-6)}` : 'Delivery Point'}
            pinColor="blue"
            description="Delivery destination"
          />
        )}

        {/* Order markers (fallback for all orders) */}
        {!deliveryLat && !deliveryLng && orders.map((order) => (
            <Marker
            key={order._id}
            coordinate={{
              latitude: order.pickupLocation.coordinates[1],
              longitude: order.pickupLocation.coordinates[0],
            }}
            title={`Order #${order._id}`}
            description={`Status: ${order.status}`}
            pinColor={order.status === 'pending' ? 'red' : 'green'}
          />
        ))}
      </MapView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});