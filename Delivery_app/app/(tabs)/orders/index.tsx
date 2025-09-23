import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import OrderCard from '@/components/orders/OrderCard';
import { getBaseUrl, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/order';
import { COLORS, FONTS } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, getSocket } from '@/utils/socket';
import { useOrders } from '@/context/OrderContext';

// Use the same token key as AuthContext and auth utility
const TOKEN_KEY = '@traffic_friend_token';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleRetry = () => {
    // Optionally, you could trigger a refetch in OrderContext
  };
  
  // Helpers to avoid type mismatches between ObjectId and string
  const toId = (val: any) => (val && typeof val === 'object' && '_id' in val ? String((val as any)._id) : String(val || ''));
  const normStatus = (s: any) => String(s || '').trim().toLowerCase();
  const myId = String(user?.id || '');

  // Filter orders based on active tab
  let filteredOrders: Order[] = [];
  if (activeTab === 'active') {
    // Active: orders assigned to me and not in a terminal state
    const activeStatuses = ['pending', 'confirmed', 'enroute', 'preparing', 'ready'];
    filteredOrders = orders
      .filter(order => toId(order.deliveryBoyId) === myId && activeStatuses.includes(normStatus(order.status)))
      .sort((a, b) => new Date(b.updatedAt || b.timestamp || 0).getTime() - new Date(a.updatedAt || a.timestamp || 0).getTime());
  } else if (activeTab === 'completed') {
    // Completed: terminal states
    const completedStatuses = ['completed', 'delivered', 'canceled', 'cancelled'];
    filteredOrders = orders
      .filter(order => toId(order.deliveryBoyId) === myId && completedStatuses.includes(normStatus(order.status)))
      .sort((a, b) => new Date(b.updatedAt || b.timestamp || 0).getTime() - new Date(a.updatedAt || a.timestamp || 0).getTime());
  } else if (activeTab === 'available') {
    // Available: unassigned AND pending only (defensive against odd API values)
    filteredOrders = orders.filter(order => {
      const assignee = toId(order.deliveryBoyId).trim().toLowerCase();
      const isUnassigned = assignee === '' || assignee === 'null' || assignee === 'undefined';
      return isUnassigned && normStatus(order.status) === 'pending';
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log('[OrdersScreen] All orders (count):', orders.length);
    if (filteredOrders.some(o => normStatus(o.status) !== 'pending')) {
      console.warn('[OrdersScreen] Non-pending order detected in Available after filter:', filteredOrders.map(o => ({ id: o._id, status: o.status, deliveryBoyId: toId(o.deliveryBoyId) })));
    }
  }

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No {activeTab === 'active' ? 'active' : activeTab === 'completed' ? 'completed' : 'available'} orders found
        </Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'active' 
            ? 'You will see new orders here when they are assigned to you'
            : activeTab === 'completed'
              ? 'Completed orders will appear here'
              : 'Available orders will appear here'
          }
        </Text>
      </View>
    );
  };

  return (
    <Screen style={styles.container}>
      <Header title="My Orders" showBack={false} />
      
      <View style={styles.tabContainer}>
        <Text
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          Active
        </Text>
        <Text
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          Completed
        </Text>
        <Text
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          Available
        </Text>
      </View>
      
      <FlatList
        data={filteredOrders}
        renderItem={({ item }) => (
          <OrderCard 
            order={item}
            onPress={() => router.push(`/orders/${item._id}`)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
  },
  tab: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginRight: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTab: {
    color: COLORS.primary,
    ...FONTS.body3Medium,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    ...FONTS.body4,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  errorText: {
    ...FONTS.body2,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    ...FONTS.body3Medium,
    color: COLORS.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
}); 