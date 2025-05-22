import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  time: string;
}

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

const getStatusColor = (status: Order['status']) => {
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

const OrderCard = ({ order }: { order: Order }) => {
  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="receipt-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{order.items} items</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>₹{order.total}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{order.time}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="View Details"
          variant="outline"
          size="small"
          onPress={() => {}}
          style={styles.actionButton}
        />
        {order.status === 'pending' && (
          <Button
            title="Accept"
            variant="primary"
            size="small"
            onPress={() => {}}
            style={styles.actionButton}
          />
        )}
        {order.status === 'preparing' && (
          <Button
            title="Mark Ready"
            variant="secondary"
            size="small"
            onPress={() => {}}
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );
};

export const OrdersScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockOrders}
        renderItem={({ item }) => <OrderCard order={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
    marginBottom: theme.spacing.md,
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
    marginLeft: theme.spacing.sm,
  },
}); 