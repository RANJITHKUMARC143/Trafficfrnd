import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = '';

export async function fetchAlerts() {
  const token = await AsyncStorage.getItem('token');
  console.log('[fetchAlerts] Using token:', token);
  console.log('[fetchAlerts] API_URL:', API_URL);
  const res = await fetch(`${API_URL}/api/alerts`, {
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