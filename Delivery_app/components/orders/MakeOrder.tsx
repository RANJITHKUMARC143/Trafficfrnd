import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { connectSocket, getSocket } from '@/utils/socket';
import { getBaseUrl, API_ENDPOINTS } from '@/config/api';
import { Order } from '@/types/order';
import Card from '../common/Card';
import Button from '../common/Button';
import { COLORS, FONTS } from '@/constants/theme';
import { MapPin, Clock, Package } from 'lucide-react-native';

interface MakeOrderProps {
  onOrderPlaced: (order: Order) => void;
}

const MakeOrder = ({ onOrderPlaced }: MakeOrderProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  useEffect(() => {
    const socket = connectSocket();

    // Listen for order status updates
    socket.on('orderStatusUpdated', (updatedOrder: Order) => {
      if (updatedOrder.customerId === user?.id) {
        setOrderStatus(updatedOrder.status);
        onOrderPlaced(updatedOrder);
      }
    });

    return () => {
      socket.off('orderStatusUpdated');
    };
  }, [user?.id]);

  const placeOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.ORDERS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          items: [
            {
              name: 'Sample Item',
              quantity: 1,
              price: 10.99,
            },
          ],
          pickupLocation: {
            type: 'Point',
            coordinates: [0, 0], // This should be replaced with actual coordinates
            address: 'Pickup Address',
          },
          deliveryLocation: {
            type: 'Point',
            coordinates: [0, 0], // This should be replaced with actual coordinates
            address: 'Delivery Address',
          },
          paymentMethod: 'card',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const order = await response.json();
      setOrderStatus('pending');
      onOrderPlaced(order);

      // Join the order room for real-time updates
      const socket = getSocket();
      if (socket) {
        socket.emit('joinOrderRoom', { orderId: order._id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Place New Order</Text>
      
      {orderStatus ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Order Status: {orderStatus}</Text>
          <Package size={24} color={COLORS.primary} />
        </View>
      ) : (
        <Button
          title="Place Order"
          onPress={placeOrder}
          loading={loading}
          icon={<Package size={18} color={COLORS.white} />}
        />
      )}

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <MapPin size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>Real-time tracking</Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>Instant updates</Text>
        </View>
        
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.ultraLightGray,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
  },
  infoContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.ultraLightGray,
    paddingTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginLeft: 8,
  },
});

export default MakeOrder; 