import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export const DashboardScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Implement refresh logic
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Today's Overview */}
      <Card style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.metricValue}>₹2,450</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.secondary} />
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Orders</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="star-outline" size={24} color={theme.colors.accent} />
            <Text style={styles.metricValue}>4.8</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
        </View>
      </Card>

      {/* Active Orders */}
      <Card style={styles.activeOrdersCard}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <View style={styles.orderList}>
          <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#ORD-1234</Text>
              <Text style={styles.orderTime}>2 mins ago</Text>
            </View>
            <Button
              title="View Details"
              variant="outline"
              size="small"
              onPress={() => {}}
            />
          </View>
          <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#ORD-1235</Text>
              <Text style={styles.orderTime}>5 mins ago</Text>
            </View>
            <Button
              title="View Details"
              variant="outline"
              size="small"
              onPress={() => {}}
            />
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            title="Add New Item"
            variant="primary"
            onPress={() => {}}
            style={styles.actionButton}
          />
          <Button
            title="View Reports"
            variant="secondary"
            onPress={() => {}}
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
}); 