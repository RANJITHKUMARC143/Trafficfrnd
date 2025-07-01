import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../src/config';

export async function fetchAlerts() {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return await res.json();
}

export async function deleteAlert(id: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/alerts/${id}`, {
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
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/alerts/${id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to mark alert as read');
} 