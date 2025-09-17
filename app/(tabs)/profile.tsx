import React, { useState, useEffect, lazy, Suspense } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, SafeAreaView, Modal, Pressable, Text, Dimensions, Animated } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';
import { socketService } from '@lib/services/socketService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '@src/config';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserOrders } from '@lib/services/orderService';

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
};

// Lazy load the LocationPicker component
import LocationPicker from '@cmp/_components/LocationPicker';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, rating: 4.8 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        await checkAuthStatus();
      } catch (err) {
        console.error('Error initializing profile:', err);
        setError('Failed to load profile. Please try again.');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeProfile();
  }, []);

  // Refresh when screen regains focus (e.g., after editing profile)
  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
      return () => {};
    }, [])
  );

  const getProfileImageUrl = (profileImage: string | undefined) => {
    if (!profileImage) return '';
    if (profileImage.startsWith('http')) return profileImage;
    return `${API_URL}${profileImage}`;
  };

  // Helper to color status text
  const getStatusStyle = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('complete')) return { color: '#22c55e' };
    if (normalized.includes('cancel')) return { color: '#ef4444' };
    if (normalized.includes('ongoing') || normalized.includes('preparing') || normalized.includes('accepted')) return { color: '#f59e0b' };
    return { color: '#4b5563' };
  };

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      console.log('checkAuthStatus: user from storage:', userData);
      console.log('checkAuthStatus: token from storage:', token);
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        // Fetch complete user details
        const response = await fetch(`${API_URL}/api/users/${parsedUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          Alert.alert('Error', 'Failed to fetch user details. Please log in again.');
          throw new Error('Failed to fetch user details');
        }
        const userDetails = await response.json();
        const profileImageUrl = getProfileImageUrl(userDetails.profileImage);
        setAuthState({
          isAuthenticated: true,
          user: {
            ...parsedUser,
            ...userDetails,
            profileImage: profileImageUrl,
            location: userDetails.location
          },
          isLoading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      Alert.alert('Error', 'Failed to check authentication status. Please try again.');
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const refreshUserStats = async () => {
    try {
      setOrdersLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token || !authState.user?.id) { setOrdersLoading(false); return; }
      // Use shared service to fetch orders
      const orders = await fetchUserOrders();
      const total = Array.isArray(orders) ? orders.length : 0;
      const completed = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'completed').length : 0;
      setStats((s) => ({ ...s, total, completed }));
      // Store latest 5 orders for display
      if (Array.isArray(orders)) {
        setRecentOrders(orders.slice(0, 5));
      }
      setOrdersLoading(false);
    } catch {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      refreshUserStats();
    }
  }, [authState.isAuthenticated]);

  // Subscribe to realtime events to refresh stats/profile
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    const onOrderCreated = () => refreshUserStats();
    const onOrderUpdated = () => refreshUserStats();
    const onOrderCompleted = () => refreshUserStats();
    try {
      socketService.on('orderCreated', onOrderCreated);
      socketService.on('orderUpdated', onOrderUpdated);
      socketService.on('orderCompleted', onOrderCompleted);
    } catch {}
    return () => {
      try {
        socketService.off('orderCreated', onOrderCreated);
        socketService.off('orderUpdated', onOrderUpdated);
        socketService.off('orderCompleted', onOrderCompleted);
      } catch {}
    };
  }, [authState.isAuthenticated]);

  const pickAndUploadPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to update your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri || !authState.user?.id) return;
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const form = new FormData();
      const filename = asset.fileName || `avatar_${Date.now()}.jpg`;
      // @ts-ignore
      form.append('profileImage', { uri: asset.uri, name: filename, type: 'image/jpeg' });
      const upload = await fetch(`${API_URL}/api/users/${authState.user.id}/profile-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form as any,
      });
      const data = await upload.json();
      if (!upload.ok) {
        Alert.alert('Upload failed', data?.message || 'Unable to update profile photo');
        return;
      }
      setAuthState((prev) => prev.user ? ({ ...prev, user: { ...prev.user, profileImage: data.profileImage } }) : prev);
      setShowPhotoMenu(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update profile photo');
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error('Login response is not valid JSON. Raw response:', rawText);
        Alert.alert('Raw response', rawText);
        throw new Error('Server did not return valid JSON. See log for details.');
      }
      if (!response.ok) {
        const serverMsg = (data && (data.message || data.error)) ? (data.message || data.error) : rawText;
        let message = serverMsg || 'Failed to login';
        const lower = String(message).toLowerCase();
        if (
          response.status === 400 ||
          response.status === 401 ||
          response.status === 404 ||
          lower.includes('invalid') ||
          lower.includes('not found') ||
          lower.includes('no user') ||
          lower.includes('incorrect')
        ) {
          message = 'User not found. Please sign up Traffic frnd.';
        }
        throw new Error(message);
      }
      if (!data.token || !data.user) {
        console.error('Invalid login response format:', data);
        throw new Error('Invalid server response format');
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('userId', data.user.id || data.user._id);
      // Debug: Log what is stored
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      console.log('After login: stored token:', storedToken);
      console.log('After login: stored user:', storedUser);
      // Fetch user details
      try {
        const userResponse = await fetch(`${API_URL}/api/users/${data.user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${data.token}`
          }
        });
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        const userDetails = await userResponse.json();
        const profileImageUrl = getProfileImageUrl(userDetails.profileImage);
        setAuthState({
          isAuthenticated: true,
          user: {
            ...data.user,
            ...userDetails,
            profileImage: profileImageUrl,
            location: userDetails.location
          },
          isLoading: false,
        });
      } catch (userDetailsError) {
        setAuthState({
          isAuthenticated: true,
          user: {
            ...data.user,
            profileImage: data.user.profileImage
          },
          isLoading: false,
        });
      }
      setFormData({
        username: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
      });
    } catch (error) {
      console.error('Login error details:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to log in. Please try again.');
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing connection to:', `${API_URL}/api/test`);
      const response = await fetch(`${API_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Connection test response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Connection test raw response:', text);
      
      try {
        const data = JSON.parse(text);
        console.log('Connection test parsed response:', data);
        return true;
      } catch (parseError) {
        console.error('Error parsing test response:', parseError);
        throw new Error('Invalid server response format');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const handleSignup = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // First test the connection
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      console.log('Attempting registration with:', {
        username: formData.name,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: '***'
      });

      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address
        }),
      });

      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      // After successful registration, log the user in
      await handleLogin();
    } catch (error) {
      console.error('Error signing up:', error);
      Alert.alert(
        'Error',
        error instanceof Error 
          ? error.message 
          : 'Failed to sign up. Please try again.'
      );
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    router.push('/edit-profile');
  };

  // Add a function to safely load the location picker
  const handleLocationSectionPress = () => {
    if (!showLocationPicker) {
      setShowLocationPicker(true);
    }
  };

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setAuthState(prev => ({ ...prev, isLoading: true }));
              checkAuthStatus();
            }}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (authState.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </ThemedView>
    );
  }

  if (authState.isAuthenticated && authState.user) {
    return (
      <ThemedView style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
        <Animated.ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          {/* Hero Section */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-150, 0, 150],
                    outputRange: [-50, 0, 0],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: scrollY.interpolate({
                    inputRange: [-150, 0],
                    outputRange: [1.06, 1],
                    extrapolateLeft: 'extend',
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={["#4CAF50", "#43e97b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { paddingTop: insets.top + 40 }]}
            >
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarShadow}>
                <TouchableOpacity activeOpacity={0.85} style={styles.avatarCircle} onPress={() => setShowPhotoMenu(true)}>
                  {authState.user.profileImage ? (
                    <Image source={{ uri: authState.user.profileImage }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
                  ) : (
                    <Ionicons name="person" size={60} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.name}>{authState.user.name || authState.user.username || 'User'}</Text>
            <Text style={styles.email}>{authState.user.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.roleText}>{authState.user.role ? authState.user.role.toUpperCase() : 'USER'}</Text>
            </View>
            </LinearGradient>
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="cart-outline" size={28} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done-outline" size={28} color="#43e97b" />
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={28} color="#FFD700" />
              <Text style={styles.statNumber}>{stats.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18 }}>
            <TouchableOpacity activeOpacity={0.9} style={styles.quickAction} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={22} color="#4CAF50" />
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.quickAction} onPress={() => router.push('/orders')}>
              <Ionicons name="receipt-outline" size={22} color="#4CAF50" />
              <Text style={styles.quickActionText}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.quickAction} onPress={() => router.push('/payments')}>
              <Ionicons name="wallet-outline" size={22} color="#4CAF50" />
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.quickAction} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={22} color="#4CAF50" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Info Card */}
          <View style={styles.infoCardWrapper}>
            <BlurView intensity={40} tint="light" style={styles.infoCardGlass}>
              <View style={styles.infoAccentBar} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoTitle}>Personal Information</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.infoRowGlass}>
                  <Ionicons name="person-circle" size={28} color="#4CAF50" style={styles.infoIconGlass} />
                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoLabelGlass}>Username</Text>
                    <Text style={styles.infoValueGlass}>{authState.user.username}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={styles.infoRowGlass}>
                  <Ionicons name="call" size={28} color="#43e97b" style={styles.infoIconGlass} />
                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoLabelGlass}>Phone</Text>
                    <Text style={styles.infoValueGlass}>{authState.user.phone || 'Not provided'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={styles.infoRowGlass}>
                  <Ionicons name="location" size={28} color="#FFD700" style={styles.infoIconGlass} />
                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoLabelGlass}>Address</Text>
                    <Text style={styles.infoValueGlass}>{authState.user.address || 'Not provided'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={styles.infoRowGlass}>
                  <Ionicons name="mail" size={28} color="#4CAF50" style={styles.infoIconGlass} />
                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoLabelGlass}>Email</Text>
                    <Text style={styles.infoValueGlass}>{authState.user.email}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Recent Orders */}
          <View style={styles.infoCardWrapper}>
            <BlurView intensity={40} tint="light" style={styles.infoCardGlass}>
              <View style={styles.infoAccentBar} />
              <View style={styles.infoCardContent}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                  <Text style={styles.infoTitle}>Recent Orders</Text>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/orders')} style={{ flexDirection:'row', alignItems:'center' }}>
                    <Text style={{ color:'#4CAF50', fontWeight:'600' }}>View All</Text>
                    <Ionicons name="chevron-forward" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
                {ordersLoading ? (
                  <ActivityIndicator color="#4CAF50" />
                ) : recentOrders.length === 0 ? (
                  <Text style={{ color:'#555' }}>No recent orders</Text>
                ) : (
                  recentOrders.map((order: any, index: number) => {
                    const createdAt = (order.timestamp || order.createdAt) ? new Date(order.timestamp || order.createdAt) : null;
                    const title = order._id ? `Order #${String(order._id).slice(-6)}` : `Order ${index+1}`;
                    const subtitle = createdAt ? createdAt.toLocaleString() : (order.vendorName || '');
                    const status = order.status || 'pending';
                    const itemsCount = Array.isArray(order.items) ? order.items.length : (order.quantity || 0);
                    return (
                      <View key={order._id || index} style={styles.orderRow}>
                        <View style={styles.orderIconWrapper}>
                          <Ionicons name="receipt-outline" size={20} color="#4CAF50" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderTitle}>{title}</Text>
                          <Text style={styles.orderSubtitle}>{subtitle}</Text>
                        </View>
                        <View style={styles.orderMeta}>
                          <Text style={[styles.orderStatus, getStatusStyle(status)]}>{status}</Text>
                          {itemsCount ? <Text style={styles.orderItems}>{itemsCount} items</Text> : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </BlurView>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.ScrollView>

        {/* Photo picker modal */}
        <Modal visible={showPhotoMenu} transparent animationType="fade" onRequestClose={() => setShowPhotoMenu(false)}>
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor:'#fff', borderRadius:16, padding:18, width:'80%' }}>
              <Text style={{ fontSize:16, fontWeight:'700', marginBottom:10 }}>Update Profile Photo</Text>
              <TouchableOpacity style={styles.quickAction} onPress={pickAndUploadPhoto}>
                <Ionicons name="image-outline" size={22} color="#4CAF50" />
                <Text style={styles.quickActionText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor:'#fef2f2' }]} onPress={() => setShowPhotoMenu(false)}>
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                <Text style={[styles.quickActionText, { color:'#ef4444' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Enhanced Navigation Bar */}
        <BottomNavigationBar />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerSafeArea}>
          <View style={styles.authHeader}>
            <View style={styles.welcomeContainer}>
              <ThemedText style={styles.welcomeTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>
                {isLogin
                  ? 'Sign in to continue your journey'
                  : 'Join us to start your journey'}
              </ThemedText>
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.authForm}>
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholderTextColor="#666"
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Address (Optional)"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholderTextColor="#666"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={isLogin ? handleLogin : handleSignup}
            >
              <ThemedText style={styles.submitButtonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <ThemedText style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Enhanced Navigation Bar */}
        <BottomNavigationBar />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  headerSafeArea: {
    backgroundColor: '#4CAF50',
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    backgroundColor: '#fff',
  },
  coverPhoto: {
    height: 150,
    backgroundColor: '#4CAF50',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    padding: 3,
    marginBottom: -60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileInfo: {
    marginTop: 70,
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#4CAF50',
    marginLeft: 5,
    fontSize: 16,
  },
  infoCardWrapper: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCardGlass: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  infoAccentBar: {
    width: 7,
    backgroundColor: 'linear-gradient(180deg, #4CAF50 0%, #43e97b 100%)',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  infoCardContent: {
    flex: 1,
    padding: 20,
  },
  infoRowGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  infoIconGlass: {
    marginRight: 14,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabelGlass: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoValueGlass: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  authHeader: {
    backgroundColor: '#4CAF50',
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeContainer: {
    paddingHorizontal: 25,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 40,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 24,
  },
  authForm: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 35,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  showPasswordButton: {
    padding: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  defaultProfileImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPickerContainer: {
    height: 300,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  locationPlaceholder: {
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 20,
  },
  locationPlaceholderText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
  },
  avatarWrapper: {
    marginBottom: 10,
  },
  avatarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 60,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#43e97b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: '#e0ffe7',
    marginTop: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  roleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -30,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: width / 3.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    marginLeft: 8,
    color: '#333',
    fontWeight: '600',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    marginHorizontal: 40,
    marginTop: 28,
    paddingVertical: 14,
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 24,
    marginHorizontal: 40,
    marginTop: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  orderIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e8f9ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  orderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  orderItems: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 