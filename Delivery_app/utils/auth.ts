import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl, getTimeout, API_CONFIG } from '../config/api';

export interface UserData {
  id?: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  profileImage?: string;
  role: string;
  vehicleType?: string;
  vehicleNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    updatedAt: string;
  };
}

const TOKEN_KEY = '@traffic_friend_token';

// Helper function to get auth header
const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to make API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${getBaseUrl()}${endpoint}`;
  const timeout = getTimeout();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log('Making API request to:', url);
    console.log('Request options:', {
      ...options,
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error('API request failed:', error);
    throw error;
  }
};

export const registerUser = async (userData: {
  email: string;
  fullName: string;
  password: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
}): Promise<{ user: UserData; token: string }> => {
  try {
    console.log('Starting user registration...');
    console.log('Registration data:', { ...userData, password: '***' });
    
    // Transform the data to match backend expectations
    const registrationData = {
      name: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      vehicleType: userData.vehicleType,
      vehicleNumber: userData.vehicleNumber
    };

    console.log('Transformed registration data:', { ...registrationData, password: '***' });
    
    const data = await apiRequest('/delivery/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    // Store token
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    console.log('User registration successful');
    
    return {
      user: data.deliveryBoy,
      token: data.token
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<{ user: UserData; token: string }> => {
  try {
    console.log('Attempting delivery boy login for email:', email);
    
    const data = await apiRequest('/delivery/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // Store token
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    console.log('Token successfully saved to AsyncStorage');
    console.log('Login successful for delivery boy:', data.deliveryBoy.fullName);
    
    return {
      user: data.deliveryBoy,
      token: data.token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('Logging out user...');
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    console.log('Getting current user...');
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Retrieved token:', token ? 'Token found' : 'No token found');
    if (!token) {
      console.log('No token found, returning null');
      return null;
    }

    const url = `${getBaseUrl()}/delivery/profile`;
    console.log('Calling profile endpoint:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });

    console.log('Profile response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HTTP error response body:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Current user data fetched successfully', data);

    // Store the last update timestamp
    await AsyncStorage.setItem('lastProfileUpdate', new Date().toISOString());

    return data.profile;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Add a function to check if profile data needs refresh
export const shouldRefreshProfile = async (): Promise<boolean> => {
  try {
    const lastUpdate = await AsyncStorage.getItem('lastProfileUpdate');
    if (!lastUpdate) return true;

    const lastUpdateTime = new Date(lastUpdate).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return currentTime - lastUpdateTime > fiveMinutes;
  } catch (error) {
    console.error('Error checking profile refresh:', error);
    return true;
  }
};

export const updateUserProfile = async (updates: Partial<UserData>): Promise<UserData> => {
  try {
    console.log('Updating user profile...');
    const headers = await getAuthHeader();
    
    const data = await apiRequest('/users/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });

    console.log('Profile updated successfully');
    return data.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const updateUserLocation = async (latitude: number, longitude: number, address: string): Promise<UserData> => {
  try {
    console.log('Updating user location...');
    const headers = await getAuthHeader();
    
    const data = await apiRequest('/users/location', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ latitude, longitude, address })
    });

    console.log('Location updated successfully');
    return data.user;
  } catch (error) {
    console.error('Update location error:', error);
    throw error;
  }
};

// Migration helper function
export const migrateUsersToBackend = async (): Promise<void> => {
  try {
    console.log('Starting user migration...');
    const usersJson = await AsyncStorage.getItem('@traffic_friend_users');
    if (!usersJson) {
      console.log('No users to migrate');
      return;
    }

    const users = JSON.parse(usersJson);
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      try {
        await registerUser({
          email: user.email,
          fullName: user.fullName,
          password: user.password,
          phone: user.phone,
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber
        });
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to migrate user ${user.email}:`, error);
      }
    }

    console.log('User migration completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}; 