import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../config/api';
const TOKEN_KEY = '@traffic_friend_token';
const API_URL = getBaseUrl();

export async function fetchAlerts() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  console.log('[fetchAlerts] Using token:', token);
  console.log('[fetchAlerts] API_URL:', API_URL);
  const res = await fetch(`${API_URL}/delivery-alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('[fetchAlerts] Response status:', res.status);
  if (!res.ok) {
    const text = await res.text();
    console.log('[fetchAlerts] Error response:', text);
    throw new Error('Failed to fetch alerts');
  }
  const data = await res.json();
  console.log('[fetchAlerts] Data:', data);
  return data;
}

export async function deleteAlert(id: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/delivery-alerts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete alert');
}

export async function clearAllAlerts(alerts: { _id: string }[]) {
  for (const alert of alerts) {
    await deleteAlert(alert._id);
  }
}

export async function markAlertRead(id: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/delivery-alerts/${id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to mark alert as read');
} 

export async function registerDeliveryPushToken(expoPushToken: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/delivery-alerts/register-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expoPushToken })
  });
  if (!res.ok) throw new Error('Failed to register push token');
}

export async function registerDeliveryFCMToken(fcmToken: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/delivery-alerts/register-fcm-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fcmToken })
  });
  if (!res.ok) throw new Error('Failed to register FCM token');
}