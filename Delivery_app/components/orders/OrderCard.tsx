import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { MapPin, Clock } from 'lucide-react-native';
import { Order } from '@/types/order';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

const OrderCard = ({ order, onPress }: OrderCardProps) => {
  // Safe access to order properties with fallbacks
  const orderId = order._id || order.id || 'N/A';
  const customerName = order.customerName || 'Customer';
  const customerAddress = order.customerAddress || order.deliveryAddress || 'Address not available';
  const totalAmount = order.totalAmount || 0;
  const status = order.status || 'pending';
  const items = order.items || [];
  const itemCount = items.length;
  
  // Calculate estimated earnings (you can adjust this logic)
  const estimatedEarnings = totalAmount * 0.1; // 10% of order value as delivery fee
  
  // Format time (you can adjust this based on your data)
  const orderTime = order.timestamp || order.createdAt || new Date().toISOString();
  const formattedTime = new Date(orderTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderId}>Order #{orderId.slice(-6)}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.customerSection}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.customerAddress} numberOfLines={1}>
            {customerAddress}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.orderDetails}>
        <View style={styles.orderDetailItem}>
          <MapPin size={16} color={COLORS.gray} />
          <Text style={styles.orderDetailText}>{itemCount} items</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <Clock size={16} color={COLORS.gray} />
          <Text style={styles.orderDetailText}>30 min</Text>
        </View>
        <View style={styles.orderDetailItem}>
        
          <Text style={[styles.orderDetailText, styles.earnings]}>
            ₹{estimatedEarnings.toFixed(2)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  orderId: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  time: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.body2Medium,
    color: COLORS.white,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  customerAddress: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.ultraLightGray,
    marginBottom: 16,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginLeft: 6,
  },
  earnings: {
    color: COLORS.success,
    ...FONTS.body4Medium,
  },
});

export default OrderCard;