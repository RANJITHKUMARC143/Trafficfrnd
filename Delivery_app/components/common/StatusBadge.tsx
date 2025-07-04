import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

type StatusType = 'pending' | 'confirmed' | 'pickup' | 'enroute' | 'delivered' | 'cancelled' | 'canceled';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge = ({ status, size = 'medium' }: StatusBadgeProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return COLORS.gray;
      case 'confirmed':
        return COLORS.primary;
      case 'pickup':
        return COLORS.statusPickup;
      case 'enroute':
        return COLORS.statusEnRoute;
      case 'delivered':
        return COLORS.statusDelivered;
      case 'cancelled':
      case 'canceled':
        return COLORS.statusCanceled;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'pickup':
        return 'Pickup';
      case 'enroute':
        return 'En Route';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
      case 'canceled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: getStatusColor() + '20' },
      styles[`${size}Container`]
    ]}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text style={[
        styles.text, 
        { color: getStatusColor() },
        styles[`${size}Text`]
      ]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    ...FONTS.body4Medium,
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mediumContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallText: {
    fontSize: 10,
    lineHeight: 14,
  },
  mediumText: {
    ...FONTS.body4Medium,
  },
  largeText: {
    ...FONTS.body3Medium,
  },
});

export default StatusBadge;