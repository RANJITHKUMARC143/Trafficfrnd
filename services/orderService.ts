// Order service for API calls
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || 'https://trafficfrnd-2.onrender.com'}/api`;

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

export async function fetchOrderDetails(orderId: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch order details');
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

// Payments (Cashfree)
export async function getPaymentConfig() {
  const res = await fetch(`${API_BASE_URL.replace(/\/api$/, '')}/api/payments/config`);
  if (!res.ok) throw new Error('Failed to load payment config');
  return res.json();
}

// Cashfree UPI Payment functions
export async function createCashfreeUPIOrder(orderId: string, upiId?: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/payments/cashfree/upi/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, upiId })
  });
  if (!res.ok) throw new Error('Failed to create Cashfree UPI order');
  return res.json();
}

export async function createCashfreePaymentSession(orderId: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/payments/cashfree/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId })
  });
  if (!res.ok) throw new Error('Failed to create Cashfree payment session');
  return res.json();
}

export async function verifyCashfreePayment(orderId: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/payments/cashfree/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId })
  });
  if (!res.ok) throw new Error('Failed to verify Cashfree payment');
  return res.json();
}

export async function getAvailablePaymentMethods() {
  const res = await fetch(`${API_BASE_URL}/payments/methods`);
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
}

// Default export for the service
const orderService = {
  createOrder,
  fetchUserOrders,
  fetchOrderDetails,
  updatePushToken,
  fetchDeliveryPoints,
  quoteDeliveryFee,
  getPaymentConfig,
  createCashfreeUPIOrder,
  createCashfreePaymentSession,
  verifyCashfreePayment,
  getAvailablePaymentMethods
};

export default orderService;