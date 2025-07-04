import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/constants/theme';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import Card from '@/components/common/Card';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import { ORDERS } from '@/data/mockData';
import { 
  Clock, 
  Navigation, 
  MapPin,
  TrendingUp,
  DollarSign 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, getSocket } from '@/utils/socket';
import { getBaseUrl, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

const TOKEN_KEY = '@traffic_friend_token';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  
  // Filter orders based on active status
  const filteredOrders = activeStatus === 'all' 
    ? orders.slice(0, 3) 
    : orders.filter(order => order.status === activeStatus).slice(0, 3);
  
  // Current date formatted for display
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Mock stats for today
  const todayStats = {
    earnings: '₹105.75',
    deliveries: '8',
    distance: '23.4 km',
    onlineHours: '6.5 hrs'
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('HomeScreen - Token loaded:', token ? 'Token exists' : 'No token');
      if (!token || token === 'null' || token === 'undefined') {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      if (token.split('.').length !== 3) {
        setError('Invalid authentication token. Please log in again.');
        setLoading(false);
        return;
      }
      if (!user || !user.id) {
        setError('User information not available. Please log in again.');
        setLoading(false);
        return;
      }
      const ordersEndpoint = API_ENDPOINTS.DELIVERY.ORDERS(user.id);
      const url = `${getBaseUrl()}${ordersEndpoint}`;
      console.log('HomeScreen - Fetching orders from:', url, 'with token:', token);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('HomeScreen - Orders response status:', response.status);
      let data = null;
      try { data = await response.clone().json(); } catch (e) { data = null; }
      console.log('HomeScreen - Orders response data:', data);
      if (!response.ok) {
        const errorData = data || {};
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch orders`);
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('HomeScreen - Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
    fetchOrders();
    }

    // Real-time updates via Socket.IO
    connectSocket();

    const handleOrderCreated = () => {
      fetchOrders();
    };
    const handleOrderUpdated = () => {
      fetchOrders();
    };
    getSocket().on('orderCreated', handleOrderCreated);
    getSocket().on('orderStatusUpdate', handleOrderUpdated);

    return () => {
      getSocket().off('orderCreated', handleOrderCreated);
      getSocket().off('orderStatusUpdate', handleOrderUpdated);
    };
  }, [user]);

  return (
    <Screen scroll>
      <Header 
        title="Dashboard" 
        showNotification 
        notificationCount={3} 
      />
      
      {/* Error display */}
      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}
      
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.welcomeText}>
        Welcome back{user && (user.fullName || user.name) ? `, ${user.fullName || user.name}` : ''}!
      </Text>
      
      {/* Today's stats */}
      <Text style={styles.sectionTitle}>Today's Summary</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.statsContainer}
      >
        <StatCard 
          title="Earnings" 
          value={todayStats.earnings} 
          icon={<DollarSign size={20} color={COLORS.primary} />}
          isUp={true}
          changePercent={12}
        />
        <StatCard 
          title="Deliveries" 
          value={todayStats.deliveries} 
          icon={<Navigation size={20} color={COLORS.accent} />}
          color={COLORS.accent}
          isUp={true}
          changePercent={8}
        />
        <StatCard 
          title="Distance" 
          value={todayStats.distance} 
          icon={<MapPin size={20} color={COLORS.success} />}
          color={COLORS.success}
        />
        <StatCard 
          title="Online Hours" 
          value={todayStats.onlineHours} 
          icon={<Clock size={20} color={COLORS.warningDark} />}
          color={COLORS.warningDark}
        />
      </ScrollView>
      
      {/* Active orders */}
      <View style={styles.ordersSectionHeader}>
        <Text style={styles.sectionTitle}>My Orders</Text>
        <TouchableOpacity onPress={() => router.push('/orders')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeStatus === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveStatus('all')}
        >
          <Text style={[
            styles.filterButtonText,
            activeStatus === 'all' && styles.activeFilterText
          ]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeStatus === 'pending' && styles.activeFilterButton
          ]}
          onPress={() => setActiveStatus('pending')}
        >
          <Text style={[
            styles.filterButtonText,
            activeStatus === 'pending' && styles.activeFilterText
          ]}>Pending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeStatus === 'confirmed' && styles.activeFilterButton
          ]}
          onPress={() => setActiveStatus('confirmed')}
        >
          <Text style={[
            styles.filterButtonText,
            activeStatus === 'confirmed' && styles.activeFilterText
          ]}>Confirmed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeStatus === 'pickup' && styles.activeFilterButton
          ]}
          onPress={() => setActiveStatus('pickup')}
        >
          <Text style={[
            styles.filterButtonText,
            activeStatus === 'pickup' && styles.activeFilterText
          ]}>Pickup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeStatus === 'enroute' && styles.activeFilterButton
          ]}
          onPress={() => setActiveStatus('enroute')}
        >
          <Text style={[
            styles.filterButtonText,
            activeStatus === 'enroute' && styles.activeFilterText
          ]}>En Route</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <Card style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </Card>
      ) : filteredOrders.length > 0 ? (
        filteredOrders.map(order => (
          <OrderCard 
            key={order._id || order.id} 
            order={order} 
            onPress={() => router.push(`/orders/${order._id || order.id}`)} 
          />
        ))
      ) : (
        <Card style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>
            No {activeStatus !== 'all' ? activeStatus : ''} orders at the moment
          </Text>
        </Card>
      )}
      
      {/* Performance overview */}
      <View style={styles.ordersSectionHeader}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <TouchableOpacity onPress={() => router.push('/profile/performance')}>
          <Text style={styles.viewAllText}>View Details</Text>
        </TouchableOpacity>
      </View>
      
      <Card style={styles.performanceCard}>
        <View style={styles.performanceHeader}>
          <TrendingUp size={18} color={COLORS.success} />
          <Text style={styles.performanceTitle}>Your performance is excellent!</Text>
        </View>
        
        <View style={styles.performanceStats}>
          <View style={styles.performanceStat}>
            <Text style={styles.performanceValue}>4.8</Text>
            <Text style={styles.performanceLabel}>Rating</Text>
          </View>
          
          <View style={styles.performanceStat}>
            <Text style={styles.performanceValue}>98%</Text>
            <Text style={styles.performanceLabel}>On Time</Text>
          </View>
          
          <View style={styles.performanceStat}>
            <Text style={styles.performanceValue}>95%</Text>
            <Text style={styles.performanceLabel}>Acceptance</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: 4,
  },
  welcomeText: {
    ...FONTS.h2,
    color: COLORS.darkGray,
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  statsContainer: {
    paddingRight: 16,
    marginHorizontal: -6,
    marginBottom: 24,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    ...FONTS.body4Medium,
    color: COLORS.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: -4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.ultraLightGray,
    marginHorizontal: 4,
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
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  performanceCard: {
    marginBottom: 24,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  performanceLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  errorCard: {
    marginBottom: 24,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
  },
  loadingCard: {
    marginBottom: 24,
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
});