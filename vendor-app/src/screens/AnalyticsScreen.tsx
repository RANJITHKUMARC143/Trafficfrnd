import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const AnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsService.getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const setupAnalytics = async () => {
      try {
        await analyticsService.initialize();
        
        // Set up real-time listeners
        analyticsService.onAnalyticsUpdate((updatedAnalytics) => {
          console.log('Received analytics update:', updatedAnalytics);
          setAnalytics(updatedAnalytics);
        });

        analyticsService.onNewOrder(() => {
          fetchAnalytics(); // Refresh analytics when new order arrives
        });

        analyticsService.onOrderStatusUpdate(() => {
          fetchAnalytics(); // Refresh analytics when order status changes
        });

        analyticsService.onOrderCancelled(() => {
          fetchAnalytics(); // Refresh analytics when order is cancelled
        });

        // Initial fetch
        await fetchAnalytics();
      } catch (error) {
        console.error('Error setting up analytics:', error);
        setError('Failed to initialize analytics');
      }
    };

    setupAnalytics();

    // Cleanup
    return () => {
      analyticsService.disconnect();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Today's Overview */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.metricValue}>₹{analytics?.metrics.today.revenue.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.secondary} />
            <Text style={styles.metricValue}>{analytics?.metrics.today.orders || 0}</Text>
            <Text style={styles.metricLabel}>Orders</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="trending-up-outline" size={24} color={theme.colors.accent} />
            <Text style={styles.metricValue}>₹{analytics?.metrics.today.averageOrderValue.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Avg. Order</Text>
          </View>
        </View>
      </Card>

      {/* Comparison with Yesterday */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>vs Yesterday</Text>
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Revenue</Text>
            <Text style={styles.comparisonValue}>
              ₹{analytics?.metrics.yesterday.revenue.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Orders</Text>
            <Text style={styles.comparisonValue}>
              {analytics?.metrics.yesterday.orders || 0}
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Avg. Order</Text>
            <Text style={styles.comparisonValue}>
              ₹{analytics?.metrics.yesterday.averageOrderValue.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Top Selling Items */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        {analytics?.topSellingItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemRevenue}>₹{item.revenue.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Order Status Distribution */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusContainer}>
          {Object.entries(analytics?.statusDistribution || {}).map(([status, count]) => (
            <View key={status} style={styles.statusItem}>
              <Text style={styles.statusLabel}>{status}</Text>
              <Text style={styles.statusValue}>{count}</Text>
            </View>
          ))}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
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
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  comparisonValue: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemName: {
    fontSize: theme.typography.fontSize.md,
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
    marginRight: theme.spacing.sm,
  },
  itemRevenue: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusValue: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
}); 