import React, { useState, useEffect, lazy, Suspense } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, SafeAreaView, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '@src/config';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

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
const LocationPicker = lazy(() => import('../components/LocationPicker'));

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

  const getProfileImageUrl = (profileImage: string | undefined) => {
    if (!profileImage) return '';
    if (profileImage.startsWith('http')) return profileImage;
    return `${API_URL}${profileImage}`;
  };

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Fetch complete user details
        const response = await fetch(`${API_URL}/api/users/${parsedUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const userDetails = await response.json();
        const profileImageUrl = getProfileImageUrl(userDetails.profileImage);
        
        console.log('Fetched user details:', {
          userId: parsedUser.id,
          hasProfileImage: !!profileImageUrl,
          profileImageUrl
        });

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
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      console.log('Starting login process...');
      console.log('Attempting login with email:', formData.email);
      
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

      console.log('Login response status:', response.status);
      // Read response as text first
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error('Login response is not valid JSON. Raw response:', rawText);
        Alert.alert('Raw response', rawText);
        throw new Error('Server did not return valid JSON. See log for details.');
      }
      console.log('Login response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      if (!data.token || !data.user) {
        console.error('Invalid login response format:', data);
        throw new Error('Invalid server response format');
      }

      console.log('Login successful, storing token and user data...');
      
      try {
        await AsyncStorage.setItem('token', data.token);
        console.log('Token stored successfully');
        
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        console.log('User data stored successfully');
      } catch (storageError) {
        console.error('Error storing auth data:', storageError);
        throw new Error('Failed to store authentication data');
      }

      console.log('Fetching complete user details...');
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
          console.error('Failed to fetch user details:', userResponse.status);
          throw new Error('Failed to fetch user details');
        }

        const userDetails = await userResponse.json();
        console.log('User details fetched successfully:', JSON.stringify(userDetails, null, 2));

        const profileImageUrl = getProfileImageUrl(userDetails.profileImage);
        console.log('Profile image URL:', profileImageUrl);

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
        console.log('Auth state updated successfully');
      } catch (userDetailsError) {
        console.error('Error fetching user details:', userDetailsError);
        // Continue with basic user data if detailed fetch fails
        setAuthState({
          isAuthenticated: true,
          user: {
            ...data.user,
            profileImage: data.user.profileImage
          },
          isLoading: false,
        });
      }

      // Clear form
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
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Failed to log in. Please try again.');
      } else {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
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

  // Upload profile photo
  const handleUploadPhoto = async () => {
    try {
      console.log('Starting photo upload process...');
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', status);
      
      if (status !== 'granted') {
        console.log('Permission not granted');
        Alert.alert('Permission required', 'Please grant permission to access your photos');
        return;
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', {
        canceled: result.canceled,
        uri: result.assets?.[0]?.uri,
        width: result.assets?.[0]?.width,
        height: result.assets?.[0]?.height,
        type: result.assets?.[0]?.type,
        fileName: result.assets?.[0]?.fileName,
      });

      if (result.canceled) {
        console.log('Image picker was canceled');
        return;
      }

      if (!result.assets?.[0]?.uri) {
        console.log('No image selected');
        return;
      }

      const imageUri = result.assets[0].uri;
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('Preparing upload with:', {
        userId: authState.user?.id,
        uploadUrl: `${API_URL}/api/users/${authState.user?.id}/profile-photo`,
        hasToken: !!AsyncStorage.getItem('token'),
        filename,
        type,
      });

      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      console.log('Sending upload request...');
      const response = await fetch(`${API_URL}/api/users/${authState.user?.id}/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AsyncStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);
      const data = await response.json();
      console.log('Upload response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload photo');
      }

      console.log('Upload successful, updating profile image in state');
      setAuthState((prev) => prev.user ? {
        ...prev,
        user: { ...prev.user, profileImage: getProfileImageUrl(data.profileImage) }
      } : prev);
      console.log('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  // Delete profile photo
  const handleDeletePhoto = async () => {
    try {
      const userId = authState.user?.id;
      const response = await fetch(`${API_URL}/api/users/${userId}/profile-photo`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete photo');
      setAuthState((prev) => prev.user ? {
        ...prev,
        user: { ...prev.user, profileImage: '' }
      } : prev);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete photo');
    }
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
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.coverPhoto}>
              <View style={styles.profileImageWrapper}>
                <TouchableOpacity onPress={() => setShowPhotoMenu(true)} activeOpacity={0.7}>
                  {authState.user.profileImage ? (
                    <Image
                      source={{ uri: authState.user.profileImage }}
                      style={styles.profileImage}
                      onError={(e) => {
                        console.error('Error loading profile image:', e.nativeEvent.error);
                        // If image fails to load, show default profile image
                        setAuthState(prev => ({
                          ...prev,
                          user: prev.user ? {
                            ...prev.user,
                            profileImage: undefined
                          } : null
                        }));
                      }}
                      onLoad={() => console.log('Profile image loaded successfully')}
                      defaultSource={require('../../assets/images/icon.png')}
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.defaultProfileImage]}>
                      <Ionicons name="person" size={40} color="#666" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              {/* Popup menu for photo actions */}
              <Modal
                visible={showPhotoMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPhotoMenu(false)}
              >
                <Pressable style={styles.photoMenuOverlay} onPress={() => setShowPhotoMenu(false)}>
                  <View style={styles.photoMenuContainer}>
                    <TouchableOpacity onPress={() => { setShowPhotoMenu(false); handleUploadPhoto(); }} style={styles.photoMenuButton}>
                      <ThemedText style={styles.photoMenuText}>Upload Photo</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowPhotoMenu(false); handleDeletePhoto(); }} style={styles.photoMenuButton}>
                      <ThemedText style={[styles.photoMenuText, { color: '#ff6b6b' }]}>Delete Photo</ThemedText>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.userName}>{authState.user.name || authState.user.username}</ThemedText>
              <ThemedText style={styles.userEmail}>{authState.user.email}</ThemedText>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>24</ThemedText>
              <ThemedText style={styles.statLabel}>Orders</ThemedText>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <ThemedText style={styles.statNumber}>12</ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>4.8</ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Ionicons name="create-outline" size={20} color="#4CAF50" />
                <ThemedText style={styles.editButtonText}>Edit</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Username</ThemedText>
                  <ThemedText style={styles.infoValue}>{authState.user.username}</ThemedText>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Phone Number</ThemedText>
                  <ThemedText style={styles.infoValue}>{authState.user.phone || 'Not provided'}</ThemedText>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Address</ThemedText>
                  <ThemedText style={styles.infoValue}>{authState.user.address || 'Not provided'}</ThemedText>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Email</ThemedText>
                  <ThemedText style={styles.infoValue}>{authState.user.email}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Location</ThemedText>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={handleLocationSectionPress}
                >
                  <Ionicons name="refresh-outline" size={20} color="#4CAF50" />
                  <ThemedText style={styles.editButtonText}>
                    {showLocationPicker ? 'Hide Map' : 'Show Map'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.locationPickerContainer}>
                {showLocationPicker && authState.user.id && (
                  <Suspense fallback={
                    <View style={[styles.locationPickerContainer, styles.loadingContainer]}>
                      <ActivityIndicator size="large" color="#4CAF50" />
                      <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
                    </View>
                  }>
                    <LocationPicker
                      onLocationSelected={(location) => {
                        console.log('Location selected:', location);
                        // Update user location in state
                        setAuthState(prev => ({
                          ...prev,
                          user: prev.user ? {
                            ...prev.user,
                            location: {
                              latitude: location.latitude,
                              longitude: location.longitude
                            }
                          } : null
                        }));
                      }}
                      initialLocation={authState.user?.location ? {
                        latitude: authState.user.location.latitude,
                        longitude: authState.user.location.longitude
                      } : undefined}
                    />
                  </Suspense>
                )}
                {!showLocationPicker && (
                  <TouchableOpacity 
                    style={styles.locationPlaceholder}
                    onPress={handleLocationSectionPress}
                  >
                    <Ionicons name="map-outline" size={24} color="#4CAF50" />
                    <ThemedText style={styles.locationPlaceholderText}>
                      {authState.user?.location 
                        ? 'Tap to view or update location'
                        : 'Tap to set your location'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              <ThemedText style={styles.logoutButtonText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
  photoMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 180,
  },
  photoMenuButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoMenuText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
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
}); 