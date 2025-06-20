import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Order } from '../types/order';
import { orderService } from '../services/orderService';

export const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrder(null); // Explicitly set to null on error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    navigation.goBack();
  };

  const handleAcceptOrder = async () => {
    try {
      await orderService.updateOrderStatus(orderId, 'preparing');
      fetchOrderDetails(); // Refresh order details
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const handleMarkReady = async () => {
    try {
      await orderService.updateOrderStatus(orderId, 'ready');
      fetchOrderDetails(); // Refresh order details
    } catch (error) {
      console.error('Error marking order as ready:', error);
      Alert.alert('Error', 'Failed to mark order as ready');
    }
  };

  const handleConfirmOrder = async () => {
    try {
      await orderService.updateOrderStatus(orderId, 'confirmed');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error confirming order:', error);
      Alert.alert('Error', 'Failed to confirm order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'preparing':
        return theme.colors.info;
      case 'ready':
        return theme.colors.success;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalContainer}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </Pressable>
        {console.log('[OrderDetailsScreen] order:', order)}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 12, color: theme.colors.text }}>Loading order details...</Text>
          </View>
        ) : !order ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>Order not found or failed to load.</Text>
            <TouchableOpacity onPress={handleClose} style={[styles.acceptButton, { marginTop: 16 }]}> 
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              <View style={styles.infoRow}><Text style={styles.label}>Order ID:</Text><Text style={styles.value}>#{order._id.slice(-6)}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Customer:</Text><Text style={styles.value}>{order.customerName}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Time:</Text><Text style={styles.value}>{new Date(order.timestamp).toLocaleString()}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Status:</Text><Text style={[styles.value, { color: getStatusColor(order.status), fontWeight: 'bold' }]}>{order.status}</Text></View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
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
            {order.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptButton} onPress={handleConfirmOrder}>
                  <Text style={styles.buttonText}>Confirm Order</Text>
                </TouchableOpacity>
              </View>
            )}
            {order.status === 'confirmed' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptOrder}>
                  <Text style={styles.buttonText}>Start Preparing</Text>
                </TouchableOpacity>
              </View>
            )}
            {order.status === 'preparing' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.readyButton} onPress={handleMarkReady}>
                  <Text style={styles.buttonText}>Mark as Ready</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    maxHeight: '90%',
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },
  modalTitle: {
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
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: 16,
    padding: 16,
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