import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Always use your computer's local IP address for Expo Go on a physical device
const API_URL = 'http://192.168.183.230:3000/api/vendors'; // Use your computer's IP address

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL,
    });
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      }
    });
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/login', { email, password });
      const { token, vendor } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('vendor', JSON.stringify(vendor));
      return response.data;
    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error.message);
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
      const response = await api.post('/register', vendorData);
      const { token, vendor } = response.data;
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
      await AsyncStorage.removeItem('vendor');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getCurrentVendor: async () => {
    try {
      const vendor = await AsyncStorage.getItem('vendor');
      return vendor ? JSON.parse(vendor) : null;
    } catch (error) {
      console.error('Get current vendor error:', error);
      return null;
    }
  },
};

export default api; 