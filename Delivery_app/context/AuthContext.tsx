import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl, API_ENDPOINTS } from '@/config/api';
import { updateDeliveryStatus, connectSocket, disconnectSocket, updateDeliveryLocation } from '@/utils/socket';
import * as Location from 'expo-location';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
  location?: {
    latitude: number;
    longitude: number;
  };
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use the same token key as auth utility
const TOKEN_KEY = '@traffic_friend_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Delay loading user to prevent blocking app startup
    setTimeout(() => {
      loadUser();
    }, 2000);
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('Token loaded from storage:', token);
      if (token) {
        const response = await fetch(`${getBaseUrl()}/delivery/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const rawUser = userData.profile || userData;
          const user = { ...rawUser, id: rawUser.id || rawUser._id, token };
          setUser(user);
          // Ensure socket is connected for realtime updates when app relaunches
          try {
            connectSocket({ id: user.id, role: 'delivery', token: user.token });
          } catch (e) {}
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(`${getBaseUrl()}/delivery/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      // Robust parsing: handle non-JSON responses (e.g., rate limit plain text)
      let data: any = null;
      let text: string | null = null;
      try {
        data = await response.clone().json();
      } catch {
        try {
          text = await response.clone().text();
        } catch {}
      }
      console.log('Login response status:', response.status, 'data:', data, 'text:', text);

      if (!response.ok) {
        let message = (data && (data.message || data.error)) || (text || 'Login failed');
        const lower = String(message).toLowerCase();
        if (response.status === 400 || response.status === 401 || lower.includes('invalid') || lower.includes('not found')) {
          message = 'User not found. Please sign up in the user app.';
        } else if (response.status === 429 || lower.startsWith('too many requests')) {
          message = 'Too many attempts. Please try again after a few minutes.';
        }
        throw new Error(message);
      }

      console.log('Token from backend:', data?.token);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      const checkToken = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('Token after set (login):', checkToken);
      const rawUser = data.deliveryBoy || data.user;
      const user = { ...rawUser, id: rawUser.id || rawUser._id, token: data.token };
      setUser(user);
      updateDeliveryStatus(user.id, 'online');
      // Connect socket and begin location streaming
      try {
        connectSocket({ id: user.id, role: 'delivery', token: user.token });
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (pos?.coords) {
            updateDeliveryLocation(user.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        }
      } catch (e) {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      setError(null);
      const response = await fetch(`${getBaseUrl()}/delivery/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      const checkTokenReg = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('Token after set (register):', checkTokenReg);
      const rawUser = data.deliveryBoy || data.user;
      const user = { ...rawUser, id: rawUser.id || rawUser._id, token: data.token };
      setUser(user);
      updateDeliveryStatus(user.id, 'online');
      // Connect socket and send initial location
      try {
        connectSocket({ id: user.id, role: 'delivery', token: user.token });
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (pos?.coords) {
            updateDeliveryLocation(user.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        }
      } catch (e) {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        updateDeliveryStatus(user.id, 'offline');
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      disconnectSocket();
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${getBaseUrl()}/delivery/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      setUser((prev) => prev ? { ...prev, ...data } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility to clear AsyncStorage for debugging
export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  console.log('Token cleared from AsyncStorage');
};

// Debug function to check AsyncStorage
export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', keys);
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`AsyncStorage[${key}]:`, value);
    }
  } catch (error) {
    console.error('Error reading AsyncStorage:', error);
  }
};

// Manual token setter for debugging
export const setTokenManually = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('Token manually set to:', token);
    const checkToken = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Token verification after manual set:', checkToken);
  } catch (error) {
    console.error('Error setting token manually:', error);
  }
}; 