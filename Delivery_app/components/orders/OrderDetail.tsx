import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { COLORS, FONTS, IS_WEB } from '@/constants/theme';
import Card from '../common/Card';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import { MapPin, Clock, DollarSign, Phone, Navigation, Package } from 'lucide-react-native';
import { Order } from '@/types/order';
import { useRouter } from 'expo-router';
import SlideToUnlock from 'react-native-slide-to-unlock';

interface OrderDetailProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: any) => void;
}

const OrderDetail = ({ order, onStatusUpdate }: OrderDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [showGoToMap, setShowGoToMap] = useState(false);
  const router = useRouter();

  // Safe access to order properties with fallbacks
  const orderId = order._id || order.id || 'N/A';
  const customerName = order.customerName || 'Customer';
  const customerAddress = order.customerAddress || order.deliveryAddress || 'Address not available';
  const customerPhone = order.customerPhone || '+1234567890';
  const totalAmount = order.totalAmount || 0;
  const status = order.status || 'pending';
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Calculate estimated earnings
  const estimatedEarnings = totalAmount * 0.1; // 10% of order value as delivery fee
  
  // Format time
  const orderTime = order.timestamp || order.createdAt || new Date().toISOString();
  const formattedTime = new Date(orderTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Debug logging for status changes
  console.log('OrderDetail - status:', status, 'deliveryBoyId:', order.deliveryBoyId, 'order:', order);
  console.log('OrderDetail - Current order status:', status);
  console.log('OrderDetail - Order ID:', orderId);
  console.log('OrderDetail - Order object:', order);

  const handleCall = () => {
    const phoneNumber = `tel:${customerPhone}`;
    if (IS_WEB) {
      window.open(phoneNumber);
    } else {
      Linking.openURL(phoneNumber).catch(() => {
        Alert.alert('Error', 'Could not open phone dialer');
      });
    }
  };

  const handleNavigate = () => {
    // Prefer selectedDeliveryPoint coordinates if available
    const point = order.selectedDeliveryPoint;
    if (point && point.latitude && point.longitude) {
      let url;
      if (Platform.OS === 'ios') {
        url = `maps://?ll=${point.latitude},${point.longitude}&q=${encodeURIComponent(point.name || 'Delivery Point')}`;
      } else if (Platform.OS === 'android') {
        url = `geo:${point.latitude},${point.longitude}?q=${point.latitude},${point.longitude}(${encodeURIComponent(point.name || 'Delivery Point')})`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
      }
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps application');
      });
      return;
    }
    // Fallback to customerAddress
    let url;
    if (Platform.OS === 'ios') {
      url = `maps:?q=${customerAddress}`;
    } else if (Platform.OS === 'android') {
      url = `geo:0,0?q=${customerAddress}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress)}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const handleUpdateStatus = async (newStatus: any) => {
    setLoading(true);
    try {
      const actualOrderId = order._id || order.id;
      if (!actualOrderId) {
        Alert.alert('Error', 'Order ID not found');
        return;
      }
      await onStatusUpdate(actualOrderId, newStatus);
      if (newStatus === 'enroute') {
        setShowGoToMap(true);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusButtons = () => {
    if (
      status === 'pending' ||
      (status === 'confirmed' && (!order.deliveryBoyId || order.deliveryBoyId === '' || order.deliveryBoyId === null)) ||
      (status === 'preparing' && (!order.deliveryBoyId || order.deliveryBoyId === '' || order.deliveryBoyId === null))
    ) {
      // Show swipe to accept if order is pending, confirmed, or preparing but not yet claimed
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Accept the Order</Text>
          <SlideToUnlock
            onSlideEnd={() => handleUpdateStatus('confirmed')}
            containerStyle={{ width: 300, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22' }}
            sliderElement={<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>→</Text></View>}
            text="Slide to Accept Order"
            textStyle={{ color: COLORS.primary, fontSize: 16, fontWeight: 'bold' }}
            disabled={loading}
          />
        </View>
      );
    }
    if (status === 'confirmed' && order.deliveryBoyId) {
      // Only show 'Picked Up, On My Way' if order is confirmed and assigned
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Picked Up, On My Way</Text>
          <SlideToUnlock
            onSlideEnd={() => handleUpdateStatus('enroute')}
            containerStyle={{ width: 300, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22' }}
            sliderElement={<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>→</Text></View>}
            text="Slide to Start Delivery"
            textStyle={{ color: COLORS.primary, fontSize: 16, fontWeight: 'bold' }}
            disabled={loading}
          />
        </View>
      );
    }
    // ...rest of your switch/case for other statuses
    switch (status) {
      case 'enroute':
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Mark as Delivered</Text>
            <SlideToUnlock
              onSlideEnd={() => handleUpdateStatus('delivered')}
              containerStyle={{ width: 300, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22' }}
              sliderElement={<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>→</Text></View>}
              text="Slide to Mark as Delivered"
              textStyle={{ color: COLORS.primary, fontSize: 16, fontWeight: 'bold' }}
              disabled={loading}
            />
          </View>
        );
      case 'delivered':
        return (
          <Button 
            title="Completed" 
            disabled
            type="outline"
          />
        );
      case 'cancelled':
      case 'canceled':
        return (
          <Button 
            title="Canceled" 
            disabled
            type="danger"
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>Order #{orderId.slice(-6)}</Text>
          <StatusBadge status={status} size="large" />
        </View>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>

      <Card style={styles.customerCard}>
        <View style={styles.customerSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerAddress}>
              {customerAddress}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={styles.actionButtonInner}>
              <Phone size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <View style={styles.actionButtonInner}>
              <Navigation size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Items</Text>
            <View style={styles.detailValueContainer}>
              <Package size={16} color={COLORS.primary} />
              <Text style={styles.detailValue}>{itemCount} items</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Est. Time</Text>
            <View style={styles.detailValueContainer}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.detailValue}>30 min</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Earnings</Text>
            <View style={styles.detailValueContainer}>
              <DollarSign size={16} color={COLORS.success} />
              <Text style={[styles.detailValue, styles.earnings]}>
                ₹{estimatedEarnings.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.itemsCard}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>₹{item.price} each</Text>
            </View>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        {renderStatusButtons()}
      </View>
      {showGoToMap && (
        null
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    ...FONTS.h3,
    color: COLORS.darkGray,
  },
  time: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  customerCard: {
    marginBottom: 16,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.ultraLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...FONTS.h4,
    color: COLORS.darkGray,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  customerAddress: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.ultraLightGray,
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    ...FONTS.body4Medium,
    color: COLORS.darkGray,
  },
  detailCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 6,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  earnings: {
    color: COLORS.success,
  },
  itemsCard: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ultraLightGray,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  itemDescription: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  itemQuantity: {
    ...FONTS.body3Medium,
    color: COLORS.primary,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.ultraLightGray,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
  },
  totalValue: {
    ...FONTS.body3Medium,
    color: COLORS.primary,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});

export default OrderDetail;