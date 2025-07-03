import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Order } from '../types/order';
import { orderService } from '../services/orderService';
import { stopAlert } from '../utils/soundPlayer';

export const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (err: any) {
      setOrder(null);
      setError(err?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleStatusUpdate = async (status: Order['status']) => {
    setLoading(true);
    setError(null);
    try {
      if (status === 'confirmed') {
        await stopAlert();
      }
      await orderService.updateOrderStatus(orderId, status);
      await fetchOrderDetails();
    } catch (err: any) {
      setError(err?.message || `Failed to update order status to ${status}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.primary;
      case 'preparing': return theme.colors.info || theme.colors.primary;
      case 'ready': return theme.colors.success;
      case 'completed': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.text }}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchOrderDetails} style={[styles.acceptButton, { marginTop: 16 }]}> 
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.acceptButton, { marginTop: 8, backgroundColor: '#ccc' }]}> 
          <Text style={[styles.buttonText, { color: '#333' }]}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>Order not found or failed to load.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.acceptButton, { marginTop: 16 }]}> 
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Order Details</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Order ID:</Text><Text style={styles.value}>#{order._id.slice(-6)}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Customer:</Text><Text style={styles.value}>{order.customerName}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Time:</Text><Text style={styles.value}>{new Date(order.timestamp).toLocaleString()}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Status:</Text><Text style={[styles.value, { color: getStatusColor(order.status), fontWeight: 'bold' }]}>{order.status}</Text></View>
        {order.deliveryAddress && (
          <View style={styles.infoRow}><Text style={styles.label}>Delivery Address:</Text><Text style={styles.value}>{order.deliveryAddress}</Text></View>
        )}
        {order.specialInstructions && (
          <View style={styles.infoRow}><Text style={styles.label}>Instructions:</Text><Text style={styles.value}>{order.specialInstructions}</Text></View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, index) => (
          <View key={item._id || index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {/* Only show Confirm Order if order is pending and no delivery boy has accepted */}
        {order.status === 'pending' && !order.deliveryBoyId && (
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleStatusUpdate('confirmed')}>
            <Text style={styles.buttonText}>Confirm Order</Text>
          </TouchableOpacity>
        )}
        {/* Only show Start Preparing if order is confirmed and delivery boy has accepted */}
        {order.status === 'confirmed' && order.deliveryBoyId && (
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleStatusUpdate('preparing')}>
            <Text style={styles.buttonText}>Start Preparing</Text>
          </TouchableOpacity>
        )}
        {order.status === 'preparing' && (
          <TouchableOpacity style={styles.readyButton} onPress={() => handleStatusUpdate('ready')}>
            <Text style={styles.buttonText}>Mark as Ready</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    marginLeft: 6,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  actions: {
    padding: 16,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  readyButton: {
    backgroundColor: theme.colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
}); 