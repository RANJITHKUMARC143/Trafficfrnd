// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseUrl: 'https://traffic-friend-backend.onrender.com/api',
    timeout: 10000, // 10 seconds
  },
  // Production
  production: {
    baseUrl: 'https://traffic-friend-backend.onrender.com/api',
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
export const getBaseUrl = () => {
  return __DEV__ ? 'https://traffic-friend-backend.onrender.com/api' : 'https://traffic-friend-backend.onrender.com/api';
};

// Get timeout for API requests
export const getTimeout = () => {
  return getApiConfig().timeout;
};

const DEV_API_URL = 'https://traffic-friend-backend.onrender.com/api';
const PROD_API_URL = 'https://traffic-friend-backend.onrender.com/api';

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