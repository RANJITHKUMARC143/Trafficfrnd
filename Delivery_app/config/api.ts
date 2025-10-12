// API Configuration
import Constants from 'expo-constants';

function deriveLanBaseURL(): string | undefined {
  try {
    const hostUri = (Constants as any)?.expoConfig?.hostUri
      || (Constants as any)?.manifest?.debuggerHost
      || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (!hostUri || typeof hostUri !== 'string') return undefined;
    const host = hostUri.split(':')[0];
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (isIPv4) {
      return `http://${host}:3000/api`;
    }
  } catch {}
  return undefined;
}

const LAN_BASE = deriveLanBaseURL();

export const API_CONFIG = {
  // Development
  development: {
    baseUrl: (process as any).env?.EXPO_PUBLIC_API_URL
      ? `${(process as any).env.EXPO_PUBLIC_API_URL}/api`
      : 'http://192.168.31.107:3000/api',
    timeout: 10000, // 10 seconds
  },
  // Production
  production: {
    baseUrl: (process as any).env?.EXPO_PUBLIC_API_URL
      ? `${(process as any).env.EXPO_PUBLIC_API_URL}/api`
      : 'http://192.168.31.107:3000/api',
    timeout: 15000, // 15 seconds
  }
};

// Get current environment
const getEnvironment = () => {
  return __DEV__ ? 'development' : 'production';
};

// Get current API configuration
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
};

// Get base URL for API requests
export const getBaseUrl = () => API_CONFIG[getEnvironment()].baseUrl;

// Get timeout for API requests
export const getTimeout = () => {
  return getApiConfig().timeout;
};

const DEV_API_URL = 'http://192.168.31.107:3000/api';
const PROD_API_URL = 'http://192.168.31.107:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  DELIVERY: {
    PROFILE: '/delivery/profile',
    UPDATE_PROFILE: '/delivery/profile',
    UPDATE_LOCATION: '/delivery/location',
    UPDATE_STATUS: '/delivery/status',
    ORDERS: (deliveryBoyId: string) => `/delivery/${deliveryBoyId}/orders`,
    ORDER_DETAILS: (orderId: string) => `/orders/${orderId}`,
    ACCEPT_ORDER: (orderId: string) => `/orders/${orderId}/accept`,
    REJECT_ORDER: (orderId: string) => `/orders/${orderId}/reject`,
    UPDATE_ORDER_STATUS: (orderId: string) => `/orders/${orderId}/status`,
  },
  EARNINGS: {
    SUMMARY: '/delivery/earnings/summary',
    HISTORY: '/delivery/earnings/history',
  },
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAILS: (orderId: string) => `/orders/${orderId}`,
    UPDATE: (orderId: string) => `/orders/${orderId}`,
    CANCEL: (orderId: string) => `/orders/${orderId}/cancel`,
    TRACK: (orderId: string) => `/orders/${orderId}/track`,
    AVAILABLE: '/orders/available',
  },
}; 