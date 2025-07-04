import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/common/Screen';
import { COLORS, FONTS } from '@/constants/theme';
import { User, CheckCircle, Car, FileText, Banknote, Bell, Globe, Phone, Shield, Home, ClipboardList, DollarSign, Headphones } from 'lucide-react-native';
import { getCurrentUser, logoutUser } from '@/utils/auth';
// Assume these exist and are implemented to fetch from backend
// import { fetchFinance, fetchStats, fetchPreferences, updateOnlineStatus } from '@/utils/api';

// Dummy implementations for demo (replace with real API calls)
const fetchFinance = async () => ({ bankAccount: 'XXXX1234', ifsc: 'SBIN0001234' });
const fetchStats = async () => ({ totalDeliveries: 1200, rating: 4.85, monthlyEarnings: 18500 });
const fetchPreferences = async () => ({ language: 'English', notifications: true, emergencyContact: '+91 9876543210' });
const updateOnlineStatus = async (val) => true;

export default function DeliveryBoyProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        setIsOnline(userData.isOnline);
        setStats(userData.stats);
        setFinance(await fetchFinance());
        setPreferences(await fetchPreferences());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  }, [fetchProfileData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      await updateOnlineStatus(value);
      await fetchProfileData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
      setIsOnline(!value);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) return <View style={styles.loading}><Text>Loading...</Text></View>;

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
              <Text style={styles.name}>{user?.fullName}</Text>
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

        {/* Vehicle Card */}
        <Card icon={<Car color={COLORS.primary} size={22} />} title="Vehicle Details">
          <Row label="Type" value={user?.vehicleType} />
          <Row label="Number" value={user?.vehicleNumber} />
          <Row label="License" value={user?.licenseNumber || 'N/A'} />
          <Row label="Insurance" value={user?.insuranceStatus ? 'Active' : 'Expired'} valueColor={user?.insuranceStatus ? COLORS.success : COLORS.error} />
        </Card>

        {/* Stats Card */}
        <Card icon={<Shield color={COLORS.primary} size={22} />} title="Performance">
          <Row label="Total Deliveries" value={stats?.totalDeliveries} />
          <Row label="Rating" value={stats?.rating?.toFixed(2)} />
          <Row label="Monthly Earnings" value={`₹${stats?.monthlyEarnings}`} />
        </Card>

        {/* Documents Card */}
        <Card icon={<FileText color={COLORS.primary} size={22} />} title="Documents">
          <TouchableOpacity style={styles.docButton} onPress={() => {}}>
            <Text style={styles.docButtonText}>View / Upload Documents</Text>
          </TouchableOpacity>
        </Card>

        {/* Finance Card */}
        <Card icon={<Banknote color={COLORS.primary} size={22} />} title="Finance">
          <Row label="Bank Account" value={finance?.bankAccount} />
          <Row label="IFSC" value={finance?.ifsc} />
          <Row label="Payout History" value="View" onPress={() => {}} valueStyle={styles.link} />
        </Card>

        {/* Preferences Card */}
        <Card icon={<Globe color={COLORS.primary} size={22} />} title="Preferences">
          <Row label="Language" value={preferences?.language} />
          <Row label="Notifications" value={preferences?.notifications ? 'Enabled' : 'Disabled'} />
          <Row label="Emergency Contact" value={preferences?.emergencyContact} icon={<Phone size={16} color={COLORS.primary} />} />
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
  logoutButtonText: { ...FONTS.body2Medium, color: COLORS.white }
}); 