import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import Card from '@/components/common/Card';
import { COLORS, FONTS } from '@/constants/theme';
import { Calendar, ArrowRight, Filter } from 'lucide-react-native';
import { getBaseUrl, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface EarningsHistoryItem {
  id: string;
  date: string;
  amount: number;
  deliveries: number;
  hours: number;
  status: string;
}

interface EarningsSummary {
  totalEarnings: number;
  totalDeliveries: number;
  totalHours: number;
}

export default function EarningsHistoryScreen() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<EarningsHistoryItem[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  const fetchEarningsHistory = async () => {
    try {
      const response = await fetch(
        `${getBaseUrl()}${API_ENDPOINTS.EARNINGS.HISTORY}?filter=${selectedFilter}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch earnings history');
      }

      const data = await response.json();
      setHistory(data.history);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching earnings history:', error);
      Alert.alert('Error', 'Failed to load earnings history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsHistory();
  }, [selectedFilter, user?.token]);

  const renderHistoryItem = ({ item }: { item: EarningsHistoryItem }) => (
    <Card style={styles.historyCard}>
      <View style={styles.historyCardLeft}>
        <View style={styles.calendarIcon}>
          <Calendar size={18} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.historyDate}>{item.date}</Text>
          <Text style={styles.historyDetail}>
            {item.deliveries} deliveries • {item.hours} hrs
          </Text>
        </View>
      </View>
      
      <View style={styles.historyCardRight}>
        <Text style={styles.historyAmount}>₹{item.amount.toFixed(2)}</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.arrowContainer}>
        <ArrowRight size={18} color={COLORS.gray} />
      </View>
    </Card>
  );

  if (loading || !summary) {
    return (
      <Screen>
        <Header title="Earnings History" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading earnings history...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Earnings History" showBack />
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by:</Text>
        
        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              selectedFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.activeFilterText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              selectedFilter === 'week' && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter('week')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'week' && styles.activeFilterText
            ]}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              selectedFilter === 'month' && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter('month')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'month' && styles.activeFilterText
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.advancedFilterButton}>
          <Filter size={16} color={COLORS.primary} />
          <Text style={styles.advancedFilterText}>Advanced Filter</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>${summary.totalEarnings.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Deliveries</Text>
          <Text style={styles.summaryValue}>{summary.totalDeliveries}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Hours</Text>
          <Text style={styles.summaryValue}>{summary.totalHours}</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Earnings History</Text>
      
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No earnings history found</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.ultraLightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    ...FONTS.body4Medium,
    color: COLORS.gray,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedFilterText: {
    ...FONTS.body4Medium,
    color: COLORS.primary,
    marginLeft: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...StyleSheet.flatten([{
      shadowColor: COLORS.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }]),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 8,
  },
  summaryValue: {
    ...FONTS.h4,
    color: COLORS.darkGray,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.ultraLightGray,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDate: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  historyDetail: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  historyCardRight: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  historyAmount: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusText: {
    ...FONTS.body4,
    color: COLORS.success,
  },
  arrowContainer: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
});