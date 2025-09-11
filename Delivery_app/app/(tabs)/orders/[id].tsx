import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import OrderDetail from '@/components/orders/OrderDetail';
import { ActivityIndicator, View, StyleSheet, Text, Alert } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { Order, OrderStatus } from '@/types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '@/config/api';
import { useOrders } from '@/context/OrderContext';

const TOKEN_KEY = '@traffic_friend_token';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { stopAlert, setOrders } = useOrders();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('OrderDetailScreen - Token loaded:', token ? 'Token exists' : 'No token');
      
      if (!token || token === 'null' || token === 'undefined') {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('OrderDetailScreen - Fetching order:', id);
      const response = await fetch(`${getBaseUrl()}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('OrderDetailScreen - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch order details`);
      }

      const data = await response.json();
      console.log('OrderDetailScreen - Order received:', data);
      setOrder(data);
      
    } catch (error) {
      console.error('OrderDetailScreen - Error fetching order:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      // Normalize client aliases to match backend
      const aliasMap: Record<string, string> = {
        out_for_delivery: 'enroute',
        en_route: 'enroute',
        on_the_way: 'enroute',
        delivered: 'completed',
      };
      const normalized = (aliasMap[String(newStatus)] || String(newStatus)) as OrderStatus;

      // Avoid duplicate no-op updates
      if (order && order.status === normalized) {
        console.log('OrderDetailScreen - Skipping status update, already at:', normalized);
        return;
      }

      console.log('OrderDetailScreen - Updating order status:', orderId, 'to:', normalized);

      const response = await fetch(`${getBaseUrl()}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: normalized }),
      });

      console.log('OrderDetailScreen - Status update response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('OrderDetailScreen - Status update response:', responseData);
        // Extract the order from the response
        const updatedOrder = responseData.order || responseData;
        setOrder(updatedOrder);
        // Reflect change in global orders list so tabs update immediately
        setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
        // Stop alert sound immediately after accepting
        if (newStatus === 'confirmed') {
          await stopAlert();
        }
        Alert.alert('Success', 'Order status updated successfully');
        // Refresh the order details to ensure we have the latest data
        setTimeout(() => {
          fetchOrderDetails();
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchOrderDetails();
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Order Details" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Header title="Order Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={handleRetry}>
            Tap to retry
          </Text>
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Header title="Order Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <Text style={styles.retryText} onPress={handleRetry}>
            Tap to retry
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Order Details" showBack />
      <OrderDetail order={order} onStatusUpdate={handleStatusUpdate} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    ...FONTS.body3Medium,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});