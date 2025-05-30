import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from './socketService';

export interface DashboardMetrics {
  revenue: number;
  orders: number;
  rating: number;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    totalAmount: number;
    createdAt: string;
    customerName: string;
  }>;
}

class DashboardService {
  async initialize() {
    try {
      await socketService.initialize();
    } catch (error) {
      console.error('Error initializing dashboard service:', error);
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/api/vendors/dashboard/metrics', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Real-time event listeners
  onMetricsUpdate(callback: (metrics: DashboardMetrics) => void) {
    socketService.on('dashboardMetricsUpdate', callback);
  }

  onNewOrder(callback: (order: DashboardMetrics['activeOrders'][0]) => void) {
    socketService.on('newOrder', callback);
  }

  onOrderStatusUpdate(callback: (order: DashboardMetrics['activeOrders'][0]) => void) {
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

export const dashboardService = new DashboardService(); 