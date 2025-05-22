import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
}) => (
  <Card style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <View style={styles.changeContainer}>
      <Ionicons
        name={isPositive ? 'arrow-up' : 'arrow-down'}
        size={16}
        color={isPositive ? theme.colors.success : theme.colors.error}
      />
      <Text
        style={[
          styles.changeText,
          { color: isPositive ? theme.colors.success : theme.colors.error },
        ]}
      >
        {change}
      </Text>
    </View>
  </Card>
);

const SimpleBarChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const maxValue = Math.max(...data);
  
  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{labels[index]}</Text>
        </View>
      ))}
    </View>
  );
};

export const AnalyticsScreen = () => {
  const revenueData = [2000, 4500, 2800, 8000, 9900, 4300, 5000];
  const ordersData = [20, 45, 28, 80, 99, 43, 50];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ScrollView style={styles.container}>
      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity style={[styles.periodButton, styles.activePeriod]}>
          <Text style={styles.activePeriodText}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.periodButton}>
          <Text style={styles.periodText}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.periodButton}>
          <Text style={styles.periodText}>Year</Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="Total Revenue"
          value="₹45,250"
          change="+12.5%"
          isPositive={true}
          icon="cash-outline"
        />
        <MetricCard
          title="Total Orders"
          value="156"
          change="+8.2%"
          isPositive={true}
          icon="receipt-outline"
        />
        <MetricCard
          title="Average Order"
          value="₹290"
          change="-2.1%"
          isPositive={false}
          icon="cart-outline"
        />
        <MetricCard
          title="Customer Rating"
          value="4.8"
          change="+0.2"
          isPositive={true}
          icon="star-outline"
        />
      </View>

      {/* Revenue Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <SimpleBarChart data={revenueData} labels={labels} />
      </Card>

      {/* Orders Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Orders Trend</Text>
        <SimpleBarChart data={ordersData} labels={labels} />
      </Card>

      {/* Top Items */}
      <Card style={styles.topItemsCard}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        <View style={styles.topItem}>
          <Text style={styles.itemName}>Margherita Pizza</Text>
          <Text style={styles.itemSales}>45 orders</Text>
        </View>
        <View style={styles.topItem}>
          <Text style={styles.itemName}>Chicken Burger</Text>
          <Text style={styles.itemSales}>38 orders</Text>
        </View>
        <View style={styles.topItem}>
          <Text style={styles.itemName}>Pasta Alfredo</Text>
          <Text style={styles.itemSales}>32 orders</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  periodButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: 20,
  },
  activePeriod: {
    backgroundColor: theme.colors.primary,
  },
  periodText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
  },
  activePeriodText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
  },
  metricCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    marginHorizontal: '1%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  chartCard: {
    margin: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: '100%',
    width: 20,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  topItemsCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  topItem: {
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
  },
  itemSales: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
}); 