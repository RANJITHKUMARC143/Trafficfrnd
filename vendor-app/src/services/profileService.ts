import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VendorProfile {
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  cuisine?: string[];
  openingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  rating?: number;
  totalRatings?: number;
  isOpen?: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProfileService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  }

  async getProfile(): Promise<VendorProfile> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Fetching profile');
      const response = await api.get('/api/vendors/profile', { headers });
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(profileData: Partial<VendorProfile>): Promise<VendorProfile> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Updating profile');
      const response = await api.put('/api/vendors/profile', profileData, { headers });
      console.log('Update profile response:', response.data);
      
      // Update stored vendor data
      await AsyncStorage.setItem('vendor', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateOpeningHours(openingHours: VendorProfile['openingHours']): Promise<VendorProfile> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Updating opening hours');
      const response = await api.patch('/api/vendors/opening-hours', { openingHours }, { headers });
      console.log('Update opening hours response:', response.data);
      
      // Update stored vendor data
      await AsyncStorage.setItem('vendor', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error updating opening hours:', error);
      throw error;
    }
  }

  async toggleOpenStatus(): Promise<VendorProfile> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Toggling open status');
      const response = await api.patch('/api/vendors/toggle-status', {}, { headers });
      console.log('Toggle status response:', response.data);
      
      // Update stored vendor data
      await AsyncStorage.setItem('vendor', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error toggling open status:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService(); 