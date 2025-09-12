import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from '@/config/api';

let socket: Socket | null = null;

export const connectSocket = (user?: { id: string; role?: string; token?: string }) => {
  if (socket) {
    console.log('[socket.ts] Disconnecting previous socket before reconnect...');
    socket.disconnect();
    socket = null;
  }
    const baseUrl = getBaseUrl().replace('/api', '');
    socket = io(baseUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    auth: {
      role: user?.role || 'delivery',
      token: user?.token || undefined,
      id: user?.id || undefined,
    },
    });

    socket.on('connect', () => {
    console.log('[socket.ts] Socket connected:', socket.id, 'auth:', user);
    });

    socket.on('disconnect', () => {
    console.log('[socket.ts] Socket disconnected');
    });

    socket.on('error', (error) => {
    console.error('[socket.ts] Socket error:', error);
    });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper functions for common socket operations
export const updateDeliveryLocation = (deliveryBoyId: string, location: { latitude: number; longitude: number }) => {
  if (socket) {
    socket.emit('updateLocation', { deliveryBoyId, location });
  }
};

export const updateOrderStatus = (orderId: string, status: string) => {
  if (socket) {
    socket.emit('updateOrderStatus', { orderId, status });
  }
};

export const updateDeliveryStatus = (deliveryBoyId: string, status: 'online' | 'offline' | 'busy') => {
  if (socket) {
    socket.emit('updateDeliveryStatus', { deliveryBoyId, status });
  }
};

export const joinOrderRoom = (orderId: string) => {
  if (socket) {
    // Backend expects a plain string orderId, not an object
    socket.emit('joinOrderRoom', orderId);
  }
};

export const leaveOrderRoom = (orderId: string) => {
  if (socket) {
    // Backend expects a plain string orderId, not an object
    socket.emit('leaveOrderRoom', orderId);
  }
};

// New order-related socket events
export const trackOrder = (orderId: string) => {
  if (socket) {
    socket.emit('trackOrder', { orderId });
  }
};

export const notifyVendor = (orderId: string, message: string) => {
  if (socket) {
    socket.emit('notifyVendor', { orderId, message });
  }
};

export const notifyDelivery = (orderId: string, message: string) => {
  if (socket) {
    socket.emit('notifyDelivery', { orderId, message });
  }
};

export const notifyCustomer = (orderId: string, message: string) => {
  if (socket) {
    socket.emit('notifyCustomer', { orderId, message });
  }
};

// Socket event listeners setup
export const setupOrderListeners = (
  onOrderCreated: (order: any) => void,
  onOrderUpdated: (order: any) => void,
  onOrderStatusChanged: (orderId: string, status: string) => void,
  onDeliveryLocationUpdated: (orderId: string, location: any) => void,
  onVendorNotification: (orderId: string, message: string) => void,
  onDeliveryNotification: (orderId: string, message: string) => void,
  onCustomerNotification: (orderId: string, message: string) => void
) => {
  if (socket) {
    socket.on('orderCreated', onOrderCreated);
    socket.on('orderUpdated', onOrderUpdated);
    socket.on('orderStatusChanged', onOrderStatusChanged);
    socket.on('deliveryLocationUpdated', onDeliveryLocationUpdated);
    socket.on('vendorNotification', onVendorNotification);
    socket.on('deliveryNotification', onDeliveryNotification);
    socket.on('customerNotification', onCustomerNotification);
  }
};

// Cleanup socket listeners
export const cleanupOrderListeners = () => {
  if (socket) {
    socket.off('orderCreated');
    socket.off('orderUpdated');
    socket.off('orderStatusChanged');
    socket.off('deliveryLocationUpdated');
    socket.off('vendorNotification');
    socket.off('deliveryNotification');
    socket.off('customerNotification');
  }
}; 