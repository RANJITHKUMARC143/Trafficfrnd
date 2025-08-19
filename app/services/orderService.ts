// Order service for API calls
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://trafficfrnd-2.onrender.com/api';

export async function createOrder(orderData) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function fetchUserOrders() {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updatePushToken(expoPushToken) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/userAuth/push-token`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ expoPushToken }),
  });
  if (!res.ok) throw new Error('Failed to update push token');
  return res.json();
}

export async function fetchDeliveryPoints() {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/delivery-points`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch delivery points');
  return res.json();
} 