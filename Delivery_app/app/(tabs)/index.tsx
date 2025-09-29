import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/constants/theme';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import { fetchAlerts } from '@/services/alertService';
import Card from '@/components/common/Card';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import { ORDERS } from '@/data/mockData';
import { 
  Clock, 
  Navigation, 
  MapPin,
  TrendingUp
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { DeviceEventEmitter } from 'react-native';
import TestNotificationComponent from '@/components/TestNotificationComponent';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [activeStatus, setActiveStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Test loading animation
  const testLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };
  
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


  useEffect(() => {
    // Remove the duplicate socket listeners since OrderContext handles them
    const sub = DeviceEventEmitter.addListener('alertsUpdated', async () => {
      try {
        const alerts = await fetchAlerts();
        const count = Array.isArray(alerts) ? alerts.filter((a: any) => !a.read).length : 0;
        setUnreadCount(count);
      } catch {}
    });

    return () => {
      sub?.remove?.();
    };
  }, [user]);

  const [unreadCount, setUnreadCount] = React.useState(0);

  useEffect(() => {
    (async () => {
      try {
        const alerts = await fetchAlerts();
        const count = Array.isArray(alerts) ? alerts.filter((a: any) => !a.read).length : 0;
        setUnreadCount(count);
      } catch {}
    })();
  }, []);

  return (
    <Screen scroll>
      <Header 
        title="Dashboard" 
        showNotification 
        notificationCount={unreadCount} 
        onNotificationPress={() => router.push('/(tabs)/alerts')}
      />
      
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
      
      {filteredOrders.length > 0 ? (
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

      {/* Firebase Notification Test */}
      <View style={styles.ordersSectionHeader}>
        <Text style={styles.sectionTitle}>Firebase Notifications</Text>
      </View>
      
      <TestNotificationComponent />
      
      {/* Test Loading Animation */}
      <View style={styles.ordersSectionHeader}>
        <Text style={styles.sectionTitle}>Test Loading Animation</Text>
      </View>
      <TouchableOpacity style={styles.testButton} onPress={testLoading}>
        <Text style={styles.testButtonText}>Test Loading (3 seconds)</Text>
      </TouchableOpacity>
      
      <LoadingOverlay visible={isLoading} size="medium" />
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
  testButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  testButtonText: {
    ...FONTS.body3Medium,
    color: COLORS.white,
  },
});