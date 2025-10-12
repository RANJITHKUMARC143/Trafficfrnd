import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_URL = (process as any).env?.EXPO_PUBLIC_API_URL || 'https://trafficfrnd-2.onrender.com';

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log the request for debugging
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      });
      return config;
    } catch (error) {
      console.error('Error getting token:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    // Map invalid credentials to friendly message
    const status = error.response?.status;
    const msg = (error.response?.data?.message || error.message || '').toLowerCase();
    if (status === 400 || status === 401 || msg.includes('invalid') || msg.includes('not found')) {
      return Promise.reject({ message: 'User not found. Please sign up in the user app.' });
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // Handle unauthorized access
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('vendor');
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network Error:', error);
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/api/vendors/login', { email, password });
      const { token, vendor } = response.data;
      
      if (!token || !vendor) {
        throw new Error('Invalid response from server');
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('vendor', JSON.stringify(vendor));
      return response.data;
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      const status = error.response?.status;
      const msg = (error.response?.data?.message || error.message || '').toLowerCase();
      if (status === 400 || status === 401 || msg.includes('invalid') || msg.includes('not found')) {
        throw new Error('User not found. Please sign up in the user app.');
      }
      throw error.response?.data || { message: 'An error occurred during login' };
    }
  },

  register: async (vendorData: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      console.log('Attempting registration for:', vendorData.email);
      const response = await api.post('/api/vendors/register', vendorData);
      const { token, vendor } = response.data;
      
      if (!token || !vendor) {
        throw new Error('Invalid response from server');
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('vendor', JSON.stringify(vendor));
      return response.data;
    } catch (error: any) {
      console.error('Registration Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'An error occurred during registration' };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('vendor');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getCurrentVendor: async () => {
    try {
      const vendor = await AsyncStorage.getItem('vendor');
      const token = await AsyncStorage.getItem('token');
      
      if (!vendor || !token) {
        return null;
      }

      return JSON.parse(vendor);
    } catch (error) {
      console.error('Get current vendor error:', error);
      return null;
    }
  },

  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      return !!(token && user);
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }
};

export const updateVendorPushToken = async (expoPushToken: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await api.put('/api/vendors/push-token', { expoPushToken }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api; 

class SocketService {
  private readonly SOCKET_URL = ((process as any).env?.EXPO_PUBLIC_API_URL || 'https://trafficfrnd-2.onrender.com'); // Updated backend socket URL
} 