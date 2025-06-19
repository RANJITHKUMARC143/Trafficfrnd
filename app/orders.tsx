import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { fetchUserOrders } from './services/orderService';
import { router } from 'expo-router';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchUserOrders();
        setOrders(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push({ pathname: '/order-details/' + item._id })}
    >
      <ThemedText style={styles.orderId}>Order ID: {item._id}</ThemedText>
      <ThemedText>Status: {item.status || 'Confirmed'}</ThemedText>
      <ThemedText>Date: {new Date(item.createdAt).toLocaleString()}</ThemedText>
      <ThemedText>Total: ₹{item.total}</ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>My Orders</ThemedText>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        ListEmptyComponent={<ThemedText>No orders found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  orderCard: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 16, marginBottom: 12 },
  orderId: { fontWeight: 'bold', marginBottom: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 