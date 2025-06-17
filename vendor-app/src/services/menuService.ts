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

export class MenuService {
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
      const url = `/api/vendors/menu/category/${category}`;
      console.log(`MenuService: Fetching menu items for URL: ${url}`);
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get(url, { headers });
      console.log(`MenuService: Response status for ${category}:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`MenuService: HTTP error for ${category}: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = response.data; // Axios automatically parses JSON
      console.log('MenuService: Raw response data for category:', data);
      return data;
    } catch (error) {
      console.error('MenuService: Error fetching menu items by category:', error);
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