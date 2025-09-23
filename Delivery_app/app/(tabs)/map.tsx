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
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = React.useRef<MapView | null>(null);

  // Extract delivery location from params if present
  const deliveryLat = params.deliveryLat ? Number(params.deliveryLat) : null;
  const deliveryLng = params.deliveryLng ? Number(params.deliveryLng) : null;
  const orderId = params.orderId || null;

  useEffect(() => {
    // Connect to socket with user info
    try {
      connectSocket(user);
    } catch {}

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
        timeInterval: 1000,
        distanceInterval: 0,
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

      socket.on('userLocationUpdated', ({ orderId: oId, location }: any) => {
        try {
          if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return;
          setCustomerLocation({ latitude: Number(location.latitude), longitude: Number(location.longitude) });
          try {
            // Fit map to both markers for quick visual recognition
            if (mapRef.current && location && (location.latitude || location.longitude) && (location.latitude !== null)) {
              const coords = [
                { latitude: location.latitude, longitude: location.longitude },
                location && location.latitude ? { latitude: location.latitude, longitude: location.longitude } : undefined,
              ].filter(Boolean) as any;
              // include current device (delivery) location if available
              if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
                // currentLocation is from state
                if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {}
              }
            }
          } catch {}
        } catch {}
      });
    }

    // Cleanup
    return () => {
      try { locationSubscription.then((sub) => sub.remove()); } catch {}
      if (socket) {
        socket.off('orderCreated');
        socket.off('orderStatusUpdated');
        socket.off('userLocationUpdated');
      }
    };
  }, [user?.id]);

  if (!location) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={(r) => (mapRef.current = r)}
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

        {/* Customer live location marker (when provided) */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Customer Location"
            pinColor="#2196F3"
          />
        )}

        {/* Delivery location marker if params present */}
        {deliveryLat && deliveryLng && (
          <Marker
            coordinate={{ latitude: deliveryLat, longitude: deliveryLng }}
            title={orderId ? `Delivery Point for Order #${orderId.toString().slice(-6)}` : 'Delivery Point'}
            pinColor="blue"
            description="Delivery destination"
          />
        )}

        {/* Order markers (fallback for all orders) - guard missing coordinates */}
        {!deliveryLat && !deliveryLng && !customerLocation && orders.map((order) => {
          const anyOrder: any = order as any;
          // Prefer explicit pickupLocation if available
          let coords: any = anyOrder?.pickupLocation?.coordinates;
          // Fallbacks: vendor location or selected delivery point GeoJSON if available
          if (!Array.isArray(coords)) coords = anyOrder?.vendorId?.location?.coordinates;
          if (!Array.isArray(coords)) coords = anyOrder?.selectedDeliveryPoint?.location?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={order._id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={`Order #${order._id}`}
                  description={`Status: ${order.status}`}
                  pinColor={order.status === 'pending' ? 'red' : 'green'}
                />
              );
            }
          }
          return null;
        })}
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