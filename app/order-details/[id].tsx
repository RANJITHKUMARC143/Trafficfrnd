import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.31.107:3000/api';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        setOrder(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }
  if (!order) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Order not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Order Details</ThemedText>
      <ThemedText style={styles.label}>Order ID: {order._id}</ThemedText>
      <ThemedText style={styles.label}>Status: {order.status || 'Confirmed'}</ThemedText>
      <ThemedText style={styles.label}>Date: {new Date(order.createdAt).toLocaleString()}</ThemedText>
      <ThemedText style={styles.label}>Total: ₹{order.total}</ThemedText>
      <ThemedText style={styles.subtitle}>Items:</ThemedText>
      <FlatList
        data={order.items}
        keyExtractor={item => item.id || item._id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <ThemedText>{item.name} x {item.quantity}</ThemedText>
            <ThemedText>₹{item.price}</ThemedText>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 6 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 