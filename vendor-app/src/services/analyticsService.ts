import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from './socketService';

export interface AnalyticsMetrics {
  today: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  yesterday: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  lastWeek: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  lastMonth: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
}

export interface TopSellingItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface StatusDistribution {
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  topSellingItems: TopSellingItem[];
  statusDistribution: StatusDistribution;
  rating: number;
}

class AnalyticsService {
  async initialize() {
    try {
      await socketService.initialize();
    } catch (error) {
      console.error('Error initializing analytics service:', error);
    }
  }

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Fetching analytics with headers:', headers);
      const response = await api.get('/api/vendors/analytics/metrics', { headers });
      console.log('Analytics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Real-time event listeners
  onAnalyticsUpdate(callback: (data: AnalyticsData) => void) {
    socketService.on('analyticsUpdate', callback);
  }

  onNewOrder(callback: (order: any) => void) {
    socketService.on('newOrder', callback);
  }

  onOrderStatusUpdate(callback: (order: any) => void) {
    socketService.on('orderStatusUpdate', callback);
  }

  onOrderCancelled(callback: (orderId: string) => void) {
    socketService.on('orderCancelled', callback);
  }

  // Cleanup
  disconnect() {
    socketService.disconnect();
  }
}

export const analyticsService = new AnalyticsService(); 