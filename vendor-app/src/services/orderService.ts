import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../types/order';

class OrderService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  }

  async getOrders(): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await api.get('/api/vendors/orders', { headers });
      console.log('getOrders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Fetching order:', orderId);
      const response = await api.get(`/api/vendors/orders/${orderId}`, { headers });
      console.log('Order response:', response.data);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error fetching order (response):', error.response.status, error.response.data);
      } else {
        console.error('Error fetching order:', error);
      }
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Updating order:', orderId, 'status to:', status);
      const response = await api.patch(
        `/api/vendors/orders/${orderId}/status`,
        { status },
        { headers }
      );
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      const vendorStr = await AsyncStorage.getItem('vendor');
      if (!vendorStr) {
        throw new Error('No vendor found in storage');
      }
      const vendor = JSON.parse(vendorStr);
      
      console.log('Fetching orders with status:', status, 'for vendor:', vendor._id);
      const response = await api.get(`/api/vendors/${vendor._id}/orders/status/${status}`, { headers });
      console.log('Orders by status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  // Subscribe to real-time order updates
  subscribeToOrderUpdates(callback: (order: Order) => void) {
    const socket = orderNotificationService.getSocket();
    if (socket) {
      socket.on('orderStatusUpdate', (updatedOrder: Order) => {
        console.log('Received order status update:', updatedOrder);
        callback(updatedOrder);
      });
    }
  }

  // Unsubscribe from real-time order updates
  unsubscribeFromOrderUpdates() {
    const socket = orderNotificationService.getSocket();
    if (socket) {
      socket.off('orderStatusUpdate');
    }
  }
}

export const orderService = new OrderService(); 