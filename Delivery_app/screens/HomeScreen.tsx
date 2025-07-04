import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, FlatList, Text, RefreshControl, Button } from 'react-native';
import { connectSocket, getSocket } from '../utils/socket';
import { updateDeliveryLocation, updateDeliveryStatus } from '../utils/socket';
import { useAuth, clearToken, debugAsyncStorage, setTokenManually } from '../context/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getBaseUrl, API_ENDPOINTS } from '../config/api';
import OrderCard from '../components/orders/OrderCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the same token key as AuthContext and auth utility
const TOKEN_KEY = '@traffic_friend_token';

export default function HomeScreen() {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Move fetchOrders outside useEffect
  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('Token loaded for /orders:', token);
      if (!token || token === 'null' || token === 'undefined') {
        console.error('No valid token found, aborting /orders request');
        return;
      }
      // Check if token looks like a JWT
      if (token.split('.').length !== 3) {
        console.error('Token is not a valid JWT, aborting /orders request');
        return;
      }
      // Check if user is available and has an ID
      if (!user || !user.id) {
        console.error('User information not available, aborting /orders request');
        return;
      }
      
      const ordersEndpoint = API_ENDPOINTS.DELIVERY.ORDERS(user.id);
      const url = `${getBaseUrl()}${ordersEndpoint}`;
      console.log('HomeScreen - Fetching orders from:', url, 'with token:', token);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('HomeScreen - Orders response status:', response.status);
      let data = null;
      try { data = await response.clone().json(); } catch (e) { data = null; }
      console.log('HomeScreen - Orders response data:', data);
      if (response.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    // Connect to socket when component mounts
    const socket = connectSocket();

    // Listen for new orders
    socket.on('orderCreated', (newOrder) => {
      setOrders(prev => [...prev, newOrder]);
    });

    // Listen for order status updates
    socket.on('orderStatusUpdated', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
    });

    // Listen for delivery status updates
    socket.on('deliveryStatusUpdated', ({ deliveryBoyId, status }) => {
      if (deliveryBoyId === user?._id) {
        // Update local state or UI as needed
      }
    });

    // Get current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      // Update delivery boy location
      if (user?._id) {
        updateDeliveryLocation(user._id, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    })();

    // Start location tracking
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
        if (user?._id) {
          updateDeliveryLocation(user._id, {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude
          });
        }
      }
    );

    // Fetch orders from backend on mount
    fetchOrders();

    return () => {
      // Cleanup
      socket.off('orderCreated');
      socket.off('orderStatusUpdated');
      socket.off('deliveryStatusUpdated');
      locationSubscription.then(sub => sub.remove());
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  };

  return (
    <View style={styles.container}>
      <Button title="Clear Token (Debug)" onPress={clearToken} />
      <Button title="Debug Storage" onPress={debugAsyncStorage} />
      <Button 
        title="Set Token (Debug)" 
        onPress={() => setTokenManually('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4M2VhNmE3ZWRiZGRhZjE3NDExZTc1YyIsImlhdCI6MTc1MDg0ODExMiwiZXhwIjoxNzUxNDUyOTEyfQ.wFRlJclh4it_3yZt4oT8s4fz5zLO6YkHGcfpTfBW7Cg')} 
      />
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
        </MapView>
      )}
      <View style={{ flex: 1, marginTop: 8 }}>
        <FlatList
          data={orders.filter(order => ['pending', 'pickup', 'enroute'].includes(order.status))}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => {}} />
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 16 }}>No active orders</Text>}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
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