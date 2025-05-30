import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from './socketService';

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  customizationOptions?: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

class MenuService {
  async initialize() {
    try {
      await socketService.initialize();
    } catch (error) {
      console.error('Error initializing menu service:', error);
    }
  }

  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get(`/api/vendors/menu`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get(`/api/vendors/menu/category/${category}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      throw error;
    }
  }

  async addMenuItem(item: Omit<MenuItem, '_id'>): Promise<MenuItem> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.post(`/api/vendors/menu`, item, { headers });
      return response.data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.put(`/api/vendors/menu/${itemId}`, updates, { headers });
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.patch(`/api/vendors/menu/${itemId}/availability`, 
        { isAvailable }, 
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling item availability:', error);
      throw error;
    }
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await api.delete(`/api/vendors/menu/${itemId}`, { headers });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // Real-time event listeners
  onMenuUpdate(callback: (menu: MenuItem[]) => void) {
    socketService.on('menuUpdate', callback);
  }

  onItemAvailabilityChange(callback: (item: MenuItem) => void) {
    socketService.on('itemAvailabilityChange', callback);
  }

  // Cleanup
  disconnect() {
    socketService.disconnect();
  }
}

export const menuService = new MenuService(); 