import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { fetchUserOrders } from './services/orderService';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'>('all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchUserOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return styles.statusComplete;
    if (s.includes('cancel')) return styles.statusCancelled;
    if (s.includes('ready')) return styles.statusReady;
    if (s.includes('prepar') || s.includes('ongoing') || s.includes('confirm') || s.includes('accepted')) return styles.statusPreparing;
    return styles.statusPending;
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    const s = statusFilter;
    return orders.filter((o: any) => String(o.status || '').toLowerCase().includes(s));
  }, [orders, statusFilter]);

  const FilterChip = ({ label, value }: { label: string; value: typeof statusFilter }) => {
    const selected = statusFilter === value;
    return (
      <TouchableOpacity onPress={() => setStatusFilter(value)} activeOpacity={0.8} style={[styles.chip, selected ? styles.chipActive : styles.chipInactive]}>
        <ThemedText style={[styles.chipText, selected ? styles.chipTextActive : styles.chipTextInactive]}>{label}</ThemedText>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.timestamp || item.createdAt);
    const itemsCount = Array.isArray(item.items) ? item.items.length : undefined;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push({ pathname: '/order-details/' + item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.orderHeaderRow}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderIconCircle}>
              <Ionicons name="receipt-outline" size={18} color="#22c55e" />
            </View>
            <ThemedText style={styles.orderId}>#{String(item._id).slice(-6)}</ThemedText>
          </View>
          <View style={[styles.statusPill, getStatusStyle(item.status)]}>
            <ThemedText style={styles.statusText}>{(item.status || 'pending').toUpperCase()}</ThemedText>
          </View>
        </View>

        <View style={styles.orderBodyRow}>
          <View style={styles.orderMetaCol}>
            <ThemedText style={styles.metaLabel}>Date</ThemedText>
            <ThemedText style={styles.metaValue}>{date.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.orderMetaCol}>
            <ThemedText style={styles.metaLabel}>Items</ThemedText>
            <ThemedText style={styles.metaValue}>{itemsCount ?? '-'}</ThemedText>
          </View>
          <View style={styles.orderMetaCol}>
            <ThemedText style={styles.metaLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₹{item.totalAmount ?? item.total ?? '-'}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.title}>My Orders</ThemedText>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color="#22c55e" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        <FilterChip label="All" value="all" />
        <FilterChip label="Pending" value="pending" />
        <FilterChip label="Preparing" value="preparing" />
        <FilterChip label="Ready" value="ready" />
        <FilterChip label="Completed" value="completed" />
        <FilterChip label="Cancelled" value="cancelled" />
      </ScrollView>
      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={item => String(item._id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={28} color="#22c55e" />
            </View>
            <ThemedText style={styles.emptyTitle}>No orders yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>Start exploring and place your first order.</ThemedText>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/search')} activeOpacity={0.9}>
              <Ionicons name="search" size={18} color="#fff" />
              <ThemedText style={styles.ctaBtnText}>Browse Menu</ThemedText>
            </TouchableOpacity>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: '#e8f9ee' },
  orderCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderColor: '#eef2f1', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  orderIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e8f9ee', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  orderId: { fontWeight: '800', fontSize: 16 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  statusPending: { backgroundColor: '#64748b' },
  statusPreparing: { backgroundColor: '#f59e0b' },
  statusReady: { backgroundColor: '#3b82f6' },
  statusComplete: { backgroundColor: '#22c55e' },
  statusCancelled: { backgroundColor: '#ef4444' },
  orderBodyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  orderMetaCol: { flex: 1 },
  metaLabel: { color: '#6b7280', fontSize: 12 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e8f9ee', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  emptySubtitle: { color: '#6b7280', marginTop: 2, marginBottom: 10 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  ctaBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  chipsRow: { paddingVertical: 6, paddingBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8, borderWidth: 1 },
  chipInactive: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#e8f9ee', borderColor: '#22c55e' },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextInactive: { color: '#111827' },
  chipTextActive: { color: '#16a34a' },
}); 