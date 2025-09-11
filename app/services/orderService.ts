// Order service for API calls
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.107:3000'}/api`;

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
  // Use dedicated user-orders endpoint to avoid ID casting on /orders/:id
  const res = await fetch(`${API_BASE_URL}/user/orders/user`, {
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
  const res = await fetch(`${API_BASE_URL}/delivery-points`);
  if (!res.ok) throw new Error('Failed to fetch delivery points');
  return res.json();
} 

// Quote delivery fee preview
export async function quoteDeliveryFee(params: {
  userLocation: { latitude: number; longitude: number };
  selectedDeliveryPoint: { latitude: number; longitude: number };
  etaMinutes?: number;
  surge?: { peakTraffic?: number; rain?: number; festival?: number };
}) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to quote delivery fee');
  return res.json();
}

// Payments (Razorpay)
export async function getPaymentConfig() {
  const res = await fetch(`${API_BASE_URL.replace(/\/api$/, '')}/api/payments/config`);
  if (!res.ok) throw new Error('Failed to load payment config');
  return res.json();
}

export async function createPaymentOrder(orderId: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/payments/online/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId })
  });
  if (!res.ok) throw new Error('Failed to create payment order');
  return res.json();
}

export async function confirmPayment(orderId: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/payments/online/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...payload })
  });
  if (!res.ok) throw new Error('Failed to confirm payment');
  return res.json();
}