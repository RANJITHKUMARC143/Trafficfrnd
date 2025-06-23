import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LocationDisplay } from '../components/LocationDisplay';
import { dashboardService, DashboardMetrics } from '../services/dashboardService';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
};

type TabParamList = {
  Orders: undefined;
};

type DashboardScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<OrdersStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export const DashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const fetchMetrics = async () => {
    try {
      console.log('Fetching dashboard metrics...');
      const data = await dashboardService.getDashboardMetrics();
      console.log('Received metrics:', data);
      setMetrics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch dashboard metrics');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const setupDashboard = async () => {
      try {
        console.log('Setting up dashboard...');
        await dashboardService.initialize();
        
        // Set up real-time listeners
        dashboardService.onMetricsUpdate((updatedMetrics) => {
          console.log('Received metrics update:', updatedMetrics);
          setMetrics(updatedMetrics);
        });

        dashboardService.onNewOrder((order) => {
          console.log('Received new order:', order);
          setMetrics(prev => {
            if (!prev) return null;
            return {
              ...prev,
              orders: prev.orders + 1,
              activeOrders: [order, ...prev.activeOrders],
            };
          });
        });

        dashboardService.onOrderStatusUpdate((updatedOrder) => {
          console.log('Received order status update:', updatedOrder);
          setMetrics(prev => {
            if (!prev) return null;
            return {
              ...prev,
              activeOrders: prev.activeOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              ),
            };
          });
        });

        dashboardService.onOrderCancelled((orderId) => {
          console.log('Received order cancellation:', orderId);
          setMetrics(prev => {
            if (!prev) return null;
            return {
              ...prev,
              activeOrders: prev.activeOrders.filter(order => order.id !== orderId),
            };
          });
        });

        // Initial fetch
        await fetchMetrics();
      } catch (error) {
        console.error('Error setting up dashboard:', error);
        setError('Failed to initialize dashboard');
      }
    };

    setupDashboard();

    // Cleanup
    return () => {
      dashboardService.disconnect();
    };
  }, [isAuthenticated]);

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('Orders', {
      screen: 'OrderDetails',
      params: { orderId }
    });
  };

  const handleAddItem = () => {
    navigation.navigate('Menu');
  };

  const handleViewReports = () => {
    navigation.navigate('Analytics');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Location Display */}
      <LocationDisplay />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Today's Overview */}
      <Card style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(2) : '0.00'}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.secondary} />
            <Text style={styles.metricValue}>{metrics?.orders || 0}</Text>
            <Text style={styles.metricLabel}>Orders</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="star-outline" size={24} color={theme.colors.accent} />
            <Text style={styles.metricValue}>{metrics?.rating ? metrics.rating.toFixed(1) : '0.0'}</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
        </View>
      </Card>

      {/* Active Orders */}
      <Card style={styles.activeOrdersCard}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <View style={styles.orderList}>
          {metrics?.activeOrders?.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderItem}
              onPress={() => handleOrderPress(order.id)}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </Text>
                <Text style={styles.customerName}>{order.customerName}</Text>
              </View>
              <Button
                title="View Details"
                variant="outline"
                size="small"
                onPress={() => handleOrderPress(order.id)}
              />
            </TouchableOpacity>
          ))}
          {(!metrics?.activeOrders || metrics.activeOrders.length === 0) && (
            <Text style={styles.noOrdersText}>No active orders</Text>
          )}
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            title="Add New Item"
            variant="primary"
            onPress={handleAddItem}
            style={styles.actionButton}
          />
          <Button
            title="View Reports"
            variant="secondary"
            onPress={handleViewReports}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  overviewCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  activeOrdersCard: {
    marginBottom: theme.spacing.md,
  },
  orderList: {
    marginTop: theme.spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  orderTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  customerName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  quickActionsCard: {
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
  },
  noOrdersText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.md,
  },
}); 