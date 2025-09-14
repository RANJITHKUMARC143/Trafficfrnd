import { API_URL } from '@src/config';
import { MenuItem } from '@/types/menu';
import { socketService } from '@/services/socketService';

class MenuService {
  private static instance: MenuService;
  private menuCache: Map<string, MenuItem[]> = new Map();
  private updateCallbacks: Set<(items: MenuItem[]) => void> = new Set();
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  private initialize() {
    if (this.isInitialized) return;

    // Wait for socket service to be ready
    const checkSocket = setInterval(() => {
      if (socketService.isConnected()) {
        clearInterval(checkSocket);
        this.setupSocketListeners();
        this.isInitialized = true;
      }
    }, 1000);

    // Clear interval after 60 seconds if socket doesn't connect
    setTimeout(() => {
      clearInterval(checkSocket);
      if (!this.isInitialized) {
        console.warn('Socket connection timeout, continuing without real-time updates');
        this.isInitialized = true;
      }
    }, 60000);
  }

  private setupSocketListeners() {
    socketService.on('menuItemAdded', (item: MenuItem) => {
      try {
        console.log('Menu item added:', item);
        this.updateCache(item);
      } catch (error) {
        console.error('Error handling menuItemAdded event:', error);
      }
    });

    socketService.on('menuItemUpdated', (item: MenuItem) => {
      try {
        console.log('Menu item updated:', item);
        this.updateCache(item);
      } catch (error) {
        console.error('Error handling menuItemUpdated event:', error);
      }
    });

    socketService.on('menuItemDeleted', (itemId: string) => {
      try {
        console.log('Menu item deleted:', itemId);
        this.removeFromCache(itemId);
      } catch (error) {
        console.error('Error handling menuItemDeleted event:', error);
      }
    });

    socketService.on('itemAvailabilityChange', (data: { itemId: string; isAvailable: boolean }) => {
      try {
        console.log('Item availability changed:', data);
        this.updateItemAvailability(data.itemId, data.isAvailable);
      } catch (error) {
        console.error('Error handling itemAvailabilityChange event:', error);
      }
    });
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async parseJsonResponse(response: Response): Promise<any> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON Parse Error. Response text:', text);
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  async getMenuItems(vendorId: string): Promise<MenuItem[]> {
    try {
      console.log('Getting menu items for vendor:', vendorId);
      
      // Check cache first
      const cachedItems = this.menuCache.get(vendorId);
      if (cachedItems) {
        console.log('Returning cached menu items for vendor:', vendorId);
        return cachedItems;
      }

      // Fetch from API if not in cache
      const apiUrl = `${API_URL}/api/vendors/menu/public/${vendorId}`;
      console.log('Fetching menu items from:', apiUrl);
      
      const response = await this.fetchWithTimeout(apiUrl);
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch menu items: ${response.status} ${response.statusText}`);
      }

      const items = await this.parseJsonResponse(response);
      console.log('Fetched menu items:', items);
      
      this.menuCache.set(vendorId, items);
      return items;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_URL}/api/vendors/menu/public/explore/all`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch all menu items: ${response.status} ${response.statusText}`);
      }

      const items = await this.parseJsonResponse(response);
      
      // Update cache for each vendor
      items.forEach((item: MenuItem) => {
        const vendorItems = this.menuCache.get(item.vendorId) || [];
        const existingItemIndex = vendorItems.findIndex(i => i._id === item._id);
        if (existingItemIndex >= 0) {
          vendorItems[existingItemIndex] = item;
        } else {
          vendorItems.push(item);
        }
        this.menuCache.set(item.vendorId, vendorItems);
      });

      return items;
    } catch (error) {
      console.error('Error fetching all menu items:', error);
      return [];
    }
  }

  private updateCache(item: MenuItem) {
    try {
      const vendorId = item.vendorId;
      const currentItems = this.menuCache.get(vendorId) || [];
      const existingItemIndex = currentItems.findIndex(i => i._id === item._id);

      if (existingItemIndex >= 0) {
        currentItems[existingItemIndex] = item;
      } else {
        currentItems.push(item);
      }

      this.menuCache.set(vendorId, currentItems);
      this.notifyUpdateListeners(vendorId);
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }

  private removeFromCache(itemId: string) {
    try {
      this.menuCache.forEach((items, vendorId) => {
        const updatedItems = items.filter(item => item._id !== itemId);
        if (updatedItems.length !== items.length) {
          this.menuCache.set(vendorId, updatedItems);
          this.notifyUpdateListeners(vendorId);
        }
      });
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  private updateItemAvailability(itemId: string, isAvailable: boolean) {
    try {
      this.menuCache.forEach((items, vendorId) => {
        const item = items.find(i => i._id === itemId);
        if (item) {
          item.isAvailable = isAvailable;
          this.menuCache.set(vendorId, items);
          this.notifyUpdateListeners(vendorId);
        }
      });
    } catch (error) {
      console.error('Error updating item availability:', error);
    }
  }

  private notifyUpdateListeners(vendorId: string) {
    try {
      const items = this.menuCache.get(vendorId) || [];
      this.updateCallbacks.forEach(callback => callback(items));
    } catch (error) {
      console.error('Error notifying update listeners:', error);
    }
  }

  onMenuUpdate(callback: (items: MenuItem[]) => void) {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  clearCache() {
    this.menuCache.clear();
  }
}

export const menuService = MenuService.getInstance();
export default menuService; 