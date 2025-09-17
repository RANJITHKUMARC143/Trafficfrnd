import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/common/Screen';
import { COLORS, FONTS } from '@/constants/theme';
import { User, CheckCircle, Banknote, Shield } from 'lucide-react-native';
import { getCurrentUser, logoutUser } from '@/utils/auth';
import { updateDeliveryStatus, getSocket, connectSocket } from '@/utils/socket';
import { useAuth } from '@/context/AuthContext';
// Assume these exist and are implemented to fetch from backend
// import { fetchFinance, fetchStats, fetchPreferences, updateOnlineStatus } from '@/utils/api';

// Dummy stats (can be replaced if backend provides richer stats endpoint)
const fetchStats = async () => ({ totalDeliveries: 1200, rating: 4.85, monthlyEarnings: 18500 });


export default function DeliveryBoyProfile() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const [surgeEnabled, setSurgeEnabled] = useState<boolean>(false);

  const fetchProfileData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        setIsOnline(userData.isOnline);
        setStats(userData.stats);
        // Finance details come from backend as bankDetails edited by admin
        setFinance(userData.bankDetails || null);
        if ((userData as any)?.surge?.enabled !== undefined) setSurgeEnabled(!!(userData as any)?.surge?.enabled);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Seed UI immediately from auth context to avoid blank screen
    if (authUser && !user) {
      setUser(authUser);
      setIsOnline(authUser.status === 'online');
      if ((authUser as any)?.surge?.enabled !== undefined) setSurgeEnabled(!!(authUser as any)?.surge?.enabled);
    }
    fetchProfileData();
    // Only run when authUser changes to avoid repeated calls
  }, [authUser]);

  // Setup realtime listeners for this delivery boy
  useEffect(() => {
    const ensureConnection = () => {
      if (!getSocket() && authUser?.id && authUser?.token) {
        connectSocket({ id: authUser.id, role: 'delivery', token: (authUser as any).token || undefined });
      }
    };
    ensureConnection();

    const socket = getSocket();
    if (!socket) return;

    const handleStatusUpdated = ({ deliveryBoyId, status }: { deliveryBoyId: string; status: 'online' | 'offline' | 'busy' }) => {
      if (authUser?.id && String(deliveryBoyId) === String(authUser.id)) {
        setIsOnline(status === 'online');
        setUser((prev: any) => prev ? { ...prev, status } : prev);
      }
    };

    const handleLocationUpdated = ({ deliveryBoyId, location }: any) => {
      if (authUser?.id && String(deliveryBoyId) === String(authUser.id)) {
        setUser((prev: any) => prev ? { ...prev, location: { ...location, updatedAt: new Date().toISOString() } } : prev);
      }
    };

    const handleOrderEvents = () => {
      // Orders and earnings can influence stats; refetch profile summary
      fetchProfileData();
    };

    const handleProfileUpdated = (payload: any) => {
      if (authUser?.id && String(payload?.id) === String(authUser.id)) {
        if (payload?.bankDetails) {
          setFinance(payload.bankDetails);
        }
        if (payload?.surge) {
          setSurgeEnabled(!!payload.surge.enabled);
        }
        // Pull latest for any other fields
        fetchProfileData();
      }
    };

    socket.on('deliveryStatusUpdated', handleStatusUpdated);
    socket.on('locationUpdated', handleLocationUpdated);
    socket.on('orderCreated', handleOrderEvents);
    socket.on('orderStatusUpdated', handleOrderEvents);
    socket.on('deliveryProfileUpdated', handleProfileUpdated);

    return () => {
      socket.off('deliveryStatusUpdated', handleStatusUpdated);
      socket.off('locationUpdated', handleLocationUpdated);
      socket.off('orderCreated', handleOrderEvents);
      socket.off('orderStatusUpdated', handleOrderEvents);
      socket.off('deliveryProfileUpdated', handleProfileUpdated);
    };
  }, [authUser, fetchProfileData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  }, [fetchProfileData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      if (authUser?.id) {
        await updateDeliveryStatus(authUser.id, value ? 'online' : 'offline');
      }
      await fetchProfileData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
      setIsOnline(!value);
    }
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const toggleSurge = async (next: boolean) => {
    try {
      const token = (authUser as any)?.token || (user as any)?.token;
      // Fallback to API_URL from config used elsewhere
      const API_URL = (process as any).env?.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      await fetch(`${API_URL}/api/delivery/me/surge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ enabled: next })
      });
      setSurgeEnabled(next);
    } catch (e) {
      Alert.alert('Error', 'Failed to update surge');
    }
  };

  if (loading) return <View style={styles.loading}><Text>Loading...</Text></View>;

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text>No profile found. Please log in again.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.logoutButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: user?.profileImage || 'https://i.pravatar.cc/150?img=3' }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{user?.fullName || 'Driver'}</Text>
              {user?.isVerified && <CheckCircle color={COLORS.primary} size={20} style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.phone}>{user?.phone}</Text>
          </View>
          <View style={styles.statusToggle}>
            <Text style={{ color: isOnline ? COLORS.success : COLORS.gray, marginRight: 6 }}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch value={isOnline} onValueChange={handleToggleOnline} />
          </View>
        </View>

        {/* Stats Card */}
        <Card icon={<Shield color={COLORS.primary} size={22} />} title="Performance">
          <Row label="Total Deliveries" value={stats?.totalDeliveries} />
          <Row label="Rating" value={stats?.rating?.toFixed(2)} />
          <Row label="Monthly Earnings" value={`₹${stats?.monthlyEarnings}`} />
        </Card>

        {/* Finance Card (admin-managed). Show blank if not filled) */}
        <Card icon={<Banknote color={COLORS.primary} size={22} />} title="Finance">
          <Row label="Account Holder" value={finance?.accountHolderName || ''} />
          <Row label="Bank Name" value={finance?.bankName || ''} />
          <Row label="Account Number" value={finance?.accountNumber || ''} />
          <Row label="IFSC" value={finance?.ifscCode || ''} />
        </Card>

        {/* Surge toggle */}
        <Card icon={<Shield color={COLORS.primary} size={22} />} title="Surge">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.rowLabel}>{surgeEnabled ? 'On (+20% fee)' : 'Off'}</Text>
            <Switch value={surgeEnabled} onValueChange={toggleSurge} />
          </View>
        </Card>


        {/* Quick Actions */}
        <Card icon={<User color={COLORS.primary} size={22} />} title="Quick actions">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/profile/edit')}> 
              <Text style={styles.quickBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/earnings')}>
              <Text style={styles.quickBtnText}>Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/support')}>
              <Text style={styles.quickBtnText}>Support</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Card({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value, valueColor, valueStyle, icon, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon}
        <Text style={[styles.rowValue, valueColor && { color: valueColor }, valueStyle]}>
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.white, borderRadius: 16, margin: 16, elevation: 2,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16, borderWidth: 2, borderColor: COLORS.primary },
  name: { ...FONTS.h2, color: COLORS.darkGray },
  phone: { ...FONTS.body3, color: COLORS.gray },
  statusToggle: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginVertical: 8, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { ...FONTS.body2Medium, color: COLORS.primary, marginLeft: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  rowLabel: { ...FONTS.body3, color: COLORS.darkGray },
  rowValue: { ...FONTS.body3, color: COLORS.gray },
  link: { color: COLORS.primary, textDecorationLine: 'underline' },
  docButton: { backgroundColor: COLORS.ultraLightGray, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  docButtonText: { color: COLORS.primary, ...FONTS.body3Medium },
  logoutButton: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 16, alignItems: 'center', margin: 24 },
  logoutButtonText: { ...FONTS.body2Medium, color: COLORS.white },
  quickBtn: { backgroundColor: COLORS.ultraLightGray, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  quickBtnText: { ...FONTS.body4Medium, color: COLORS.darkGray }
}); 