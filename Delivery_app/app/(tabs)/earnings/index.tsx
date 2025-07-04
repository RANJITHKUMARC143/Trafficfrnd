import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import Card from '@/components/common/Card';
import { COLORS, FONTS } from '@/constants/theme';
import { Calendar } from 'lucide-react-native';
import { getBaseUrl } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EarningsChart from '@/components/earnings/EarningsChart';

const TOKEN_KEY = '@traffic_friend_token';

const TIMEFRAMES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function EarningsScreen() {
  const [timeframe, setTimeframe] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState(null);

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${getBaseUrl()}/delivery/earnings/summary?timeframe=${timeframe}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to fetch earnings data');
      }
      const data = await response.json();
      setEarnings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [timeframe]);

  if (loading) {
    return (
      <Screen>
        <Header title="Earnings" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Header title="Earnings" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchEarnings} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  if (!earnings) {
    return (
      <Screen>
        <Header title="Earnings" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>No earnings data available.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Earnings" />
      <View style={styles.timeframeContainer}>
        {TIMEFRAMES.map(tf => (
          <TouchableOpacity
            key={tf.key}
            style={[styles.timeframeButton, timeframe === tf.key && styles.activeTimeframeButton]}
            onPress={() => setTimeframe(tf.key)}
          >
            <Text style={[styles.timeframeButtonText, timeframe === tf.key && styles.activeTimeframeButtonText]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Earnings Summary</Text>
        <Text style={styles.summaryValue}>₹{earnings.current?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.summarySubtext}>Deliveries: {earnings.deliveries || 0} | Hours: {earnings.hours || 0}</Text>
      </Card>
      {/* Chart placeholder */}
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Earnings Chart</Text>
        {Array.isArray(earnings.data) && earnings.data.length > 0 ? (
          <EarningsChart data={earnings.data.map(item => ({
            day: item.date,
            earnings: item.amount
          }))} timeframe={timeframe} />
        ) : (
          <Text style={styles.chartPlaceholder}>No earnings data available for chart.</Text>
        )}
      </Card>
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Recent Payouts</Text>
      </View>
      {Array.isArray(earnings.data) && earnings.data.length > 0 ? (
        earnings.data.map((item, idx) => (
          <Card key={idx} style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <View style={styles.calendarIcon}>
                <Calendar size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.historyDate}>{item.date || '-'}</Text>
                <Text style={styles.historyDetail}>
                  {item.deliveries || 0} deliveries • {item.hours || 0} hrs
                </Text>
              </View>
            </View>
            <View style={styles.historyCardRight}>
              <Text style={styles.historyAmount}>₹{item.amount?.toFixed(2) || '0.00'}</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{item.status || 'Paid'}</Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.historyCard}>
          <Text style={styles.emptyText}>No recent payouts.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: 16,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  retryText: {
    color: COLORS.white,
    ...FONTS.body3Medium,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.ultraLightGray,
    marginHorizontal: 6,
  },
  activeTimeframeButton: {
    backgroundColor: COLORS.primary,
  },
  timeframeButtonText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  activeTimeframeButtonText: {
    color: COLORS.white,
    ...FONTS.body3Medium,
  },
  summaryCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 20,
  },
  summaryTitle: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginBottom: 8,
  },
  summaryValue: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: 4,
  },
  summarySubtext: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  chartPlaceholder: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  viewAllText: {
    ...FONTS.body4Medium,
    color: COLORS.primary,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 12,
  },
  historyDate: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
  },
  historyDetail: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  historyCardRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    ...FONTS.body2Medium,
    color: COLORS.success,
  },
  statusContainer: {
    backgroundColor: COLORS.ultraLightGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  statusText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
  },
}); 