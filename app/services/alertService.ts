import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@src/config';

export async function fetchAlerts() {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.log('No authentication token found for alerts');
      throw new Error('Authentication required - please login');
    }

    console.log('Fetching alerts from:', `${API_URL}/api/alerts`);
    console.log('Using token:', token.substring(0, 20) + '...');

    const res = await fetch(`${API_URL}/api/alerts`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Alerts API response status:', res.status);
    
    // Handle JWT signature errors by clearing the token
    if (res.status === 401) {
      const errorText = await res.text();
      console.log('Authentication error response:', errorText);
      if (errorText.includes('Invalid token') || errorText.includes('invalid signature')) {
        console.log('JWT signature error detected, clearing stored token');
        await AsyncStorage.removeItem('token');
        throw new Error('Authentication expired - please login again');
      }
      throw new Error('Authentication failed - please login again');
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Alerts API error:', res.status, errorText);
      throw new Error(`Failed to fetch alerts: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Successfully fetched alerts:', data.length, 'items');
    
    // Additional client-side deduplication as a safety measure
    const uniqueAlerts = data.reduce((acc: any[], alert: any) => {
      const existingIndex = acc.findIndex(existing => existing._id === alert._id);
      if (existingIndex === -1) {
        acc.push(alert);
      }
      return acc;
    }, []);
    
    return uniqueAlerts;
  } catch (error) {
    console.error('Error in fetchAlerts:', error);
    throw error;
  }
}

export async function deleteAlert(id: string) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required - please login');
    }

    const res = await fetch(`${API_URL}/api/alerts/${id}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Delete alert error:', res.status, errorText);
      throw new Error(`Failed to delete alert: ${res.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Error in deleteAlert:', error);
    throw error;
  }
}

export async function clearAllAlerts(alerts: { _id: string }[]) {
  try {
    for (const alert of alerts) {
      await deleteAlert(alert._id);
    }
  } catch (error) {
    console.error('Error in clearAllAlerts:', error);
    throw error;
  }
}

export async function markAlertRead(id: string) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required - please login');
    }

    const res = await fetch(`${API_URL}/api/alerts/${id}/read`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Mark alert read error:', res.status, errorText);
      throw new Error(`Failed to mark alert as read: ${res.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Error in markAlertRead:', error);
    throw error;
  }
} 