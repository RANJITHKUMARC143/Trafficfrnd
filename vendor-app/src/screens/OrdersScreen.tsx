import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { orderService } from '../services/orderService';
import { orderNotificationService } from '../services/orderNotificationService';
import { Order } from '../types/order';

const mockOrders: Order[] = [
  {
    id: 'ORD-1234',
    customerName: 'John Doe',
    items: 3,
    total: 450,
    status: 'pending',
    time: '2 mins ago',
  },
  {
    id: 'ORD-1235',
    customerName: 'Jane Smith',
    items: 2,
    total: 320,
    status: 'preparing',
    time: '5 mins ago',
  },
  {
    id: 'ORD-1236',
    customerName: 'Mike Johnson',
    items: 4,
    total: 680,
    status: 'ready',
    time: '10 mins ago',
  },
];

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  
  return Math.floor(seconds) + ' secs ago';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return theme.colors.warning;
    case 'preparing':
      return theme.colors.primary;
    case 'ready':
      return theme.colors.secondary;
    case 'completed':
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
};

const OrderCard = ({ order, onStatusUpdate }: { order: Order; onStatusUpdate: () => void }) => {
  const navigation = useNavigation();

  const handleOrderPress = () => {
    navigation.navigate('OrderDetails', { orderId: order._id });
  };

  const handleAcceptOrder = async () => {
    try {
      await orderService.updateOrderStatus(order._id, 'preparing');
      onStatusUpdate(); // Refresh the orders list
    } catch (error) {
      console.error('Error accepting order:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleMarkReady = async () => {
    try {
      await orderService.updateOrderStatus(order._id, 'ready');
      onStatusUpdate(); // Refresh the orders list
    } catch (error) {
      console.error('Error marking order as ready:', error);
      // You might want to show an error message to the user here
    }
  };

  // Calculate total items
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Format time
  const orderTime = new Date(order.timestamp);
  const timeAgo = getTimeAgo(orderTime);

  return (
    <TouchableOpacity style={styles.orderCard} onPress={handleOrderPress}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order._id.slice(-6)}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="receipt-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{totalItems} items</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>₹{order.totalAmount}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{timeAgo}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.outlineButton]} 
          onPress={handleOrderPress}
        >
          <Text style={styles.outlineButtonText}>View Details</Text>
        </TouchableOpacity>
        {order.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={handleAcceptOrder}
          >
            <Text style={styles.primaryButtonText}>Accept</Text>
          </TouchableOpacity>
        )}
        {order.status === 'preparing' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={handleMarkReady}
          >
            <Text style={styles.secondaryButtonText}>Mark Ready</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const OrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadOrders();
    
    // Initialize order notifications
    orderNotificationService.initialize();

    // Subscribe to real-time order updates
    orderNotificationService.onOrderStatusUpdate((updatedOrder) => {
      setOrders(currentOrders => 
        currentOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    orderNotificationService.onNewOrder((newOrder) => {
      setOrders(currentOrders => [newOrder, ...currentOrders]);
    });

    orderNotificationService.onOrderCancelled((orderId) => {
      setOrders(currentOrders => 
        currentOrders.filter(order => order._id !== orderId)
      );
    });

    // Cleanup
    return () => {
      orderNotificationService.disconnect();
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      console.log('OrdersScreen fetched orders:', data);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard 
            order={item} 
            onStatusUpdate={loadOrders}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  filterButton: {
    padding: theme.spacing.xs,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderId: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  customerName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'capitalize',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 4,
    marginLeft: theme.spacing.sm,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  outlineButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  secondaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
}); 